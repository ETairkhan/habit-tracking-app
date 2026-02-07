# HabitFlow API Documentation

## Server Setup

1. Убедитесь, что `server/.env` содержит корректный `MONGODB_URI` (получите из MongoDB Atlas).
2. Запустите сервер: `npm start` или `node src/server.js`
3. Сервер запустится на `http://localhost:5000`

## API Endpoints

### Authentication (Публичные)

#### Регистрация
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}

Response (201):
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "displayName": "John Doe"
  }
}
```

#### Вход
```
POST /api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john_doe",
  "password": "password123"
}

Response (200):
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "displayName": "John Doe"
  }
}
```

---

### Users (Private, требует JWT в заголовке `Authorization: Bearer <token>`)

#### Получить профиль
```
GET /api/users/profile
Authorization: Bearer <token>

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "displayName": "John Doe",
  "avatar": "default-avatar.png",
  "role": "user",
  "settings": {
    "emailNotifications": true,
    "timezone": "UTC",
    "dailyReminderTime": "09:00",
    "weekStartsOn": "monday"
  },
  "stats": {
    "totalHabits": 5,
    "totalCheckins": 25,
    "currentStreak": 3,
    "longestStreak": 10,
    "successRate": 80
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-20T15:30:00.000Z"
}
```

#### Обновить профиль
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "username": "john_new",
  "displayName": "John New Name"
}

Response (200): Updated user object
```

#### Получить статистику пользователя
```
GET /api/users/stats
Authorization: Bearer <token>

Response (200):
{
  "userId": "507f1f77bcf86cd799439011",
  "totalHabits": 5,
  "totalCheckins": 25,
  "totalCompletedCheckins": 20,
  "overallSuccessRate": 80,
  "habitsByCategory": [
    {
      "category": "health",
      "count": 2,
      "habits": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Morning Jog",
          "successRate": 85,
          "currentStreak": 5
        }
      ]
    },
    {
      "category": "productivity",
      "count": 2,
      "habits": [...]
    }
  ],
  "habitsByFrequency": [
    { "frequency": "daily", "count": 4 },
    { "frequency": "weekly", "count": 1 }
  ],
  "topCategory": {
    "category": "health",
    "count": 2
  },
  "avgHabitsPerCategory": 1.7,
  "topHabits": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Morning Jog",
      "successRate": 85,
      "currentStreak": 5,
      "longestStreak": 15
    }
  ]
}
```

---

### Habits (Private, требует JWT)

#### Создать новую привычку
```
POST /api/habits
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Morning Jog",
  "description": "30 minute jog every morning",
  "category": "health",
  "frequency": "daily",
  "colorCode": "#4CAF50",
  "icon": "running",
  "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"],
  "targetValue": 30,
  "unit": "minutes"
}

Response (201):
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Morning Jog",
  "description": "30 minute jog every morning",
  "category": "health",
  "frequency": "daily",
  "colorCode": "#4CAF50",
  "icon": "running",
  "user": "507f1f77bcf86cd799439011",
  "currentStreak": 0,
  "longestStreak": 0,
  "totalCompleted": 0,
  "successRate": 0,
  "startDate": "2024-01-20T10:00:00.000Z",
  "createdAt": "2024-01-20T10:00:00.000Z",
  "updatedAt": "2024-01-20T10:00:00.000Z"
}
```

#### Список всех привычек
```
GET /api/habits
Authorization: Bearer <token>

Response (200): Array of habit objects
```

#### Получить привычку по ID
```
GET /api/habits/:id
Authorization: Bearer <token>

Response (200): Habit object
```

#### Обновить привычку
```
PUT /api/habits/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Morning Jog Updated",
  "frequency": "daily",
  "category": "health"
}

Response (200): Updated habit object
```

#### Удалить привычку
```
DELETE /api/habits/:id
Authorization: Bearer <token>

Response (204): No content
```

---

### Habit Checkins (Частичная отметка о выполнении привычки)

