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

export interface QuestionsService {
  getAllQuestions(): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | null>;
  validateToken(token: string): Promise<boolean>;
  validateAnswer(questionId: number, answerId: number): Promise<boolean>;
}
