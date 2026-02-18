// Offline data storage service using IndexedDB
class OfflineStorage {
  constructor() {
    this.dbName = 'PhoneScannerPOS';
    this.dbVersion = 1;
    this.db = null;
    this.stores = {
      sales: 'sales',
      products: 'products',
      customers: 'customers',
      receipts: 'receipts',
      pendingSync: 'pendingSync'
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(this.stores.sales)) {
          db.createObjectStore(this.stores.sales, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.stores.products)) {
          db.createObjectStore(this.stores.products, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.stores.customers)) {
          db.createObjectStore(this.stores.customers, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.stores.receipts)) {
          db.createObjectStore(this.stores.receipts, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.stores.pendingSync)) {
          db.createObjectStore(this.stores.pendingSync, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Generic methods for CRUD operations
  async add(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Pending sync operations
  async addPendingSync(operation) {
    const syncData = {
      ...operation,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };
    return this.add(this.stores.pendingSync, syncData);
  }

  async getPendingSync() {
    return this.getAll(this.stores.pendingSync);
  }

  async removePendingSync(id) {
    return this.delete(this.stores.pendingSync, id);
  }

  // Clear all data
  async clearStore(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
