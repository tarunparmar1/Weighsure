import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { saveOfflineInstrument, getOfflineInstruments } from '../services/offlineStore';
import { OfflineContext } from '../context/OfflineContext';
import { FiSave, FiArrowLeft, FiCamera, FiCheckCircle } from 'react-icons/fi';

export default function InstrumentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { isOnline } = useContext(OfflineContext);

  const [formData, setFormData] = useState({
    manufacturer: { name: '', address: '', country: 'India', contactPerson: '', phone: '', email: '' },
    modelInfo: { modelNumber: '', serialNumber: '', typeDesignation: '', yearOfManufacture: new Date().getFullYear() },
    specifications: {
      accuracyClass: 'III',
      maxCapacity: 15,
      minCapacity: 0.1,
      verificationScaleInterval_e: 0.005,
      actualScaleInterval_d: 0.005,
      tareRange: 15,
      tareType: 'subtractive',
      operatingTemperatureMin: -10,
      operatingTemperatureMax: 40,
    },
    photos: [],
  });

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadInstrument();
    }
  }, [id]);

  const loadInstrument = async () => {
    if (isOnline) {
      try {
        const res = await API.get(`/instruments/${id}`);
        setFormData(res.data.instrument);
      } catch (err) {
        console.error(err);
      }
    } else {
      const list = await getOfflineInstruments();
      const match = list.find((i) => i.id === id || i._id === id || i.clientId === id);
      if (match) setFormData(match);
    }
  };

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (!isOnline) {
      // Local preview URLs when offline
      const localPhotos = files.map((file) => ({
        url: URL.createObjectURL(file),
        caption: file.name,
      }));
      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...localPhotos] }));
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      files.forEach((f) => data.append('files', f));
      const res = await API.post('/upload/multiple', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...res.data.files] }));
    } catch (err) {
      alert('Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Auto calculate n = Max / e
    const maxCap = Number(formData.specifications.maxCapacity);
    const eVal = Number(formData.specifications.verificationScaleInterval_e);
    const calculatedN = Math.floor(maxCap / eVal);

    const updatedSpec = {
      ...formData.specifications,
      numberOfIntervals_n: calculatedN,
    };

    const finalData = {
      ...formData,
      specifications: updatedSpec,
    };

    if (isOnline) {
      try {
        if (isEdit) {
          await API.put(`/instruments/${id}`, finalData);
        } else {
          await API.post('/instruments', finalData);
        }
        await saveOfflineInstrument(finalData);
        navigate('/instruments');
      } catch (err) {
        alert('Error saving to server, saving locally instead.');
        await saveOfflineInstrument(finalData);
        navigate('/instruments');
      } finally {
        setLoading(false);
      }
    } else {
      await saveOfflineInstrument(finalData);
      setLoading(false);
      navigate('/instruments');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <button onClick={() => navigate('/instruments')} className="btn btn-secondary btn-sm" style={{ marginBottom: '0.5rem' }}>
            <FiArrowLeft /> Back to List
          </button>
          <h1 style={{ fontSize: '1.75rem' }}>
            {isEdit ? 'Edit Instrument Specifications' : 'Register New NAWI Instrument'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Manufacturer Details */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            1. Manufacturer Details
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Manufacturer Name *</label>
              <input type="text" className="form-input" value={formData.manufacturer.name} onChange={(e) => handleChange('manufacturer', 'name', e.target.value)} required placeholder="e.g. Mettler Toledo / Avery Weigh-Tronix" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input type="text" className="form-input" value={formData.manufacturer.country} onChange={(e) => handleChange('manufacturer', 'country', e.target.value)} placeholder="India" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input type="text" className="form-input" value={formData.manufacturer.contactPerson} onChange={(e) => handleChange('manufacturer', 'contactPerson', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Full Address</label>
            <input type="text" className="form-input" value={formData.manufacturer.address} onChange={(e) => handleChange('manufacturer', 'address', e.target.value)} placeholder="Industrial Area Phase 2, New Delhi" />
          </div>
        </div>

        {/* Model Information */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            2. Model Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Model Number / Designation *</label>
              <input type="text" className="form-input" value={formData.modelInfo.modelNumber} onChange={(e) => handleChange('modelInfo', 'modelNumber', e.target.value)} required placeholder="e.g. IND-570" />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input type="text" className="form-input" value={formData.modelInfo.serialNumber} onChange={(e) => handleChange('modelInfo', 'serialNumber', e.target.value)} placeholder="SN-2024-9981" />
            </div>
            <div className="form-group">
              <label className="form-label">Year of Manufacture</label>
              <input type="number" className="form-input" value={formData.modelInfo.yearOfManufacture} onChange={(e) => handleChange('modelInfo', 'yearOfManufacture', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Metrological Specifications (OIML R-76) */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            3. OIML R-76 Technical & Metrological Specifications
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Accuracy Class *</label>
              <select className="form-select" value={formData.specifications.accuracyClass} onChange={(e) => handleChange('specifications', 'accuracyClass', e.target.value)}>
                <option value="I">Class I (Special — High Precision)</option>
                <option value="II">Class II (High — Analytical / Trade)</option>
                <option value="III">Class III (Medium — Standard Trade Scale)</option>
                <option value="IIII">Class IIII (Ordinary — Industrial Heavy)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Capacity (Max in kg) *</label>
              <input type="number" step="any" className="form-input" value={formData.specifications.maxCapacity} onChange={(e) => handleChange('specifications', 'maxCapacity', Number(e.target.value))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Capacity (Min in kg) *</label>
              <input type="number" step="any" className="form-input" value={formData.specifications.minCapacity} onChange={(e) => handleChange('specifications', 'minCapacity', Number(e.target.value))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Verification Scale Interval (e in kg) *</label>
              <input type="number" step="any" className="form-input" value={formData.specifications.verificationScaleInterval_e} onChange={(e) => handleChange('specifications', 'verificationScaleInterval_e', Number(e.target.value))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Actual Scale Interval (d in kg) *</label>
              <input type="number" step="any" className="form-input" value={formData.specifications.actualScaleInterval_d} onChange={(e) => handleChange('specifications', 'actualScaleInterval_d', Number(e.target.value))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Calculated Scale Intervals (n = Max/e)</label>
              <input type="text" className="form-input" disabled value={Math.floor((Number(formData.specifications.maxCapacity) || 0) / (Number(formData.specifications.verificationScaleInterval_e) || 1))} style={{ opacity: 0.7 }} />
            </div>
          </div>
        </div>

        {/* Instrument Photos */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCamera /> Photographs & Nameplate Verification
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <FiCamera /> {uploading ? 'Uploading to Cloudinary...' : 'Attach Instrument Photos'}
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          {formData.photos && formData.photos.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {formData.photos.map((photo, idx) => (
                <div key={idx} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={photo.url} alt={`Instrument ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={() => navigate('/instruments')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FiSave /> {loading ? 'Saving Specs...' : 'Save Instrument'}
          </button>
        </div>
      </form>
    </div>
  );
}
