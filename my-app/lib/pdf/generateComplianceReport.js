import { jsPDF } from 'jspdf';

// ── Layout constants ──────────────────────────────────────────────
const PAGE_WIDTH = 210; // A4 mm
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = 297 - MARGIN_BOTTOM;

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ensureSpace(doc, y, needed) {
  if (y + needed > MAX_Y) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return y;
}

function sectionHeading(doc, y, number, title) {
  y = ensureSpace(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${number}. ${title}`, MARGIN_LEFT, y);
  y += 8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y - 4, MARGIN_LEFT + CONTENT_WIDTH, y - 4);
  return y;
}

function labeledLine(doc, y, label, value) {
  y = ensureSpace(doc, y, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${label}: `, MARGIN_LEFT, y);
  const labelWidth = doc.getTextWidth(`${label}: `);
  doc.setFont('helvetica', 'normal');
  const wrappedValue = doc.splitTextToSize(
    String(value ?? 'N/A'),
    CONTENT_WIDTH - labelWidth,
  );
  doc.text(wrappedValue, MARGIN_LEFT + labelWidth, y);
  y += wrappedValue.length * 5;
  return y + 2;
}

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

// ── Score Bar Helper ──────────────────────────────────────────────

function drawScoreBar(doc, y, label, score, barWidth) {
  y = ensureSpace(doc, y, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(label, MARGIN_LEFT, y);
  doc.text(`${score}%`, MARGIN_LEFT + barWidth + 8, y);

  // Background bar
  const barY = y - 3;
  const barHeight = 4;
  const barX = MARGIN_LEFT + 55;
  const barW = barWidth - 55;

  doc.setFillColor(230, 230, 230);
  doc.roundedRect(barX, barY, barW, barHeight, 1, 1, 'F');

  // Fill bar
  if (score > 0) {
    const fillW = Math.max(1, (score / 100) * barW);
    if (score >= 80) {
      doc.setFillColor(34, 139, 34); // Green
    } else if (score >= 50) {
      doc.setFillColor(218, 165, 32); // Yellow
    } else {
      doc.setFillColor(220, 53, 69); // Red
    }
    doc.roundedRect(barX, barY, fillW, barHeight, 1, 1, 'F');
  }

  return y + 8;
}

// ── Main Generator ────────────────────────────────────────────────

/**
 * Generate a Compliance Report PDF.
 * @param {Object} organization — Organization document (plain object)
 * @param {Object} scores — Compliance scores { overall, wvpp, training, annualReview, incidentLog }
 * @param {Object} stats — Stats object { employees, incidents, training, deadlines, ... }
 * @returns {Buffer} PDF as a Node.js Buffer
 */
export function generateComplianceReport(organization, scores, stats) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN_TOP;

  // ── Title Page ────────────────────────────────────────────────
  y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SB 553 Compliance Report', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(organization.name || 'Organization', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  const addr = organization.address || {};
  const addressLine = [addr.street, addr.city, addr.state, addr.zip]
    .filter(Boolean)
    .join(', ');
  if (addressLine) {
    doc.text(addressLine, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 6;
  }

  y += 6;
  doc.text(`Generated: ${formatDate(new Date())}`, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5;
  doc.text(
    'Per California Labor Code Section 6401.9 (SB 553)',
    PAGE_WIDTH / 2,
    y,
    { align: 'center' },
  );

  // Overall score circle
  y += 20;
  const circleX = PAGE_WIDTH / 2;
  const circleR = 22;

  // Background circle
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(3);
  doc.circle(circleX, y, circleR);

  // Score arc color
  const overall = scores.overall ?? 0;
  if (overall >= 80) {
    doc.setDrawColor(34, 139, 34);
  } else if (overall >= 50) {
    doc.setDrawColor(218, 165, 32);
  } else {
    doc.setDrawColor(220, 53, 69);
  }
  doc.setLineWidth(3);
  doc.circle(circleX, y, circleR);

  // Score text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(0);
  doc.text(`${overall}%`, circleX, y + 3, { align: 'center' });
  y += circleR + 4;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Overall Compliance Score', circleX, y, { align: 'center' });

  // ── Content Pages ─────────────────────────────────────────────
  doc.addPage();
  y = MARGIN_TOP;

  // Section 1: Score Breakdown
  y = sectionHeading(doc, y, 1, 'Compliance Score Breakdown');
  y += 2;

  const barWidth = CONTENT_WIDTH - 15;
  y = drawScoreBar(doc, y, 'WVPP Status', scores.wvpp ?? 0, barWidth);
  y = drawScoreBar(doc, y, 'Training', scores.training ?? 0, barWidth);
  y = drawScoreBar(doc, y, 'Annual Review', scores.annualReview ?? 0, barWidth);
  y = drawScoreBar(doc, y, 'Incident Log', scores.incidentLog ?? 0, barWidth);
  y += 4;

  // Scoring methodology
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Each component is weighted equally at 25%. Overall score = average of all four components.',
    MARGIN_LEFT,
    y,
  );
  doc.setTextColor(0);
  y += 10;

  // Section 2: Organization Summary
  y = sectionHeading(doc, y, 2, 'Organization Summary');
  y = labeledLine(doc, y, 'Organization', organization.name);
  if (organization.dba) {
    y = labeledLine(doc, y, 'DBA', organization.dba);
  }
  y = labeledLine(doc, y, 'Industry', organization.industry || 'N/A');
  y = labeledLine(doc, y, 'Employee Count', String(organization.employeeCount || 'N/A'));
  y = labeledLine(doc, y, 'Plan Tier', (organization.plan || 'free').charAt(0).toUpperCase() + (organization.plan || 'free').slice(1));
  y += 4;

  // Section 3: WVPP Status
  y = sectionHeading(doc, y, 3, 'Workplace Violence Prevention Plan');
  y = labeledLine(doc, y, 'WVPP Created', formatDate(organization.wvppCreatedAt));
  y = labeledLine(doc, y, 'Last Plan Review', formatDate(organization.lastPlanReviewDate));
  y = labeledLine(doc, y, 'Next Review Due', formatDate(organization.nextPlanReviewDueDate));

  const wvppStatus = scores.wvpp >= 100 ? 'Current' : scores.wvpp > 0 ? 'Needs Attention' : 'Missing';
  y = labeledLine(doc, y, 'Status', wvppStatus);
  y += 4;

  // Section 4: Training Compliance
  y = sectionHeading(doc, y, 4, 'Training Compliance');
  y = labeledLine(doc, y, 'Total Active Employees', String(stats.totalEmployees ?? 'N/A'));
  y = labeledLine(doc, y, 'Employees Trained', String(stats.employeesTrained ?? 'N/A'));
  y = labeledLine(doc, y, 'Training Completion Rate', `${stats.trainingCompletionRate ?? 0}%`);
  y = labeledLine(doc, y, 'Overdue Training', String(stats.overdueTraining ?? 0));
  y = labeledLine(doc, y, 'Last Training Date', formatDate(organization.lastTrainingDate));
  y = labeledLine(doc, y, 'Next Training Due', formatDate(organization.nextTrainingDueDate));
  y += 4;

  // Section 5: Incident Log Summary
  y = sectionHeading(doc, y, 5, 'Incident Log Summary');
  y = labeledLine(doc, y, 'Total Incidents', String(stats.totalIncidents ?? 0));
  y = labeledLine(doc, y, 'Open Investigations', String(stats.openInvestigations ?? 0));
  y = labeledLine(doc, y, 'Completed Investigations', String(stats.completedInvestigations ?? 0));

  if (stats.recentIncidents && stats.recentIncidents.length > 0) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    y = ensureSpace(doc, y, 8);
    doc.text('Recent Incidents:', MARGIN_LEFT, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const inc of stats.recentIncidents.slice(0, 5)) {
      y = ensureSpace(doc, y, 6);
      const status = (inc.investigationStatus || 'pending').replace(/_/g, ' ');
      doc.text(
        `\u2022 ${formatDate(inc.incidentDate)} — ${(inc.detailedDescription || '').slice(0, 80)}... [${status}]`,
        MARGIN_LEFT + 2,
        y,
      );
      y += 5;
    }
  }
  y += 4;

  // Section 6: Upcoming Deadlines
  if (stats.deadlines && stats.deadlines.length > 0) {
    y = sectionHeading(doc, y, 6, 'Upcoming Deadlines');

    doc.setFontSize(9);
    for (const deadline of stats.deadlines) {
      y = ensureSpace(doc, y, 8);
      doc.setFont('helvetica', 'bold');
      const overdueTag = deadline.overdue ? ' [OVERDUE]' : '';
      doc.text(`${deadline.label}${overdueTag}`, MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(deadline.date), MARGIN_LEFT + CONTENT_WIDTH - 40, y);
      y += 5;
    }
    y += 4;
  }

  // Section 7: Recommendations
  const recommendations = buildRecommendations(scores, stats);
  if (recommendations.length > 0) {
    const sectionNum = stats.deadlines && stats.deadlines.length > 0 ? 7 : 6;
    y = sectionHeading(doc, y, sectionNum, 'Recommendations');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const rec of recommendations) {
      y = ensureSpace(doc, y, 8);
      const lines = doc.splitTextToSize(`\u2022 ${rec}`, CONTENT_WIDTH - 8);
      doc.text(lines, MARGIN_LEFT + 2, y);
      y += lines.length * 4 + 2;
    }
  }

  // ── Footer disclaimer ─────────────────────────────────────────
  y = ensureSpace(doc, y, 20);
  y += 10;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120);
  const disclaimer = doc.splitTextToSize(
    'This report is generated by SafeWorkCA for informational and compliance documentation purposes. ' +
    'It does not constitute legal advice. Employers are responsible for ensuring their workplace violence ' +
    'prevention plans meet all requirements under California Labor Code Section 6401.9.',
    CONTENT_WIDTH,
  );
  doc.text(disclaimer, MARGIN_LEFT, y);
  doc.setTextColor(0);

  // ── Page numbers ────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${organization.name || 'Organization'} — Compliance Report`,
      MARGIN_LEFT,
      297 - 10,
    );
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, 297 - 10, { align: 'right' });
    doc.setTextColor(0);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// ── Recommendations Builder ───────────────────────────────────────

