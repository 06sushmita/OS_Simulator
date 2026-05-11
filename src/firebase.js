import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDgmij0nFN6cAVJaVXyqnkqE4EGw6KzLPM',
  authDomain: 'deadlock-simulator.firebaseapp.com',
  projectId: 'deadlock-simulator',
  storageBucket: 'deadlock-simulator.firebasestorage.app',
  messagingSenderId: '1016753768930',
  appId: '1:1016753768930:web:beeb3e6b60953c90ba91bb',
  measurementId: 'G-WVJGDEGV62',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const analyticsPromise =
  typeof window === 'undefined'
    ? Promise.resolve(null)
    : isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);

export { app, db, analyticsPromise };
