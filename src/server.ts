import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import apicache from 'apicache';
import { config } from './app-config';
import questionsRouter from './endpoints/questions';
import { AnswersRouter } from './endpoints/answers';
import { DatabaseService } from './services/database.service';

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.text({ type: 'text/plain' }));

  const cache = apicache.middleware;
  app.use(cache('30 days'));

  const databaseService = await DatabaseService.create();

  app.use((req, res, next) => {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).send("Invalid JSON");
      }
    }
    next();
  });

  app.use('/api', questionsRouter);
  const answersRouter = new AnswersRouter(databaseService);
  app.use("/api", answersRouter.registerRoutes());

  app.listen(config.port, () => {
    console.log(`[${config.nodeEnv}] Server started on http://localhost:${config.port}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
