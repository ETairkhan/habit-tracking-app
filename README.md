# HabitFlow - Приложение для отслеживания привычек

## Project Overview

HabitFlow - это полнофункциональное веб-приложение для отслеживания привычек, построенное на стеке Node.js + Express + MongoDB Atlas для бэкенда и React + Vite + TailwindCSS для фронтенда. Приложение реализует JWT-аутентификацию, ролевой доступ, валидацию данных и адаптивный интерфейс для управления личными привычками.

**Основные функции:**
- Управление привычками (создание, редактирование, удаление)
- Ежедневное отслеживание выполнения привычек
- Статистика и аналитика прогресса
- Email-уведомления и напоминания
- Админ-панель для управления пользователями
- Многопользовательская поддержка через MongoDB Atlas

**Database**: Uses **MongoDB Atlas** — a managed cloud database that supports multi-user collaboration and remote access.

### Folder Structure

- **`server`**: Node.js / Express API
- **`client`**: React + Vite frontend
- Root `package.json` lets you run both from the project root.

## Set up Instructions

### Требования
- Node.js 18.x или выше
- npm или yarn
- MongoDB Atlas (для продакшена) или локальная MongoDB

### Бэкенд установка

1. **Clone & install root tools**
   ```bash
   npm install
   ```

2. **Backend setup**
   ```bash
   cd server
   npm install
   ```

3. **Create `.env` in `server` with:**
   ```env
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secret-key
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173
   NODE_ENV=development
   
   # Опционально: для email-уведомлений
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   SMTP_FROM=noreply@habitflow.com
   ```

4. **Start backend**
   ```bash
   npm run dev  # для разработки
   npm start    # для продакшена
   ```

### Фронтенд установка

1. **Frontend setup**
   ```bash
   cd client
   npm install
   ```

2. **Create `.env` in `client` with:**
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start frontend**
   ```bash
   npm run dev
   ```

4. **Run both from root**
   ```bash
   npm run dev
   ```

Приложение будет доступно по адресу `http://localhost:5173`

## API Documentation

### Authentication

#### `POST /api/auth/register`
Регистрация нового пользователя

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "displayName": "Test User"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User"
  }
}
```

#### `POST /api/auth/login`
Вход пользователя

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User"
  }
}
```

### Users (Private, JWT Required)

#### `GET /api/users/profile`
Получить профиль текущего пользователя

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "role": "user",
    "stats": {
      "totalHabits": 5,
      "totalCheckins": 25,
      "overallSuccessRate": 80
    }
  }
}
```

#### `PUT /api/users/profile`
Обновить профиль пользователя

#### `GET /api/users/stats`
Получить агрегированную статистику (habits by category, by frequency, top category, overall success rate)

### Habits (Private, JWT Required)

#### `GET /api/habits`
Получить все привычки текущего пользователя

**Response (200):**
```json
{
  "habits": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "Утренняя зарядка",
      "description": "15 минут упражнений каждое утро",
      "category": "health",
      "frequency": "daily",
      "statistics": {
        "currentStreak": 7,
        "longestStreak": 15,
        "successRate": 85
      }
    }
  ]
}
```

#### `POST /api/habits`
Создать новую привычку

**Request Body:**
```json
{
  "name": "Чтение книг",
  "description": "Читать 30 минут каждый день",
  "category": "learning",
  "frequency": "daily"
}
```

#### `GET /api/habits/:id`
Получить детали привычки

#### `PUT /api/habits/:id`
Обновить привычку

#### `DELETE /api/habits/:id`
Удалить привычку

### Habit Checkins (Daily Tracking, Private, JWT Required)

#### `POST /api/habits/:habitId/checkins`
Отметить привычку как выполненную для конкретной даты

**Request Body:**
```json
{
  "date": "2024-01-15",
  "completed": true,
  "notes": "Отличная тренировка!"
}
```

#### `GET /api/habits/:habitId/checkins/stats`
Получить статистику по привычке (current streak, longest streak, success rate, last 30 days breakdown)

**Response (200):**
```json
{
  "statistics": {
    "currentStreak": 7,
    "longestStreak": 15,
    "successRate": 85,
    "totalCheckins": 30,
    "completedCheckins": 25,
    "last30Days": [
      { "date": "2024-01-01", "completed": true },
      { "date": "2024-01-02", "completed": false }
    ]
  }
}
```

#### `GET /api/habits/:habitId/checkins`
Получить отметки за период

#### `PUT /api/habits/:habitId/checkins/:checkinId`
Обновить отметку

#### `DELETE /api/habits/:habitId/checkins/:checkinId`
Удалить отметку

### Notifications (Email Reminders with SMTP, Private, JWT Required)

#### `POST /api/notifications/test`
Отправить тестовое email-уведомление текущему пользователю

#### `POST /api/notifications/weekly-preview`
Отправить еженедельный отчет со списком привычек пользователя

### Admin Routes (Admin Role Required, JWT Required)

#### `GET /api/admin/users`
Получить всех пользователей (только для админа)

#### `GET /api/admin/users-with-habits`
Получить всех пользователей с количеством привычек и деталями (только для админа)

#### `POST /api/admin/make-admin`
Повысить пользователя до роли админа (только для админа)

#### `POST /api/admin/remove-admin`
Понизить админа до обычного пользователя (только для админа)

#### `DELETE /api/admin/users/:userId`
Удалить пользователя и все связанные данные (только для админа)

#### `DELETE /api/admin/users/:userId/habits`
Удалить все привычки конкретного пользователя (только для админа)

### Database Models

- **User** — username, email, password, displayName, role, settings, stats
- **Habit** — name, description, category, frequency, user reference, statistics (currentStreak, longestStreak, successRate)
- **Checkin** — user, habit, date, completed flag, notes (for daily tracking)

## Screenshots of Features

### Главная страница - Дашборд привычек
*Описание: Основной экран приложения показывает все привычки пользователя с их текущим статусом, статистикой и возможностью быстрой отметки о выполнении.*

### Страница создания привычки
*Описание: Форма создания новой привычки с полями для названия, описания, выбора категории (здоровье, продуктивность, обучение, mindfulness, социальное, другое) и частоты выполнения.*

### Календарь отслеживания
*Описание: Календарный вид показывает историю выполнения привычек за месяц с цветовой индикацией успешных дней и возможностью добавления заметок.*

### Статистика и аналитика
*Описание: Детальная статистика по привычкам включает графики успешности, текущие и рекордные серии, а также анализ по категориям и частотам.*

### Профиль пользователя
*Описание: Страница профиля позволяет редактировать личные данные (email, username, displayName), просматривать общую статистику и настраивать email-уведомления.*

### Админ-панель
*Описание: Панель администратора для управления пользователями, просмотра статистики по всем пользователям, повышения/понижения ролей и удаления пользовательских данных.*

### Email-уведомления
*Описание: Пример email-уведомления с напоминанием о привычке и еженедельным отчетом о прогрессе. Поддерживаются SMTP сервисы Mailgun, SendGrid, Postmark.*

### Мобильная версия
*Описание: Адаптивный дизайн обеспечивает полноценную работу приложения на мобильных устройствах с сохранением всех функций.*

---

## Links

**GitHub Repository:** https://github.com/ETairkhan/habit-tracking-app

**Deployed Project:** https://habit-tracking-app-rama.onrender.com
