import os
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import uuid
from supabase import create_client, Client

from backend.app.database.connection import get_db
from backend.app.database.models import User

# Load environment
load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

# Initialize Supabase client if keys are provided
supabase_client: Client = None
if SUPABASE_URL and SUPABASE_SECRET_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    except Exception:
        pass

security = HTTPBearer()

def verify_supabase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodes and verifies the Supabase Auth JWT token.
    Supports either offline symmetric decoding (if SUPABASE_JWT_SECRET is set)
    or online validation via the Supabase Auth API client.
    """
    token = credentials.credentials

    # Method 1: Online validation via Supabase Client (if configured)
    if supabase_client:
        try:
            res = supabase_client.auth.get_user(token)
            if res and res.user:
                return {
                    "sub": str(res.user.id),
                    "email": res.user.email,
                    "user_metadata": res.user.user_metadata or {}
                }
        except Exception as e:
            # If online check fails, we can fall back to offline decoding if the secret is available.
            if not SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Authentication validation failed: {str(e)}"
                )

    # Method 2: Offline symmetric decoding (requires SUPABASE_JWT_SECRET)
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication configurations missing (either JWT secret or client keys required)."
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )

def get_current_user(
    payload: dict = Depends(verify_supabase_jwt),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to retrieve the current user, syncing the Supabase Auth
    user ID with our public database users table.
    """
    # sub contains the unique Supabase User ID (UUID)
    user_id_str = payload.get("sub")
    email = payload.get("email")

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user ID (sub)."
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format in sub claim."
        )

    # Check if user already exists in our db
    db_user = db.query(User).filter(User.id == user_uuid).first()

    if not db_user:
        # Extract user metadata (e.g. user's name if configured during signup)
        user_metadata = payload.get("user_metadata", {})
        name = user_metadata.get("full_name") or user_metadata.get("name") or email.split("@")[0]

        # Sync user to public database
        db_user = User(
            id=user_uuid,
            email=email,
            name=name
        )
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
        except Exception as e:
            db.rollback()
            # If there was a race condition and user was created concurrently:
            db_user = db.query(User).filter(User.id == user_uuid).first()
            if not db_user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to sync user with local database: {str(e)}"
                )

    return db_user
