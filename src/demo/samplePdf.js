// Builds small one-page sample PDFs for the demo (lab results, X-ray report, prescription, ECG).
// Every document is marked as sample data. Text is plain ASCII so the standard Helvetica font can show it.

const PAGE = { width: 595, height: 842 }; // A4 in points
const INK = '0.094 0.137 0.122';
const MUTED = '0.337 0.4 0.373';
const SCRUB = '0.071 0.345 0.31';
const ALERT = '0.706 0.137 0.094';

const escapeText = (text) => String(text).replace(/[\\()]/g, (c) => `\\${c}`);

class Page {
  constructor() {
    this.ops = [];
  }

  text(x, y, value, { size = 11, bold = false, color = INK } = {}) {
    this.ops.push(`BT ${color} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapeText(value)}) Tj ET`);
    return this;
  }

  rule(y, { x1 = 50, x2 = PAGE.width - 50, color = '0.79 0.847 0.824' } = {}) {
    this.ops.push(`${color} RG 0.8 w ${x1} ${y} m ${x2} ${y} l S`);
    return this;
  }

  band(y, height, color) {
    this.ops.push(`${color} rg 0 ${y} ${PAGE.width} ${height} re f`);
    return this;
  }

  toBlob() {
    const content = this.ops.join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Contents 4 0 R ` +
        '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = objects.map((object, index) => {
      const offset = pdf.length;
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
      return offset;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return new Blob([pdf], { type: 'application/pdf' });
  }
}

/** Shared letterhead: clinic band, document type, sample warning and patient details. */
function letterhead(kind, { patient, date, clinicName }) {
  const page = new Page()
    .band(PAGE.height - 70, 70, SCRUB)
    .text(50, PAGE.height - 42, clinicName.toUpperCase(), { size: 16, bold: true, color: '1 1 1' })
    .text(PAGE.width - 190, PAGE.height - 42, kind, { size: 11, color: '1 1 1' })
    .text(50, PAGE.height - 95, 'SAMPLE DOCUMENT - demo data, not a real patient record', {
      size: 9,
      bold: true,
      color: ALERT,
    });
  const top = PAGE.height - 130;
  page
    .text(50, top, 'Patient', { size: 9, color: MUTED })
    .text(50, top - 16, patient.fullName, { size: 12, bold: true })
    .text(280, top, 'File no.', { size: 9, color: MUTED })
    .text(280, top - 16, patient.fileNumber, { size: 12, bold: true })
    .text(420, top, 'Date', { size: 9, color: MUTED })
    .text(420, top - 16, date, { size: 12, bold: true })
    .rule(top - 34);
  return { page, y: top - 64 };
}

function paragraph(page, y, lines, options = {}) {
  let cursor = y;
  for (const line of lines) {
    page.text(50, cursor, line, options);
    cursor -= options.leading ?? 18;
  }
  return cursor;
}

function footer(page, signer) {
  page
    .rule(110)
    .text(50, 88, signer, { size: 10, bold: true })
    .text(50, 72, 'Generated for the clinic system demo.', { size: 9, color: MUTED });
  return page;
}

const builders = {
  blood({ page, y }) {
    page
      .text(50, y, 'Blood test results', { size: 15, bold: true })
      .text(50, y - 30, 'Test', { size: 9, color: MUTED })
      .text(260, y - 30, 'Result', { size: 9, color: MUTED })
      .text(390, y - 30, 'Reference range', { size: 9, color: MUTED })
      .rule(y - 38);
    const rows = [
      ['HbA1c', '6.8 %', '4.0 - 5.6 %', true],
      ['Fasting glucose', '118 mg/dL', '70 - 99 mg/dL', true],
      ['Total cholesterol', '182 mg/dL', 'below 200 mg/dL'],
      ['LDL cholesterol', '104 mg/dL', 'below 130 mg/dL'],
      ['Creatinine', '0.8 mg/dL', '0.6 - 1.1 mg/dL'],
      ['Haemoglobin', '12.9 g/dL', '12.0 - 15.5 g/dL'],
    ];
    let row = y - 58;
    for (const [test, result, range, high] of rows) {
      page
        .text(50, row, test)
        .text(260, row, result, { bold: true, color: high ? ALERT : INK })
        .text(390, row, range, { color: MUTED })
        .rule(row - 9, { color: '0.89 0.933 0.918' });
      row -= 26;
    }
    paragraph(
      page,
      row - 16,
      ['Results marked in red are above the reference range.', 'Discuss them at your next visit.'],
      {
        size: 10,
        color: MUTED,
        leading: 15,
      },
    );
    return footer(page, 'Reviewed by: Clinic laboratory (sample)');
  },

  xray({ page, y }) {
    page.text(50, y, 'Chest X-ray report', { size: 15, bold: true });
    let cursor = paragraph(page, y - 30, ['Examination: Chest X-ray, PA view'], { size: 11 });
    page.text(50, cursor - 10, 'Findings', { size: 11, bold: true });
    cursor = paragraph(
      page,
      cursor - 30,
      [
        'The lungs are clear. No consolidation, effusion or pneumothorax.',
        'Heart size is within normal limits.',
        'Bones and soft tissues show no abnormality.',
      ],
      { size: 11 },
    );
    page.text(50, cursor - 10, 'Impression', { size: 11, bold: true });
    paragraph(page, cursor - 30, ['Normal chest X-ray.'], { size: 11 });
    return footer(page, 'Radiologist: Dr. Sample Radiologist');
  },

  rx({ page, y }) {
    page.text(50, y, 'Prescription', { size: 15, bold: true });
    const items = [
      ['Metformin 500 mg', 'One tablet twice daily, with breakfast and dinner'],
      ['Atorvastatin 10 mg', 'One tablet at night'],
      ['Vitamin D3 1000 IU', 'One tablet daily'],
    ];
    let cursor = y - 36;
    for (const [medicine, instructions] of items) {
      page
        .text(50, cursor, medicine, { size: 12, bold: true })
        .text(50, cursor - 16, instructions, { size: 11, color: MUTED });
      cursor -= 44;
    }
    paragraph(page, cursor - 6, ['Duration: 3 months, then follow-up visit.'], { size: 11 });
    return footer(page, 'Prescribed by: Clinic doctor (sample)');
  },

  ecg({ page, y }) {
    page.text(50, y, 'ECG report', { size: 15, bold: true });
    const rows = [
      ['Rhythm', 'Sinus rhythm'],
      ['Heart rate', '78 bpm'],
      ['PR interval', '160 ms'],
      ['QRS duration', '92 ms'],
      ['QTc', '418 ms'],
    ];
    let row = y - 36;
    for (const [label, value] of rows) {
      page.text(50, row, label, { color: MUTED }).text(220, row, value, { bold: true });
      row -= 22;
    }
    paragraph(page, row - 10, ['Conclusion: normal ECG. Continue blood pressure treatment.'], { size: 11 });
    return footer(page, 'Cardiology: Dr. Sample Cardiologist');
  },

  placeholder({ page, y }, { title }) {
    page.text(50, y, title, { size: 15, bold: true });
    paragraph(
      page,
      y - 32,
      [
        'This PDF was added in an earlier visit to the demo.',
        'The demo keeps uploaded files only until the page is reloaded,',
        'so this page stands in for it. The live system keeps every PDF.',
      ],
      { size: 11, color: MUTED },
    );
    return footer(page, 'Clinic system demo');
  },
};

/** Returns a PDF Blob of the given sample kind ('blood', 'xray', 'rx', 'ecg' or 'placeholder'). */
export function makeSamplePdf(kind, { patient, date, clinicName, title = '' }) {
  const labels = {
    blood: 'LABORATORY',
    xray: 'RADIOLOGY',
    rx: 'PRESCRIPTION',
    ecg: 'CARDIOLOGY',
    placeholder: 'DOCUMENT',
  };
  const head = letterhead(labels[kind] || 'DOCUMENT', { patient, date, clinicName });
  return (builders[kind] || builders.placeholder)(head, { title }).toBlob();
}
