import { auth } from '../firebase/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Test Firebase authentication
export async function testFirebaseAuth() {
  console.log('=== Firebase Authentication Test ===');
  console.log('1. Testing Firebase initialization...');
  
  try {
    // Check if auth is properly initialized
    if (!auth) {
      return { success: false, message: 'Firebase auth not initialized' };
    }
    
    console.log('✓ Firebase auth initialized');
    console.log('2. Testing auth configuration...');
    
    // Check app configuration
    const app = auth.app;
    console.log('✓ Firebase app:', app.name);
    console.log('✓ Project ID:', app.options.projectId);
    console.log('✓ Auth domain:', app.options.authDomain);
    
    console.log('3. Testing authentication with Firebase...');
    
    // Test with a real email to see actual Firebase response
    const testEmail = `test${Date.now()}@example.com`; // Use timestamp to avoid conflicts
    const testPassword = 'test123456';
    
    console.log(`Attempting to create user with email: ${testEmail}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✓ User created successfully:', userCredential.user);
    console.log('✓ User UID:', userCredential.user.uid);
    console.log('✓ User email:', userCredential.user.email);
    
    // Test if user is actually saved by checking current user
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userCredential.user.uid) {
      console.log('✓ User properly saved in Firebase Auth');
    } else {
      console.log('✗ User not properly saved in Firebase Auth');
    }
    
    // Clean up - delete the test user
    await userCredential.user.delete();
    console.log('✓ Test user deleted successfully');
    
    return { 
      success: true, 
      message: 'Firebase Auth is working correctly - users are being saved properly',
      details: {
        projectId: app.options.projectId,
        authDomain: app.options.authDomain,
        testUserCreated: true,
        testUserDeleted: true
      }
    };
    
  } catch (error) {
    console.error('✗ Firebase Auth test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide specific error messages
    let errorMessage = 'Failed to create account. Please try again.';
    let solution = '';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered.';
      solution = 'Firebase Auth is working, but email already exists.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
      solution = 'Check email format.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak.';
      solution = 'Use a stronger password (6+ characters).';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Firebase Auth not configured properly.';
      solution = 'Enable Email/Password authentication in Firebase Console → Authentication → Sign-in method.';
    } else if (error.code === 'auth/api-key-not-valid') {
      errorMessage = 'Invalid Firebase API key.';
      solution = 'Check your Firebase configuration in firebase.js';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network connection failed.';
      solution = 'Check your internet connection and Firebase project status.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts.';
      solution = 'Wait a few minutes and try again.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'User account is disabled.';
      solution = 'Check Firebase Console → Authentication → Users.';
    }
    
    return { 
      success: false, 
      message: errorMessage,
      code: error.code,
      solution: solution,
      fullError: error.message
    };
  }
}

// Test current authentication state
export function testCurrentAuthState() {
  console.log('=== Current Auth State Test ===');
  console.log('Current user:', auth.currentUser);
  console.log('Auth loading state:', auth.auth?.currentUser);
  
  return {
    currentUser: auth.currentUser,
    isSignedIn: !!auth.currentUser,
    uid: auth.currentUser?.uid,
    email: auth.currentUser?.email
  };
}
