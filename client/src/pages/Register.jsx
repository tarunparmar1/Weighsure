import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiBriefcase, FiPhone, FiActivity } from 'react-icons/fi';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'engineer',
    organization: 'Department of Consumer Affairs (Legal Metrology)',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--accent-gradient)', padding: '0.875rem', borderRadius: '16px', marginBottom: '1rem' }}>
            <FiActivity size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>Register Testing Officer</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Create an official account for OIML R-76 Type Evaluation
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><FiUser /> Full Name</label>
            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required placeholder="Dr. A. K. Sharma" />
          </div>

          <div className="form-group">
            <label className="form-label"><FiMail /> Official Email</label>
            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required placeholder="aksharma@doca.gov.in" />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label"><FiLock /> Password</label>
              <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-select" value={formData.role} onChange={handleChange}>
                <option value="engineer">Testing Engineer</option>
                <option value="admin">Lab Administrator</option>
                <option value="viewer">Auditor / Viewer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><FiBriefcase /> Organization / Laboratory</label>
            <input type="text" name="organization" className="form-input" value={formData.organization} onChange={handleChange} placeholder="Regional Reference Standard Laboratory" />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label"><FiPhone /> Contact Phone</label>
            <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Officer'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
