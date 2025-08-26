import express, { Request, Response } from 'express';
import { ServiceFactory } from '../services/service-factory';
import { AnswerRequest } from '../models/answer.request';
import { UserAnswer } from '../models/database.interface';

const router = express.Router();

// Get services from factory
const questionsService = ServiceFactory.getQuestionsService();
const databaseService = ServiceFactory.getDatabaseService();

// GET /questions
router.get("/questions/", async (req: Request, res: Response) => {
  try {
    const questions = await questionsService.getAllQuestions();
    if (!questions.length) {
      res.status(204).json({ message: "There are no questions" });
      return;
    }

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /questions/:id
router.get("/questions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const question = await questionsService.getQuestionById(id);

    if (!question) {
      res.status(404).json({ message: "No such question" });
      return;
    }

    res.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /answers
router.post("/answers", async (req: Request, res: Response) => {
  const { token, telegramUser, timestamp, questionId, answerId }: AnswerRequest = req.body as AnswerRequest;

  // Validate token
  let isTokenValid: boolean;

  isTokenValid = await questionsService.validateToken(token);

  if (isTokenValid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let isCorrect: boolean;

  try {
    // Validate question and answer
    isCorrect = await questionsService.validateAnswer(questionId, answerId);

    // Save to database
    const userAnswer = {
      telegramUser,
      questionId,
      answerId,
      isCorrect,
      timestamp,
      token,
    } as UserAnswer;

    console.log("Answer received:", { telegramUser, questionId, answerId, isCorrect });

    await databaseService.saveUserAnswer(userAnswer);
    console.log("Answer saved:", { telegramUser, questionId, answerId, isCorrect });
  } catch (error) {
    console.error("Error processing answer:", error);
    if (error instanceof Error && (error.message === 'Question not found' || error.message === 'Answer not found')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to save answer" });
  }

  res.json({ status: "ok", correct: isCorrect });
});

export default router;
