import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from './app-config';
import questionsAndAnswers from './loaders/questions-and-answers';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/api', questionsAndAnswers);

app.listen(config.port, () => {
  console.log(`[${config.nodeEnv}] Server started on http://localhost:${config.port}`);
});
