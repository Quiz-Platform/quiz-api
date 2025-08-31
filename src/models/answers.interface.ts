type float = number;

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

// Type for any quiz in this app
export interface QuizStats {
  totalAnswers: number;
  correctAnswers: number;
  averageScore: float;
};

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Type only for placement tests
export interface PlacementTestResults extends QuizStats {
  score: Grade;
  proficiencyLevel: ProficiencyLevel;
}
