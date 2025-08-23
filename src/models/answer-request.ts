export interface Answer {
  telegramUser: string;
  timestamp: number;
  questionId: number;
  answerId: string;
  isCorrect: boolean;
}

export interface AnswerRequest extends Answer {
  timestamp: number;
  token: string;
}
