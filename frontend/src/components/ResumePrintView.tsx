'use client';

import React from 'react';

interface ResumePrintViewProps {
  data: {
    primary_title?: string;
    contact_info?: {
      name?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      website?: string;
      location?: string;
    };
    education?: Array<{
      school: string;
      degree?: string;
      field_of_study?: string;
      grad_date?: string;
    }>;
    experiences?: Array<{
      company: string;
      role: string;
      start_date?: string;
      end_date?: string;
      bullet_points?: string[];
    }>;
    projects?: Array<{
      title: string;
      description?: string;
      url?: string;
      achievements?: string[];
    }>;
  };
  userName: string;
  userEmail: string;
  parsedRequirements?: {
    technical_skills?: string[];
    keywords?: string[];
  };
}

export function ResumePrintView({ data, userName, userEmail, parsedRequirements }: ResumePrintViewProps) {
  const { contact_info, education = [], experiences = [], projects = [] } = data;
  const displayName = contact_info?.name || userName;

  // Build contact items array
  const contactItems: string[] = [];
  if (contact_info?.location) contactItems.push(contact_info.location);
  if (contact_info?.phone) contactItems.push(contact_info.phone);
  
  const emailVal = contact_info?.email || userEmail;
  if (emailVal) contactItems.push(emailVal);
  
  if (contact_info?.website) contactItems.push(contact_info.website);
  if (contact_info?.github) contactItems.push(contact_info.github.replace(/^https?:\/\/(www\.)?/, ''));
  if (contact_info?.linkedin) contactItems.push(contact_info.linkedin.replace(/^https?:\/\/(www\.)?/, ''));

  // Get skills
  const skillsList = parsedRequirements?.technical_skills || [];

  return (
    <div className="resume-print-container">
      {/* Inline Styles to override Tailwind and enforce perfect PDF layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: letter;
          margin: 0.5in;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          .resume-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
        .resume-print-container {
          font-family: "Times New Roman", Times, Georgia, serif;
          color: #000;
          line-height: 1.3;
          font-size: 10.5pt;
          background: white;
          width: 100%;
          max-width: 8.5in;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .resume-header {
          text-align: center;
          margin-bottom: 8px;
        }
        .resume-name {
          font-size: 18pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 4px 0;
        }
        .resume-divider {
          border: 0;
          border-top: 1.5px solid #000;
          margin: 4px 0 6px 0;
        }
        .resume-contacts {
          font-size: 9pt;
          margin: 0;
          color: #111;
          word-spacing: 1px;
        }
        .resume-section {
          margin-top: 12px;
        }
        .resume-section-title {
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 6px 0;
          letter-spacing: 0.75px;
          border-bottom: 1px solid #111;
          padding-bottom: 1px;
        }
        .resume-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2px;
        }
        .resume-item-title {
          font-weight: bold;
          font-size: 10.5pt;
        }
        .resume-item-subtitle {
          font-style: italic;
          font-size: 10pt;
        }
        .resume-item-right {
          font-size: 10pt;
          text-align: right;
          font-weight: normal;
        }
        .resume-item-right-bold {
          font-size: 10pt;
          text-align: right;
          font-weight: bold;
        }
        .resume-bullets {
          margin: 2px 0 6px 0;
          padding-left: 18px;
          list-style-type: disc;
        }
        .resume-bullets li {
          margin-bottom: 2px;
          font-size: 10pt;
          text-align: justify;
        }
        .resume-skills-grid {
          font-size: 10pt;
          margin-top: 4px;
        }
        .resume-skills-label {
          font-weight: bold;
        }
      ` }} />

      {/* Header (Stanford/MCS Centered Template) */}
      <div className="resume-header">
        <h1 className="resume-name">{displayName}</h1>
        <hr className="resume-divider" />
        <p className="resume-contacts">
          {contactItems.join('  •  ')}
        </p>
      </div>

      {/* Education Section */}
      {education.length > 0 && (
        <div className="resume-section">
          <h2 className="resume-section-title">Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} className="resume-education-item" style={{ marginBottom: idx < education.length - 1 ? '6px' : '0' }}>
              <div className="resume-row">
                <span className="resume-item-title">{edu.school}</span>
                <span className="resume-item-right-bold">
                  {edu.grad_date || 'Graduation Date'}
                </span>
              </div>
              <div className="resume-row">
                <span className="resume-item-subtitle">
                  {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience Section */}
      {experiences.length > 0 && (
        <div className="resume-section">
          <h2 className="resume-section-title">Experience</h2>
          {experiences.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <div className="resume-row">
                <span className="resume-item-title">{exp.company}</span>
                <span className="resume-item-right-bold">
                  {exp.start_date || 'Start'} – {exp.end_date || 'Present'}
                </span>
              </div>
              <div className="resume-row">
                <span className="resume-item-subtitle">{exp.role}</span>
              </div>
              {exp.bullet_points && exp.bullet_points.length > 0 && (
                <ul className="resume-bullets">
                  {exp.bullet_points.map((bp, bpIdx) => (
                    <li key={bpIdx}>{bp}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects Section */}
      {projects.length > 0 && (
        <div className="resume-section">
          <h2 className="resume-section-title">Projects</h2>
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <div className="resume-row">
                <span className="resume-item-title">{proj.title}</span>
                {proj.url && (
                  <span className="resume-item-right" style={{ fontStyle: 'italic' }}>
                    {proj.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                )}
              </div>
              {proj.achievements && proj.achievements.length > 0 ? (
                <ul className="resume-bullets">
                  {proj.achievements.map((ach, achIdx) => (
                    <li key={achIdx}>{ach}</li>
                  ))}
                </ul>
              ) : (
                proj.description && (
                  <ul className="resume-bullets">
                    <li>{proj.description}</li>
                  </ul>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills Section */}
      {skillsList.length > 0 && (
        <div className="resume-section">
          <h2 className="resume-section-title">Skills & Interests</h2>
          <div className="resume-skills-grid">
            <span className="resume-skills-label">Technical Skills:</span> {skillsList.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
