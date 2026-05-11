# Firebase History

This file stores the Firebase setup note and the reason behind the change.

Why this change was noted:

- We are using Firebase for the `deadlock-simulator` project setup.
- The saved snippet shows the client configuration for app initialization and analytics.
- Keeping this here makes the project history easier to follow later.

Saved configuration snippet:

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
