import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import questionsAndAnswers from "./loaders/questions-and-answers";

setGlobalOptions({maxInstances: 10});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/", questionsAndAnswers);

// Export the Express app as a Firebase Function
export const api = onRequest(app);
