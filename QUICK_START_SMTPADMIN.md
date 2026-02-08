# 🚀 Quick Start Guide - Email & Admin Features

## 5-Minute Setup

### 1. Install Nodemailer

```bash
cd server
npm install
```

### 2. Choose SMTP Provider & Get Credentials

**Option A: Mailgun (Free Tier)**

1. Go to https://www.mailgun.com/
2. Sign up and verify
3. Get credentials from Dashboard > Sending > Domain Settings
4. Copy: SMTP Host, SMTP User, SMTP Pass

**Option B: SendGrid (Free Tier)**

1. Go to https://sendgrid.com/
2. Sign up
3. Create API key
4. Use `apikey` as SMTP_USER and API key as SMTP_PASS

**Option C: Gmail**

1. Enable 2-Step Verification on Google Account
2. Generate "App Password"
3. Use Gmail address and app password

### 3. Configure .env

```bash
# Edit server/.env
SMTP_HOST=smtp.mailgun.org          # or smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=postmaster@sandbox123...  # or apikey
SMTP_PASS=your-password-here
SMTP_FROM=noreply@habitflow.com
```

### 4. Create Admin User

```bash
# Option: Open MongoDB Compass or shell and run:
db.users.updateOne(
  { username: "your-username" },
  { $set: { role: "admin" } }
)
```

### 5. Start Server & Test

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2 - Get token from login, then:
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Available Endpoints

### 📧 Email Notifications

| Method | Endpoint                            | Description              |
| ------ | ----------------------------------- | ------------------------ |
| POST   | `/api/notifications/test`           | Send test email          |
| POST   | `/api/notifications/weekly-preview` | Send weekly habit report |

### 🛡️ Admin Management

| Method | Endpoint                          | Description            |
| ------ | --------------------------------- | ---------------------- |
| GET    | `/api/admin/users`                | List all users         |
| GET    | `/api/admin/users-with-habits`    | List users with habits |
| POST   | `/api/admin/make-admin`           | Promote user to admin  |
| POST   | `/api/admin/remove-admin`         | Downgrade admin        |
| DELETE | `/api/admin/users/:userId`        | Delete user & data     |
| DELETE | `/api/admin/users/:userId/habits` | Delete user's habits   |

---

## Quick Test Commands

```bash
# Set your token
TOKEN="your-jwt-token"

# Send test email
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer $TOKEN"

# Send weekly report
curl -X POST http://localhost:5000/api/notifications/weekly-preview \
  -H "Authorization: Bearer $TOKEN"

# Get all users (admin only)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Make someone admin
curl -X POST http://localhost:5000/api/admin/make-admin \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id"}'
```

---

## Documentation

- **[README.md](README.md)** - Full project overview
- **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - Detailed testing with curl
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was implemented
- **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** - Complete checklist

---

## Troubleshooting

### Email not sending?

✓ Check SMTP credentials in .env  
✓ Verify email provider account is active  
✓ Check spam folder  
✓ Look at server logs for error messages

### Admin endpoints return 403?

✓ Make sure user role is "admin" in database  
✓ Verify JWT token is valid  
✓ Check Authorization header format: `Bearer TOKEN`

### Module not found error?

✓ Run `npm install` in server directory  
✓ Make sure nodemailer was installed  
✓ Check import statements match file names

---

## Files Created/Modified

### New Files

- `server/src/services/emailService.js`
- `server/src/controllers/notificationController.js`
- `server/src/routes/notificationRoutes.js`
- `server/src/controllers/adminController.js`
- `server/src/routes/adminRoutes.js`
- `API_TESTING_GUIDE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `VERIFICATION_CHECKLIST.md`

### Modified Files

- `server/package.json` (added nodemailer)
- `server/src/app.js` (added routes)
- `server/.env` (added SMTP config)
- `README.md` (added documentation)

---

**Status**: ✅ Ready to use!  
**All mandatory tasks completed**: Email notifications + Admin features + RBAC
