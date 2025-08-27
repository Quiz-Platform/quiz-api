import {DatabaseSchema, DatabaseServiceInterface, AnswerEntry} from '../models/database.interface';
import {Low} from 'lowdb';
import { JSONFilePreset } from 'lowdb/node'
import {Logger} from '../utils/logger';

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
      this.logger.log({ type: 'event', message: `Answer from user ${telegramUser} saved with id ${id} for session ${sessionId}` });
    } else {
      this.db.data!.sessions.push({
        sessionId,
        telegramUser,
        answers: [answerWithId],
      });
    }

    await this.db.write();
    console.log('Answer saved with ID:', id);
    return id;
  }

  async getUserQuizHistory(userId: string): Promise<AnswerEntry[]> {
    await this.db.read();
    return this.db.data!.sessions
      .filter(session => session.telegramUser === userId)
      .flatMap(session => session.answers);
  }

  async getQuizStatistics(): Promise<any> {
    await this.db.read();
    const allAnswers = this.db.data!.sessions.flatMap(session => session.answers);

    const totalAnswers = allAnswers.length;
    const correctAnswers = allAnswers.filter(a => a.isCorrect).length;

    return {
      totalAnswers,
      correctAnswers,
      averageScore: totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : '0'
    };
  }
}
