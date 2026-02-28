import { db } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

// Helper function to create user-specific collection reference
function getUserCollection(userId, collectionName) {
  return collection(db, 'users', userId, collectionName);
}

function getUserDoc(userId, collectionName, docId) {
  return doc(db, 'users', userId, collectionName, docId);
}

// ============ PRODUCTS ============
export async function getUserProducts(userId) {
  try {
    const productsRef = getUserCollection(userId, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✓ Found ${products.length} products for user ${userId}`);
    return products;
  } catch (error) {
    console.error('Error getting user products:', error);
    throw error;
  }
}

export async function addUserProduct(userId, productData) {
  try {
    const productsRef = getUserCollection(userId, 'products');
    const productWithTimestamp = {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(productsRef, productWithTimestamp);
    console.log(`✓ Added product ${docRef.id} for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error adding user product:', error);
    throw error;
  }
}

export async function updateUserProduct(userId, productId, updateData) {
  try {
    const productRef = getUserDoc(userId, 'products', productId);
    const productWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(productRef, productWithTimestamp);
    console.log(`✓ Updated product ${productId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user product:', error);
    throw error;
  }
}

export async function deleteUserProduct(userId, productId) {
  try {
    const productRef = getUserDoc(userId, 'products', productId);
    await deleteDoc(productRef);
    console.log(`✓ Deleted product ${productId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting user product:', error);
    throw error;
  }
}

// ============ SALES/RECEIPTS ============
export async function getUserSales(userId) {
  try {
    const salesRef = getUserCollection(userId, 'sales');
    const q = query(salesRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date ? doc.data().date.toDate() : new Date()
    }));
    console.log(`✓ Found ${sales.length} sales for user ${userId}`);
    return sales;
  } catch (error) {
    console.error('Error getting user sales:', error);
    throw error;
  }
}

export async function addUserSale(userId, saleData) {
  try {
    const salesRef = getUserCollection(userId, 'sales');
    const saleWithTimestamp = {
      ...saleData,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(salesRef, saleWithTimestamp);
    console.log(`✓ Added sale ${docRef.id} for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error adding user sale:', error);
    throw error;
  }
}

export async function deleteUserSale(userId, saleId) {
  try {
    const saleRef = getUserDoc(userId, 'sales', saleId);
    await deleteDoc(saleRef);
    console.log(`✓ Deleted sale ${saleId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting user sale:', error);
    throw error;
  }
}

export async function getUserSale(userId, saleId) {
  try {
    const saleRef = getUserDoc(userId, 'sales', saleId);
    const saleDoc = await getDoc(saleRef);
    
    if (saleDoc.exists()) {
      const saleData = saleDoc.data();
      return {
        id: saleDoc.id,
        ...saleData,
        date: saleData.date ? saleData.date.toDate() : new Date()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user sale:', error);
    throw error;
  }
}

// ============ CART ============
export async function getUserCart(userId) {
  try {
    const cartRef = getUserCollection(userId, 'cart');
    const snapshot = await getDocs(cartRef);
    const cartItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✓ Found ${cartItems.length} cart items for user ${userId}`);
    return cartItems;
  } catch (error) {
    console.error('Error getting user cart:', error);
    throw error;
  }
}

export async function addUserCartItem(userId, cartItem) {
  try {
    const cartRef = getUserCollection(userId, 'cart');
    const cartItemWithTimestamp = {
      ...cartItem,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(cartRef, cartItemWithTimestamp);
    console.log(`✓ Added cart item ${docRef.id} for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error adding user cart item:', error);
    throw error;
  }
}

export async function updateUserCartItem(userId, cartItemId, updateData) {
  try {
    const cartRef = getUserDoc(userId, 'cart', cartItemId);
    await updateDoc(cartRef, updateData);
    console.log(`✓ Updated cart item ${cartItemId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user cart item:', error);
    throw error;
  }
}

export async function deleteUserCartItem(userId, cartItemId) {
  try {
    const cartRef = getUserDoc(userId, 'cart', cartItemId);
    await deleteDoc(cartRef);
    console.log(`✓ Deleted cart item ${cartItemId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting user cart item:', error);
    throw error;
  }
}

export async function clearUserCart(userId) {
  try {
    const cartRef = getUserCollection(userId, 'cart');
    const snapshot = await getDocs(cartRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`✓ Cleared cart for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error clearing user cart:', error);
    throw error;
  }
}

// ============ DATA MIGRATION ============
export async function migrateUserData(userId) {
  try {
    console.log(`🔄 Starting data migration for user ${userId}`);
    
    // Migrate products from global collection to user collection
    const globalProductsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(globalProductsRef);
    
    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();
      await addUserProduct(userId, {
        ...productData,
        migratedFrom: 'global',
        originalId: doc.id
      });
    }
    
    console.log(`✅ Migration completed for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error migrating user data:', error);
    throw error;
  }
}
