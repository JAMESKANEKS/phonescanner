import { offlineStorage } from './offlineStorage.js';
import { db } from '../firebase/firebase.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  serverTimestamp 
} from 'firebase/firestore';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Save data with offline support
  async saveData(collectionName, data, docId = null) {
    const operation = {
      type: docId ? 'update' : 'create',
      collection: collectionName,
      data: { ...data, timestamp: serverTimestamp() },
      docId,
      localId: data.id || crypto.randomUUID()
    };

    if (this.isOnline) {
      try {
        if (docId) {
          await updateDoc(doc(db, collectionName, docId), operation.data);
        } else {
          const docRef = await addDoc(collection(db, collectionName), operation.data);
          operation.docId = docRef.id;
        }
        
        // Store locally for offline access
        await offlineStorage.add(collectionName, {
          ...operation.data,
          id: operation.docId || operation.localId
        });
        
        return operation.docId || operation.localId;
      } catch (error) {
        console.error('Online save failed, queuing for sync:', error);
        await offlineStorage.addPendingSync(operation);
        await offlineStorage.add(collectionName, {
          ...operation.data,
          id: operation.localId,
          _pendingSync: true
        });
        return operation.localId;
      }
    } else {
      // Offline mode - queue for sync
      await offlineStorage.addPendingSync(operation);
      await offlineStorage.add(collectionName, {
        ...operation.data,
        id: operation.localId,
        _pendingSync: true
      });
      return operation.localId;
    }
  }

  // Delete data with offline support
  async deleteData(collectionName, docId) {
    const operation = {
      type: 'delete',
      collection: collectionName,
      docId,
      localId: docId
    };

    if (this.isOnline) {
      try {
        await deleteDoc(doc(db, collectionName, docId));
        await offlineStorage.delete(collectionName, docId);
      } catch (error) {
        console.error('Online delete failed, queuing for sync:', error);
        await offlineStorage.addPendingSync(operation);
        await offlineStorage.update(collectionName, { 
          id: docId, 
          _pendingDelete: true 
        });
      }
    } else {
      await offlineStorage.addPendingSync(operation);
      await offlineStorage.update(collectionName, { 
        id: docId, 
        _pendingDelete: true 
      });
    }
  }

  // Get data with offline fallback
  async getData(collectionName, queryConstraints = []) {
    if (this.isOnline) {
      try {
        const q = query(collection(db, collectionName), ...queryConstraints);
        const querySnapshot = await getDocs(q);
        const data = [];
        
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });

        // Cache data locally
        for (const item of data) {
          await offlineStorage.update(collectionName, item);
        }

        return data;
      } catch (error) {
        console.error('Online fetch failed, using offline data:', error);
        return await offlineStorage.getAll(collectionName);
      }
    } else {
      return await offlineStorage.getAll(collectionName);
    }
  }

  // Sync pending operations
  async syncPendingData() {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      const pendingOperations = await offlineStorage.getPendingSync();
      
      for (const operation of pendingOperations) {
        try {
          if (operation.type === 'create') {
            const docRef = await addDoc(collection(db, operation.collection), operation.data);
            // Update local data with real Firebase ID
            const localData = await offlineStorage.get(operation.collection, operation.localId);
            if (localData) {
              await offlineStorage.update(operation.collection, {
                ...localData,
                id: docRef.id,
                _pendingSync: false
              });
            }
          } else if (operation.type === 'update') {
            await updateDoc(doc(db, operation.collection, operation.docId), operation.data);
            // Update local data
            const localData = await offlineStorage.get(operation.collection, operation.docId);
            if (localData) {
              await offlineStorage.update(operation.collection, {
                ...localData,
                _pendingSync: false
              });
            }
          } else if (operation.type === 'delete') {
            await deleteDoc(doc(db, operation.collection, operation.docId));
            await offlineStorage.delete(operation.collection, operation.docId);
          }

          // Remove from pending sync
          await offlineStorage.removePendingSync(operation.id);
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync
  async forceSync() {
    if (this.isOnline) {
      await this.syncPendingData();
    }
  }
}

export const syncService = new SyncService();
