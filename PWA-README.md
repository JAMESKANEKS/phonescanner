# PWA Setup and Offline Functionality

This document explains the Progressive Web App (PWA) features and offline data synchronization implemented in the Phone Scanner POS system.

## Features Implemented

### 1. PWA Installation Prompt
- Automatic installation prompt when the app meets PWA criteria
- Custom install button in the UI
- Works on desktop and mobile devices

### 2. Offline Data Storage
- IndexedDB for local data storage
- Automatic data synchronization when back online
- Queue system for pending operations

### 3. Connection Status
- Real-time online/offline status indicator
- Sync progress display
- Manual sync trigger

## How It Works

### PWA Installation
1. The app registers a service worker automatically
2. When criteria are met, an install prompt appears
3. Users can install the app on their device/home screen
4. The app works standalone like a native app

### Offline Data Flow
1. **Online Mode**: Data saves directly to Firebase and cached locally
2. **Offline Mode**: Data saves to IndexedDB and queued for sync
3. **Back Online**: Queued operations automatically sync to Firebase

### Data Storage Structure
- **sales**: All sales transactions
- **products**: Product inventory
- **customers**: Customer information
- **receipts**: Receipt data
- **pendingSync**: Operations waiting to sync

## Usage Examples

### Using the Sync Service

```javascript
import { syncService } from '../services/syncService';

// Save data with offline support
const saleId = await syncService.saveData('sales', {
  items: cart,
  total: 100,
  timestamp: new Date().toISOString()
});

// Get data with offline fallback
const products = await syncService.getData('products');

// Delete data with offline support
await syncService.deleteData('products', productId);
```

### Using Offline Storage Directly

```javascript
import { offlineStorage } from '../services/offlineStorage';

// Initialize storage
await offlineStorage.init();

// Add data locally
await offlineStorage.add('products', productData);

// Get all local data
const localProducts = await offlineStorage.getAll('products');
```

## Files Added/Modified

### New Files
- `src/components/PWAInstallPrompt.jsx` - Installation prompt component
- `src/components/ConnectionStatus.jsx` - Connection status indicator
- `src/services/offlineStorage.js` - IndexedDB storage service
- `src/services/syncService.js` - Firebase synchronization service
- `src/pages/POS-Example.jsx` - Example implementation with offline support
- `public/pwa-192x192.svg` - PWA icon (192x192)
- `public/pwa-512x512.svg` - PWA icon (512x512)

### Modified Files
- `package.json` - Added vite-plugin-pwa dependency
- `vite.config.js` - PWA configuration
- `index.html` - PWA meta tags
- `src/firebase/firebase.js` - Offline persistence enabled
- `src/App.jsx` - PWA components integration

## Testing the PWA

### Local Development
1. Run `npm run dev`
2. Open Chrome DevTools → Application → Manifest
3. Check "Add to home screen" functionality
4. Test offline mode in DevTools → Network → Offline

### Production Deployment
1. Run `npm run build`
2. Deploy to a secure (HTTPS) server
3. Test installation on mobile devices
4. Verify offline functionality

## Browser Support

- Chrome/Edge: Full PWA support
- Firefox: Good PWA support
- Safari: Limited PWA support on iOS
- Offline storage works in all modern browsers

## Security Considerations

- All Firebase operations use proper authentication
- Local data is stored in IndexedDB (encrypted on some platforms)
- Service worker caches only static assets
- No sensitive data stored in localStorage

## Troubleshooting

### PWA Not Installing
- Ensure site is served over HTTPS
- Check that service worker is registered
- Verify manifest.json is accessible
- Make sure icons are properly configured

### Sync Issues
- Check network connection
- Verify Firebase permissions
- Clear IndexedDB if needed
- Check browser console for errors

### Performance Tips
- Limit data stored locally
- Regular cleanup of old pending operations
- Use pagination for large datasets
- Implement data expiration policies
