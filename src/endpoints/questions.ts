import express, { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import {MockQuestionsService} from '../services/mock-questions.service';
import {config} from '../app-config';

const questionsRouter = express.Router();
const logger = new Logger();

const questionsService = new MockQuestionsService(config);

// GET /questions
questionsRouter.get("/questions/", async (req: Request, res: Response) => {
  try {
    const questions = await questionsService.getAllQuestions();
    if (!questions.length) {
      res.status(204).json({ message: "There are no questions" });
      return;
    }

    res.json(questions);
  } catch (error) {
    logger.log({type: 'error', message: 'Error fetching questions', error});
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /questions/:id
questionsRouter.get("/questions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const question = await questionsService.getQuestionById(id);

    if (!question) {
      res.status(404).json({ message: "No such question" });
      return;
    }

    res.json(question);
  } catch (error) {
    logger.log({type: 'error', message: 'Error fetching questions', error});
    res.status(500).json({ message: "Internal server error" });
  }
});

export default questionsRouter;
