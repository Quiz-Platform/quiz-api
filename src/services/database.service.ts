import { DatabaseSchema, DatabaseServiceInterface, AnswerEntry } from '../models/database.interface';
import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node'
import { Logger } from '../utils/logger';
import { Grade, PlacementTestResults, ProficiencyLevel, QuizStats } from '../models/answers.interface';

export class DatabaseService implements DatabaseServiceInterface {
  private db: Low<DatabaseSchema>;
  private logger: Logger;

  constructor(db: Low<DatabaseSchema>) {
    this.db = db;
    this.logger = new Logger();
  }

  static async create(): Promise<DatabaseService> {
    const db = await JSONFilePreset<DatabaseSchema>('db.json', { sessions: [] });
    return new DatabaseService(db);
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
    await this.db.read();

    const session = this.db.data!.sessions.find(s => s.sessionId === sessionId);
    const id = Date.now().toString();
    const answerWithId: AnswerEntry = {
      ...userAnswer,
      id,
      createdAt: new Date().toISOString(),
    };

    if (session) {
      session.answers.push(answerWithId);
    } else {
      this.db.data!.sessions.push({
        sessionId,
        telegramUser,
        answers: [answerWithId],
      });
    }

    await this.db.write();
    this.logger.log({ type: 'event', message: `Answer saved with ID ${telegramUser} saved with id ${id} for session ${sessionId}` });
    return id;
  }

  async getUserQuizHistory(userId: string): Promise<AnswerEntry[]> {
    await this.db.read();
    return this.db.data!.sessions
      .filter(session => session.telegramUser === userId)
      .flatMap(session => session.answers);
  }

  async getQuizStats(): Promise<QuizStats> {
    await this.db.read();
    const allAnswers = this.db.data!.sessions.flatMap(session => session.answers);

    const totalAnswers = allAnswers.length;
    const correctAnswers = allAnswers.filter(a => a.isCorrect).length;

    return {
      totalAnswers,
      correctAnswers,
      averageScore: totalAnswers > 0 ? this._toFixed((correctAnswers / totalAnswers) * 100) : 0
    };
  }

  async getQuizStatByUserSession(sessionId: string, telegramUser: string): Promise<PlacementTestResults> {
    await this.db.read();
    const session = this.db.data!.sessions.find(
      s => s.sessionId === sessionId && s.telegramUser === telegramUser
    );

    if (!session) {
      this.logger.log({ type: 'event', message: `Session not found for user ${telegramUser} with sessionId ${sessionId}`});
      return;
    }

    const totalAnswers = session.answers.length;
    const correctAnswers = session.answers.filter(a => a.isCorrect).length;
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
