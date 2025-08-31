import data from './questions.mock.json';
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

  async getQuestionsTotalCount(): Promise<number> {
    return this.questions.length;
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

  async validateAnswer(questionId: number | string, answerId: number | string): Promise<boolean | null> {
    // returns true if the answer exists and is correct,
    // returns false if the answer exists but is incorrect,
    // returns null if either the question or the answer option does not exist

    const question = await this.getQuestionById(questionId);
    if (!question) {
      logger.log({ type: 'error', message: `Question not found: id=${questionId}` });
      return null;
    }

    const option = question.options.find(opt => opt.id === Number(answerId));
    if (!option) {
      logger.log({ type: 'error', message: `Answer not found: id=${answerId} in question ${questionId}` });
      return null;
    }

    return option.isTrue;
  }
}
