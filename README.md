# Quiz API

This API is made with Express and uses Vercel functions environment and Supabase as a DB.

## Prerequisites

Before running the project locally or in production, make sure you have:

- **Node.js** ≥ 18
- **npm** ≥ 8
- A **Supabase project** (or any Postgres-compatible DB)
- A `.env` file in the project root with the variables given in **.env.example**

## Local build

### Install dependencies:

```
npm i
```

### Compile the TypeScript source:

```
npm run build
```

### Run in development mode (with hot reload):

```
npm run start-dev
```

http://localhost:8080

## Production build
```
npm i
```

```
npm run build
```

```
npm run start-prod
```

The app will run on `8080` port by default. The port can be defined by setting
the`PORT` environment variable.

## Migrations

Database schema migrations are managed with **Knex** and run locally.  
Ensure your `.env` file contains a valid connection string:  `DATABASE_CONNECTION_STRING=<your-postgres-connection-string>`.
The `DATABASE_CONNECTION_STRING` is only required for Knex migrations, while the database URL and key are used by the API itself.


### Create 

```shell
npx knex migrate:make <migration-name>
```

A new migration file will be generated in the **./migrations** directory. Its name will be automatically prefixed with a timestamp.

### Apply Migrations

```shell
npx knex migrate:latest
```

### Roll Back the Last Migration

```shell
npx knex migrate:rollback
```

### Quick Troubleshooting

If Knex reports the migration directory is corrupt after renaming a file, check the `knex_migrations` table in your DB and update the name column to match the actual filename.

To reset migrations in a dev environment you can:

```shell
npx knex migrate:rollback --all
```
(If needed) remove the knex_migrations and knex_migrations_lock tables from the database
```shell
npx knex migrate:latest
```

## API Endpoints

| Type | Route                                                              | Description                                | Successful response                      |
|------|--------------------------------------------------------------------|--------------------------------------------|------------------------------------------|
| GET  | `/api/questions/` [🔗](http://localhost:8080/api/questions/)       | Get all questions                          | `QuestionsApiRes<Question[]>`            |
| GET  | `/api/questions/:id` [🔗](http://localhost:8080/api/questions/:id) | Get a specific question by ID (id: number) | `QuestionsApiRes<Question[]>`            |
| POST | `/api/answers`                                                     | Submit an answer for a question            | 200 `{ status: 'ok', correct: boolean }` |  
| POST | `/api/answers/stats`                                               | Get quiz results by user and session id    | `PlacementTestResults`                   |


### POST /api/answers

Request body example

```json
{  
  "sessionId": "31627082025",
  "token": "secret-token-here",
  "telegramUser": "user123",
  "questionId": 2,
  "answerId": 1
}
```

The API token is stored in the `API_TOKEN` environment variable when `NODE_ENV` is set to `production`.
In development mode (`NODE_ENV=development`), the app reads the token from the `API_TOKEN` field in the `.env` file located at the project root.

To set up your environment, create a `.env` file and fill in the variables listed in `.env.example`.

### POST /api/answers/stats

Request body example

```json
{  
  "sessionId": "31627082025",
  "token": "secret-token-here",
  "telegramUser": "user123"
}
```
