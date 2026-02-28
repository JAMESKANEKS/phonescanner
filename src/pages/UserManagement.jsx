import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
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
          View all users registered in the system
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
        <div style={{
          padding: '16px',
          background: '#222835',
          borderBottom: '1px solid #31384a'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
            gap: '16px',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#8188a0',
            fontWeight: '600'
          }}>
            <div>UID</div>
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Created</div>
          </div>
        </div>

        <div style={{ maxHeight: '600px', overflow: 'auto' }}>
          {users.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#8188a0'
            }}>
              No users found. Users will appear here when they sign up.
            </div>
          ) : (
            users.map((user, index) => (
              <div
                key={user.uid}
                style={{
                  padding: '16px',
                  borderBottom: index < users.length - 1 ? '1px solid #31384a' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#f6f8ff',
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
                  fontSize: '12px',
                  color: '#8188a0',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.uid}
                </div>
                <div>
                  {user.name || user.displayName || 'Not set'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#aab2c5'
                }}>
                  {user.email}
                </div>
                <div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    background: user.role === 'admin' ? 'rgba(255, 77, 106, 0.2)' : 'rgba(54, 194, 255, 0.2)',
                    color: user.role === 'admin' ? '#ff6b8a' : '#36c2ff'
                  }}>
                    {user.role || 'user'}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#8188a0'
                }}>
                  {user.createdAt ? new Date(user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#1b1f2a',
        borderRadius: '8px',
        border: '1px solid #31384a'
      }}>
        <div style={{
          fontSize: '13px',
          color: '#aab2c5',
          marginBottom: '8px'
        }}>
          Total Users: <span style={{ color: '#36c2ff', fontWeight: '600' }}>{users.length}</span>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#8188a0'
        }}>
          Users are stored in the "users" collection in Firestore
        </div>
      </div>
    </div>
  );
}
