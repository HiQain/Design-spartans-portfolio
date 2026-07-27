import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyC8ixThMuTncx0LWw4kVFtJ4nOeTmq2iGc",
  authDomain: "designspartans-portfolio.firebaseapp.com",
  projectId: "designspartans-portfolio",
  storageBucket: "designspartans-portfolio.firebasestorage.app",
  messagingSenderId: "601370060723",
  appId: "1:601370060723:web:c3950c2abe2de4ae3b8dc6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
