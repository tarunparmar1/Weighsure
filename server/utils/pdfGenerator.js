const PDFDocument = require('pdfkit');

/**
 * Generate a standardized test report PDF from a populated report document.
 */
async function generatePDF(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const inst = report.instrument;
      const specs = inst?.specifications || {};

      // ── Header ──
      doc.fontSize(18).font('Helvetica-Bold')
        .text('TEST REPORT', { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text('Non-Automatic Weighing Instrument — OIML R-76', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#555')
        .text(`Report Number: ${report.reportNumber}`, { align: 'center' });
      doc.text(`Date: ${new Date(report.reportDate).toLocaleDateString('en-IN')}`, { align: 'center' });
      doc.text(`OIML Engine Version: ${report.oimlRuleVersion}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2563eb').stroke();
      doc.moveDown();

      // ── Laboratory Details ──
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000')
        .text('1. LABORATORY DETAILS');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      const lab = report.laboratory || {};
      addRow(doc, 'Laboratory Name', lab.name || '—');
      addRow(doc, 'Address', lab.address || '—');
      addRow(doc, 'Accreditation No.', lab.accreditationNumber || '—');
      addRow(doc, 'Temperature (°C)', lab.labTemperature ?? '—');
      addRow(doc, 'Humidity (%RH)', lab.labHumidity ?? '—');
      doc.moveDown();

      // ── Instrument Details ──
      doc.fontSize(12).font('Helvetica-Bold')
        .text('2. INSTRUMENT DETAILS');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      addRow(doc, 'Manufacturer', inst?.manufacturer?.name || '—');
      addRow(doc, 'Model Number', inst?.modelInfo?.modelNumber || '—');
      addRow(doc, 'Serial Number', inst?.modelInfo?.serialNumber || '—');
      addRow(doc, 'Accuracy Class', specs.accuracyClass || '—');
      addRow(doc, 'Max Capacity', `${specs.maxCapacity ?? '—'} kg`);
      addRow(doc, 'Min Capacity', `${specs.minCapacity ?? '—'} kg`);
      addRow(doc, 'Verification Interval (e)', `${specs.verificationScaleInterval_e ?? '—'} kg`);
      addRow(doc, 'Actual Scale Interval (d)', `${specs.actualScaleInterval_d ?? '—'} kg`);
      addRow(doc, 'No. of Intervals (n)', specs.numberOfIntervals_n ?? '—');
      doc.moveDown();

      // ── Test Results ──
      doc.fontSize(12).font('Helvetica-Bold')
        .text('3. TEST RESULTS');
      doc.moveDown(0.3);

      if (report.tests && report.tests.length > 0) {
        report.tests.forEach((test, idx) => {
          doc.fontSize(10).font('Helvetica-Bold')
            .text(`3.${idx + 1} ${formatTestName(test.testType)}`);
          doc.moveDown(0.2);

          const result = test.results?.calculated;
          if (result) {
            // Result header
            const passText = test.results.passed ? 'PASSED ✓' : 'FAILED ✗';
            const passColor = test.results.passed ? '#16a34a' : '#dc2626';
            doc.fontSize(9).font('Helvetica-Bold').fillColor(passColor)
              .text(`Result: ${passText}`);
            doc.fillColor('#000').font('Helvetica');

            if (test.results.remarks) {
              doc.fontSize(8).text(test.results.remarks);
            }

            // Detailed results table based on test type
            if (result.results && Array.isArray(result.results)) {
              doc.moveDown(0.3);
              result.results.forEach((r) => {
                const line = Object.entries(r)
                  .filter(([k]) => !['withinMPE', 'passed'].includes(k))
                  .map(([k, v]) => `${formatKey(k)}: ${typeof v === 'number' ? v.toFixed(4) : v}`)
                  .join('  |  ');
                doc.fontSize(7).text(line, { indent: 10 });
              });
            }

            // For increasing/decreasing load
            if (result.increasing) {
              doc.fontSize(8).font('Helvetica-Bold').text('Increasing Load:', { indent: 10 });
              doc.font('Helvetica');
              result.increasing.forEach((r) => {
                doc.fontSize(7).text(
                  `Load: ${r.testLoad} kg | Indication: ${r.indication} kg | Error: ${r.error} kg | MPE: ±${r.mpe} kg | ${r.withinMPE ? '✓' : '✗'}`,
                  { indent: 20 }
                );
              });
              doc.fontSize(8).font('Helvetica-Bold').text('Decreasing Load:', { indent: 10 });
              doc.font('Helvetica');
              result.decreasing.forEach((r) => {
                doc.fontSize(7).text(
                  `Load: ${r.testLoad} kg | Indication: ${r.indication} kg | Error: ${r.error} kg | MPE: ±${r.mpe} kg | ${r.withinMPE ? '✓' : '✗'}`,
                  { indent: 20 }
                );
              });
            }
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(9).text('No tests recorded.', { indent: 10 });
      }

      doc.moveDown();

      // ── Overall Result ──
      doc.fontSize(12).font('Helvetica-Bold')
        .text('4. OVERALL RESULT');
      doc.moveDown(0.3);

      if (report.overallResult) {
        const overallColor = report.overallResult.passed ? '#16a34a' : '#dc2626';
        doc.fontSize(14).font('Helvetica-Bold').fillColor(overallColor)
          .text(report.overallResult.passed ? 'OVERALL: PASSED' : 'OVERALL: FAILED', { align: 'center' });
        doc.fillColor('#000');
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica');
        if (report.overallResult.summary) doc.text(report.overallResult.summary);
        if (report.overallResult.evaluatedBy) addRow(doc, 'Evaluated By', report.overallResult.evaluatedBy);
        if (report.overallResult.approvedBy) addRow(doc, 'Approved By', report.overallResult.approvedBy);
      }

      doc.moveDown(2);

      // ── Signature Block ──
      doc.fontSize(9).font('Helvetica');
      const sigY = doc.y;
      doc.text('_________________________', 50, sigY);
      doc.text('_________________________', 350, sigY);
      doc.text('Testing Officer', 50, sigY + 15);
      doc.text('Approving Authority', 350, sigY + 15);

      // ── Footer ──
      doc.fontSize(7).fillColor('#999')
        .text(
          `Generated on ${new Date().toLocaleString('en-IN')} | NAWI Test Report System | OIML R-76`,
          50, 770, { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function addRow(doc, label, value) {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(String(value));
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

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

module.exports = { generatePDF };
