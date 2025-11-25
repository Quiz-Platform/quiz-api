import { QuestionsService, Question } from '../models/questions.interface';
import { AppConfig } from '../app-config';
import { Logger } from '../utils/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const logger = new Logger();

export class SupabaseQuestionsService implements QuestionsService {
  private db: SupabaseClient;
  protected config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.db = createClient(
      process.env.DATABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  async getAllQuestions(): Promise<Question[]> {
    const { data, error } = await this.db
      .from('questions')
      .select('*');

    if (error) {
      logger.log({ type: 'error', message: `Error fetching all questions: ${error.message}` });
      return [];
    }

    return (data || []).map(q => ({
      id: q.id,
      text: q.text,
      options: q.options || [],
    }));
  }

  async getQuestionsTotalCount(): Promise<number> {
    const { count, error } = await this.db
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      logger.log({ type: 'error', message: `Error fetching questions count: ${error.message}` });
      return 0;
    }

    return count || 0;
  }

  async getQuestionById(id: number | string): Promise<Question | null> {
    const { data, error } = await this.db
      .from('questions')
      .select('*')
      .eq('id', Number(id))
      .maybeSingle();

    if (error) {
      logger.log({ type: 'error', message: `Error fetching question id=${id}: ${error.message}` });
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      text: data.text,
      options: data.options || [],
    };
  }

  async validateToken(token: string): Promise<boolean> {
    const validToken = this.config.apiToken;
    if (!validToken) {
      logger.log({ type: 'error', message: 'No access token set for the app. Set a token in app.config.ts' });
    }
    return !!token && token === validToken;
  }

  async validateAnswer(questionId: number | string, answerId: number | string): Promise<boolean | null> {
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
