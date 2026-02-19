import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
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

  // Automatic popup for PWA installation (only when native prompt is available)
  if (showInstallButton && deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-4 rounded-lg shadow-lg max-w-sm animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">📱 Install App</h3>
          <button
            onClick={() => setShowInstallButton(false)}
            className="text-slate-400 hover:text-white text-xl leading-none"
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

  return null;
};

export default PWAInstallPrompt;
