import { Answer } from './answer.request';

export interface AnswerEntry extends Answer {
  isCorrect: boolean;
}

export type DatabaseSchema = {
  answers: AnswerEntry[];
}

export interface DatabaseServiceInterface {
  saveUserAnswer(userAnswer: AnswerEntry): Promise<string>;
  getUserQuizHistory(userId: string): Promise<AnswerEntry[]>;
  getQuizStatistics(): Promise<any>;
}
