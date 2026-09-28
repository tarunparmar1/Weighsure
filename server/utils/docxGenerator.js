const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
} = require('docx');

/**
 * Generate a DOCX test report from a populated report document.
 */
async function generateDOCX(report) {
  const inst = report.instrument || {};
  const specs = inst.specifications || {};
  const lab = report.laboratory || {};

  const children = [];

  // Title
  children.push(
    new Paragraph({ text: 'TEST REPORT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Non-Automatic Weighing Instrument — OIML R-76', size: 20, color: '666666' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Report: ${report.reportNumber}  |  Date: ${new Date(report.reportDate).toLocaleDateString('en-IN')}  |  Engine: ${report.oimlRuleVersion}`, size: 18, color: '888888' }),
      ],
    }),
    new Paragraph({ text: '' }),
  );

  // Section: Laboratory
  children.push(
    new Paragraph({ text: '1. LABORATORY DETAILS', heading: HeadingLevel.HEADING_2 }),
    ...makeInfoRows([
      ['Laboratory Name', lab.name || '—'],
      ['Address', lab.address || '—'],
      ['Accreditation No.', lab.accreditationNumber || '—'],
      ['Temperature (°C)', lab.labTemperature ?? '—'],
      ['Humidity (%RH)', lab.labHumidity ?? '—'],
    ]),
    new Paragraph({ text: '' }),
  );

  // Section: Instrument
  children.push(
    new Paragraph({ text: '2. INSTRUMENT DETAILS', heading: HeadingLevel.HEADING_2 }),
    ...makeInfoRows([
      ['Manufacturer', inst.manufacturer?.name || '—'],
      ['Model Number', inst.modelInfo?.modelNumber || '—'],
      ['Serial Number', inst.modelInfo?.serialNumber || '—'],
      ['Accuracy Class', specs.accuracyClass || '—'],
      ['Max Capacity', `${specs.maxCapacity ?? '—'} kg`],
      ['Min Capacity', `${specs.minCapacity ?? '—'} kg`],
      ['Verification Interval (e)', `${specs.verificationScaleInterval_e ?? '—'} kg`],
      ['Actual Scale Interval (d)', `${specs.actualScaleInterval_d ?? '—'} kg`],
      ['No. of Intervals (n)', String(specs.numberOfIntervals_n ?? '—')],
    ]),
    new Paragraph({ text: '' }),
  );

  // Section: Tests
  children.push(
    new Paragraph({ text: '3. TEST RESULTS', heading: HeadingLevel.HEADING_2 }),
  );

  if (report.tests && report.tests.length > 0) {
    report.tests.forEach((test, idx) => {
      const passed = test.results?.passed;
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `3.${idx + 1}  ${formatTestName(test.testType)}  —  `, bold: true }),
            new TextRun({ text: passed ? 'PASSED' : 'FAILED', bold: true, color: passed ? '16a34a' : 'dc2626' }),
          ],
        }),
      );
      if (test.results?.remarks) {
        children.push(new Paragraph({ children: [new TextRun({ text: test.results.remarks, size: 18 })] }));
      }
      children.push(new Paragraph({ text: '' }));
    });
  } else {
    children.push(new Paragraph({ text: 'No tests recorded.' }));
  }

  // Section: Overall
  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '4. OVERALL RESULT', heading: HeadingLevel.HEADING_2 }),
  );

  if (report.overallResult) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: report.overallResult.passed ? 'OVERALL: PASSED' : 'OVERALL: FAILED',
            bold: true, size: 32,
            color: report.overallResult.passed ? '16a34a' : 'dc2626',
          }),
        ],
      }),
    );
    if (report.overallResult.summary) {
      children.push(new Paragraph({ text: report.overallResult.summary }));
    }
  }

  // Signatures
  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: '_________________________          ', size: 20 }),
        new TextRun({ text: '          _________________________', size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Testing Officer                                   ', size: 18 }),
        new TextRun({ text: '                    Approving Authority', size: 18 }),
      ],
    }),
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

function makeInfoRows(pairs) {
  return pairs.map(([label, value]) => new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: String(value), size: 20 }),
    ],
  }));
}

function formatTestName(type) {
  const names = {
    eccentricity: 'Eccentricity Test',
    repeatability: 'Repeatability Test',
    increasingLoad: 'Increasing Load Test',
    decreasingLoad: 'Decreasing Load Test',
    increasingDecreasingLoad: 'Increasing/Decreasing Load Test',
    discrimination: 'Discrimination Test',
    tare: 'Tare Device Test',
    zeroTracking: 'Zero Tracking Test',
    temperature: 'Temperature Test',
    tilting: 'Tilting Test',
  };
  return names[type] || type;
}

module.exports = { generateDOCX };
