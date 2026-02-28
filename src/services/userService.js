import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDefaultPermissions } from './adminService';

// Create user document in Firestore when they sign up
export async function createUserProfile(user, additionalData = {}) {
  try {
    console.log('Creating user profile for:', user.uid);
    
    const userRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);
    
    if (!userSnapshot.exists()) {
      const createdAt = new Date();
      const userData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: createdAt,
        updatedAt: createdAt,
        role: 'user', // Default role
        status: 'active',
        permissions: getDefaultPermissions(), // Add default permissions
        ...additionalData
      };
      
      await setDoc(userRef, userData);
      console.log('✓ User profile created in Firestore:', userData);
      return userData;
    } else {
      console.log('User profile already exists');
      return userSnapshot.data();
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// Get user profile from Firestore
export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      console.log('✓ User profile found:', userSnapshot.data());
      return userSnapshot.data();
    } else {
      console.log('User profile not found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// Update user profile in Firestore
export async function updateUserProfile(uid, updateData) {
  try {
    const userRef = doc(db, 'users', uid);
    const updatePayload = {
      ...updateData,
      updatedAt: new Date()
    };
    
    await updateDoc(userRef, updatePayload);
    console.log('✓ User profile updated:', updatePayload);
    
    // Return updated profile
    return await getUserProfile(uid);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log('✓ User found by email:', userDoc.data());
      return userDoc.data();
    } else {
      console.log('User not found by email');
      return null;
    }
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Get all users (for admin purposes)
export async function getAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    
    console.log(`✓ Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}
