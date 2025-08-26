import fs from 'fs';
import path from 'path';
import { QuestionsService, Question } from '../../models/questions.interface';
import { AppConfig } from '../../app-config';

export class MockQuestionsService implements QuestionsService {
  private questions: Question[] = [];
  protected config: AppConfig;

  constructor(config: AppConfig) {
    this.loadQuestions();
    this.config = config;
  }

  private loadQuestions(): void {
    try {
      const questionsPath = path.join(__dirname, '../../../src/mocks/questions.mock.json');
      const data = fs.readFileSync(questionsPath, 'utf8');
      this.questions = JSON.parse(data);
    } catch (err) {
      console.error('Error loading mock questions:', err);
      this.questions = [];
    }
  }

  async getAllQuestions(): Promise<Question[]> {
    return this.questions;
  }

  async getQuestionById(id: number): Promise<Question | null> {
    return this.questions.find(q => q.id === id) || null;
  }

  async validateToken(token: string): Promise<boolean> {
    const validToken = this.config.apiToken;
    if (!validToken) {
      console.error('No access token set for the app. Set a token in app.config.ts');
    }

    return !(!token || token !== validToken);
  }

  async validateAnswer(questionId: number, answerId: number): Promise<boolean> {
    const question = await this.getQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const answer = question.options.find(o => o.id === answerId);
    if (!answer) {
      throw new Error('Answer not found');
    }

    return answer.isTrue;
  }
}
