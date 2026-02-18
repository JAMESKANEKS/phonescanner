import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import ConnectionStatus from '../components/ConnectionStatus';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #333 0, #111 40%, #000 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#9fb4ff'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(159, 180, 255, 0.3)',
            borderTop: '3px solid #9fb4ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '14px', letterSpacing: '0.1em' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {children}
      <PWAInstallPrompt />
      <ConnectionStatus />
    </>
  );
}

export default ProtectedRoute;
