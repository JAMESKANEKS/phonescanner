import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import ConnectionStatus from '../components/ConnectionStatus';

function ProtectedRoute({ children, requiredPermission }) {
  const { currentUser, userProfile, loading, refreshUserProfile } = useAuth();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const location = useLocation();

  // Check if user has the required permission
  const hasPermission = requiredPermission && userProfile?.permissions 
    ? userProfile.permissions[requiredPermission] === true 
    : true; // Default to true if no permission required

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
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // If permission is denied, show modal instead of redirecting
  if (requiredPermission && !hasPermission) {
    return (
      <>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at top, #333 0, #111 40%, #000 100%)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, #1b1f2a, #10131a)',
            borderRadius: '18px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            maxWidth: '400px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 77, 106, 0.1)',
              border: '2px solid rgba(255, 77, 106, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px'
            }}>
              🔒
            </div>
            
            <h2 style={{
              color: '#e5f3ff',
              fontSize: '20px',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Access Denied
            </h2>
            
            <p style={{
              color: '#8188a0',
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              You don't have permission to access this area. Please contact your administrator or the developer to get the necessary permissions.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #1fe6a8, #0fb4ff)',
                  color: '#031015',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.8)';
                }}
              >
                Go Back
              </button>
              
              <button
                onClick={refreshUserProfile}
                style={{
                  padding: '12px 24px',
                  background: '#31384a',
                  color: '#aab2c5',
                  border: '1px solid #31384a',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#3d4658';
                  e.target.style.borderColor = '#4a5568';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#31384a';
                  e.target.style.borderColor = '#31384a';
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <PWAInstallPrompt />
        <ConnectionStatus />
      </>
    );
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
