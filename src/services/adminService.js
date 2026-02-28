import { db } from '../firebase/firebase';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';

// Update user permission
export async function updatePermission(userId, permission, value) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentData = userDoc.data();
    const currentPermissions = currentData.permissions || {};
    
    // Update the specific permission
    const updatedPermissions = {
      ...currentPermissions,
      [permission]: value
    };
    
    // Update the user document with new permissions
    await updateDoc(userRef, {
      permissions: updatedPermissions,
      updatedAt: new Date()
    });
    
    console.log(`✓ Updated ${permission} permission for user ${userId}:`, value);
    return true;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
}

// Get user permissions
export async function getUserPermissions(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {};
    }
    
    const userData = userDoc.data();
    return userData.permissions || {};
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {};
  }
}

// Update multiple permissions at once
export async function updateMultiplePermissions(userId, permissions) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentData = userDoc.data();
    const currentPermissions = currentData.permissions || {};
    
    // Merge new permissions with existing ones
    const updatedPermissions = {
      ...currentPermissions,
      ...permissions
    };
    
    await updateDoc(userRef, {
      permissions: updatedPermissions,
      updatedAt: new Date()
    });
    
    console.log(`✓ Updated multiple permissions for user ${userId}:`, updatedPermissions);
    return true;
  } catch (error) {
    console.error('Error updating multiple permissions:', error);
    throw error;
  }
}

// Check if user has specific permission
export async function checkUserPermission(userId, permission) {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions[permission] === true;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

// Get all users with their permissions
export async function getAllUsersWithPermissions() {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        permissions: userData.permissions || {}
      });
    });
    
    console.log(`✓ Found ${users.length} users with permissions`);
    return users;
  } catch (error) {
    console.error('Error getting users with permissions:', error);
    throw error;
  }
}

// Initialize default permissions for new users
export function getDefaultPermissions() {
  return {
    dashboard: true,
    pos: true,
    products: true,
    receipts: true,
    cart: true,
    print: true,
    reports: false,
    settings: false
  };
}
