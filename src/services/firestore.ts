import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Answer } from '../models/answer-request';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface UserAnswer extends Answer {
  createdAt: string; // Date and time when it was put to Firestore
}

export const saveUserAnswer = async (userAnswer: UserAnswer): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'quiz_responses'), {
      ...userAnswer,
      createdAt: serverTimestamp()
    });

    console.log('Answer saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving answer to Firestore:', error);
    throw error;
  }
};
