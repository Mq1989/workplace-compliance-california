import { jsPDF } from 'jspdf';

// ── Layout constants ──────────────────────────────────────────────
const PAGE_WIDTH = 297; // A4 landscape mm
const PAGE_HEIGHT = 210;
const MARGIN = 20;
const CENTER_X = PAGE_WIDTH / 2;

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Main Generator ────────────────────────────────────────────────

/**
 * Generate a Training Certificate PDF.
 * @param {Object} employee — Employee document (plain object)
 * @param {Object} organization — Organization document (plain object)
 * @param {Date|string} completionDate — Training completion date
 * @returns {Buffer} PDF as a Node.js Buffer
 */
export function generateTrainingCertificate(employee, organization, completionDate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Decorative border ─────────────────────────────────────────
  // Outer border
  doc.setDrawColor(44, 82, 130); // Dark blue
  doc.setLineWidth(2);
  doc.rect(MARGIN - 6, MARGIN - 6, PAGE_WIDTH - 2 * (MARGIN - 6), PAGE_HEIGHT - 2 * (MARGIN - 6));

  // Inner border
  doc.setDrawColor(44, 82, 130);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN, MARGIN, PAGE_WIDTH - 2 * MARGIN, PAGE_HEIGHT - 2 * MARGIN);

  // Corner accents (decorative squares)
  const accentSize = 4;
  const corners = [
    [MARGIN - 6, MARGIN - 6],
    [PAGE_WIDTH - MARGIN + 6 - accentSize, MARGIN - 6],
    [MARGIN - 6, PAGE_HEIGHT - MARGIN + 6 - accentSize],
    [PAGE_WIDTH - MARGIN + 6 - accentSize, PAGE_HEIGHT - MARGIN + 6 - accentSize],
  ];
  doc.setFillColor(44, 82, 130);
  for (const [cx, cy] of corners) {
    doc.rect(cx, cy, accentSize, accentSize, 'F');
  }

  let y = MARGIN + 16;

  // ── Header ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('CERTIFICATE OF COMPLETION', CENTER_X, y, { align: 'center' });
  y += 14;

  // ── Title ─────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(44, 82, 130);
  doc.text('Workplace Violence', CENTER_X, y, { align: 'center' });
  y += 11;
  doc.text('Prevention Training', CENTER_X, y, { align: 'center' });
  y += 14;

  // ── Subtitle ──────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('California Senate Bill 553 — Labor Code Section 6401.9', CENTER_X, y, { align: 'center' });
  y += 14;

  // ── Presented To ──────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text('This certifies that', CENTER_X, y, { align: 'center' });
  y += 12;

  // Employee name
  const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.text(employeeName, CENTER_X, y, { align: 'center' });
  y += 4;

  // Underline under name
  const nameWidth = doc.getTextWidth(employeeName);
  doc.setDrawColor(44, 82, 130);
  doc.setLineWidth(0.5);
  doc.line(CENTER_X - nameWidth / 2 - 10, y, CENTER_X + nameWidth / 2 + 10, y);
  y += 10;

  // ── Body Text ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(
    'has successfully completed the required SB 553 Workplace Violence Prevention Training',
    CENTER_X,
    y,
    { align: 'center' },
  );
  y += 6;
  doc.text(
    `administered by ${organization.name || 'the organization'}.`,
    CENTER_X,
    y,
    { align: 'center' },
  );
  y += 6;
  doc.text(
    'This training fulfills the annual requirement per California Labor Code Section 6401.9(c)(3).',
    CENTER_X,
    y,
    { align: 'center' },
  );
  y += 14;

  // ── Completion Date ───────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Date of Completion: ${formatDate(completionDate)}`, CENTER_X, y, { align: 'center' });
  y += 16;

  // ── Signature Lines ───────────────────────────────────────────
  const sigLineWidth = 70;
  const sigLeftX = CENTER_X - 55;
  const sigRightX = CENTER_X + 55;
  const sigY = y;

  // Organization representative line
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX - sigLineWidth / 2, sigY, sigLeftX + sigLineWidth / 2, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text('Authorized Representative', sigLeftX, sigY + 5, { align: 'center' });
  doc.text(organization.name || '', sigLeftX, sigY + 9, { align: 'center' });

  // Date line
  doc.line(sigRightX - sigLineWidth / 2, sigY, sigRightX + sigLineWidth / 2, sigY);
  doc.text('Date', sigRightX, sigY + 5, { align: 'center' });

  // ── Footer ────────────────────────────────────────────────────
  const footerY = PAGE_HEIGHT - MARGIN - 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    'This certificate is generated by SafeWorkCA for compliance documentation purposes.',
    CENTER_X,
    footerY,
    { align: 'center' },
  );
  doc.text(
    'Retain for a minimum of 1 year per LC 6401.9 training record requirements.',
    CENTER_X,
    footerY + 4,
    { align: 'center' },
  );

  // ── Return as Buffer ──────────────────────────────────────────
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
