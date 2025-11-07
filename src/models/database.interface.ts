import { Answer, PlacementTestResults, QuizStats } from './answers.interface';

export interface AnswerEntry extends Answer {
  id: string;
  createdAt: string;
  isCorrect: boolean;
}

export interface DatabaseServiceInterface {
  saveUserAnswer(sessionId: string, telegramUser: string, userAnswer: AnswerEntry): Promise<string>;
  getUserQuizHistory(userId: string): Promise<AnswerEntry[]>;
  getQuizStats(): Promise<QuizStats>;
  getQuizStatByUserSession(sessionId: string, telegramUser: string): Promise<PlacementTestResults | undefined>;
}
