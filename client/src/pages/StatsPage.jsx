import React, { useEffect, useState } from "react";
import { apiClient } from "../apiClient.js";

const StatsPage = () => {
  const [daysStats, setDaysStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // 7, 30, 90

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Получить статистику по дням
      const days = parseInt(selectedPeriod);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dayRes = await apiClient.get("/users/stats/days", {
        params: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      });

      setDaysStats(dayRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Ошибка при загрузке статистики"
      );
      console.error("Stats error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      1: "😞",
      2: "😕",
      3: "😐",
      4: "🙂",
      5: "😄",
    };
    return moods[mood] || "😐";
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading-state">
          <p>Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (!daysStats) {
    return (
      <div className="page">
        <div className="empty-state-container">
          <p>Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  const summary = daysStats.summary || {};
  const dailyStats = daysStats.dailyStats || [];
  const bestDay = daysStats.bestDay || null;

  // Count days with completed habits
  const completedDays = dailyStats.filter((d) => d.completedHabits > 0).length;
  const avgSuccessRate = dailyStats.length > 0
    ? Math.round(
        dailyStats.reduce((sum, d) => sum + (d.successRate || 0), 0) /
          dailyStats.length
      )
    : 0;
  const totalCheckIns = dailyStats.reduce(
    (sum, d) => sum + (d.completedHabits || 0),
    0
  );

  return (
    <div className="page">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <div className="page-header">
        <h1>📊 Статистика по дням</h1>
        <div className="period-selector">
          {["7", "30", "90"].map((period) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? "active" : ""}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period} дней
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card-large">
          <div className="stat-label">Дней отслежено</div>
          <div className="stat-value">{dailyStats.length}</div>
        </div>

        <div className="stat-card-large">
          <div className="stat-label">Дней с выполненными привычками</div>
          <div className="stat-value">{completedDays}</div>
        </div>

        <div className="stat-card-large">
          <div className="stat-label">Всего check-in</div>
          <div className="stat-value check-in-count">{totalCheckIns}</div>
        </div>

        <div className="stat-card-large">
          <div className="stat-label">Средний процент выполнения</div>
          <div className="stat-value success-rate">{avgSuccessRate}%</div>
        </div>
      </div>

      {/* Best Day Highlight */}
      {bestDay && (
        <div className="best-day-card">
          <div className="best-day-emoji">🏆</div>
          <div className="best-day-content">
            <h3>Лучший день</h3>
            <p className="best-day-date">
              {new Date(bestDay.date).toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <div className="best-day-stats">
              <span>{bestDay.completedHabits} привычек выполнено</span>
              <span>{Math.round(bestDay.successRate)}% успеха</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily History */}
      <div className="daily-history">
        <h2>История дней</h2>
        {dailyStats.length > 0 ? (
          <div className="history-table">
            {dailyStats
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((day) => (
                <div key={day.date} className="history-row">
                  <div className="history-date">
                    <div className="date-number">
                      {new Date(day.date).getDate()}
                    </div>
                    <div className="date-info">
                      <div className="day-of-week">
                        {new Date(day.date).toLocaleDateString("ru-RU", {
                          weekday: "short",
                        })}
                      </div>
                      <div className="month-year">
                        {new Date(day.date).toLocaleDateString("ru-RU", {
                          month: "short",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="history-mood">
                    <span className="mood-emoji">
                      {getMoodEmoji(day.mood)}
                    </span>
                  </div>

                  <div className="history-completion">
                    <div className="completion-text">
                      {day.completedHabits}/{day.totalHabits} привычек
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${day.successRate || 0}%`,
                        }}
                      />
                    </div>
                    <div className="percent-text">
                      {Math.round(day.successRate || 0)}%
                    </div>
                  </div>

                  <div className="history-energy">
                    <div className="energy-label">Энергия</div>
                    <div className="energy-bar">
                      <div
                        className="energy-fill"
                        style={{
                          width: `${(day.energy / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="history-status">
                    {day.status === "completed" ? (
                      <span className="badge completed">✓ Закрыт</span>
                    ) : (
                      <span className="badge in-progress">◆ В процессе</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-state-container">
            <p>Нет дней для отображения в этом периоде</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
