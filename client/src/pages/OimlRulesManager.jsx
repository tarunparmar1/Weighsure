import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { OfflineContext } from '../context/OfflineContext';
import { getOfflineRules, saveOfflineRule } from '../services/offlineStore';
import { FiSettings, FiUploadCloud, FiCheckCircle, FiShield, FiPlus, FiCpu } from 'react-icons/fi';

export default function OimlRulesManager() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useContext(OfflineContext);

  const [newRuleJson, setNewRuleJson] = useState(`{
  "version": "R76-2024-v2",
  "name": "OIML R-76 (2024 Revision)",
  "description": "Updated metrological requirements for electronic digital weighing instruments",
  "effectiveDate": "2024-01-01",
  "accuracyClasses": {
    "III": {
      "label": "Medium",
      "minScaleIntervals": 500,
      "maxScaleIntervals": 10000,
      "minCapacityMultiplier": 20,
      "mpeRanges": [
        { "fromIntervals": 0, "toIntervals": 500, "mpeInE": 0.5 },
        { "fromIntervals": 500, "toIntervals": 2000, "mpeInE": 1.0 },
        { "fromIntervals": 2000, "toIntervals": 10000, "mpeInE": 1.5 }
      ]
    }
  }
}`);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [isOnline]);

  const fetchRules = async () => {
    setLoading(true);
    if (isOnline) {
      try {
        const res = await API.get('/oiml-rules');
        setRules(res.data.rules);
      } catch (err) {
        console.error('Error fetching online rules, falling back to local store:', err);
        const local = await getOfflineRules();
        setRules(local);
      } finally {
        setLoading(false);
      }
    } else {
      const local = await getOfflineRules();
      setRules(local);
      setLoading(false);
    }
  };

  const handleSetLatest = async (id) => {
    try {
      await API.put(`/oiml-rules/${id}/set-latest`);
      fetchRules();
      alert('Selected OIML Engine version activated as primary calculation engine!');
    } catch (err) {
      alert('Failed to set latest rule version.');
    }
  };

  const handleUploadRule = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const parsed = JSON.parse(newRuleJson);
      if (isOnline) {
        await API.post('/oiml-rules', parsed);
        alert('New OIML engine rule set uploaded and deployed successfully!');
        fetchRules();
      } else {
        await saveOfflineRule(parsed);
        alert('New rule saved locally in offline store.');
      }
    } catch (err) {
      alert('Invalid JSON structure or server upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Upgradable OIML R-76 <span className="gradient-text">Calculation Engine</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Dynamic Engine Version Control & Automated Rule Set Upgrades
        </p>
      </div>

      {/* Installed Engine Versions Grid */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiCpu color="var(--accent-primary)" /> Installed Engine Versions
        </h3>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Version ID</th>
                <th>Standard Name</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading engine versions...</td></tr>
              ) : rules.length > 0 ? (
                rules.map((rule) => (
                  <tr key={rule._id || rule.version}>
                    <td style={{ fontWeight: 600 }}><span className="badge badge-info">{rule.version}</span></td>
                    <td>{rule.name}</td>
                    <td>{new Date(rule.effectiveDate).toLocaleDateString()}</td>
                    <td>
                      {rule.isLatest ? (
                        <span className="badge badge-passed"><FiCheckCircle /> ACTIVE ENGINE</span>
                      ) : (
                        <span className="badge badge-pending">ARCHIVED</span>
                      )}
                    </td>
                    <td>
                      {!rule.isLatest && isOnline && rule._id && (
                        <button onClick={() => handleSetLatest(rule._id)} className="btn btn-secondary btn-sm">
                          Set Active Engine
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No rules found. Default R76-2006-v1 engine is active.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deploy / Upgrade Engine Form */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiUploadCloud color="var(--accent-primary)" /> Upgrade OIML Engine (Deploy New Rule Set JSON)
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          When OIML recommendations are revised or updated by international committees, upload the new version JSON document below. The engine will instantly update without requiring code rebuilds or server restarts.
        </p>

        <form onSubmit={handleUploadRule}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Rule Definition JSON</label>
            <textarea
              rows={12}
              className="form-textarea"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem', background: '#0b0f19' ,color:'white'}}
              value={newRuleJson}
              onChange={(e) => setNewRuleJson(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              <FiUploadCloud /> {uploading ? 'Deploying...' : 'Deploy & Activate Engine Rule Set'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
