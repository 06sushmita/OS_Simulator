# Changelog

## 2026-05-07

### Firebase note

We started keeping Firebase configuration details with the project history because the app is planned to use Firebase services instead of staying fully local-only.

Reason for this change:

- Firebase gives us a single backend platform for hosting future app data and usage tracking.
- The current configuration is for the `deadlock-simulator` Firebase project.
- Analytics is included in the setup snippet, so this change also records that measurement support was considered as part of the integration.

Stored setup snippet:

```js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgmij0nFN6cAVJaVXyqnkqE4EGw6KzLPM",
  authDomain: "deadlock-simulator.firebaseapp.com",
  projectId: "deadlock-simulator",
  storageBucket: "deadlock-simulator.firebasestorage.app",
  messagingSenderId: "1016753768930",
  appId: "1:1016753768930:web:beeb3e6b60953c90ba91bb",
  measurementId: "G-WVJGDEGV62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

This entry records the intended Firebase setup. The current app codebase does not yet import Firebase at runtime.
