import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLock, FiMail, FiShield, FiAlertCircle } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('engineer@metrology.gov.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check credentials or server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'var(--bg-main)' }}>
      <div className="gov-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderTop: '4px solid var(--gov-navy)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          
          <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy)', margin: '0.25rem 0 0.1rem 0' }}>
            Legal Metrology Portal
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            OIML R-76 Non-Automatic Weighing Instruments Verification
          </div>
        </div>

        {/* Security Notice */}
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#5d4037', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiShield color="#f57f17" />
          <span>Authorized Access Only — Legal Metrology Officers & Technical Engineers</span>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', border: '1px solid #fad2cf', color: '#c5221f', padding: '0.65rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiAlertCircle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><FiMail /> Official Govt Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="engineer@metrology.gov.in"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label"><FiLock /> Account Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }} disabled={loading}>
            {loading ? 'Authenticating Officer Credentials...' : 'Sign In to Officer Portal'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          New Officer Registration? <Link to="/register" style={{ color: 'var(--gov-blue)', textDecoration: 'none', fontWeight: 600 }}>Register Account</Link>
        </div>
      </div>
    </div>
  );
}
