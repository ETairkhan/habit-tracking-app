import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api`,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("habitflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ======================= AUTH =======================
export const authAPI = {
  register: (email, password) =>
    apiClient.post("/auth/register", { email, password }),
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),
};

// ======================= USERS =======================
export const userAPI = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (data) => apiClient.put("/users/profile", data),
  getDashboardStats: () => apiClient.get("/users/stats/dashboard"),
  getWeeklyStats: () => apiClient.get("/users/stats/weekly"),
  getCategoryStats: (category) =>
    apiClient.get(`/users/stats/category/${category}`),
  getUserInsights: () => apiClient.get("/users/insights"),
};

// ======================= HABITS =======================
export const habitAPI = {
  getAll: () => apiClient.get("/habits"),
  create: (habitData) => apiClient.post("/habits", habitData),
  update: (habitId, habitData) =>
    apiClient.put(`/habits/${habitId}`, habitData),
  delete: (habitId) => apiClient.delete(`/habits/${habitId}`),
  getHeatmap: (habitId, monthOffset = 0) =>
    apiClient.get(`/habits/${habitId}/checkins/heatmap`, {
      params: { monthOffset },
    }),
  getStreak: (habitId) =>
    apiClient.get(`/habits/${habitId}/checkins/streak`),
  getTrend: (habitId) =>
    apiClient.get(`/habits/${habitId}/checkins/trend`),
};

// ======================= CHECK-INS =======================
export const checkinAPI = {
  create: (habitId, checkinData) =>
    apiClient.post(`/habits/${habitId}/checkins`, checkinData),
  getAll: (habitId) => apiClient.get(`/habits/${habitId}/checkins`),
  update: (habitId, checkinId, checkinData) =>
    apiClient.put(
      `/habits/${habitId}/checkins/${checkinId}`,
      checkinData
    ),
  delete: (habitId, checkinId) =>
    apiClient.delete(`/habits/${habitId}/checkins/${checkinId}`),
  getHeatmap: (habitId, monthOffset = 0) =>
    apiClient.get(`/habits/${habitId}/checkins/heatmap`, {
      params: { monthOffset },
    }),
  getProgressTrend: (habitId) =>
    apiClient.get(`/habits/${habitId}/checkins/trend`),
  getStreakDetails: (habitId) =>
    apiClient.get(`/habits/${habitId}/checkins/streak`),
};

// ======================= DAYS =======================
export const dayAPI = {
  create: (dayData) => apiClient.post("/days", dayData),
  getAll: (filters = {}) =>
    apiClient.get("/days", { params: filters }),
  getById: (dayId) => apiClient.get(`/days/${dayId}`),
  update: (dayId, dayData) =>
    apiClient.put(`/days/${dayId}`, dayData),
  delete: (dayId) => apiClient.delete(`/days/${dayId}`),
  addHabit: (dayId, habitId) =>
    apiClient.post(`/days/${dayId}/habits`, { habitId }),
  removeHabit: (dayId, habitId) =>
    apiClient.delete(`/days/${dayId}/habits/${habitId}`),
  checkHabit: (dayId, habitId, checkData) =>
    apiClient.put(`/days/${dayId}/habits/${habitId}`, checkData),
  getMonthly: (year, month) =>
    apiClient.get("/days/calendar", { params: { year, month } }),
};
