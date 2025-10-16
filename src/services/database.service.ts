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

  private _toFixed(num, decimals = 2): number {
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

  async saveUserAnswer(sessionId: string, telegramUser: string, userAnswer: AnswerEntry): Promise<string> {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    // Ensure session exists
    const { data: existingSession } = await this.db
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    if (!existingSession) {
      await this.db.from('sessions').insert({
        id: sessionId,
        telegram_user: telegramUser,
      });
    }

    // Save answer
    const { error } = await this.db.from('answers').insert({
      id: Number(userAnswer.answerId) || Number(id),
      session_id: sessionId,
      question_id: userAnswer.questionId,
      is_correct: userAnswer.isCorrect,
      created_at: createdAt,
    });

    if (error) {
      this.logger.log({ type: 'error', message: `Error saving answer: ${error.message}` });
      throw error;
    }

    this.logger.log({ type: 'event', message: `Answer ${id} saved for ${telegramUser} in session ${sessionId}` });
    return id;
  }

  async getUserQuizHistory(userId: string): Promise<AnswerEntry[]> {
    const { data, error } = await this.db
      .from('sessions')
      .select('id, answers(id, question_id, is_correct, created_at)')
      .eq('telegram_user', userId);

    if (error) throw error;

    return data.flatMap((s: any) => s.answers);
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
    const { data: session, error } = await this.db
      .from('answers')
      .select('is_correct')
      .eq('session_id', sessionId);

    if (!session) {
      this.logger.log({ type: 'event', message: `Session not found for user ${telegramUser} with sessionId ${sessionId}`});
      return;
    }

    const totalAnswers = session.length;
    const correctAnswers = session.filter(a => a.is_correct).length;
    const averageScore = totalAnswers > 0 ? this._toFixed((correctAnswers / totalAnswers) * 100) : 0;

    return {
      totalAnswers,
      correctAnswers,
      averageScore: averageScore,
      score: this._getScore(averageScore),
      proficiencyLevel: this._getProficiencyLevel(averageScore)
    };
  }
}
