import express from 'express';
import dotenv from 'dotenv';
import questionsAndAnswers from './loaders/questions-and-answers';

dotenv.config();
const app = express();
const port = process.env.PORT ?? 8080;
const cors = require('cors');

app.use(cors());
app.use('/api', questionsAndAnswers);

app.listen(port);
