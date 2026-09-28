import API from '../services/api';
import { generateOfflinePDF } from '../services/offlinePdfGenerator';

/**
 * Validates whether a report is finalized (completed, approved, or rejected) for download.
 * If report is in draft or in_progress status, download is prohibited.
 */
function isReportReadyForDownload(report) {
  if (!report) return false;
  if (report.status === 'draft' || report.status === 'in_progress') {
    return false;
  }
  return true;
}

/**
 * Downloads the official PDF for a test report.
 */
export async function downloadReportPDF(report) {
  if (!isReportReadyForDownload(report)) {
    alert('You cannot download a test report that has not been finalized or approved yet.');
    return;
  }

  if (report._id) {
    try {
      const response = await API.get(`/reports/${report._id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.reportNumber || 'NAWI-Report'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;
    } catch (err) {
      console.warn('Server PDF download failed, using client-side generator:', err);
    }
  }

  // Client-side jsPDF fallback
  generateOfflinePDF(report);
}

/**
 * Downloads the editable DOCX for a test report.
 */
export async function downloadReportDOCX(report) {
  if (!isReportReadyForDownload(report)) {
    alert('You cannot download a test report that has not been finalized or approved yet.');
    return;
  }

  if (!report._id) {
    alert('DOCX export requires server connection.');
    return;
  }
  try {
    const response = await API.get(`/reports/${report._id}/docx`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.reportNumber || 'NAWI-Report'}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Failed to download DOCX file. Please check server status.');
  }
}
