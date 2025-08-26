import { DatabaseService, UserAnswer } from '../../models/database.interface';
import TinyDB from 'tinydb';

export class TinyDBDatabaseService implements DatabaseService {
  private db: TinyDB;

  constructor() {
    this.db = new TinyDB('quiz_responses.json');
  }

  async saveUserAnswer(userAnswer: UserAnswer): Promise<string> {
    try {
      const id = Date.now().toString();
      const answerWithId = {
        ...userAnswer,
        id,
        createdAt: new Date().toISOString()
      };

      await this.db.insert(answerWithId);
      console.log('Answer saved to TinyDB with ID:', id);
      return id;
    } catch (error) {
      console.error('Error saving answer to TinyDB:', error);
      throw error;
    }
  }

  async getUserQuizHistory(userId: string): Promise<UserAnswer[]> {
    try {
      const answers = await this.db.find({ telegramUser: userId });
      return answers as UserAnswer[];
    } catch (error) {
      console.error('Error fetching user history from TinyDB:', error);
      throw error;
    }
  }

  async getQuizStatistics(): Promise<any> {
    try {
      const answers = await this.db.find({});
      const totalAnswers = answers.length;
      const correctAnswers = answers.filter((a: any) => a.isCorrect).length;

      return {
        totalAnswers,
        correctAnswers,
        averageScore: totalAnswers > 0 ?
          (correctAnswers / totalAnswers * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error fetching statistics from TinyDB:', error);
      throw error;
    }
  }
}
