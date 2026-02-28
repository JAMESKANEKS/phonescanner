# Firebase Setup Instructions

## 🔧 Fix Your Firebase Configuration

The issue is that your Firebase configuration is incomplete. Follow these steps:

### Step 1: Get Your Complete Firebase Config

1. Go to: https://console.firebase.google.com/
2. Select your project: `phonescanner-ba5ab`
3. Click **Settings** (gear icon) → **Project settings**
4. Scroll down to **"Firebase SDK snippet"** section
5. Copy the **complete** config object (it should have all these fields):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCxPDYR93pfqePmyE2OEjFhjEVnR2OMN2w",
  authDomain: "phonescanner-ba5ab.firebaseapp.com",
  projectId: "phonescanner-ba5ab",
  storageBucket: "phonescanner-ba5ab.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // optional
};
```

### Step 2: Update Your Firebase Config

Replace the config in `src/firebase/firebase.js` with the complete config from Step 1.

### Step 3: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Sign-in method** tab
3. Find **Email/Password** and click it
4. **Enable** the toggle switch
5. Click **Save**

### Step 4: Test the Fix

1. Restart your development server
2. Go to the signup page
3. Click **"Test Firebase Connection"**
4. Try creating a new account

## 🔍 What the Test Shows

The test button will show you:
- ✓ If Firebase is properly initialized
- ✓ If your project configuration is correct
- ✓ If users can be created and saved
- ✗ Specific error messages if something is wrong

## 🚨 Common Issues

- **"configuration-not-found"** → Enable Email/Password auth in Firebase Console
- **"api-key-not-valid"** → Check your Firebase config
- **"network-request-failed"** → Check internet connection
- **"email-already-in-use"** → This is actually good - it means Firebase is working!

## 📱 Check Users in Firebase Console

After creating an account, you can verify it was saved:
1. Firebase Console → Authentication → Users
2. You should see the new user listed there

---

**If you still have issues, run the test and share the exact error message you see!**
