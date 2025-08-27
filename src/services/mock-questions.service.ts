import * as data from './questions.mock.json';
import { QuestionsService, Question } from '../models/questions.interface';
import { AppConfig } from '../app-config';
import { Logger } from '../utils/logger';

const logger = new Logger();

export class MockQuestionsService implements QuestionsService {
  private questions: Question[] = [];
  protected config: AppConfig;

  constructor(config: AppConfig) {
    this.loadQuestions();
    this.config = config;
  }

  private loadQuestions(): void {
    try {
      this.questions = data;
    } catch (error) {
      logger.log({type: 'error', message: 'Error loading mock questions', error});
      this.questions = [];
    }
  }

  async getAllQuestions(): Promise<Question[]> {
    return this.questions;
  }

  async getQuestionById(id: number | string): Promise<Question | null> {
    return this.questions.find(q => q.id === Number(id)) || null;
  }

  async validateToken(token: string): Promise<boolean> {
    const validToken = this.config.apiToken;
    if (!validToken) {
      logger.log({type: 'error', message: 'No access token set for the app. \nSet a token in app.config.ts'})
    }

    return !(!token || token !== validToken);
  }

  async validateAnswer(questionId: number | string, answerId: number | string): Promise<boolean> {
    // TODO: validation

    return true;
  }
}
