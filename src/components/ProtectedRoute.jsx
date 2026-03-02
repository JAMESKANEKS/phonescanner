import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import ConnectionStatus from '../components/ConnectionStatus';
import PaymentModal from '../components/PaymentModal';
import { paymentService } from '../services/paymentService';

function ProtectedRoute({ children, requiredPermission }) {
  const { currentUser, userProfile, loading, refreshUserProfile } = useAuth();
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [hasApprovedPayment, setHasApprovedPayment] = useState(false);
  const location = useLocation();

  // Check if user has the required permission
  const hasPermission = requiredPermission && userProfile?.permissions 
    ? userProfile.permissions[requiredPermission] === true 
    : true; // Default to true if no permission required

  // Check for approved payment when permission is denied
  useEffect(() => {
    const checkApprovedPayment = async () => {
      if (currentUser && requiredPermission && !hasPermission) {
        try {
          const approved = await paymentService.hasApprovedPayment(currentUser.uid);
          setHasApprovedPayment(approved);
          
          // If payment is approved, refresh user profile to get updated permissions
          if (approved) {
            await refreshUserProfile();
          }
        } catch (error) {
          console.error('Error checking approved payment:', error);
        }
      }
    };

    checkApprovedPayment();
  }, [currentUser, requiredPermission, hasPermission, refreshUserProfile]);

  // Handle profile refresh with loading state
  const handleRefreshProfile = async () => {
    if (refreshingProfile) return;
    
    try {
      setRefreshingProfile(true);
      await refreshUserProfile();
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setRefreshingProfile(false);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (reference) => {
    try {
      setCheckingPayment(true);
      
      // Submit payment request to database
      const paymentRequest = await paymentService.submitPaymentRequest({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userProfile?.displayName || currentUser.email,
        reference: reference,
        amount: 49,
        currency: 'PHP',
        type: 'monthly_subscription'
      });
      
      console.log('Payment request submitted:', paymentRequest);
      return Promise.resolve();
    } catch (error) {
      console.error('Payment submission error:', error);
      throw error;
    } finally {
      setCheckingPayment(false);
    }
  };

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If permission is denied, show payment modal instead of redirecting
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
              Dashboard Access Locked
            </h2>
            
            <p style={{
              color: '#8188a0',
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              Pay P49 monthly to unlock dashboard access and receipt printing features.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #36c2ff, #1fe6a8)',
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
                  e.target.style.boxShadow = '0 8px 20px rgba(54, 194, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Unlock Now - P49/mo
              </button>
              
              <button
                onClick={() => window.history.back()}
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
                Go Back
              </button>
            </div>
          </div>
        </div>
        
        {showPaymentModal && (
          <PaymentModal
            onClose={() => setShowPaymentModal(false)}
            onSubmit={handlePaymentSubmit}
          />
        )}
        
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
