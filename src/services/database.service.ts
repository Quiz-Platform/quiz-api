import {DatabaseSchema, DatabaseServiceInterface, AnswerEntry} from '../models/database.interface';
import {Low} from 'lowdb';
import { JSONFilePreset } from 'lowdb/node'

export class DatabaseService implements DatabaseServiceInterface {
  private db: Low<DatabaseSchema>;

  constructor(db: Low<DatabaseSchema>) {
    this.db = db;
  }

  static async create(): Promise<DatabaseService> {
    const db = await JSONFilePreset<DatabaseSchema>('db.json', { answers: [] });
    return new DatabaseService(db);
  }


  async saveUserAnswer(userAnswer: AnswerEntry): Promise<string> {
    await this.db.read();
    const id = Date.now().toString();
    console.log(userAnswer);
    const answerWithId = { ...userAnswer, id, createdAt: new Date().toISOString() };
    this.db.data!.answers.push(answerWithId);
    await this.db.write();
    console.log('Answer saved with ID:', id);
    return id;
  }

  async getUserQuizHistory(userId: string): Promise<AnswerEntry[]> {
    await this.db.read();
    return this.db.data!.answers.filter(a => a.telegramUser === userId);
  }

  async getQuizStatistics(): Promise<any> {
    await this.db.read();
    const answers = this.db.data!.answers;
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    return {
      totalAnswers,
      correctAnswers,
      averageScore: totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : 0
    };
  }
}
