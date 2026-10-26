import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Exact credentials from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDxfoxZVCXOGROvRYR3x5X9UGrXGlkn8bU",
  authDomain: "menvora-ayurveda.firebaseapp.com",
  projectId: "menvora-ayurveda",
  storageBucket: "menvora-ayurveda.firebasestorage.app",
  messagingSenderId: "487067046769",
  appId: "1:487067046769:web:c062391960ff0b690ddcd0",
  measurementId: "G-FW1E0LF57C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);