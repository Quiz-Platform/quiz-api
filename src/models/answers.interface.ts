export interface Answer {
  questionId: number;
  answerId: number;
}

export interface AnswerRequest extends Answer {
  timestamp: number;
  telegramUser: string;
  token: string;
  sessionId: string;
}