#### Отметить привычку выполненной на конкретный день
```
POST /api/habits/:habitId/checkins
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-20",
  "completed": true,
  "notes": "Great morning jog, felt energized"
}

Response (201):
{
  "_id": "507f1f77bcf86cd799439013",
  "user": "507f1f77bcf86cd799439011",
  "habit": "507f1f77bcf86cd799439012",
  "date": "2024-01-20T00:00:00.000Z",
  "completed": true,
  "notes": "Great morning jog, felt energized",
  "createdAt": "2024-01-20T10:00:00.000Z",
  "updatedAt": "2024-01-20T10:00:00.000Z"
}
```

#### Получить статистику привычки
```
GET /api/habits/:habitId/checkins/stats
Authorization: Bearer <token>

Response (200):
{
  "habitId": "507f1f77bcf86cd799439012",
  "habitName": "Morning Jog",
  "category": "health",
  "frequency": "daily",
  "totalCheckins": 15,
  "completedCheckins": 12,
  "successRate": 80,
  "currentStreak": 3,
  "longestStreak": 7,
  "lastCheckinDate": "2024-01-20T00:00:00.000Z",
  "last30Days": {
    "2024-01-20": { "completed": true, "notes": "Great jog" },
    "2024-01-19": { "completed": true, "notes": null },
    "2024-01-18": { "completed": false, "notes": "Rainy day" },
    ...
  },
  "recentCheckins": [...]
}
```

#### Получить чекины за диапазон дат
```
GET /api/habits/:habitId/checkins?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>

Response (200): Array of checkin objects
```

#### Обновить чекин
```
PUT /api/habits/:habitId/checkins/:checkinId
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": false,
  "notes": "Updated: Couldn't jog today"
}

Response (200): Updated checkin object
```

#### Удалить чекин
```
DELETE /api/habits/:habitId/checkins/:checkinId
Authorization: Bearer <token>

Response (204): No content
```

---

## Примеры Workflow

### 1. Регистрация и создание привычки

```bash
# 1. Регистрация
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"alice",
    "email":"alice@example.com",
    "password":"securepass123"
  }'

# Скопируйте token из ответа
TOKEN="eyJhbGc..."

# 2. Создание привычки
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Read 30 minutes",
    "category":"learning",
    "frequency":"daily"
  }'

# Скопируйте habitId из ответа
HABIT_ID="507f1f77bcf86cd799439012"

# 3. Отметить привычку выполненной
curl -X POST http://localhost:5000/api/habits/$HABIT_ID/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date":"2024-01-20",
    "completed":true,
    "notes":"Read fantasy novel"
  }'

# 4. Получить статистику привычки
curl -X GET http://localhost:5000/api/habits/$HABIT_ID/checkins/stats \
  -H "Authorization: Bearer $TOKEN"

# 5. Получить общую статистику пользователя
curl -X GET http://localhost:5000/api/users/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## Database Collections

### Users
- username (string, unique)
- email (string, unique)
- password (string, hashed)
- displayName (string)
- avatar (string)
- role (enum: user, premium, admin)
- settings (object)
- stats (object)
- timestamps

### Habits
- name (string, required)
- description (string)
- category (enum: health, productivity, learning, mindfulness, social, other)
- frequency (enum: daily, weekly, custom)
- daysOfWeek (array of strings)
- colorCode (string)
- icon (string)
- targetValue, unit (for tracking quantity)
- user (ref to User)
- currentStreak, longestStreak (number)
- totalCompleted, successRate (number)
- startDate, endDate (dates)
- timestamps

### Checkins
- user (ref to User)
- habit (ref to Habit)
- date (date)
- completed (boolean)
- notes (string)
- timestamps

---

## Key Statistics Explained

- **Success Rate**: (completedCheckins / totalCheckins) × 100%
- **Current Streak**: Current consecutive days habit was completed
- **Longest Streak**: Longest consecutive days habit was completed
- **Top Category**: Category with most habits
- **Avg per Category**: Average habits per category
