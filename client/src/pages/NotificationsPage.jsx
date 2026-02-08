import React, { useState } from "react";
import { notificationAPI } from "../apiClient.js";

const NotificationsPage = () => {
  const [testLoading, setTestLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSendTestEmail = async () => {
    setTestLoading(true);
    try {
      const response = await notificationAPI.sendTestNotification();
      showMessage(
        `✅ Тестовое письмо отправлено на ${response.data.email}`,
        "success"
      );
    } catch (error) {
      showMessage(
        `❌ Ошибка: ${error.response?.data?.message || "Не удалось отправить письмо"}`,
        "error"
      );
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendWeeklyReport = async () => {
    setWeeklyLoading(true);
    try {
      const response = await notificationAPI.sendWeeklyPreview();
      showMessage(
        `✅ Еженедельный отчет (${response.data.habitCount} привычек) отправлен на ${response.data.email}`,
        "success"
      );
    } catch (error) {
      showMessage(
        `❌ Ошибка: ${error.response?.data?.message || "Не удалось отправить письмо"}`,
        "error"
      );
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
            📧 Уведомления
          </h1>
          <p className="text-slate-400">
            Отправляйте себе напоминания и еженедельные отчеты о ваших привычках прямо на почту
          </p>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`mb-6 rounded-lg px-6 py-4 transition-all ${
              messageType === "success"
                ? "bg-emerald-900/40 border border-emerald-500/50 text-emerald-200"
                : "bg-red-900/40 border border-red-500/50 text-red-200"
            }`}
            role="alert"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Email Card */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-lg hover:border-slate-700 transition-colors">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-3xl">🧪</span>
              <h2 className="text-2xl font-bold text-slate-100">
                Тестовое письмо
              </h2>
            </div>

            <p className="mb-6 text-slate-400 leading-relaxed">
              Проверьте, что email уведомления работают корректно. Вы получите пример напоминания о ваших привычках.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span className="text-sm text-slate-300">
                  Приветственное сообщение с примером напоминания
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span className="text-sm text-slate-300">
                  Красивое форматирование письма
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span className="text-sm text-slate-300">
                  Мгновенная доставка
                </span>
              </div>
            </div>

            <button
              onClick={handleSendTestEmail}
              disabled={testLoading}
              className={`w-full rounded-lg px-6 py-3 font-semibold text-white transition-all ${
                testLoading
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg hover:shadow-emerald-500/50"
              }`}
              aria-label="Send test email notification"
            >
              {testLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600"></span>
                  Отправка...
                </span>
              ) : (
                "Отправить тестовое письмо"
              )}
            </button>
          </div>

          {/* Weekly Report Card */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-lg hover:border-slate-700 transition-colors">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <h2 className="text-2xl font-bold text-slate-100">
                Еженедельный отчет
              </h2>
            </div>

            <p className="mb-6 text-slate-400 leading-relaxed">
              Получите подробный отчет о всех ваших привычках с информацией о процценте успешного выполнения.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span className="text-sm text-slate-300">
                  Полный список всех активных привычек
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span className="text-sm text-slate-300">
                  Процент успешного выполнения для каждой привычки
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span className="text-sm text-slate-300">
                  Мотивирующее сообщение для продолжения результатов
                </span>
              </div>
            </div>

            <button
              onClick={handleSendWeeklyReport}
              disabled={weeklyLoading}
              className={`w-full rounded-lg px-6 py-3 font-semibold text-white transition-all ${
                weeklyLoading
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg hover:shadow-blue-500/50"
              }`}
              aria-label="Send weekly report email notification"
            >
              {weeklyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></span>
                  Отправка...
                </span>
              ) : (
                "Отправить еженедельный отчет"
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-lg border border-slate-800/50 bg-slate-900/30 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">
            💡 Полезные советы
          </h3>
          <ul className="space-y-3 text-slate-400 text-sm">
            <li className="flex gap-3">
              <span className="text-emerald-400 flex-shrink-0">•</span>
              <span>
                Проверьте папку "Спам" (Junk), если письма не появляются в основной папке
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 flex-shrink-0">•</span>
              <span>
                Добавьте адрес отправителя в контакты, чтобы письма всегда приходили в основную папку
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 flex-shrink-0">•</span>
              <span>
                Письма отправляются мгновенно на адрес, указанный в вашем профиле
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 flex-shrink-0">•</span>
              <span>
                Для еженедельного отчета нужно создать хотя бы одну привычку
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
