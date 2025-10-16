import { DatabaseServiceInterface, AnswerEntry } from '../models/database.interface';
import { Logger } from '../utils/logger';
import { Grade, PlacementTestResults, ProficiencyLevel, QuizStats } from '../models/answers.interface';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

export class DatabaseService implements DatabaseServiceInterface {
  private db: SupabaseClient;
  private logger: Logger;

  constructor() {
    this.db = createClient(
      process.env.DATABASE_URL!,
      process.env.SUPABASE_KEY!
    );
    this.logger = new Logger();
  }

  static async create(): Promise<DatabaseService> {
    return new DatabaseService();
  }

  private _toFixed(num: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return ((num * factor) - (num * factor % 1)) / factor;
  }

  private _getScore(average: number): Grade {
    if (average >= 90) return 'A';
    if (average >= 80) return 'B';
    if (average >= 70) return 'C';
    if (average >= 60) return 'D';
    if (average >= 50) return 'E';
    return 'F';
  }

  private _getProficiencyLevel(average: number): ProficiencyLevel {
    if (average <= 20) return 'A1';
    if (average <= 40) return 'A2';
    if (average <= 60) return 'B1';
    if (average <= 75) return 'B2';
    if (average <= 90) return 'C1';
    return 'C2';
  }

  // Save a single user answer; update if answer id exists
  async saveUserAnswer(sessionId: string, telegramUser: string, userAnswer: AnswerEntry): Promise<string> {
    const id = userAnswer.id || Date.now().toString();
    const createdAt = new Date().toISOString();

    // Ensure the session exists
    const { data: existingSession, error: sessionError } = await this.db
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!existingSession) {
      const { error } = await this.db.from('sessions').insert({
        id: sessionId,
        telegram_user: telegramUser,
      });
      if (error) {
        this.logger.log({ type: 'error', message: `${error.message}` });
      }


    }

    // Insert or update answer using upsert
    const { error } = await this.db
      .from('answers')
      .upsert(
        [{
          id,
          sessionId,
          questionId: userAnswer.questionId,
          answerId: userAnswer.answerId,
          isCorrect: userAnswer.isCorrect,
          createdAt,
        }],
        { onConflict: 'id' } // upsert on primary key
      );

    if (error) {
      this.logger.log({ type: 'error', message: `Error saving answer: ${error.message}` });
      throw error;
    }

    this.logger.log({ type: 'event', message: `Answer ${id} saved/updated for user ${telegramUser} in session ${sessionId}` });
    return id;
  }

  // Get all answers submitted by a user
  async getUserQuizHistory(userId: string): Promise<AnswerEntry[]> {
    const { data, error } = await this.db
      .from('answers')
      .select('*')
      .eq('telegram_user', userId);

    if (error) throw error;

    return data as AnswerEntry[];
  }

  async getQuizStats(): Promise<QuizStats> {
    const { data, error } = await this.db.from('answers').select('is_correct');
    if (error) throw error;

    const totalAnswers = data.length;
    const correctAnswers = data.filter(a => a.is_correct).length;

    return {
      totalAnswers,
      correctAnswers,
      averageScore: totalAnswers > 0 ? this._toFixed((correctAnswers / totalAnswers) * 100) : 0
    };
  }

  async getQuizStatByUserSession(sessionId: string, telegramUser: string): Promise<PlacementTestResults | undefined> {
    const { data, error } = await this.db
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('telegram_user', telegramUser);

    if (error) throw error;
    if (!data || data.length === 0) return;

    const totalAnswers = data.length;
    const correctAnswers = data.filter(a => a.is_correct).length;
    const averageScore = totalAnswers > 0 ? this._toFixed((correctAnswers / totalAnswers) * 100) : 0;

    return {
      totalAnswers,
      correctAnswers,
      averageScore,
      score: this._getScore(averageScore),
      proficiencyLevel: this._getProficiencyLevel(averageScore)
    };
  }
}
