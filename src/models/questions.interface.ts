export interface Option {
  id: number;
  text: string;
  isTrue: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export type QuestionsApiRes<T> = {
  items: T | Question[] | unknown[];
  counter: {
    total: number;
    currentNumber?: number;
  }
};

export interface QuestionsService {
  getAllQuestions(): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | null>;
  getQuestionsTotalCount(): Promise<number>;
  validateToken(token: string): Promise<boolean>;
  validateAnswer(questionId: number, answerId: number): Promise<boolean>;
}
