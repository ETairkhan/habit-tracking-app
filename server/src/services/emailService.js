import nodemailer from "nodemailer";

let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.error("SMTP configuration is incomplete. Check .env file.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: SMTP_PORT === "465",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const mailTransporter = initializeTransporter();

    if (!mailTransporter) {
      throw new Error("Email service not configured properly");
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject,
      html: htmlContent,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendTestEmail = async (userEmail, userName) => {
  const subject = "HabitFlow - Test Notification";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Hello ${userName}! 👋</h1>
      <p style="color: #666; font-size: 16px;">
        This is a test email from <strong>HabitFlow</strong>.
      </p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="color: #333; margin: 0;">
          <strong>Example Reminder:</strong> Don't forget to complete your daily habits! 
          Keep up the great work! 🎯
        </p>
      </div>
      <p style="color: #999; font-size: 12px;">
        You received this email because you requested a test notification from HabitFlow.
      </p>
    </div>
  `;

  return sendEmail(userEmail, subject, htmlContent);
};

export const sendWeeklyReport = async (userEmail, userName, habits) => {
  const habitList = habits
    .map(
      (habit) => `
    <li style="margin: 8px 0; color: #333;">
      <strong>${habit.name}</strong> (${habit.frequency}) - Success Rate: ${habit.successRate || 0}%
    </li>
  `
    )
    .join("");

  const subject = "HabitFlow - Your Weekly Report";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Your Weekly Habit Report 📊</h1>
      <p style="color: #666; font-size: 16px;">
        Hi ${userName},
      </p>
      <p style="color: #666; font-size: 16px;">
        You have <strong>${habits.length}</strong> active habit(s) this week. Here's your list:
      </p>
      <ul style="background-color: #f9f9f9; padding: 20px 40px; border-radius: 5px; border-left: 4px solid #4CAF50;">
        ${habitList || '<li style="color: #999;">No habits yet</li>'}
      </ul>
      <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-radius: 5px;">
        <p style="color: #2e7d32; margin: 0;">
          Keep tracking your habits consistently to achieve your goals! 🚀
        </p>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 20px;">
        Report generated on ${new Date().toLocaleDateString()}
      </p>
    </div>
  `;

  return sendEmail(userEmail, subject, htmlContent);
};
