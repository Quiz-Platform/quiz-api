import { Answer, PlacementTestResults, QuizStats } from './answers.interface';

export interface AnswerEntry extends Answer {
  id?: number;
  createdAt: string;
  isCorrect: boolean | null;
}

export interface DatabaseServiceInterface {
  createUserAnswer(sessionId: string, telegramUser: string, userAnswer: Omit<AnswerEntry, 'id'>): Promise<number | null>;
  getUserQuizHistory(userId: string): Promise<AnswerEntry[]>;
  getQuizStats(): Promise<QuizStats>;
  getQuizStatByUserSession(sessionId: string, telegramUser: string): Promise<PlacementTestResults | undefined>;
}
