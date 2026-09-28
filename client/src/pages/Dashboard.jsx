import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { OfflineContext } from '../context/OfflineContext';
import { getOfflineReports, getOfflineInstruments } from '../services/offlineStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiLayers,
  FiRefreshCw,
  FiArrowRight,
  FiInfo,
  FiShield,
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useContext(OfflineContext);

  useEffect(() => {
    loadDashboardData();
  }, [isOnline]);

  const loadDashboardData = async () => {
    setLoading(true);
    if (isOnline) {
      try {
        const res = await API.get('/dashboard/stats');
        setData(res.data);
      } catch (err) {
        console.error('Online dashboard error, loading local store:', err);
        await loadOfflineDashboard();
      } finally {
        setLoading(false);
      }
    } else {
      await loadOfflineDashboard();
      setLoading(false);
    }
  };

  const loadOfflineDashboard = async () => {
    const offlineReports = await getOfflineReports();
    const offlineInsts = await getOfflineInstruments();

    const passed = offlineReports.filter((r) => r.overallResult?.passed === true).length;
    const failed = offlineReports.filter((r) => r.overallResult?.passed === false).length;
    const pending = offlineReports.filter((r) => r.status === 'draft' || r.status === 'in_progress').length;

    setData({
      stats: {
        totalReports: offlineReports.length,
        completedReports: offlineReports.filter((r) => r.status === 'completed').length,
        passedReports: passed,
        failedReports: failed,
        draftReports: pending,
        totalInstruments: offlineInsts.length,
      },
      recentReports: offlineReports.slice(0, 5),
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--gov-navy)' }}>
        <FiRefreshCw className="spin" size={28} /> &nbsp; Loading Legal Metrology Dashboard...
      </div>
    );
  }

  const stats = data?.stats || {};

  const doughnutData = {
    labels: ['Compliant (Passed)', 'Non-Compliant (Failed)', 'In Process / Draft'],
    datasets: [
      {
        data: [
          stats.passedReports || 0,
          stats.failedReports || 0,
          stats.draftReports || 0,
        ],
        backgroundColor: ['#138808', '#d9534f', '#ff9933'],
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  };

  const monthlyData = data?.monthlyData || [];
  const barData = {
    labels: monthlyData.length > 0 ? monthlyData.map((m) => `${m._id.month}/${m._id.year}`) : ['Current Month'],
    datasets: [
      {
        label: 'Verified Compliant',
        data: monthlyData.length > 0 ? monthlyData.map((m) => m.passed) : [stats.passedReports || 0],
        backgroundColor: '#0a2540',
        borderRadius: 2,
      },
      {
        label: 'Rejected Non-Compliant',
        data: monthlyData.length > 0 ? monthlyData.map((m) => m.failed) : [stats.failedReports || 0],
        backgroundColor: '#d9534f',
        borderRadius: 2,
      },
    ],
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>
      
      {/* Official Government Announcement Banner */}
      <div className="gov-banner-announcement">
        <FiInfo color="#ff9933" size={18} />
        <div>
          <strong>Official Notification:</strong> Evaluation of Non-Automatic Weighing Instruments (NAWI) conducted in compliance with the Legal Metrology Act, 2009 and OIML Recommendation R-76 Edition 2006.
        </div>
      </div>

      {/* Header Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--gov-navy)', marginBottom: '0.2rem' }}>
            Legal Metrology Type Evaluation Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            National Metrological Performance & Verification Summary
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/instruments/new" className="btn btn-secondary">
            <FiPlus /> Register Model / Instrument
          </Link>
          <Link to="/reports/new" className="btn btn-primary">
            <FiPlus /> Initiate Type Evaluation
          </Link>
        </div>
      </div>

      {/* Official Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-navy)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            TOTAL TEST REPORTS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gov-navy)' }}>{stats.totalReports || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {stats.completedReports || 0} completed evaluations
          </div>
        </div>

        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-green)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            OIML R-76 COMPLIANT
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gov-green)' }}>{stats.passedReports || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gov-green)', marginTop: '0.25rem' }}>
            Passed MPE & Technical Verification
          </div>
        </div>

        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-red)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            NON-COMPLIANT / REJECTED
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gov-red)' }}>{stats.failedReports || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gov-red)', marginTop: '0.25rem' }}>
            Exceeded Permissible Errors
          </div>
        </div>

        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-saffron)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            REGISTERED NAWI MODELS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gov-navy)' }}>{stats.totalInstruments || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Specifications in repository
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title"><FiCheckCircle color="var(--gov-green)" /> Compliance Verification Summary</span>
          </div>
          <div style={{ height: '210px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
              }}
            />
          </div>
        </div>

        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title"><FiShield color="var(--gov-navy)" /> Evaluation Trends & Compliance</span>
          </div>
          <div style={{ height: '210px' }}>
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                scales: {
                  x: { ticks: { font: { size: 10 } } },
                  y: { ticks: { font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>

      </div>

      {/* Recent Reports Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title"><FiFileText color="var(--gov-navy)" /> Recent Type Evaluation Test Reports</span>
          <Link to="/reports" style={{ color: 'var(--gov-blue)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View Full Repository <FiArrowRight />
          </Link>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Report Number</th>
                <th>Manufacturer / Model</th>
                <th>Date</th>
                <th>Status</th>
                <th>Verification Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentReports && data.recentReports.length > 0 ? (
                data.recentReports.map((report, idx) => (
                  <tr key={report._id || report.clientId}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--gov-navy)' }}>{report.reportNumber}</td>
                    <td>
                      {report.instrument?.manufacturer?.name || 'Local Manufacturer'} ({report.instrument?.modelInfo?.modelNumber || 'N/A'})
                    </td>
                    <td>{new Date(report.reportDate || report.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${report.status === 'completed' || report.status === 'approved' ? 'passed' : 'pending'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      {report.overallResult?.passed === true && <span className="badge badge-passed">COMPLIANT</span>}
                      {report.overallResult?.passed === false && <span className="badge badge-failed">REJECTED</span>}
                      {report.overallResult?.passed === undefined && <span className="badge badge-pending">UNDER TEST</span>}
                    </td>
                    <td>
                      <Link to={`/reports/${report._id || report.clientId}`} className="btn btn-secondary btn-sm">
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No test reports recorded yet. Click "Initiate Type Evaluation" to record test observations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
