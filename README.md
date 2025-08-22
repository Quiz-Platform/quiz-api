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

| Type | Route | Description |
|------|-------|-------------|
| GET | `/api/questions/` | Get all questions |
| GET | `/api/questions/:id` | Get a specific question by ID (id: number) |
| POST | `/api/answers` | Submit an answer for a question (questionId: number, answerId: string) |
