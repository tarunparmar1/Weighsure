import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { OfflineContext } from '../context/OfflineContext';
import { getOfflineInstruments, deleteOfflineInstrument } from '../services/offlineStore';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiLayers } from 'react-icons/fi';

export default function Instruments() {
  const [instruments, setInstruments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { isOnline } = useContext(OfflineContext);

  useEffect(() => {
    fetchInstruments();
  }, [search, isOnline]);

  const fetchInstruments = async () => {
    setLoading(true);
    let serverList = [];
    let localList = [];

    if (isOnline) {
      try {
        const res = await API.get(`/instruments?search=${encodeURIComponent(search)}`);
        serverList = res.data.instruments || [];
      } catch (err) {
        console.error('Error fetching online instruments:', err);
      }
    }

    try {
      localList = await getOfflineInstruments();
    } catch (e) {
      console.error('Error loading offline instruments:', e);
    }

    const combinedMap = new Map();

    serverList.forEach((inst) => {
      const key = inst._id || inst.clientId || inst.id;
      combinedMap.set(key, inst);
    });

    localList.forEach((inst) => {
      const key = inst._id || inst.clientId || inst.id;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, inst);
      }
    });

    let merged = Array.from(combinedMap.values());

    if (search) {
      const s = search.toLowerCase();
      merged = merged.filter(
        (inst) =>
          inst.manufacturer?.name?.toLowerCase().includes(s) ||
          inst.modelInfo?.modelNumber?.toLowerCase().includes(s) ||
          inst.modelInfo?.serialNumber?.toLowerCase().includes(s)
      );
    }

    setInstruments(merged);
    setLoading(false);
  };

  const handleDelete = async (inst) => {
    const modelName = inst.modelInfo?.modelNumber || inst.manufacturer?.name || 'this machine';
    if (!window.confirm(`Are you sure you want to delete ${modelName}?`)) return;

    const targetId = inst._id || inst.clientId || inst.id;

    // Delete locally first
    await deleteOfflineInstrument(targetId);
    if (inst._id) await deleteOfflineInstrument(inst._id);
    if (inst.clientId) await deleteOfflineInstrument(inst.clientId);

    // If online and has server ID, call server DELETE
    if (isOnline && (inst._id || targetId)) {
      try {
        await API.delete(`/instruments/${inst._id || targetId}`);
      } catch (err) {
        console.warn('Server delete warning:', err.response?.data?.message || err.message);
      }
    }

    alert(`Instrument ${modelName} deleted successfully.`);
    fetchInstruments();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>
      
      {/* Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--gov-navy)', marginBottom: '0.2rem' }}>
            National NAWI Instrument Specifications Register
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Form LM-1 Model Registration & Metrological Specifications
          </p>
        </div>
        <Link to="/instruments/new" className="btn btn-primary">
          <FiPlus /> Register New NAWI Model
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="gov-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by manufacturer name, model designation, or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Official Table */}
      <div className="gov-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Manufacturer Name</th>
                <th>Model Designation</th>
                <th>Serial Number</th>
                <th>Accuracy Class</th>
                <th>Max Capacity</th>
                <th>Interval (e = d)</th>
                <th>Intervals (n)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading model specifications...</td>
                </tr>
              ) : instruments.length > 0 ? (
                instruments.map((inst, idx) => (
                  <tr key={inst._id || inst.clientId || inst.id || idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--gov-navy)' }}>{inst.manufacturer?.name || 'Unspecified'}</td>
                    <td>{inst.modelInfo?.modelNumber}</td>
                    <td>{inst.modelInfo?.serialNumber || '—'}</td>
                    <td>
                      <span className="badge badge-info">Class {inst.specifications?.accuracyClass}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{inst.specifications?.maxCapacity} kg</td>
                    <td>{inst.specifications?.verificationScaleInterval_e} kg</td>
                    <td>{inst.specifications?.numberOfIntervals_n || Math.floor((inst.specifications?.maxCapacity || 1) / (inst.specifications?.verificationScaleInterval_e || 1))}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Link to={`/instruments/edit/${inst._id || inst.clientId || inst.id}`} className="btn btn-secondary btn-sm" title="Edit Model Specs">
                          <FiEdit /> Edit
                        </Link>
                        <button onClick={() => handleDelete(inst)} className="btn btn-danger btn-sm" title="Delete Model Specs">
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No NAWI model specifications registered in database. Click "Register New NAWI Model" to add one.
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
