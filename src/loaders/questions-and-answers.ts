import express, { Request, Response } from 'express';
import fs from "fs";
import path from "path";

const router = express.Router();

interface Option {
  id: string;
  text: string;
  isTrue: boolean;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface AnswerRequest {
  token: string;
  telegramUser: string;
  timestamp: number;
  questionId: number;
  answerId: string;
}

  // Loading mock data
  const questionsPath = path.join(__dirname, "../../src/mocks/questions.mock.json");
  let questions: Question[] = [];

  try {
    const data = fs.readFileSync(questionsPath, "utf8");
    questions = JSON.parse(data);
  } catch (err) {
  console.error("Error loading mock data", err);
}

// GET /api/questions
router.get("/api/questions/", (req: Request, res: Response) => {
  if (!questions.length) {
    return res.status(204).json({ message: "There are no questions" });
  }

  res.json(questions);
});

// GET /api/questions/:id
router.get("/api/questions/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const question = questions.find(q => q.id === id);

  if (!question) {
    return res.status(404).json({ message: "No such question" });
  }

  res.json(question);
});

// POST /api/answers
router.post("/api/answers", (req: Request, res: Response) => {
  const { token, telegramUser, timestamp, questionId, answerId }: AnswerRequest = req.body;

  // Validate token
  // TODO: Use Firebase Authentication SDK's Email and password based authentication instead of API token
  const validToken = process.env.API_TOKEN;
  if (!validToken) {
    return res.status(500).json({ message: "Configuration error" });
  }

  if (!token || token !== validToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const question = questions.find(q => q.id === questionId);
  if (!question) return res.status(400).json({ message: "Unknown questionId" });

  const answer = question.options.find(o => o.id === answerId);
  if (!answer) return res.status(400).json({ message: "Unknown answerId" });

  const isCorrect = answer.isTrue;

  console.log("Response:", { telegramUser, timestamp, questionId, answerId, isCorrect });

  res.json({ status: "ok", correct: isCorrect });
});

export default router;
