// This script helps you get the correct Firebase configuration
// Go to: https://console.firebase.google.com/project/phonescanner-ba5ab/settings/general
// Scroll down to "Firebase SDK snippet" and copy the config object

/*
Your Firebase config should look like this:

const firebaseConfig = {
  apiKey: "AIzaSyCxPDYR93pfqePmyE2OEjFhjEVnR2OMN2w",
  authDomain: "phonescanner-ba5ab.firebaseapp.com",
  projectId: "phonescanner-ba5ab",
  storageBucket: "phonescanner-ba5ab.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // optional
};

STEPS TO FIX:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "phonescanner-ba5ab"
3. Click on Settings (gear icon) → Project settings
4. Scroll down to "Firebase SDK snippet" section
5. Copy the complete config object
6. Replace the config in src/firebase/firebase.js

7. IMPORTANT: Enable Email/Password Authentication:
   - Go to Authentication → Sign-in method
   - Click "Email/Password"
   - Enable it and save

8. Also check that your API key has the correct permissions
*/

export const instructions = {
  step1: "Go to Firebase Console: https://console.firebase.google.com/",
  step2: "Select project: phonescanner-ba5ab",
  step3: "Settings → Project settings → Firebase SDK snippet",
  step4: "Copy the complete config object",
  step5: "Replace config in src/firebase/firebase.js",
  step6: "Enable Email/Password authentication in Authentication → Sign-in method"
};