function buildRecommendations(scores, stats) {
  const recs = [];

  if ((scores.wvpp ?? 0) === 0) {
    recs.push('Create and publish a Workplace Violence Prevention Plan (WVPP) immediately. This is a core requirement of SB 553.');
  } else if ((scores.wvpp ?? 0) < 100) {
    recs.push('Review and update your WVPP to ensure it is current. Annual review is required under LC 6401.9.');
  }

  if ((scores.training ?? 0) < 100) {
    recs.push('Ensure all employees complete required SB 553 training. Annual training is mandatory per LC 6401.9(c)(3).');
  }

  if ((stats.overdueTraining ?? 0) > 0) {
    recs.push(`${stats.overdueTraining} employee(s) have overdue training. Schedule training sessions immediately.`);
  }

  if ((scores.annualReview ?? 0) < 100) {
    recs.push('Schedule your annual plan review. Plans must be reviewed at least annually and after any workplace violence incident.');
  }

  if ((stats.openInvestigations ?? 0) > 0) {
    recs.push(`Complete ${stats.openInvestigations} open incident investigation(s). All incidents must be fully investigated and documented.`);
  }

  if (recs.length === 0) {
    recs.push('Your organization is currently meeting all SB 553 compliance requirements. Continue to maintain training schedules and review your WVPP annually.');
  }

  return recs;
}
