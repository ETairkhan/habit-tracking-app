import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { adminAPI, habitAPI } from "../apiClient.js";

const ROLES = ["user", "premium", "moderator", "admin"];
const TABS = ["users", "habits"];
const ROLE_LABELS = {
  user: "User",
  premium: "Premium",
  moderator: "Moderator",
  admin: "Admin",
};
const ROLE_COLORS = {
  user: "bg-slate-500/20 text-slate-300 border-slate-500/50",
  premium: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  moderator: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  admin: "bg-red-500/20 text-red-300 border-red-500/50",
};

const AdminPage = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [usersWithHabits, setUsersWithHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const isAdmin = currentUser?.role === "admin";
  const canManageHabits = currentUser?.role === "admin" || currentUser?.role === "moderator";

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getUsersWithHabits();
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithHabits = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getUsersWithHabits();
      setUsersWithHabits(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load habits");
      setUsersWithHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = () => {
    if (activeTab === "users") fetchUsers();
    else fetchUsersWithHabits();
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const handleSetRole = async (userId, newRole) => {
    if (!isAdmin) return;
    setActionLoading(userId);
    setError("");
    setSuccess("");
    try {
      await adminAPI.setUserRole(userId, newRole);
      setSuccess(`Role updated to ${ROLE_LABELS[newRole]}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete user "${username}" and all their habits?`)) return;
    setActionLoading(userId);
    setError("");
    setSuccess("");
    try {
      await adminAPI.deleteUser(userId);
      setSuccess(`User "${username}" deleted`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteHabit = async (habitId, habitName) => {
    if (!canManageHabits) return;
    if (!window.confirm(`Delete habit "${habitName}"?`)) return;
    setActionLoading(habitId);
    setError("");
    setSuccess("");
    try {
      await habitAPI.delete(habitId);
      setSuccess(`Habit "${habitName}" deleted`);
      fetchUsersWithHabits();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete habit");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUserHabits = async (userId, username) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete all habits for "${username}"?`)) return;
    setActionLoading(userId);
    setError("");
    setSuccess("");
    try {
      await adminAPI.deleteUserHabits(userId);
      setSuccess(`All habits for "${username}" deleted`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete habits");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage users and roles. Your role:{" "}
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
              ROLE_COLORS[currentUser?.role] || ROLE_COLORS.user
            }`}
          >
            {ROLE_LABELS[currentUser?.role] || currentUser?.role}
          </span>
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          ✓ {success}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
            }`}
          >
            {tab === "users" ? "👥 Users" : "🎯 Habits"}
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">
            {activeTab === "users" ? "Users" : "Habits"}
          </h2>
          <p className="text-xs text-slate-400">
            {activeTab === "users"
              ? isAdmin
                ? "Change roles or delete users."
                : "You can view users. Only admins can change roles or delete."
              : canManageHabits
                ? "View all habits. Admins and moderators can delete any habit."
                : "View all habits across users."}
          </p>
        </div>

        {activeTab === "users" ? (
          loading ? (
            <div className="px-4 py-12 text-center text-slate-400">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-400">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="bg-slate-800/50 text-left">
                    <th className="px-4 py-3 font-medium text-slate-300">User</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Email</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Role</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Habits</th>
                    {isAdmin && (
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-800/30 transition"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">
                        {u.username || u.displayName || "-"}
                      </span>
                      {u.displayName && u.displayName !== u.username && (
                        <span className="ml-2 text-slate-500">
                          ({u.displayName})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select
                          value={u.role || "user"}
                          onChange={(e) =>
                            handleSetRole(u._id, e.target.value)
                          }
                          disabled={actionLoading === u._id}
                          className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
                            ROLE_COLORS[u.role] || ROLE_COLORS.user
                          }`}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-400">
                        <span className="font-medium text-emerald-400">
                          {(u.habitCount ?? (u.habits || []).length) || 0}
                        </span>
                        <span className="ml-1 text-xs">habit(s)</span>
                        {(u.habits || []).length > 0 && (
                          <div className="mt-1 max-w-[200px] truncate text-xs text-slate-500" title={(u.habits || []).map((h) => h.name).join(", ")}>
                            {(u.habits || []).slice(0, 3).map((h) => h.name).join(", ")}
                            {(u.habits || []).length > 3 && "…"}
                          </div>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteUserHabits(u._id, u.username)
                            }
                            disabled={actionLoading === u._id}
                            className="rounded bg-amber-600/80 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                          >
                            Delete habits
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            disabled={
                              actionLoading === u._id ||
                              u._id === (currentUser?.id || currentUser?._id)
                            }
                            className="rounded bg-red-600/80 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Delete user
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        ) : (
          loading ? (
          <div className="px-4 py-12 text-center text-slate-400">
            Loading habits...
          </div>
        ) : (() => {
            const habitsFlat = usersWithHabits.flatMap((u) =>
              (u.habits || []).map((h) => ({
                ...h,
                ownerId: u._id,
                ownerUsername: u.username || u.displayName || "-",
              }))
            );
            return habitsFlat.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400">
                No habits found.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="bg-slate-800/50 text-left">
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Habit
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Owner
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Category
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Frequency
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Success
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Streak
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Completed
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-300">
                        Last updated
                      </th>
                      {canManageHabits && (
                        <th className="px-4 py-3 font-medium text-slate-300">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {habitsFlat.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-white">{h.name}</span>
                            {h.description && (
                              <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-500" title={h.description}>
                                {h.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {h.ownerUsername}
                        </td>
                        <td className="px-4 py-3 text-slate-400 capitalize">
                          {h.category || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 capitalize">
                          {h.frequency || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              (h.successRate || 0) >= 70
                                ? "text-emerald-400"
                                : (h.successRate || 0) >= 40
                                  ? "text-amber-400"
                                  : "text-slate-400"
                            }
                          >
                            {(h.successRate ?? 0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <span className="text-amber-400 font-medium">{h.currentStreak ?? 0}</span>
                          <span className="text-slate-500"> / {h.longestStreak ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {h.totalCompleted ?? 0}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {h.updatedAt
                            ? new Date(h.updatedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : h.createdAt
                              ? new Date(h.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                        </td>
                        {canManageHabits && (
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteHabit(h.id, h.name)
                              }
                              disabled={actionLoading === h.id}
                              className="rounded bg-red-600/80 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </section>
    </div>
  );
};

AdminPage.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.string,
  }),
};

export default AdminPage;
