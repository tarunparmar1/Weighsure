import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { OfflineContext } from '../context/OfflineContext';
import { getOfflineReports } from '../services/offlineStore';
import { downloadReportPDF, downloadReportDOCX } from '../utils/downloadHelper';
import { FiPlus, FiSearch, FiFileText, FiDownload, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { isOnline } = useContext(OfflineContext);

  useEffect(() => {
    fetchReports();
  }, [search, statusFilter, isOnline]);

  const fetchReports = async () => {
    setLoading(true);
    let serverReports = [];
    let localReports = [];

    if (isOnline) {
      try {
        let url = `/reports?search=${encodeURIComponent(search)}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        const res = await API.get(url);
        serverReports = res.data.reports || [];
      } catch (err) {
        console.error('Fetching online reports failed:', err);
      }
    }

    try {
      localReports = await getOfflineReports();
    } catch (e) {
      console.error('Failed to load local reports:', e);
    }

    // Combine server & offline reports, avoiding duplicates
    const combinedMap = new Map();

    // Add server reports first
    serverReports.forEach((r) => {
      const key = r._id || r.clientId;
      combinedMap.set(key, r);
    });

    // Add local reports (if not already present from server)
    localReports.forEach((r) => {
      const key = r._id || r.clientId || r.id;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, r);
      }
    });

    let mergedList = Array.from(combinedMap.values());

    // Filter by status if selected
    if (statusFilter) {
      mergedList = mergedList.filter((r) => r.status === statusFilter);
    }

    // Filter by search string if typed
    if (search) {
      const s = search.toLowerCase();
      mergedList = mergedList.filter(
        (r) =>
          r.reportNumber?.toLowerCase().includes(s) ||
          r.laboratory?.name?.toLowerCase().includes(s) ||
          r.instrument?.manufacturer?.name?.toLowerCase().includes(s) ||
          r.instrument?.modelInfo?.modelNumber?.toLowerCase().includes(s)
      );
    }

    // Sort newest first
    mergedList.sort((a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt));

    setReports(mergedList);
    setLoading(false);
  };

  const handlePDF = (report) => {
    downloadReportPDF(report);
  };

  const handleDOCX = (report) => {
    downloadReportDOCX(report);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>
      
      {/* Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--gov-navy)', marginBottom: '0.2rem' }}>
            National OIML R-76 Type Evaluation Reports Repository
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Official Register of Verification Certificates & Test Data
          </p>
        </div>
        <Link to="/reports/new" className="btn btn-primary">
          <FiPlus /> Initiate Type Evaluation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search report number, manufacturer, or laboratory name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved & Stamped</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="gov-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Report Number</th>
                <th>Manufacturer / Model</th>
                <th>Evaluation Date</th>
                <th>Engine Version</th>
                <th>Status</th>
                <th>Verification Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading test reports...</td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((rpt, idx) => (
                  <tr key={rpt._id || rpt.clientId || rpt.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/reports/${rpt._id || rpt.clientId || rpt.id}`} style={{ color: 'var(--gov-blue)', textDecoration: 'none' }}>
                        {rpt.reportNumber || `NAWI-RPT-${idx + 1}`}
                      </Link>
                    </td>
                    <td>
                      {rpt.instrument?.manufacturer?.name || 'Scale Model'} ({rpt.instrument?.modelInfo?.modelNumber || 'N/A'})
                    </td>
                    <td>{new Date(rpt.reportDate || rpt.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-info">{rpt.oimlRuleVersion || 'R76-2006-v1'}</span></td>
                    <td>
                      <span className={`badge badge-${rpt.status === 'completed' || rpt.status === 'approved' ? 'passed' : 'pending'}`}>
                        {rpt.status}
                      </span>
                    </td>
                    <td>
                      {rpt.overallResult?.passed === true && <span className="badge badge-passed">COMPLIANT</span>}
                      {rpt.overallResult?.passed === false && <span className="badge badge-failed">REJECTED</span>}
                      {rpt.overallResult?.passed === undefined && <span className="badge badge-pending">PENDING</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Link to={`/reports/${rpt._id || rpt.clientId || rpt.id}`} className="btn btn-secondary btn-sm" title="View Report Certificate">
                          <FiEye /> View
                        </Link>
                        <button onClick={() => handlePDF(rpt)} className="btn btn-secondary btn-sm" title="Download Official PDF">
                          <FiDownload /> PDF
                        </button>
                        <button onClick={() => handleDOCX(rpt)} className="btn btn-secondary btn-sm" title="Download Word DOCX">
                          DOCX
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No test reports found in repository.
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
