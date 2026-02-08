import React, { useState, useEffect } from "react";
import { dayAPI, habitAPI } from "../apiClient.js";
import "../styles.css";

const DaysPage = () => {
  const [days, setDays] = useState([]);
  const [habits, setHabits] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseReport, setShowCloseReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [newDayForm, setNewDayForm] = useState({
    date: new Date().toISOString().split("T")[0],
    dayNotes: "",
    mood: 3,
    energy: 3,
    habits: [],
    tags: "",
  });

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  useEffect(() => {
    if (days.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayData = days.find((d) => d.date === todayStr);
      if (todayData && todayData.day && !selectedDay) {
        setSelectedDay(todayData.day);
      }
    }
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const daysResponse = await dayAPI.getMonthly(year, month);
      console.log("Days Response:", daysResponse.data);
      setDays(daysResponse.data.days || []);

      const habitsResponse = await habitAPI.getAll();
      console.log("Habits Response:", habitsResponse.data);
      setHabits(habitsResponse.data || []);
    } catch (error) {
      console.error("Load error:", error);
      showToast("Ошибка загрузки", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateDay = async (e) => {
    e.preventDefault();
    
    // Проверяем, выбрана ли хотя бы одна привычка
    if (newDayForm.habits.length === 0) {
      showToast("Выберите хотя бы одну привычку", "error");
      return;
    }
    
    try {
      setIsSavingDay(true);
      showToast("💾 Сохраняется...", "info");
      
      // Ensure date is in YYYY-MM-DD format for UTC consistency
      let dateStr = newDayForm.date;
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }

      const dayData = {
        date: dateStr,
        dayNotes: newDayForm.dayNotes,
        mood: parseInt(newDayForm.mood),
        energy: parseInt(newDayForm.energy),
        habits: newDayForm.habits,
        tags: newDayForm.tags.split(",").map((t) => t.trim()).filter((t) => t),
      };

      let response;
      if (isEditingDay && selectedDay) {
        // Обновляем существующий день
        response = await dayAPI.update(selectedDay._id, dayData);
        showToast("✅ День обновлён успешно!", "success");
      } else {
        // Создаём новый день
        response = await dayAPI.create(dayData);
        showToast("✅ День создан успешно!", "success");
      }

      setShowCreateModal(false);
      setIsEditingDay(false);
      setNewDayForm({
        date: new Date().toISOString().split("T")[0],
        dayNotes: "",
        mood: 3,
        energy: 3,
        habits: [],
        tags: "",
      });
      loadData();
    } catch (error) {
      console.error("Create/Update error:", error);
      showToast("❌ Ошибка при сохранении дня", "error");
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleCompleteDay = async () => {
    try {
      await dayAPI.update(selectedDay._id, { status: "completed" });
      showToast("День завершён!", "success");
      setShowCloseReport(false);
      setSelectedDay(null);
      loadData();
    } catch (error) {
      console.error("Complete error:", error);
      showToast("Ошибка завершения дня", "error");
    }
  };

  const handleToggleHabitCompletion = async (habitId) => {
    try {
      const habit = selectedDay.habits.find((h) => h.habit._id.toString() === habitId.toString());
      if (!habit) {
        showToast("Привычка не найдена", "error");
        return;
      }
      
      await dayAPI.checkHabit(selectedDay._id, habitId, {
        completed: !habit.completed,
      });
      
      // Обновляем локальное состояние без полной перезагрузки
      const updatedSelectedDay = {
        ...selectedDay,
        habits: selectedDay.habits.map((h) => {
          if (h.habit._id.toString() === habitId.toString()) {
            return {
              ...h,
              completed: !h.completed,
            };
          }
          return h;
        }),
        completedHabits: habit.completed 
          ? selectedDay.completedHabits - 1 
          : selectedDay.completedHabits + 1,
      };
      
      setSelectedDay(updatedSelectedDay);
      showToast(habit.completed ? "Привычка отмечена как невыполненная" : "Привычка выполнена!", "success");
    } catch (error) {
      console.error("Toggle error:", error);
      showToast("Ошибка при обновлении привычки", "error");
    }
  };

  const handleAddHabitToDay = async (habitId) => {
    try {
      await dayAPI.addHabit(selectedDay._id, habitId);
      showToast("Привычка добавлена!", "success");
      // Полностью перезагружаем данные
      loadData();
    } catch (error) {
      console.error("Add error:", error);
      showToast("Ошибка при добавлении привычки", "error");
    }
  };

  const handleRemoveHabitFromDay = async (habitId) => {
    try {
      await dayAPI.removeHabit(selectedDay._id, habitId);
      showToast("Привычка удалена!", "success");
      // Обновляем локальное состояние
      const updatedSelectedDay = {
        ...selectedDay,
        habits: selectedDay.habits.filter((h) => h.habit._id.toString() !== habitId.toString()),
        totalHabits: selectedDay.totalHabits - 1,
      };
      setSelectedDay(updatedSelectedDay);
    } catch (error) {
      console.error("Remove error:", error);
      showToast("Ошибка при удалении привычки", "error");
    }
  };

  const handleDeleteDay = async () => {
    if (confirm("Вы уверены?")) {
      try {
        await dayAPI.delete(selectedDay._id);
        setSelectedDay(null);
        loadData();
        showToast("День удалён!", "success");
      } catch (error) {
        console.error("Delete error:", error);
        showToast("Ошибка при удалении дня", "error");
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const getMoodEmoji = (mood) => {
    const moods = { 1: "😢", 2: "😕", 3: "😐", 4: "😊", 5: "😄" };
    return moods[mood] || "😐";
  };

  const getHabitIcon = (icon) => {
    if (!icon || icon === "default-icon") return "🎯";
    return icon;
  };

  const handleCalendarDayClick = (dayData) => {
    const hasDay = dayData.day !== null;
    if (hasDay) {
      setSelectedDay(dayData.day);
    } else {
      // dayData.date уже в формате YYYY-MM-DD
      setNewDayForm({
        date: dayData.date,
        dayNotes: "",
        mood: 3,
        energy: 3,
        habits: [],
        tags: "",
      });
      setShowCreateModal(true);
    }
  };

  // Функция для добавления привычек к существующему дню
  const handleShowAddHabitsModal = () => {
    if (!selectedDay) return;
    const selectedHabitIds = selectedDay.habits.map(h => h.habit._id);
    setNewDayForm({
      date: selectedDay.date,
      dayNotes: selectedDay.dayNotes || "",
      mood: selectedDay.mood || 3,
      energy: selectedDay.energy || 3,
      habits: selectedHabitIds,
      tags: selectedDay.tags?.join(", ") || "",
    });
    setIsEditingDay(true);
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin mb-4 text-4xl">⏳</div>
          <p className="text-slate-600 text-lg">Загрузка дней...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>📅 Дни</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setIsEditingDay(false);
            setNewDayForm({
              date: new Date().toISOString().split("T")[0],
              dayNotes: "",
              mood: 3,
              energy: 3,
              habits: [],
              tags: "",
            });
            setShowCreateModal(true);
          }}
        >
          ➕ Новый день
        </button>
      </div>

      <div className="days-layout">
        <div className="calendar-section">
          <div className="calendar-nav">
            <button onClick={handlePrevMonth} className="btn btn-secondary">
              ←
            </button>
            <h2>{monthName}</h2>
            <button onClick={handleNextMonth} className="btn btn-secondary">
              →
            </button>
          </div>

          <div className="calendar-grid">
            {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((day) => (
              <div key={day} className="calendar-header">{day}</div>
            ))}
            {days && days.length > 0 ? (
              days.map((dayData, index) => {
                const hasDay = dayData.day !== null;
                // Парсим дату как UTC дату
                const [year, month, day] = dayData.date.split('-').map(Number);
                const dayDate = new Date(Date.UTC(year, month - 1, day));
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const compareDate = new Date(dayDate);
                compareDate.setHours(0, 0, 0, 0);
                
                const isToday = compareDate.getTime() === today.getTime();
                const isSelected = selectedDay && selectedDay.date === dayData.date;

                return (
                  <div
                    key={index}
                    onClick={() => handleCalendarDayClick(dayData)}
                    className={`calendar-day-small ${hasDay ? "has-day" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  >
                    <div className="day-number">{dayDate.getUTCDate()}</div>
                    {hasDay && (
                      <div className="day-mark">
                        <span className="mood">{getMoodEmoji(dayData.day.mood)}</span>
                        <span className="percent">{dayData.day.totalHabits > 0 ? Math.round((dayData.day.completedHabits / dayData.day.totalHabits) * 100) : 0}%</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "1rem", color: "#64748b" }}>
                Нет дней в этом месяце
              </div>
            )}
          </div>
        </div>

        <div className="day-section">
          {selectedDay ? (
            <div className="day-detail">
              <h2>
                {(() => {
                  // Получаем дату в формате YYYY-MM-DD из ISO строки
                  const dateStr = selectedDay.date.split('T')[0];
                  // Парсим дату как UTC
                  const [year, month, day] = dateStr.split('-');
                  // Форматируем в DD.MM.YYYY без преобразования часовых поясов
                  return `${day}.${month}.${year}`;
                })()}
              </h2>
              <p>Привычки: {selectedDay.completedHabits}/{selectedDay.totalHabits}</p>
              {selectedDay.habits && selectedDay.habits.length > 0 ? (
                <div>
                  {selectedDay.habits.map((habit) => (
                    <div key={habit.habit._id} className={`habit-item ${habit.completed ? "completed" : ""}`}>
                      <input
                        type="checkbox"
                        checked={habit.completed}
                        onChange={() => handleToggleHabitCompletion(habit.habit._id)}
                      />
                      <span>{getHabitIcon(habit.habit.icon)} {habit.habit.name}</span>
                      {habit.quality && <span className="quality-badge">Качество: {habit.quality}/5</span>}
                      <button 
                        className="btn-remove-habit" 
                        onClick={() => handleRemoveHabitFromDay(habit.habit._id)}
                        title="Удалить привычку из дня"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Нет привычек</p>
              )}
              <div className="day-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={handleShowAddHabitsModal}
                  title="Добавить или изменить привычки"
                >
                  ➕ Изменить
                </button>
                {selectedDay.status !== "completed" && (
                  <button className="btn btn-primary" onClick={() => setShowCloseReport(true)}>
                    ✅ Завершить день
                  </button>
                )}
                <button className="btn btn-danger" onClick={() => handleDeleteDay()}>
                  🗑️ Удалить
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state-container">
              <p>Выберите день на календаре</p>
            </div>
          )}
        </div>
      </div>

      {showCloseReport && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowCloseReport(false)}>
          <div className="modal close-report" onClick={(e) => e.stopPropagation()}>
            <h2>Завершить день?</h2>
            <p>Выполнено: {selectedDay.completedHabits}/{selectedDay.totalHabits}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => handleCompleteDay()}>
                ✅ Подтвердить
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCloseReport(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditingDay ? "📅 Изменить день" : "📅 Создать день"}</h2>
            <form onSubmit={handleCreateDay}>
              <div className="form-group">
                <label>Дата:</label>
                <input
                  type="date"
                  value={newDayForm.date}
                  onChange={(e) => setNewDayForm({ ...newDayForm, date: e.target.value })}
                  disabled={isEditingDay}
                  required
                />
              </div>
              <div className="form-group">
                <label>Настроение:</label>
                <div className="mood-selector">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`mood-btn ${newDayForm.mood === m ? "active" : ""}`}
                      onClick={() => setNewDayForm({ ...newDayForm, mood: m })}
                    >
                      {getMoodEmoji(m)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Энергия: {newDayForm.energy}/5</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newDayForm.energy}
                  onChange={(e) => setNewDayForm({ ...newDayForm, energy: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Заметки:</label>
                <textarea
                  value={newDayForm.dayNotes}
                  onChange={(e) => setNewDayForm({ ...newDayForm, dayNotes: e.target.value })}
                  placeholder="Как прошёл день?"
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Привычки (выберите хотя бы одну):</label>
                {newDayForm.habits.length === 0 && (
                  <div className="alert-box alert-error" style={{ marginBottom: "1rem" }}>
                    ⚠️ Обязательно выберите хотя бы одну привычку
                  </div>
                )}
                {habits && habits.length > 0 ? (
                  habits.map((habit) => (
                    <label key={habit._id} className="checkbox">
                      <input
                        type="checkbox"
                        checked={newDayForm.habits.includes(habit._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDayForm({ ...newDayForm, habits: [...newDayForm.habits, habit._id] });
                          } else {
                            setNewDayForm({ ...newDayForm, habits: newDayForm.habits.filter((h) => h !== habit._id) });
                          }
                        }}
                      />
                      {getHabitIcon(habit.icon)} {habit.name}
                    </label>
                  ))
                ) : (
                  <p style={{ color: "#ef4444" }}>Сначала создайте привычки в разделе "Привычки"</p>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={newDayForm.habits.length === 0 || isSavingDay}
                >
                  {isSavingDay ? "⏳ Сохраняется..." : (isEditingDay ? "💾 Сохранить изменения" : "➕ Создать")}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsEditingDay(false);
                  }}
                  disabled={isSavingDay}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaysPage;