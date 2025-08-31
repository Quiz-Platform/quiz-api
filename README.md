# Quiz API

## Local build
```
npm i
```

```
npm run build
```

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

The app will run on 8080 port by default. The port can be defined by setting
the`PORT` environment variable.

The cache lifetime is 15 days by default and can be defined by setting the
`CACHE_LIFETIME` environment variable.

## API Endpoints

| Type | Route                                                              | Description                                |
|------|--------------------------------------------------------------------|--------------------------------------------|
| GET | `/api/questions/` [🔗](http://localhost:8080/api/questions/)       | Get all questions                          |
| GET | `/api/questions/:id` [🔗](http://localhost:8080/api/questions/:id) | Get a specific question by ID (id: number) |
| POST | `/api/answers`                                                     | Submit an answer for a question            |
| POST | `/api/answers/stats`                                               | Gen quiz results by user and session id    |


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
