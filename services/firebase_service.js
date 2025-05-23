import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD_F705xlEtYkNuBgDHfymdmG7Hmp3foWg",
  authDomain: "authstorage-bab30.firebaseapp.com",
  projectId: "authstorage-bab30",
  storageBucket: "authstorage-bab30.firebasestorage.app",
  messagingSenderId: "475858934318",
  appId: "1:475858934318:web:f3a575c28afa6a621f1dbf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
