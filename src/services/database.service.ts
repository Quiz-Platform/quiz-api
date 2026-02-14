import {DatabaseServiceInterface, AnswerEntry, Sessions} from '../models/database.interface';
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

  private _getScore(score: number): Grade {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    if (score >= 50) return 'E';
    return 'F';
  }

  private _getProficiencyLevel(score: number): ProficiencyLevel {
    if (score <= 30) return 'A1';
    if (score <= 50) return 'A2';
    if (score <= 80) return 'B1';
    if (score <= 90) return 'B2';
    return 'B2';
  }

  private async _ensureSessionExists(sessionId: string): Promise<boolean> {
    const { data, error: sessionError } = await this.db
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      this.logger.log({ type: 'error', message: `Error fetching session: ${sessionError.message}` });
      return false;
    }
  }

  async createNewSession(sessionId: string, telegramUser: string): Promise<void> {
    const { data: existingSession, error } = await this.db
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      this.logger.log({
        type: 'error',
        message: `Error fetching session: ${error.message}`,
      });
      throw error;
    }

    if (existingSession) return;

    const { error: insertError } = await this.db
      .from('sessions')
      .insert({ id: sessionId, telegram_user: telegramUser });

    if (insertError) {
      this.logger.log({
        type: 'error',
        message: `Error creating session: ${insertError.message}`,
      });
      throw insertError;
    }
  }

  async getLatestUserSessionId(userId: string): Promise<string> {
    const { data: session, error } = await this.db
      .from('sessions')
      .select('id')
      .eq('telegram_user', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      this.logger.log({ type: 'error', message: `Error fetching session: ${error.message}` });
      throw error;
    }

    return session.id;
  }

  async createUserAnswer(sessionId: string, telegramUser: string, userAnswer: Omit<AnswerEntry, 'id'>): Promise<number | null> {
    // Convert answerId to number safely
    const answerId = userAnswer.answerId !== undefined ? Number(userAnswer.answerId) : null;

    if (answerId !== null && isNaN(answerId)) {
      this.logger.log({ type: 'error', message: `Invalid answerId: ${userAnswer.answerId}` });
      this.logger.log({ type: 'error', message: 'answerId must be a number' });
      return null;
    }

    const sessionReady = await this._ensureSessionExists(sessionId);
    if (!sessionReady) {
      await this.createNewSession(sessionId, telegramUser);
    }

    const { data, error } = await this.db
      .from('answers')
      .insert({
        session_id: sessionId,
        question_id: userAnswer.questionId,
        answer_id: answerId,
        is_correct: userAnswer.isCorrect,
        created_at: userAnswer.createdAt,
      })
      .select('id')
      .single();

    if (error) {
      this.logger.log({ type: 'error', message: `Error saving answer: ${error.message}` });
      return null;
    }

    const newId = data?.id;
    if (newId) {
      this.logger.log({ type: 'event', message: `Answer ${newId} saved for user ${telegramUser} in session ${sessionId}` });
    }

    return newId ?? null;
  }

  // Update entry adding the check result
  async updateUserAnswer(answerId: number, isCorrect: boolean): Promise<void> {
    await this.db
      .from('answers')
      .update({ 'is_correct': isCorrect })
      .eq('id', answerId);
  }

  // Get all answers submitted by a user
  async getUserQuizHistory(userId: string): Promise<AnswerEntry[]> {
    const { data, error } = await this.db
      .from('answers')
      .select('id, session_id, question_id, answer_id, is_correct, created_at, sessions!inner(telegram_user)')
      .eq('sessions.telegram_user', userId);

    if (error) {
      this.logger.log({ type: 'error', message: `Error fetching user quiz history: ${error.message}` });
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      questionId: row.question_id,
      answerId: row.answer_id,
      isCorrect: row.is_correct,
      createdAt: row.created_at,
      telegramUser: row.sessions?.[0]?.telegram_user
    })) as AnswerEntry[];
  }


  async getQuizStats(): Promise<QuizStats> {
    const { data, error } = await this.db.from('answers').select('is_correct');
    if (error) {
      this.logger.log({ type: 'error', message: `Error fetching quiz stats: ${error.message}` });
      return { totalAnswers: 0, correctAnswers: 0, averageScore: 0 };
    }

    const answers = data || [];
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const averageScore = totalAnswers > 0 ? this._toFixed((correctAnswers / totalAnswers) * 100) : 0;

    return {
      totalAnswers,
      correctAnswers,
      averageScore,
    };
  }

  async getQuizStatByUserSession(sessionId: string, telegramUser: string): Promise<PlacementTestResults | undefined> {
    const { data, error } = await this.db
      .from('answers')
      .select('is_correct, sessions!inner(telegram_user)')
      .eq('session_id', sessionId)
      .eq('sessions.telegram_user', telegramUser);

    if (error) {
      this.logger.log({ type: 'error', message: `Error fetching session stats: ${error.message}` });
    }

    if (!data || data.length === 0) return;

    const totalAnswers = data.length;
    const correctAnswers = data.filter(a => a.is_correct).length;
    const averageScore = totalAnswers > 0 ? this._toFixed((correctAnswers / totalAnswers) * 100) : 0;

    return {
      totalAnswers,
      correctAnswers,
      averageScore,
      score: this._getScore(averageScore),
      proficiencyLevel: this._getProficiencyLevel(averageScore),
    };
  }

  async getUserProgress(sessionId: string): Promise<number | null> {
    const { data, error } = await this.db
      .from('progress')
      .select('current_question')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      this.logger.log({ type: 'error', message: `Error fetching progress: ${error.message}` });
      return null;
    }

    return data?.current_question ?? null;
  }

  async setUserProgress(sessionId: string, telegramUser: string, questionId: number): Promise<void> {
    const { error } = await this.db
      .from('progress')
      .upsert({
        session_id: sessionId,
        telegram_user: telegramUser,
        current_question: questionId,
        updated_at: new Date().toISOString()
      });

    if (error) {
      this.logger.log({ type: 'error', message: `Error saving progress: ${error.message}` });
    }
  }
}
