import { DatabaseService } from '../models/database.interface';
import { QuestionsService } from '../models/questions.interface';
import { TinyDBDatabaseService } from './providers/tinydb-database.service';
import { MockQuestionsService } from './providers/mock-questions.service';
import {config} from '../app-config';

export class ServiceFactory {
  private static databaseService: DatabaseService;
  private static questionsService: QuestionsService;

  static getDatabaseService(): DatabaseService {
    if (!this.databaseService) {
      this.databaseService = new TinyDBDatabaseService(); // TinyDB
    }
    return this.databaseService;
  }

  static getQuestionsService(): QuestionsService {
    if (!this.questionsService) {
      this.questionsService = new MockQuestionsService(config);
    }
    return this.questionsService;
  }

  static setDatabaseService(service: DatabaseService): void {
    this.databaseService = service;
  }

  static setQuestionsService(service: QuestionsService): void {
    this.questionsService = service;
  }
}
