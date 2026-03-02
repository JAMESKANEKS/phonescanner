import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { testFirebaseAuth } from '../utils/firebaseTest';

export default function PaymentApproval() {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadPaymentRequests();
  }, []);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const requests = await paymentService.getAllPaymentRequests();
      setPaymentRequests(requests);
    } catch (error) {
      console.error('Error loading payment requests:', error);
      setError('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this payment request?')) return;
    
    try {
      setProcessingId(requestId);
      await paymentService.approvePaymentRequest(
        requestId, 
        currentUser.uid, 
        currentUser.email
      );
      await loadPaymentRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      setProcessingId(requestId);
      await paymentService.rejectPaymentRequest(
        requestId, 
        currentUser.uid, 
        currentUser.email, 
        reason
      );
      await loadPaymentRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (requestId) => {
    if (!confirm('Are you sure you want to delete this payment request?')) return;
    
    try {
      setProcessingId(requestId);
      await paymentService.deletePaymentRequest(requestId);
      await loadPaymentRequests(); // Refresh the list
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTestFirebase = async () => {
    console.log('Testing Firebase connection...');
    const result = await testFirebaseAuth();
    console.log('Firebase test result:', result);
    alert(result.success ? 'Firebase connection working! Check console for details.' : `Firebase test failed: ${result.message}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#2ed573';
      case 'rejected': return '#ff6b8a';
      case 'pending': return '#36c2ff';
      default: return '#8188a0';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#aab2c5'
      }}>
        Loading payment requests...
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: '#0a0b0e',
      minHeight: '100vh'
    }}>
      <div style={{
        marginBottom: '24px'
      }}>
        <h1 style={{
          color: '#e5f3ff',
          fontSize: '24px',
          marginBottom: '8px'
        }}>
          Payment Approval
        </h1>
        <p style={{ color: '#8188a0', fontSize: '14px' }}>
          Review and approve user payment requests for dashboard access
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 77, 106, 0.1)',
          border: '1px solid rgba(255, 77, 106, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#ff6b8a',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#1b1f2a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #31384a'
      }}>
        {paymentRequests.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#8188a0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div>No payment requests found</div>
          </div>
        ) : (
          paymentRequests.map(request => (
            <div
              key={request.id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #31384a',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#222835';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{
                      color: '#e5f3ff',
                      fontSize: '16px',
                      margin: 0
                    }}>
                      {request.userName}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      background: `${getStatusColor(request.status)}20`,
                      color: getStatusColor(request.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {request.status}
                    </span>
                  </div>
                  
                  <p style={{
                    color: '#8188a0',
                    fontSize: '13px',
                    margin: '0 0 8px 0'
                  }}>
                    {request.userEmail}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '12px',
                    color: '#aab2c5'
                  }}>
                    <span><strong>Reference:</strong> {request.reference}</span>
                    <span><strong>Amount:</strong> P{request.amount}</span>
                    <span><strong>Date:</strong> {formatDate(request.submittedAt)}</span>
                  </div>
                  
                  {request.approvedAt && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#2ed573'
                    }}>
                      Approved on {formatDate(request.approvedAt)} by {request.approvedByEmail}
                    </div>
                  )}
                  
                  {request.rejectionReason && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#ff6b8a'
                    }}>
                      Rejection reason: {request.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {request.status === 'pending' && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    style={{
                      padding: '8px 16px',
                      background: processingId === request.id ? '#2a2f3a' : '#2ed573',
                      color: '#031015',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: processingId === request.id ? 0.6 : 1
                    }}
                  >
                    {processingId === request.id ? 'Processing...' : 'Approve'}
                  </button>
                  
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    style={{
                      padding: '8px 16px',
                      background: processingId === request.id ? '#2a2f3a' : '#ff6b8a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: processingId === request.id ? 0.6 : 1
                    }}
                  >
                    {processingId === request.id ? 'Processing...' : 'Reject'}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(request.id)}
                    disabled={processingId === request.id}
                    style={{
                      padding: '8px 16px',
                      background: processingId === request.id ? '#2a2f3a' : '#31384a',
                      color: '#aab2c5',
                      border: '1px solid #31384a',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: processingId === request.id ? 0.6 : 1
                    }}
                  >
                    {processingId === request.id ? 'Processing...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
