import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showDesktopPrompt, setShowDesktopPrompt] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [browser, setBrowser] = useState('');
  const [dismissedDesktop, setDismissedDesktop] = useState(false);

  useEffect(() => {
    // Detect device and browser
    setTimeout(() => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsDesktop(!isMobile);
      
      // Detect browser
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        setBrowser('chrome');
      } else if (userAgent.includes('firefox')) {
        setBrowser('firefox');
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        setBrowser('safari');
      } else if (userAgent.includes('edg')) {
        setBrowser('edge');
      }
    }, 0);

    // Check if desktop prompt was previously dismissed
    const wasDismissed = localStorage.getItem('pwa-desktop-dismissed');
    setTimeout(() => {
      if (wasDismissed) {
        setDismissedDesktop(true);
      }
    }, 0);

    // Show desktop prompt after 3 seconds if not dismissed and on desktop
    if (isDesktop && !wasDismissed) {
      const timer = setTimeout(() => {
        setShowDesktopPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDesktop]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      // Hide desktop prompt when native prompt is available
      setShowDesktopPrompt(false);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setShowDesktopPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-desktop-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDesktopDismiss = () => {
    setShowDesktopPrompt(false);
    setDismissedDesktop(true);
    localStorage.setItem('pwa-desktop-dismissed', 'true');
  };

  const getBrowserInstructions = () => {
    switch (browser) {
      case 'chrome':
        return 'Click the install icon (⊕) in the address bar';
      case 'firefox':
        return 'Click the "Install" icon in the address bar';
      case 'edge':
        return 'Click the app icon (⋮) in the address bar';
      case 'safari':
        return 'Click "Share" then "Add to Home Screen"';
      default:
        return 'Look for the install option in your browser menu';
    }
  };

  // Native install prompt (when available)
  if (showInstallButton && deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-4 rounded-lg shadow-lg max-w-sm animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">📱 Install App</h3>
          <button
            onClick={() => setShowInstallButton(false)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-slate-300 mb-3">
          Install our POS app for faster access and offline capabilities!
        </p>
        <button
          onClick={handleInstallClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Install App
        </button>
      </div>
    );
  }

  // Desktop prompt (when native prompt not available)
  if (showDesktopPrompt && isDesktop && !dismissedDesktop) {
    return (
      <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-2xl max-w-md transform transition-all duration-500 ease-out">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">🚀 Install POS App</h3>
            <p className="text-blue-100 text-sm">Get the best experience with our desktop app</p>
          </div>
          <button
            onClick={handleDesktopDismiss}
            className="text-blue-200 hover:text-white ml-4 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
          <p className="text-sm mb-2">💡 <strong>How to install:</strong></p>
          <p className="text-sm text-blue-100">{getBrowserInstructions()}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="text-lg mb-1">⚡</div>
            <div>Faster Access</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="text-lg mb-1">📴</div>
            <div>Offline Mode</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="text-lg mb-1">🔔</div>
            <div>Notifications</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="text-lg mb-1">🎯</div>
            <div>Full Screen</div>
          </div>
        </div>

        <button
          onClick={handleDesktopDismiss}
          className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Got it, thanks!
        </button>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;
