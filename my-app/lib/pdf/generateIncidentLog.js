import { jsPDF } from 'jspdf';
import { VIOLENCE_TYPES, INCIDENT_TYPES, PERPETRATOR_TYPES } from '@/constants';

// ── Layout constants ──────────────────────────────────────────────
const PAGE_WIDTH = 210; // A4 mm
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = 297 - MARGIN_BOTTOM;

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

function formatShortDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function ensureSpace(doc, y, needed) {
  if (y + needed > MAX_Y) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return y;
}

// ── Main Generator ────────────────────────────────────────────────

/**
 * Generate an Incident Log PDF.
 * @param {Object[]} incidents — Array of Incident documents (plain objects)
 * @param {Object} organization — Organization document (plain object)
 * @param {{ start?: Date, end?: Date }} dateRange — Optional date range filter
 * @returns {Buffer} PDF as a Node.js Buffer
 */
export function generateIncidentLog(incidents, organization, dateRange) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const landscapeWidth = 297;
  const landscapeContentWidth = landscapeWidth - MARGIN_LEFT - MARGIN_RIGHT;
  const landscapeMaxY = PAGE_WIDTH - MARGIN_BOTTOM; // 210 - 25 = 185
  let y = MARGIN_TOP;

  // ── Title ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Violent Incident Log', landscapeWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(organization.name || 'Organization', landscapeWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  if (dateRange && (dateRange.start || dateRange.end)) {
    const rangeStr = `${formatDate(dateRange.start)} — ${formatDate(dateRange.end)}`;
    doc.text(`Date Range: ${rangeStr}`, landscapeWidth / 2, y, { align: 'center' });
    y += 5;
  }
  doc.text(`Generated: ${formatDate(new Date())}`, landscapeWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(
    `Per California Labor Code Section 6401.9(d) — 5-year retention required`,
    landscapeWidth / 2,
    y,
    { align: 'center' },
  );
  y += 10;

  // ── Summary ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Incidents: ${incidents.length}`, MARGIN_LEFT, y);
  y += 8;

  if (incidents.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('No incidents recorded for the specified period.', MARGIN_LEFT, y);
  } else {
    // ── Table header ──────────────────────────────────────────
    const colWidths = [22, 16, 40, 40, 50, 38, 30, 30];
    // Date, Time, Location, Violence Type, Description, Perpetrator, Investigation, Injuries

    function drawTableHeader(startY) {
      doc.setFillColor(40, 40, 40);
      doc.rect(MARGIN_LEFT, startY - 4, landscapeContentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255);

      const headers = ['Date', 'Time', 'Location', 'Violence Type', 'Description', 'Perpetrator', 'Investigation', 'Injuries'];
      let x = MARGIN_LEFT + 1;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, startY);
        x += colWidths[i];
      }
      doc.setTextColor(0);
      return startY + 6;
    }

    y = drawTableHeader(y);

    // ── Table rows ────────────────────────────────────────────
    for (let idx = 0; idx < incidents.length; idx++) {
      const inc = incidents[idx];

      // Estimate row height based on content
      doc.setFontSize(6.5);
      const descLines = doc.splitTextToSize(
        (inc.detailedDescription || '').slice(0, 200),
        colWidths[4] - 2,
      );
      const violenceLabels = (inc.workplaceViolenceTypes || [])
        .map((v) => lookupLabel(v, VIOLENCE_TYPES).replace(/Type \d - /, ''))
        .join(', ');
      const violenceLines = doc.splitTextToSize(violenceLabels || 'N/A', colWidths[3] - 2);

      const rowHeight = Math.max(descLines.length, violenceLines.length, 2) * 3.5 + 3;

      // Check if we need a new page
      if (y + rowHeight > landscapeMaxY) {
        doc.addPage();
        y = MARGIN_TOP;
        y = drawTableHeader(y);
      }

      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(MARGIN_LEFT, y - 3, landscapeContentWidth, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);

      let x = MARGIN_LEFT + 1;

      // Date
      doc.text(formatShortDate(inc.incidentDate), x, y);
      x += colWidths[0];

      // Time
      doc.text(inc.incidentTime || 'N/A', x, y);
      x += colWidths[1];

      // Location
      const locText = inc.location?.description || 'N/A';
      const locLines = doc.splitTextToSize(locText, colWidths[2] - 2);
      doc.text(locLines, x, y);
      x += colWidths[2];

      // Violence Type
      doc.text(violenceLines, x, y);
      x += colWidths[3];

      // Description (truncated)
      doc.text(descLines, x, y);
      x += colWidths[4];

      // Perpetrator
      const perpLabel = lookupLabel(inc.perpetratorClassification, PERPETRATOR_TYPES);
      const perpLines = doc.splitTextToSize(perpLabel, colWidths[5] - 2);
      doc.text(perpLines, x, y);
      x += colWidths[5];

      // Investigation Status
      const invStatus = (inc.investigationStatus || 'pending').replace(/_/g, ' ');
      doc.text(invStatus.charAt(0).toUpperCase() + invStatus.slice(1), x, y);
      x += colWidths[6];

      // Injuries
      const injText = inc.injuries?.occurred ? `Yes: ${(inc.injuries.description || '').slice(0, 50)}` : 'No';
      const injLines = doc.splitTextToSize(injText, colWidths[7] - 2);
      doc.text(injLines, x, y);

      y += rowHeight;
    }
  }

  // ── Detailed Incident Records ─────────────────────────────
  if (incidents.length > 0) {
    doc.addPage('a4', 'portrait');
    y = MARGIN_TOP;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detailed Incident Records', MARGIN_LEFT, y);
    y += 10;

    for (let idx = 0; idx < incidents.length; idx++) {
      const inc = incidents[idx];

      y = ensureSpace(doc, y, 60);

      // Incident header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Incident ${idx + 1} — ${formatDate(inc.incidentDate)}`, MARGIN_LEFT, y);
      y += 6;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_LEFT, y - 3, MARGIN_LEFT + CONTENT_WIDTH, y - 3);
      y += 2;

      doc.setFontSize(9);

      // Date/Time/Location
      doc.setFont('helvetica', 'bold');
      doc.text('Date: ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(inc.incidentDate), MARGIN_LEFT + 15, y);
      doc.setFont('helvetica', 'bold');
      doc.text('Time: ', MARGIN_LEFT + 70, y);
      doc.setFont('helvetica', 'normal');
      doc.text(inc.incidentTime || 'N/A', MARGIN_LEFT + 82, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Location: ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      doc.text(inc.location?.description || 'N/A', MARGIN_LEFT + 22, y);
      y += 6;

      // Classification
      const vtLabels = (inc.workplaceViolenceTypes || []).map((v) => lookupLabel(v, VIOLENCE_TYPES)).join('; ');
      doc.setFont('helvetica', 'bold');
      doc.text('Violence Type(s): ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      const vtLines = doc.splitTextToSize(vtLabels || 'N/A', CONTENT_WIDTH - 35);
      doc.text(vtLines, MARGIN_LEFT + 35, y);
      y += vtLines.length * 4 + 2;

      const itLabels = (inc.incidentTypes || []).map((t) => lookupLabel(t, INCIDENT_TYPES)).join('; ');
      doc.setFont('helvetica', 'bold');
      doc.text('Incident Type(s): ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      const itLines = doc.splitTextToSize(itLabels || 'N/A', CONTENT_WIDTH - 35);
      doc.text(itLines, MARGIN_LEFT + 35, y);
      y += itLines.length * 4 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Perpetrator: ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lookupLabel(inc.perpetratorClassification, PERPETRATOR_TYPES), MARGIN_LEFT + 27, y);
      y += 6;

      // Description
      y = ensureSpace(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', MARGIN_LEFT, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(inc.detailedDescription || 'N/A', CONTENT_WIDTH);
      for (const line of descLines) {
        y = ensureSpace(doc, y, 5);
        doc.text(line, MARGIN_LEFT, y);
        y += 4;
      }
      y += 2;

      // Response
      if (inc.consequences) {
        y = ensureSpace(doc, y, 10);
        doc.setFont('helvetica', 'bold');
        doc.text('Security Contacted: ', MARGIN_LEFT, y);
        doc.setFont('helvetica', 'normal');
        doc.text(inc.consequences.securityContacted ? 'Yes' : 'No', MARGIN_LEFT + 38, y);
        doc.setFont('helvetica', 'bold');
        doc.text('Law Enforcement: ', MARGIN_LEFT + 60, y);
        doc.setFont('helvetica', 'normal');
        doc.text(inc.consequences.lawEnforcementContacted ? 'Yes' : 'No', MARGIN_LEFT + 95, y);
        y += 5;
      }

      // Injuries
      if (inc.injuries) {
        doc.setFont('helvetica', 'bold');
        doc.text('Injuries: ', MARGIN_LEFT, y);
        doc.setFont('helvetica', 'normal');
        doc.text(
          inc.injuries.occurred ? `Yes — ${inc.injuries.description || 'Details not provided'}` : 'None reported',
          MARGIN_LEFT + 20,
          y,
        );
        y += 5;
      }

      // Investigation
      doc.setFont('helvetica', 'bold');
      doc.text('Investigation Status: ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      const invStatus = (inc.investigationStatus || 'pending').replace(/_/g, ' ');
      doc.text(invStatus.charAt(0).toUpperCase() + invStatus.slice(1), MARGIN_LEFT + 40, y);
      y += 5;

      if (inc.investigationNotes) {
        y = ensureSpace(doc, y, 8);
        doc.setFont('helvetica', 'bold');
        doc.text('Investigation Notes:', MARGIN_LEFT, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(inc.investigationNotes, CONTENT_WIDTH);
        for (const line of noteLines) {
          y = ensureSpace(doc, y, 5);
          doc.text(line, MARGIN_LEFT, y);
          y += 4;
        }
        y += 2;
      }

      if (inc.correctiveActionsTaken && inc.correctiveActionsTaken.length > 0) {
        y = ensureSpace(doc, y, 8);
        doc.setFont('helvetica', 'bold');
        doc.text('Corrective Actions:', MARGIN_LEFT, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        for (const action of inc.correctiveActionsTaken) {
          y = ensureSpace(doc, y, 5);
          doc.text(`\u2022 ${action}`, MARGIN_LEFT + 2, y);
          y += 4;
        }
        y += 2;
      }

      // Completed by
      doc.setFont('helvetica', 'bold');
      doc.text('Completed By: ', MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      const completedBy = inc.completedBy
        ? `${inc.completedBy.name}, ${inc.completedBy.title}`
        : 'N/A';
      doc.text(completedBy, MARGIN_LEFT + 30, y);
      y += 10;
    }
  }

  // ── Page numbers ────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `${organization.name || 'Organization'} — Violent Incident Log`,
      MARGIN_LEFT,
      pageHeight - 10,
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - MARGIN_RIGHT,
      pageHeight - 10,
      { align: 'right' },
    );
    doc.setTextColor(0);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
