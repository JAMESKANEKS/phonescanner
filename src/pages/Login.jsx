import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef();

  useEffect(() => {
    emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
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
            Login
          </div>
          <div style={{ fontSize: '12px', color: '#8188a0' }}>
            Access your POS system
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
              Email Address
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pos-input"
              placeholder="admin@pos.com"
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
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
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
