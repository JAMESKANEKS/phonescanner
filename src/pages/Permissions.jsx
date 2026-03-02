import { useEffect, useState } from "react";
import { getAllUsersWithPermissions, updatePermission } from "../services/adminService";
import { useAuth } from "../context/AuthContext";
import PaymentApproval from "../components/PaymentApproval";
import { paymentService } from "../services/paymentService";

export default function Permissions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('permissions');
  const { currentUser, refreshUserProfile } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const usersData = await getAllUsersWithPermissions();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  const handleTogglePermission = async (userId, permission) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPermissionState = !user.permissions[permission];
    
    // Set loading state for this specific user
    setUpdatingUserId(userId);
    
    // Update local state immediately for instant UI feedback
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              permissions: { 
                ...u.permissions,
                [permission]: newPermissionState
              } 
            }
          : u
      )
    );
    
    try {
      // If removing dashboard permission, also remove approved payment requests
      if (permission === 'dashboard' && !newPermissionState) {
        console.log('Removing dashboard permission - cleaning up approved payment requests for user:', userId);
        try {
          const userPaymentRequests = await paymentService.getUserPaymentRequests(userId);
          const approvedRequests = userPaymentRequests.filter(req => req.status === 'approved');
          
          // Delete all approved payment requests so user has to pay again
          for (const request of approvedRequests) {
            await paymentService.deletePaymentRequest(request.id);
            console.log('Deleted approved payment request:', request.id);
          }
        } catch (paymentError) {
          console.error('Error cleaning up payment requests:', paymentError);
          // Don't fail the permission update if payment cleanup fails
        }
      }
      
      // Update permission in Firebase
      await updatePermission(userId, permission, newPermissionState);
      
      // If updating current user's permissions, refresh their profile
      if (currentUser && userId === currentUser.uid) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      // Revert local state on error
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, permissions: user.permissions }
            : u
        )
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleAllPermissions = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const hasAnyPermission = user.permissions.dashboard || user.permissions.print;
    const newPermissionState = !hasAnyPermission;
    
    // Set loading state for this specific user
    setUpdatingUserId(userId);
    
    // Update local state immediately for instant UI feedback
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              permissions: { 
                ...u.permissions,
                dashboard: newPermissionState,
                print: newPermissionState
              } 
            }
          : u
      )
    );
    
    try {
      // If removing permissions (turning off), also remove approved payment requests
      if (!newPermissionState) {
        console.log('Removing permissions - cleaning up approved payment requests for user:', userId);
        try {
          const userPaymentRequests = await paymentService.getUserPaymentRequests(userId);
          const approvedRequests = userPaymentRequests.filter(req => req.status === 'approved');
          
          // Delete all approved payment requests so user has to pay again
          for (const request of approvedRequests) {
            await paymentService.deletePaymentRequest(request.id);
            console.log('Deleted approved payment request:', request.id);
          }
        } catch (paymentError) {
          console.error('Error cleaning up payment requests:', paymentError);
          // Don't fail the permission update if payment cleanup fails
        }
      }
      
      // Update dashboard and print permissions in Firebase
      await updatePermission(userId, "dashboard", newPermissionState);
      await updatePermission(userId, "print", newPermissionState);
      
      // If updating current user's permissions, refresh their profile
      if (currentUser && userId === currentUser.uid) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      // Revert local state on error
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, permissions: user.permissions }
            : u
        )
      );
    } finally {
      setUpdatingUserId(null);
    }
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
        Loading users...
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
          User Management
        </h1>
        <p style={{ color: '#8188a0', fontSize: '14px' }}>
          Manage user permissions and payment approvals
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #31384a'
      }}>
        <button
          onClick={() => setActiveTab('permissions')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'permissions' ? '#36c2ff' : 'transparent',
            color: activeTab === 'permissions' ? '#031015' : '#8188a0',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Permissions
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'payments' ? '#36c2ff' : 'transparent',
            color: activeTab === 'payments' ? '#031015' : '#8188a0',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Payment Approvals
        </button>
      </div>

      {activeTab === 'permissions' ? (
        <>
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
            {users.map(user => (
              <div
                key={user.id}
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
                  <div>
                    <h3 style={{
                      color: '#e5f3ff',
                      fontSize: '16px',
                      marginBottom: '4px'
                    }}>
                      {user.name || user.displayName || 'Unknown User'}
                    </h3>
                    <p style={{
                      color: '#8188a0',
                      fontSize: '13px',
                      margin: 0
                    }}>
                      {user.email}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleAllPermissions(user.id)}
                    disabled={updatingUserId === user.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: Object.values(user.permissions).some(p => p === true) ? '#dc3545' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updatingUserId === user.id ? 'not-allowed' : 'pointer',
                      opacity: updatingUserId === user.id ? 0.7 : 1,
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {updatingUserId === user.id ? (
                      <>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span> Updating...
                      </>
                    ) : (
                      (user.permissions.dashboard || user.permissions.print) ? 'Hide All' : 'Show All'
                    )}
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px'
                }}>
                  {[
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'print', label: 'Print' }
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#222835',
                        borderRadius: '6px',
                        border: '1px solid #31384a'
                      }}
                    >
                      <span style={{
                        color: '#aab2c5',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {label}
                      </span>
                      <button
                        onClick={() => handleTogglePermission(user.id, key)}
                        disabled={updatingUserId === user.id}
                        style={{
                          width: '40px',
                          height: '20px',
                          backgroundColor: user.permissions[key] ? '#36c2ff' : '#31384a',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: updatingUserId === user.id ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: user.permissions[key] ? '22px' : '2px',
                          transition: 'left 0.15s ease'
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <PaymentApproval />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
