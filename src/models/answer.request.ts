export interface Answer {
  telegramUser: string;
  timestamp: number;
  questionId: number;
  answerId: number;
}

export interface AnswerRequest extends Answer {
  token: string;
}
