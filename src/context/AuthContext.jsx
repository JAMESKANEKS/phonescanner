/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { createUserProfile, getUserProfile } from '../services/userService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        
        // Check if user is suspended and auto-logout
        if (profile && profile.status === 'suspended') {
          console.log('User is suspended, logging out...');
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          return false; // Indicate suspension
        }
        return true; // Indicate active status
      } catch (error) {
        console.error('Error refreshing user profile:', error);
        return false;
      }
    }
    return false;
  };

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, additionalData = {}) {
    console.log('AuthContext: Creating user with email:', email);
    
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: User created successfully in Auth:', userCredential.user);
      
      // Create user profile in Firestore
      const userProfileData = await createUserProfile(userCredential.user, additionalData);
      console.log('AuthContext: User profile created in Firestore:', userProfileData);
      
      // Set user profile in state
      setUserProfile(userProfileData);
      
      return userCredential;
    } catch (error) {
      console.error('AuthContext: Error creating user:', error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Load user profile from Firestore
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          
          // Check if user is suspended and auto-logout
          if (profile && profile.status === 'suspended') {
            console.log('User is suspended, logging out...');
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            return;
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Periodic status check for real-time suspension monitoring
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const intervalId = setInterval(async () => {
      try {
        const profile = await getUserProfile(currentUser.uid);
        
        // Check if user status changed to suspended
        if (profile && profile.status === 'suspended' && userProfile.status !== 'suspended') {
          console.log('User status changed to suspended, logging out...');
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
        }
        
        // Update profile if it changed
        if (profile && profile.status !== userProfile.status) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [currentUser, userProfile]);

  const value = {
    currentUser,
    userProfile,
    login,
    signup,
    logout,
    refreshUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
