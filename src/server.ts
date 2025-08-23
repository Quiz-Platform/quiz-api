import express from 'express';
import dotenv from 'dotenv';
import questionsAndAnswers from './loaders/questions-and-answers';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import bodyParser from 'body-parser';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};


dotenv.config();
const firebaseApp = initializeApp(firebaseConfig);
const app = express();
const analytics = getAnalytics(firebaseApp);
const port = process.env.PORT ?? 8080;
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use('/api', questionsAndAnswers);

app.listen(port);
