import { jsPDF } from 'jspdf';
import { VIOLENCE_TYPES, ALERT_METHODS } from '@/constants';

// ── Layout constants ──────────────────────────────────────────────
const PAGE_WIDTH = 210; // A4 mm
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = 297 - MARGIN_BOTTOM; // A4 height minus bottom margin

// ── Helpers ───────────────────────────────────────────────────────

function lookupLabel(value, list) {
  const item = list.find((i) => i.value === value);
  return item ? item.label : value;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── PDF Writer Utilities ──────────────────────────────────────────

/** Ensure enough vertical space; add a page if not. Returns the current Y. */
function ensureSpace(doc, y, needed) {
  if (y + needed > MAX_Y) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return y;
}

/** Write a section heading (bold, larger font). */
function sectionHeading(doc, y, number, title) {
  y = ensureSpace(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${number}. ${title}`, MARGIN_LEFT, y);
  y += 8;
  // Underline
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y - 4, MARGIN_LEFT + CONTENT_WIDTH, y - 4);
  return y;
}

/** Write a sub-heading (bold, normal size). */
function subHeading(doc, y, text) {
  y = ensureSpace(doc, y, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(text, MARGIN_LEFT, y);
  y += 6;
  return y;
}

/** Write a labeled value line. */
function labeledLine(doc, y, label, value) {
  y = ensureSpace(doc, y, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${label}: `, MARGIN_LEFT, y);
  const labelWidth = doc.getTextWidth(`${label}: `);
  doc.setFont('helvetica', 'normal');
  const wrappedValue = doc.splitTextToSize(
    value || 'N/A',
    CONTENT_WIDTH - labelWidth,
  );
  doc.text(wrappedValue, MARGIN_LEFT + labelWidth, y);
  y += wrappedValue.length * 5;
  return y + 2;
}

/** Write a block of wrapped body text. */
function bodyText(doc, y, text) {
  if (!text) return y;
  y = ensureSpace(doc, y, 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  for (const line of lines) {
    y = ensureSpace(doc, y, 6);
    doc.text(line, MARGIN_LEFT, y);
    y += 5;
  }
  return y + 2;
}

/** Write a bulleted list. */
function bulletList(doc, y, items) {
  if (!items || items.length === 0) return y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 8);
    y = ensureSpace(doc, y, lines.length * 5 + 2);
    doc.text('\u2022', MARGIN_LEFT + 2, y);
    doc.text(lines, MARGIN_LEFT + 8, y);
    y += lines.length * 5 + 1;
  }
  return y + 2;
}

/** Write a boolean indicator. */
function boolLine(doc, y, label, value) {
  const indicator = value ? 'Yes' : 'No';
  return labeledLine(doc, y, label, indicator);
}

// ── Main Generator ────────────────────────────────────────────────

/**
 * Generate a WVPP PDF document from a plan object.
 * @param {Object} plan — Mongoose plan document (plain object)
 * @param {Object} organization — Mongoose organization document (plain object)
 * @returns {Buffer} PDF as a Node.js Buffer
 */
