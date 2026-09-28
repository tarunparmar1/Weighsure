import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateOfflinePDF(report) {
  const doc = new jsPDF();
  const inst = report.instrument || {};
  const specs = inst.specifications || {};

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TEST REPORT (OFFLINE GENERATED)', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Non-Automatic Weighing Instrument — OIML R-76', 105, 27, { align: 'center' });
  doc.text(`Report No: ${report.reportNumber || 'LOCAL-DRAFT'} | Date: ${new Date().toLocaleDateString()}`, 105, 33, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Section 1: Instrument Specs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Instrument Specifications', 14, 46);

  doc.autoTable({
    startY: 50,
    head: [['Parameter', 'Value']],
    body: [
      ['Manufacturer', inst.manufacturer?.name || 'Local Scale'],
      ['Model Number', inst.modelInfo?.modelNumber || 'N/A'],
      ['Accuracy Class', specs.accuracyClass || 'III'],
      ['Max Capacity (Max)', `${specs.maxCapacity || '—'} kg`],
      ['Min Capacity (Min)', `${specs.minCapacity || '—'} kg`],
      ['Scale Interval (e = d)', `${specs.verificationScaleInterval_e || '—'} kg`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Section 2: Test Results
  const currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. OIML R-76 Compliance Summary', 14, currentY);

  const testRows = (report.tests || []).map((t) => [
    t.testType.toUpperCase(),
    t.results?.passed ? 'PASSED' : 'FAILED',
    t.results?.remarks || 'Evaluated against OIML MPE boundaries',
  ]);

  doc.autoTable({
    startY: currentY + 5,
    head: [['Test Type', 'Status', 'Remarks']],
    body: testRows.length > 0 ? testRows : [['All Prescribed Tests', report.overallResult?.passed ? 'PASSED' : 'FAILED', 'Local Evaluation']],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Overall Result Banner
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  if (report.overallResult?.passed) {
    doc.setTextColor(22, 163, 74);
    doc.text('OVERALL VERIFICATION RESULT: PASSED', 105, finalY, { align: 'center' });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text('OVERALL VERIFICATION RESULT: FAILED', 105, finalY, { align: 'center' });
  }

  doc.save(`${report.reportNumber || 'NAWI-REPORT'}.pdf`);
}
