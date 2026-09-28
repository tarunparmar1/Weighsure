import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { OfflineContext } from '../context/OfflineContext';
import { AuthContext } from '../context/AuthContext';
import { getOfflineReports, saveOfflineReport } from '../services/offlineStore';
import { downloadReportPDF, downloadReportDOCX } from '../utils/downloadHelper';
import {
  FiArrowLeft,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiCheck,
  FiX,
} from 'react-icons/fi';

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOnline } = useContext(OfflineContext);
  const { user } = useContext(AuthContext);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id, isOnline]);

  const loadReport = async () => {
    setLoading(true);
    if (isOnline) {
      try {
        const res = await API.get(`/reports/${id}`);
        setReport(res.data.report);
      } catch (err) {
        console.error('Error fetching online report, loading local store:', err);
        await loadLocalReport();
      } finally {
        setLoading(false);
      }
    } else {
      await loadLocalReport();
      setLoading(false);
    }
  };

  const loadLocalReport = async () => {
    const local = await getOfflineReports();
    const match = local.find((r) => r.id === id || r._id === id || r.clientId === id || r.reportNumber === id);
    if (match) setReport(match);
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve and stamp this official test report?')) return;
    setApproving(true);
    const targetId = report._id || report.clientId || id;

    const updatedLocal = {
      ...report,
      status: 'approved',
      overallResult: {
        ...(report.overallResult || {}),
        approvedBy: user?.name || 'Dr. Rajesh Sharma (Director)',
      },
    };

    // Save locally first
    await saveOfflineReport(updatedLocal);
    setReport(updatedLocal);

    if (isOnline) {
      try {
        const res = await API.post(`/reports/${targetId}/approve`, report);
        if (res.data?.report) {
          setReport(res.data.report);
          await saveOfflineReport({ ...res.data.report, synced: true });
        }
        alert('Test Report approved and stamped successfully!');
      } catch (err) {
        console.warn('Server approval error, report remains approved locally:', err);
        alert('Report approved and saved locally!');
      } finally {
        setApproving(false);
      }
    } else {
      setApproving(false);
      alert('Report approved locally in offline store!');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter reason for rejecting this test report:', 'Failed Maximum Permissible Error (MPE) tolerance limits');
    if (reason === null) return;

    setRejecting(true);
    const targetId = report._id || report.clientId || id;

    const updatedLocal = {
      ...report,
      status: 'rejected',
      overallResult: {
        ...(report.overallResult || {}),
        passed: false,
        summary: reason || 'Report rejected during official review.',
        approvedBy: `Rejected by ${user?.name || 'Testing Officer'}`,
      },
    };

    // Save locally first
    await saveOfflineReport(updatedLocal);
    setReport(updatedLocal);

    if (isOnline) {
      try {
        const res = await API.post(`/reports/${targetId}/reject`, { ...report, reason });
        if (res.data?.report) {
          setReport(res.data.report);
          await saveOfflineReport({ ...res.data.report, synced: true });
        }
        alert('Test Report has been REJECTED.');
      } catch (err) {
        console.warn('Server rejection error, report remains rejected locally:', err);
        alert('Report rejected and saved locally!');
      } finally {
        setRejecting(false);
      }
    } else {
      setRejecting(false);
      alert('Report rejected locally in offline store!');
    }
  };

  const handlePDF = () => {
    if (report) downloadReportPDF(report);
  };

  const handleDOCX = () => {
    if (report) downloadReportDOCX(report);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gov-navy)' }}>Loading Official Test Report...</div>;
  }

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Test Report Not Found</h2>
        <button onClick={() => navigate('/reports')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Reports Repository
        </button>
      </div>
    );
  }

  const inst = report.instrument || {};
  const specs = inst.specifications || {};
  const lab = report.laboratory || {};

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/reports')} className="btn btn-secondary btn-sm">
          <FiArrowLeft /> Return to Repository
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handlePDF} className="btn btn-primary btn-sm">
            <FiDownload /> Export Official PDF
          </button>
          <button onClick={handleDOCX} className="btn btn-secondary btn-sm">
            <FiDownload /> Export Editable Word (DOCX)
          </button>

          {/* Side by Side Approval & Rejection Buttons */}
          {report.status !== 'approved' && report.status !== 'rejected' && (
            <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid var(--border-gov)', paddingLeft: '0.5rem' }}>
              <button onClick={handleApprove} className="btn btn-success btn-sm" disabled={approving || rejecting}>
                <FiCheck /> Approve & Stamp Report
              </button>
              <button onClick={handleReject} className="btn btn-danger btn-sm" disabled={approving || rejecting}>
                <FiX /> Reject Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Official Government Document Certificate */}
      <div className="gov-card" style={{ padding: '2.5rem', border: '2px solid var(--gov-navy)', background: '#ffffff' }}>
        
        {/* Government Header & Crest */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--gov-navy)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
            भारत सरकार | GOVERNMENT OF INDIA
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)', marginTop: '0.1rem' }}>
            उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय | MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            विधिक माप विज्ञान प्रभाग | LEGAL METROLOGY DIVISION
          </div>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--gov-navy)', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            TYPE EVALUATION TEST REPORT
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Non-Automatic Weighing Instruments (NAWI) — Evaluation as per OIML Recommendation R-76
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Issued under Legal Metrology Act, 2009 & Legal Metrology (General) Rules, 2011
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8125rem', background: 'var(--gov-blue-light)', padding: '0.4rem', borderRadius: '4px' }}>
            <span>Report Number: <strong>{report.reportNumber}</strong></span>
            <span>Date of Issue: <strong>{new Date(report.reportDate || report.createdAt).toLocaleDateString('en-IN')}</strong></span>
            <span>OIML Engine: <strong>{report.oimlRuleVersion || 'R76-2006-v1'}</strong></span>
          </div>
        </div>

        {/* Section 1: Laboratory */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--gov-navy)', borderBottom: '1px solid var(--border-gov)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
            1. TESTING LABORATORY & ENVIRONMENTAL CONDITIONS
          </h3>
          <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: '25%' }}>Designated Laboratory</td>
                <td>{lab.name || 'Regional Reference Standard Laboratory'}</td>
                <td style={{ fontWeight: 600, width: '25%' }}>Accreditation No.</td>
                <td>{lab.accreditationNumber || 'NABL-LM-2024-001'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Ambient Temperature</td>
                <td>{lab.labTemperature ?? 23.5} °C</td>
                <td style={{ fontWeight: 600 }}>Relative Humidity</td>
                <td>{lab.labHumidity ?? 52} % RH</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Instrument Specs */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--gov-navy)', borderBottom: '1px solid var(--border-gov)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
            2. INSTRUMENT IDENTIFICATION & TECHNICAL PARAMETERS
          </h3>
          <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: '25%' }}>Manufacturer Name</td>
                <td>{inst.manufacturer?.name || 'Unspecified'}</td>
                <td style={{ fontWeight: 600, width: '25%' }}>Accuracy Class</td>
                <td><span className="badge badge-info">Class {specs.accuracyClass}</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Model / Serial No.</td>
                <td>{inst.modelInfo?.modelNumber} / {inst.modelInfo?.serialNumber || 'N/A'}</td>
                <td style={{ fontWeight: 600 }}>Maximum Capacity (Max)</td>
                <td><strong>{specs.maxCapacity} kg</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Verification Scale Interval (e)</td>
                <td><strong>{specs.verificationScaleInterval_e} kg</strong></td>
                <td style={{ fontWeight: 600 }}>Minimum Capacity (Min)</td>
                <td><strong>{specs.minCapacity} kg</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Actual Scale Interval (d)</td>
                <td><strong>{specs.actualScaleInterval_d} kg</strong></td>
                <td style={{ fontWeight: 600 }}>Number of Scale Intervals (n)</td>
                <td><strong>{specs.numberOfIntervals_n || Math.floor((specs.maxCapacity || 1) / (specs.verificationScaleInterval_e || 1))}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Test Evaluation Results */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--gov-navy)', borderBottom: '1px solid var(--border-gov)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
            3. SUMMARY OF OIML R-76 METROLOGICAL TEST EVALUATIONS
          </h3>
          
          {report.tests && report.tests.length > 0 ? (
            report.tests.map((test, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.6rem', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gov-navy)' }}>
                    3.{idx + 1} {test.testType.toUpperCase()} TEST EVALUATION
                  </span>
                  <span className={`badge badge-${test.results?.passed ? 'passed' : 'failed'}`}>
                    {test.results?.passed ? 'COMPLIANT ✓' : 'NON-COMPLIANT ✗'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {test.results?.remarks || 'Observed errors evaluated against permissible tolerances.'}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No test observations recorded.</div>
          )}
        </div>

        {/* Section 4: Final Compliance Stamp Banner */}
        <div style={{ textAlign: 'center', padding: '1rem', background: report.status === 'rejected' || report.overallResult?.passed === false ? '#fce8e6' : '#e6f4ea', border: `2px solid ${report.status === 'rejected' || report.overallResult?.passed === false ? '#c5221f' : '#137333'}`, borderRadius: '4px', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: report.status === 'rejected' || report.overallResult?.passed === false ? '#c5221f' : '#137333', textTransform: 'uppercase' }}>
            FINAL VERIFICATION RESULT: {report.status === 'rejected' ? 'MODEL REJECTED' : (report.overallResult?.passed ? 'MODEL APPROVED (COMPLIANT)' : 'MODEL REJECTED (NON-COMPLIANT)')}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
            {report.overallResult?.summary || (report.overallResult?.passed ? 'The weighing instrument satisfies all technical and metrological criteria of OIML Recommendation R-76.' : 'The instrument fails to satisfy Maximum Permissible Error tolerances.')}
          </div>
        </div>

        {/* Signatures & Seal Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-gov)', fontSize: '0.8125rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '200px', borderBottom: '1px solid var(--text-dark)', marginBottom: '0.4rem', paddingBottom: '0.2rem', fontWeight: 600 }}>
              {report.createdBy?.name || 'Priya Verma'}
            </div>
            <div>Testing Officer / Metrology Engineer</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Regional Reference Standard Laboratory</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '200px', borderBottom: '1px solid var(--text-dark)', marginBottom: '0.4rem', paddingBottom: '0.2rem', fontWeight: 600 }}>
              {report.overallResult?.approvedBy || (report.status === 'approved' ? 'Dr. Rajesh Sharma (Director)' : (report.status === 'rejected' ? 'Rejected' : 'Pending Review'))}
            </div>
            <div>Approving Authority / Director</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Department of Consumer Affairs</div>
          </div>
        </div>

      </div>

    </div>
  );
}
