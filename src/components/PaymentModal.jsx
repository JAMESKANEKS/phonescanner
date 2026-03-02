import React, { useState } from 'react';
import qr from '../assets/images/qr.jpg';

export default function PaymentModal({ onClose, onSubmit }) {
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reference.trim()) {
      alert('Please enter a reference number');
      return;
    }

    console.log('🚀 Starting payment submission...');
    console.log('Reference number:', reference);

    setIsSubmitting(true);
    try {
      console.log('📤 Calling onSubmit function...');
      const result = await onSubmit(reference);
      console.log('✅ Payment submission successful:', result);
      setSubmitted(true);
    } catch (error) {
      console.error('❌ Payment submission error:', error);
      alert('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1b1f2a, #10131a)',
          borderRadius: '18px',
          padding: '40px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(46, 213, 115, 0.1)',
            border: '2px solid rgba(46, 213, 115, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px'
          }}>
            ✅
          </div>
          
          <h2 style={{
            color: '#2ed573',
            fontSize: '20px',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Payment Submitted
          </h2>
          
          <p style={{
            color: '#8188a0',
            fontSize: '14px',
            lineHeight: '1.5',
            marginBottom: '24px'
          }}>
            Your payment reference has been submitted for approval. You will receive access once the payment is verified.
          </p>
          
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2ed573, #0fb4ff)',
              color: '#031015',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
              width: '100%'
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
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1b1f2a, #10131a)',
        borderRadius: '18px',
        padding: '40px',
        maxWidth: '450px',
        width: '90%',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            color: '#e5f3ff',
            fontSize: '24px',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Unlock Dashboard
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8188a0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          background: 'rgba(94, 84, 142, 0.1)',
          border: '1px solid rgba(94, 84, 142, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#36c2ff',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            💰 Monthly Subscription
          </div>
          <div style={{
            color: '#e5f3ff',
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            P49
          </div>
          <div style={{
            color: '#8188a0',
            fontSize: '14px'
          }}>
            Access Dashboard & Print Receipts
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            display: 'inline-block',
            marginBottom: '15px'
          }}>
            <div style={{
              width: '200px',
              height: '200px',
              background: '#000',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}></div>
                <div ><img src={qr} alt="QR Code" style={{ width: "220px", marginTop: "30px", marginBottom: "10px" }} /></div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>Scan to Pay or 09366253640</div>
              </div>
            </div>
          </div>
          <p style={{
            color: '#8188a0',
            fontSize: '12px',
            marginTop: '20px'
          }}>
            Scan the QR code with your mobile payment app
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#aab2c5',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Payment Reference Number
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter your payment reference"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#222835',
                border: '1px solid #31384a',
                borderRadius: '8px',
                color: '#e5f3ff',
                fontSize: '14px',
                transition: 'border-color 0.15s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#36c2ff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#31384a';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              background: isSubmitting ? '#2a2f3a' : 'linear-gradient(135deg, #36c2ff, #1fe6a8)',
              color: '#031015',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              opacity: isSubmitting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(54, 194, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        <p style={{
          color: '#8188a0',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '20px',
          marginBottom: 0
        }}>
          After payment verification, your dashboard access will be activated within 2-3 minutes.
        </p>
      </div>
    </div>
  );
}
