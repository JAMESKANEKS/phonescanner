import React, { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    syncInProgress: false
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus(syncService.getSyncStatus());
    };

    const interval = setInterval(updateStatus, 1000);

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const handleForceSync = async () => {
    await syncService.forceSync();
  };

  return (
    <div className="pos-connection-status">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        ${status.isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
        }
      `}>
        <div className={`
          w-2 h-2 rounded-full
          ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}
          ${status.syncInProgress ? 'animate-pulse' : ''}
        `} />
        
        <span>
          {status.isOnline ? 'Online' : 'Offline'}
          {status.syncInProgress && ' (Syncing...)'}
        </span>

        {status.isOnline && status.syncInProgress && (
          <button
            onClick={handleForceSync}
            className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
          >
            Force Sync
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
