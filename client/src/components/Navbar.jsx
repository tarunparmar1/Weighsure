import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { OfflineContext } from '../context/OfflineContext';
import {
  FiActivity,
  FiFileText,
  FiLayers,
  FiSettings,
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiLogOut,
  FiUser,
  FiShield,
} from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const {
    isOnline,
    pendingQueueCount,
    isSyncing,
    triggerSync,
  } = useContext(OfflineContext);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header>
      {/* Tricolor Strip */}
      <div className="gov-tricolor-strip" />

      {/* Utility Bar */}
      <div className="top-gov-bar">
        <div>
          <span>WEIGHSURE</span>
          <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
          <span>Digital NAWI Testing & Compliance Platform</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <span>OIML R-76</span>
          <span>Type Evaluation</span>
        </div>
      </div>

      {/* Main Brand Header */}
      <div className="gov-header">
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            {/* WeighSure Logo */}
            <div className="gov-emblem-badge">
              <span>WS</span>
            </div>

            <div>
              <div className="gov-title-hindi">
                WeighSure
              </div>

              <div className="gov-title-english">
                Digital NAWI Testing & OIML R-76 Compliance Platform
              </div>
            </div>
          </Link>

          {/* Sync & User Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            {/* Connection Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
              }}
            >
              {isOnline ? (
                <span
                  style={{
                    color: '#81c784',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <FiWifi /> Server Online
                </span>
              ) : (
                <span
                  style={{
                    color: '#ffb74d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <FiWifiOff /> Offline Mode
                </span>
              )}

              {pendingQueueCount > 0 && (
                <button
                  onClick={triggerSync}
                  disabled={isSyncing || !isOnline}
                  className="btn btn-sm"
                  style={{
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    background: '#ff9933',
                    color: '#000',
                    border: 'none',
                  }}
                >
                  <FiRefreshCw
                    className={isSyncing ? 'spin' : ''}
                  />
                  {pendingQueueCount} Pending Sync
                </button>
              )}
            </div>

            {/* User Badge */}
            {user ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderLeft: '1px solid rgba(255,255,255,0.2)',
                  paddingLeft: '1rem',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {user.name}
                  </div>

                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#b0bec5',
                    }}
                  >
                    <FiShield size={10} />{' '}
                    {user.role.toUpperCase()}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Log out"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
              >
                <FiUser /> Officer Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* WeighSure Navigation Bar */}
      {user && (
        <div className="gov-navbar">
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <nav className="gov-nav-links">
              <Link
                to="/"
                className={`gov-nav-link ${isActive('/') ? 'active' : ''
                  }`}
              >
                <FiActivity /> Dashboard
              </Link>

              <Link
                to="/instruments"
                className={`gov-nav-link ${isActive('/instruments') ? 'active' : ''
                  }`}
              >
                <FiLayers /> Instruments Register
              </Link>

              <Link
                to="/reports"
                className={`gov-nav-link ${isActive('/reports') ? 'active' : ''
                  }`}
              >
                <FiFileText /> Test Reports Repository
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/oiml-rules"
                  className={`gov-nav-link ${isActive('/oiml-rules') ? 'active' : ''
                    }`}
                >
                  <FiSettings /> OIML Engine Manager
                </Link>
              )}
            </nav>

            <div
              style={{
                color: '#d1dbe5',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              WeighSure Platform
            </div>
          </div>
        </div>
      )}
    </header>
  );
}