import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { testFirebaseAuth, testCurrentAuthState } from '../utils/firebaseTest';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const nameRef = useRef();

  const testFirebase = async () => {
    setTestResult('Testing Firebase connection...');
    
    // First check current auth state
    const currentAuth = testCurrentAuthState();
    console.log('Current auth state:', currentAuth);
    
    // Then run comprehensive test
    const result = await testFirebaseAuth();
    setTestResult(JSON.stringify(result, null, 2));
  };

  useEffect(() => {
    nameRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to create user with email:', email);
      const userCredential = await signup(email, password, {
        displayName: name.trim(),
        name: name.trim()
      });
      console.log('User created successfully:', userCredential.user);
      console.log('User UID:', userCredential.user.uid);
      console.log('User email:', userCredential.user.email);
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or sign in.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #333 0, #111 40%, #000 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'linear-gradient(135deg, #1b1f2a, #10131a)',
        borderRadius: '18px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '30px 30px 20px',
          textAlign: 'center',
          background: 'radial-gradient(circle at top left, #1f2635 0, #090c11 60%, #05060a 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'conic-gradient(from 200deg, #1fe6a8, #0fb4ff, #1fe6a8)',
            boxShadow: '0 0 12px rgba(0,255,255,0.45)',
            margin: '0 auto 16px'
          }} />
          
          <div style={{
            fontSize: '20px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#9fb3ff',
            marginBottom: '4px'
          }}>
            Phone Scanner
          </div>
          <div style={{ fontSize: '12px', color: '#7b8197' }}>
            Smart POS Terminal
          </div>
          
          <div style={{
            fontSize: '24px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#e5f3ff',
            marginTop: '20px',
            marginBottom: '8px'
          }}>
            Sign Up
          </div>
          <div style={{ fontSize: '12px', color: '#8188a0' }}>
            Create your account
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
          {error && (
            <div style={{
              background: 'rgba(255, 77, 106, 0.1)',
              border: '1px solid rgba(255, 77, 106, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#ff6b8a',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '13px',
              color: '#aab2c5',
              marginBottom: '8px',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Full Name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pos-input"
              placeholder="John Doe"
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #31384a',
                background: '#090b11',
                color: '#f6f8ff',
                padding: '12px 14px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '13px',
              color: '#aab2c5',
              marginBottom: '8px',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pos-input"
              placeholder="your@email.com"
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #31384a',
                background: '#090b11',
                color: '#f6f8ff',
                padding: '12px 14px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '13px',
              color: '#aab2c5',
              marginBottom: '8px',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pos-input"
              placeholder="••••••••"
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #31384a',
                background: '#090b11',
                color: '#f6f8ff',
                padding: '12px 14px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '13px',
              color: '#aab2c5',
              marginBottom: '8px',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pos-input"
              placeholder="••••••••"
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #31384a',
                background: '#090b11',
                color: '#f6f8ff',
                padding: '12px 14px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pos-button"
            style={{
              width: '100%',
              borderRadius: '999px',
              border: 'none',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease, opacity 0.12s ease',
              background: loading ? '#31384a' : 'linear-gradient(135deg, #1fe6a8, #0fb4ff)',
              color: '#031015',
              boxShadow: loading ? 'none' : '0 6px 18px rgba(0, 0, 0, 0.8)',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(3, 16, 21, 0.3)',
                  borderTop: '2px solid #031015',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '13px', color: '#8188a0' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{
                  color: '#36c2ff',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Sign In
              </Link>
            </div>
            
            <button
              type="button"
              onClick={testFirebase}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                fontSize: '11px',
                background: '#31384a',
                color: '#8188a0',
                border: '1px solid #31384a',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Test Firebase Connection
            </button>
            
            {testResult && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#aab2c5',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                {testResult}
              </div>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .pos-input:focus {
          border-color: #36c2ff;
          box-shadow: 0 0 0 1px rgba(54, 194, 255, 0.8);
          background: #05060b;
        }
        
        .pos-input::placeholder {
          color: #666f88;
        }
      `}</style>
    </div>
  );
}
