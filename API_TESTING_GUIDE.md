# HabitFlow API Testing Guide - Email & Admin Features

This guide provides curl commands to test the newly implemented SMTP email notifications and admin features.

## Prerequisites

1. Ensure server is running: `npm run dev`
2. Have a valid JWT token (get one by logging in)
3. SMTP credentials configured in `.env`

## 🔐 Authentication Token

First, register or login to get a token:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "password123"
  }'
```

Response includes:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "role": "user" }
}
```

**Store the token for subsequent requests:**

```bash
TOKEN="your-jwt-token-here"
```

---

## 📧 Email Notifications (SMTP)

### 1. Send Test Email

Sends a test reminder email to the current user.

```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "message": "Test notification sent successfully",
  "email": "test@example.com"
}
```

**What happens:**

- Email subject: "HabitFlow - Test Notification"
- Contains: Greeting, example reminder text, and contact info
- Sent to user's registered email

---

### 2. Send Weekly Habit Report

Generates and sends a weekly report with all user's habits.

```bash
curl -X POST http://localhost:5000/api/notifications/weekly-preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "message": "Weekly report sent successfully",
  "habitCount": 5,
  "email": "test@example.com"
}
```

**Email content includes:**

- Total habit count
- List of all habits with:
  - Habit name
  - Frequency (daily/weekly/custom)
  - Success rate percentage
- Motivational message
- Report generation date

---

## 🛡️ Admin Features (RBAC)

All admin routes require:

- Valid JWT token
- User role = "admin"

### 1. Get All Users

List all registered users (without passwords).

```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**

```json
{
  "message": "Users retrieved successfully",
  "count": 3,
  "users": [
    {
      "_id": "...",
      "username": "john",
      "email": "john@example.com",
      "role": "user",
      "displayName": "John Doe",
      "createdAt": "2026-02-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Users with Habit Details

List all users with their habits and habit counts.

```bash
curl -X GET http://localhost:5000/api/admin/users-with-habits \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**

```json
{
  "message": "Users with habits retrieved successfully",
  "count": 3,
  "users": [
    {
      "_id": "...",
      "username": "john",
      "email": "john@example.com",
      "role": "user",
      "habitCount": 3,
      "habits": [
        {
          "id": "...",
          "name": "Morning Run",
          "frequency": "daily",
          "successRate": 85
        },
        {
          "id": "...",
          "name": "Read",
          "frequency": "daily",
          "successRate": 70
        }
      ]
    }
  ]
}
```

---

### 3. Promote User to Admin

Make a regular user an admin.

```bash
curl -X POST http://localhost:5000/api/admin/make-admin \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE"
  }'
```

**Response:**

```json
{
  "message": "User john has been promoted to admin",
  "user": {
    "id": "...",
    "username": "john",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Error cases:**

- 400: User already admin
- 404: User not found
- 403: You don't have admin role

---

### 4. Downgrade Admin to Regular User

Remove admin role from an admin user.

```bash
curl -X POST http://localhost:5000/api/admin/remove-admin \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE"
  }'
```

**Response:**

```json
{
  "message": "User john has been downgraded from admin",
  "user": {
    "id": "...",
    "username": "john",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### 5. Delete a User (and all their data)

Permanently delete a user and cascade delete:

- All their habits
- All their checkins

```bash
curl -X DELETE http://localhost:5000/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**

```json
{
  "message": "User john and all associated data deleted successfully",
  "deletedUser": {
    "id": "...",
    "username": "john",
    "email": "john@example.com"
  },
  "deletedHabits": 3
}
```

**Warning:** This action is permanent!

---

### 6. Delete All Habits for a User

Delete all habits for a specific user (keeps user account).

```bash
curl -X DELETE http://localhost:5000/api/admin/users/USER_ID_HERE/habits \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**

```json
{
  "message": "All habits for user john deleted successfully",
  "deletedHabits": 3,
  "habitsIds": ["habitId1", "habitId2", "habitId3"]
}
```

---

## 🔧 SMTP Configuration Examples

### Mailgun Setup

1. Sign up at https://www.mailgun.com/
2. Create account and verify domain
3. Get credentials from Domain Settings > SMTP credentials

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@sandbox123.mailgun.org
SMTP_PASS=your-password-here
SMTP_FROM=noreply@habitflow.com
```

### SendGrid Setup

1. Sign up at https://sendgrid.com/
2. Create API key
3. Use the key with SendGrid SMTP

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key-here
SMTP_FROM=noreply@habitflow.com
```

### Gmail Setup

1. Enable 2-Step Verification on Google Account
2. Generate App Password
3. Use Gmail SMTP

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=your-email@gmail.com
```

---

## 📝 Testing Workflow

### Complete Admin Demo

```bash
# 1. Login as regular user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"john","password":"pass123"}' | jq -r '.token')

# 2. Send test email
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer $TOKEN"

# 3. Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin","password":"pass123"}' | jq -r '.token')

# 4. View all users
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 5. View users with habits
curl -X GET http://localhost:5000/api/admin/users-with-habits \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 6. Make someone admin
curl -X POST http://localhost:5000/api/admin/make-admin \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"john-id"}' | jq
```

---

## ⚠️ Error Responses

### Unauthorized (Missing Token)

```json
{ "message": "Authorization header missing" }
```

Status: 401

### Forbidden (Insufficient Role)

```json
{ "message": "Forbidden: insufficient role" }
```

Status: 403

### Not Found

```json
{ "message": "User not found" }
```

Status: 404

### Email Service Error

```json
{ "message": "Email service not configured properly" }
```

Status: 500 (Check .env SMTP variables)

---

## 📦 Implementation Details

### Email Service (`server/src/services/emailService.js`)

- Singleton pattern for transporter
- HTML email templates
- Error handling and logging
- Support for multiple SMTP providers

### Notification Controller (`server/src/controllers/notificationController.js`)

- `sendTestNotification` - Test email endpoint
- `sendWeeklyPreview` - Weekly report endpoint
- Automatic user lookup and email retrieval

### Admin Controller (`server/src/controllers/adminController.js`)

- User management (view, promote/demote, delete)
- Cascade deletion (user → habits → checkins)
- Complete RBAC enforcement

### Middleware (`server/src/middleware/auth.js`)

- `authMiddleware` - JWT verification
- `requireRole(["admin"])` - Role-based access control

---

## 🚀 Next Steps

1. **Configure SMTP**: Add credentials to `.env`
2. **Install Nodemailer**: `npm install` in server directory
3. **Create admin user**: Manually set role to "admin" in MongoDB or use the app
4. **Test endpoints**: Use curl commands above
5. **Integrate with frontend**: Call `/api/notifications/` endpoints from React
