import { AnswerRequest } from './answer.request';

export interface UserAnswer extends AnswerRequest {
  createdAt: string;
  isCorrect: boolean;
}

export interface DatabaseService {
  saveUserAnswer(userAnswer: UserAnswer): Promise<string>;
  getUserQuizHistory(userId: string): Promise<UserAnswer[]>;
  getQuizStatistics(): Promise<any>;
}