export function generateWVPP(plan, organization) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN_TOP;

  // ── Title Page ───────────────────────────────────────────────
  y = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Workplace Violence', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;
  doc.text('Prevention Plan', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 16;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(organization.name || 'Organization', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;
  if (organization.dba) {
    doc.setFontSize(11);
    doc.text(`DBA: ${organization.dba}`, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 8;
  }

  doc.setFontSize(10);
  const addr = organization.address || {};
  const addressLine = [addr.street, addr.city, addr.state, addr.zip]
    .filter(Boolean)
    .join(', ');
  if (addressLine) {
    doc.text(addressLine, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 6;
  }
  if (organization.phone) {
    doc.text(`Phone: ${organization.phone}`, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 6;
  }

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Version ${plan.version || 1}`, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Status: ${(plan.status || 'draft').charAt(0).toUpperCase() + (plan.status || 'draft').slice(1)}`,
    PAGE_WIDTH / 2,
    y,
    { align: 'center' },
  );
  y += 6;
  if (plan.publishedAt) {
    doc.text(`Published: ${formatDate(plan.publishedAt)}`, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 6;
  }
  doc.text(`Generated: ${formatDate(new Date())}`, PAGE_WIDTH / 2, y, { align: 'center' });

  // Footer note on title page
  y = 250;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const disclaimer = doc.splitTextToSize(
    'This Workplace Violence Prevention Plan is prepared pursuant to California Labor Code Section 6401.9 (SB 553). ' +
    'This document does not constitute legal advice. Employers are responsible for ensuring compliance with all applicable laws.',
    CONTENT_WIDTH,
  );
  doc.text(disclaimer, PAGE_WIDTH / 2, y, { align: 'center', maxWidth: CONTENT_WIDTH });

  // ── Content Pages ────────────────────────────────────────────
  doc.addPage();
  y = MARGIN_TOP;

  // Section 1: Responsible Persons
  y = sectionHeading(doc, y, 1, 'Responsible Persons');
  const persons = plan.responsiblePersons || [];
  if (persons.length === 0) {
    y = bodyText(doc, y, 'No responsible persons designated.');
  } else {
    for (let i = 0; i < persons.length; i++) {
      const p = persons[i];
      y = ensureSpace(doc, y, 30);
      y = subHeading(doc, y, `Person ${i + 1}`);
      y = labeledLine(doc, y, 'Name', p.name);
      y = labeledLine(doc, y, 'Title', p.title);
      y = labeledLine(doc, y, 'Phone', p.phone);
      y = labeledLine(doc, y, 'Email', p.email);
      if (p.responsibilities && p.responsibilities.length > 0) {
        y = subHeading(doc, y, 'Responsibilities');
        y = bulletList(doc, y, p.responsibilities);
      }
      y += 2;
    }
  }

  // Section 2: Employee Involvement & Compliance
  y = sectionHeading(doc, y, 2, 'Employee Involvement & Compliance');

  const ei = plan.employeeInvolvement || {};
  y = subHeading(doc, y, 'Employee Involvement');
  y = labeledLine(doc, y, 'Meeting Frequency', ei.meetingFrequency);
  y = bodyText(doc, y, ei.meetingDescription);
  y = bodyText(doc, y, ei.trainingInvolvementDescription);
  y = bodyText(doc, y, ei.reportingProceduresDescription);

  const cp = plan.complianceProcedures || {};
  y = subHeading(doc, y, 'Compliance Procedures');
  y = labeledLine(doc, y, 'Training', cp.trainingDescription);
  y = labeledLine(doc, y, 'Supervision', cp.supervisionDescription);
  y = labeledLine(doc, y, 'Recognition Program', cp.recognitionProgram);
  y = labeledLine(doc, y, 'Disciplinary Process', cp.disciplinaryProcess);

  // Section 3: Communication System
  y = sectionHeading(doc, y, 3, 'Communication System');
  const cs = plan.communicationSystem || {};
  y = boolLine(doc, y, 'New Employee Orientation', cs.newEmployeeOrientation);
  y = boolLine(doc, y, 'Regular Meetings', cs.regularMeetings);
  if (cs.regularMeetings) {
    y = labeledLine(doc, y, 'Meeting Frequency', cs.meetingFrequency);
  }
  y = boolLine(doc, y, 'Posted Information', cs.postedInformation);
  if (cs.postedInformation) {
    y = labeledLine(doc, y, 'Posting Locations', cs.postingLocations);
  }
  y = labeledLine(doc, y, 'Reporting Hotline', cs.reportingHotline);
  y = labeledLine(doc, y, 'Reporting Form', cs.reportingForm);
  y = boolLine(doc, y, 'Anonymous Reporting', cs.anonymousReporting);

  // Section 4: Emergency Response
  y = sectionHeading(doc, y, 4, 'Emergency Response');
  const er = plan.emergencyResponse || {};
  if (er.alertMethods && er.alertMethods.length > 0) {
    y = subHeading(doc, y, 'Alert Methods');
    const alertLabels = er.alertMethods.map((m) => lookupLabel(m, ALERT_METHODS));
    y = bulletList(doc, y, alertLabels);
  }
  y = labeledLine(doc, y, 'Evacuation Plan', er.evacuationPlanDescription);
  if (er.shelterLocations && er.shelterLocations.length > 0) {
    y = subHeading(doc, y, 'Shelter Locations');
    y = bulletList(doc, y, er.shelterLocations);
  }
  y = labeledLine(doc, y, 'Law Enforcement Contact', er.lawEnforcementContact);

  if (er.emergencyContacts && er.emergencyContacts.length > 0) {
    y = subHeading(doc, y, 'Emergency Contacts');
    for (const c of er.emergencyContacts) {
      y = ensureSpace(doc, y, 16);
      y = labeledLine(doc, y, 'Name', c.name);
      y = labeledLine(doc, y, 'Title', c.title);
      y = labeledLine(doc, y, 'Phone', c.phone);
      y += 2;
    }
  }

  // Section 5: Hazard Assessment
  y = sectionHeading(doc, y, 5, 'Hazard Assessment');
  const hazards = plan.hazardAssessments || [];
  if (hazards.length === 0) {
    y = bodyText(doc, y, 'No hazard assessments recorded.');
  } else {
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      y = ensureSpace(doc, y, 26);
      y = subHeading(doc, y, `Hazard ${i + 1}`);
      y = labeledLine(doc, y, 'Type', lookupLabel(h.hazardType, VIOLENCE_TYPES));
      y = labeledLine(doc, y, 'Description', h.description);
      y = labeledLine(doc, y, 'Risk Level', (h.riskLevel || '').charAt(0).toUpperCase() + (h.riskLevel || '').slice(1));
      if (h.controlMeasures && h.controlMeasures.length > 0) {
        y = subHeading(doc, y, 'Control Measures');
        y = bulletList(doc, y, h.controlMeasures);
      }
      if (h.assessedBy) {
        y = labeledLine(doc, y, 'Assessed By', h.assessedBy);
      }
      if (h.assessedAt) {
        y = labeledLine(doc, y, 'Assessed Date', formatDate(h.assessedAt));
      }
      y += 2;
    }
  }

  // Section 6: Hazard Correction & Post-Incident Procedures
  y = sectionHeading(doc, y, 6, 'Hazard Correction & Post-Incident Procedures');
  const hc = plan.hazardCorrectionProcedures || {};
  y = subHeading(doc, y, 'Hazard Correction');
  y = labeledLine(doc, y, 'Immediate Threat Procedure', hc.immediateThreatProcedure);
  y = labeledLine(doc, y, 'Documentation Process', hc.documentationProcess);
  if (hc.engineeringControls && hc.engineeringControls.length > 0) {
    y = subHeading(doc, y, 'Engineering Controls');
    y = bulletList(doc, y, hc.engineeringControls);
  }
  if (hc.workPracticeControls && hc.workPracticeControls.length > 0) {
    y = subHeading(doc, y, 'Work Practice Controls');
    y = bulletList(doc, y, hc.workPracticeControls);
  }
  if (hc.administrativeControls && hc.administrativeControls.length > 0) {
    y = subHeading(doc, y, 'Administrative Controls');
    y = bulletList(doc, y, hc.administrativeControls);
  }

  const pi = plan.postIncidentProcedures || {};
  y = subHeading(doc, y, 'Post-Incident Response');
  if (pi.investigationSteps && pi.investigationSteps.length > 0) {
    y = subHeading(doc, y, 'Investigation Steps');
    y = bulletList(doc, y, pi.investigationSteps);
  }
  if (pi.supportResources && pi.supportResources.length > 0) {
    y = subHeading(doc, y, 'Support Resources');
    y = bulletList(doc, y, pi.supportResources);
  }
  y = boolLine(doc, y, 'Counseling Available', pi.counselingAvailable);
  if (pi.counselingAvailable && pi.counselingProvider) {
    y = labeledLine(doc, y, 'Counseling Provider', pi.counselingProvider);
  }

  // Section 7: Training Program
  y = sectionHeading(doc, y, 7, 'Training Program');
  const tp = plan.trainingProgram || {};
  y = labeledLine(doc, y, 'Initial Training', tp.initialTrainingDescription);
  y = labeledLine(doc, y, 'Annual Refresher', tp.annualRefresherDescription);
  y = labeledLine(doc, y, 'New Hazard Training', tp.newHazardTrainingDescription);
  if (tp.trainingTopics && tp.trainingTopics.length > 0) {
    y = subHeading(doc, y, 'Training Topics');
    y = bulletList(doc, y, tp.trainingTopics);
  }

  // Section 8: Recordkeeping & Plan Access
  y = sectionHeading(doc, y, 8, 'Recordkeeping & Plan Access');
  const rk = plan.recordkeepingProcedures || {};
  y = labeledLine(doc, y, 'Hazard Records Retention', `${rk.hazardRecordsRetention || 5} years`);
  y = labeledLine(doc, y, 'Training Records Retention', `${rk.trainingRecordsRetention || 1} year(s)`);
  y = labeledLine(doc, y, 'Incident Log Retention', `${rk.incidentLogRetention || 5} years`);
  y = labeledLine(doc, y, 'Access Procedure', rk.accessProcedure);

  const pa = plan.planAccessibility || {};
  y = subHeading(doc, y, 'Plan Accessibility');
  y = labeledLine(doc, y, 'Physical Location', pa.physicalLocation);
  y = boolLine(doc, y, 'Electronic Access', pa.electronicAccess);
  if (pa.electronicAccess) {
    y = labeledLine(doc, y, 'Electronic Location', pa.electronicLocation);
  }

  // Section 9: Review Schedule
  y = sectionHeading(doc, y, 9, 'Review Schedule');
  const rs = plan.reviewSchedule || {};
  if (rs.annualReviewMonth != null) {
    y = labeledLine(doc, y, 'Annual Review Month', MONTH_NAMES[rs.annualReviewMonth] || 'N/A');
  }
  y = labeledLine(doc, y, 'Last Review', formatDate(rs.lastReviewDate));
  y = labeledLine(doc, y, 'Next Review', formatDate(rs.nextReviewDate));
  y = bodyText(doc, y, rs.reviewProcedure);

  // Section 10: Authorization
  y = sectionHeading(doc, y, 10, 'Authorization');
  const az = plan.authorization || {};
  y = labeledLine(doc, y, 'Authorized By', az.authorizerName);
  y = labeledLine(doc, y, 'Title', az.authorizerTitle);
  y = bodyText(doc, y, az.authorizationStatement);
  if (az.signedAt) {
    y = labeledLine(doc, y, 'Date Signed', formatDate(az.signedAt));
  }

  // Signature line
  y = ensureSpace(doc, y, 30);
  y += 12;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 70, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Signature', MARGIN_LEFT, y + 5);

  doc.line(MARGIN_LEFT + 90, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  doc.text('Date', MARGIN_LEFT + 90, y + 5);

  // ── Page numbers ────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${organization.name || 'Organization'} — WVPP v${plan.version || 1}`,
      MARGIN_LEFT,
      297 - 10,
    );
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, 297 - 10, { align: 'right' });
    doc.setTextColor(0);
  }

  // ── Return as Buffer ────────────────────────────────────────
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
