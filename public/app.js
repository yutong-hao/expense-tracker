const API_BASE = "http://localhost:3000/api";
const API_URL = `${API_BASE}/expenses`;
const LEDGER_PAGE_SIZE = 6;
let expenseRequestId = 0;

const CATEGORY_COLORS = {
  'Food':          { bg: '#ead5be', border: '#d4b896' },
  'Shopping':      { bg: '#bdd0e0', border: '#9ab8d0' },
  'Transport':     { bg: '#c2d4c2', border: '#9fbf9f' },
  'Entertainment': { bg: '#e0c4c8', border: '#cba4aa' },
  'Health':        { bg: '#b8d4d0', border: '#90bcb8' },
  'Utilities':     { bg: '#ddd8b0', border: '#c8c088' },
  'Education':     { bg: '#c2d4cc', border: '#9ec0b4' },
  'default':       { bg: '#d2d6d8', border: '#b4babе' },
};

const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const changePasswordForm = document.getElementById("change-password-form");
const loginCard = loginForm.closest(".auth-card");
const registerCard = document.getElementById("register-card");
const changePasswordCard = document.getElementById("change-password-card");
const showRegisterBtn = document.getElementById("show-register");
const showLoginBtn = document.getElementById("show-login");
const showChangePasswordBtn = document.getElementById("show-change-password");
const showLoginFromPasswordBtn = document.getElementById("show-login-from-password");
const statusMenuBtn = document.getElementById("status-menu-btn");
const statusMenuOptions = document.getElementById("status-menu-options");
const statusToggleOption = document.getElementById("status-toggle-option");
const currentUsername = document.getElementById("current-username");
const currentRole = document.getElementById("current-role");
const accountMenuBtn = document.getElementById("account-menu-btn");
const accountModal = document.getElementById("account-modal");
const accountForm = document.getElementById("account-form");
const accountUsername = document.getElementById("account-username");
const accountCurrentPassword = document.getElementById("account-current-password");
const accountNewPassword = document.getElementById("account-new-password");
const cancelAccountBtn = document.getElementById("cancel-account");
const adminPanel = document.getElementById("admin-panel");
const adminUsers = document.getElementById("admin-users");
const adminActivities = document.getElementById("admin-activities");
const adminUserSearch = document.getElementById("admin-user-search");
const adminRoleFilter = document.getElementById("admin-role-filter");
const adminActivityDateFilter = document.getElementById("admin-activity-date-filter");
const activityActionFilter = document.getElementById("activity-action-filter");
const adminClearFiltersBtn = document.getElementById("admin-clear-filters");
const userPrevPage = document.getElementById("user-prev-page");
const userNextPage = document.getElementById("user-next-page");
const userPageInfo = document.getElementById("user-page-info");
const activityPrevPage = document.getElementById("activity-prev-page");
const activityNextPage = document.getElementById("activity-next-page");
const activityPageInfo = document.getElementById("activity-page-info");
const expenseWorkspace = document.getElementById("expense-workspace");

const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");
const expenseSearch = document.getElementById("expense-search");
const filterCategory = document.getElementById("filter-category");
const filterMinAmount = document.getElementById("filter-min-amount");
const filterMaxAmount = document.getElementById("filter-max-amount");
const sortExpenses = document.getElementById("sort-expenses");
const clearFiltersBtn = document.getElementById("clear-filters");

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editId = document.getElementById("edit-id");
const editTitle = document.getElementById("edit-title");
const editCategory = document.getElementById("edit-category");
const editAmount = document.getElementById("edit-amount");
const editDate = document.getElementById("edit-date");
const editDescription = document.getElementById("edit-description");
const editCancelBtn = document.getElementById("cancel-edit");

const deleteModal = document.getElementById("delete-modal");
const cancelDeleteBtn = document.getElementById("cancel-delete");
const confirmDeleteBtn = document.getElementById("confirm-delete");

const initialState = {
  authToken: localStorage.getItem("expense_token"),
  activeUser: JSON.parse(localStorage.getItem("expense_user") || "null"),
  expenses: [],
  expandedCategories: {},
  ledgerPage: 1,
  adminUserRecords: [],
  adminUserFilters: {
    search: "",
    role: "",
    date: "",
    action: ""
  },
  adminUserPagination: {
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0
  },
  adminActivities: [],
  activityFilters: {
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0
  },
  filters: {
    search: "",
    category: "",
    minAmount: "",
    maxAmount: "",
    sort: "date-desc"
  },
  editingExpense: null,
  deleteTargetId: null
};

function AppReducer(state, action) {
  switch (action.type) {
    case "SET_SESSION":
      return {
        ...state,
        authToken: action.payload.token,
        activeUser: action.payload.user
      };
    case "CLEAR_SESSION":
      return {
        ...state,
        authToken: null,
        activeUser: null,
        expenses: [],
        expandedCategories: {},
        ledgerPage: 1,
        adminUserRecords: [],
        adminUserFilters: initialState.adminUserFilters,
        adminUserPagination: initialState.adminUserPagination,
        adminActivities: [],
        activityFilters: initialState.activityFilters,
        editingExpense: null,
        deleteTargetId: null
      };
    case "SET_EXPENSES":
      return {
        ...state,
        expenses: action.payload.expenses,
        ledgerPage: 1
      };
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.name]: action.payload.value
        },
        ledgerPage: 1
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: initialState.filters,
        ledgerPage: 1
      };
    case "TOGGLE_CATEGORY_GROUP":
      if (state.expandedCategories[action.payload.category]) {
        return {
          ...state,
          expandedCategories: {},
          ledgerPage: 1
        };
      }

      return {
        ...state,
        expandedCategories: {
          [action.payload.category]: true
        },
        ledgerPage: 1
      };
    case "SET_LEDGER_PAGE":
      return {
        ...state,
        ledgerPage: action.payload.page
      };
    case "SET_ADMIN_ACTIVITIES":
      return {
        ...state,
        adminActivities: action.payload.activities,
        activityFilters: action.payload.pagination
      };
    case "SET_ADMIN_USERS":
      return {
        ...state,
        adminUserRecords: action.payload.users,
        adminUserPagination: action.payload.pagination
      };
    case "SET_ADMIN_USER_FILTER":
      return {
        ...state,
        adminUserFilters: {
          ...state.adminUserFilters,
          [action.payload.name]: action.payload.value
        },
        activityFilters: {
          ...state.activityFilters,
          page: 1
        },
        adminUserPagination: {
          ...state.adminUserPagination,
          page: 1
        }
      };
    case "CLEAR_ADMIN_USER_FILTERS":
      return {
        ...state,
        adminUserFilters: {
          ...initialState.adminUserFilters
        },
        activityFilters: {
          ...state.activityFilters,
          page: 1
        },
        adminUserPagination: {
          ...state.adminUserPagination,
          page: 1
        }
      };
    case "SET_ADMIN_USER_PAGE":
      return {
        ...state,
        adminUserPagination: {
          ...state.adminUserPagination,
          page: action.payload.page
        }
      };
    case "SET_ACTIVITY_PAGE":
      return {
        ...state,
        activityFilters: {
          ...state.activityFilters,
          page: action.payload.page
        }
      };
    case "START_EDIT":
      return {
        ...state,
        editingExpense: action.payload.expense
      };
    case "CANCEL_EDIT":
      return {
        ...state,
        editingExpense: null
      };
    case "START_DELETE":
      return {
        ...state,
        deleteTargetId: action.payload.id
      };
    case "CANCEL_DELETE":
      return {
        ...state,
        deleteTargetId: null
      };
    default:
      return state;
  }
}

function useReducer(reducer, startingState) {
  let state = startingState;

  function getState() {
    return state;
  }

  function dispatch(action) {
    const previousState = state;
    state = reducer(state, action);
    renderAppState(state, previousState, action);
  }

  return [getState, dispatch];
}

const [getAppState, dispatch] = useReducer(AppReducer, initialState);

function renderAppState(state, previousState, action) {
  if (state.authToken && state.activeUser) {
    localStorage.setItem("expense_token", state.authToken);
    localStorage.setItem("expense_user", JSON.stringify(state.activeUser));
  } else {
    localStorage.removeItem("expense_token");
    localStorage.removeItem("expense_user");
  }

  if (action.type === "SET_SESSION" || action.type === "CLEAR_SESSION") {
    if (action.type === "CLEAR_SESSION") {
      editModal.classList.add("hidden");
      deleteModal.classList.add("hidden");
      editForm.reset();
    }

    showAuthenticatedView();
  }

  if (action.type === "SET_FILTER" || action.type === "CLEAR_FILTERS") {
    syncFilterControls(state.filters);
  }

  if (action.type === "SET_EXPENSES" || action.type === "TOGGLE_CATEGORY_GROUP" || action.type === "SET_LEDGER_PAGE") {
    syncFilterControls(state.filters);
    renderExpenses(state.expenses, state.expandedCategories, state.ledgerPage);
  }

  if (action.type === "SET_ADMIN_ACTIVITIES") {
    renderAdminActivities(state.adminActivities, state.activityFilters);
  }

  if (action.type === "SET_ADMIN_USERS" || action.type === "SET_ADMIN_USER_FILTER" || action.type === "CLEAR_ADMIN_USER_FILTERS") {
    syncAdminUserFilterControls(state.adminUserFilters);
    renderAdminUsers(state.adminUserRecords, state.adminUserFilters, state.adminUserPagination);
  }

  if (state.editingExpense !== previousState.editingExpense) {
    if (state.editingExpense) {
      const expense = state.editingExpense;
      editId.value = expense.id;
      editTitle.value = expense.title;
      editCategory.value = expense.category;
      editAmount.value = expense.amount;
      editDate.value = String(expense.expense_date).split("T")[0];
      editDescription.value = expense.description || "";
      editModal.classList.remove("hidden");
    } else {
      editModal.classList.add("hidden");
      editForm.reset();
    }
  }

  if (state.deleteTargetId !== previousState.deleteTargetId) {
    deleteModal.classList.toggle("hidden", state.deleteTargetId === null);
  }
}

function authHeaders() {
  const { authToken } = getAppState();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`
  };
}

function isValidDate(dateStr) {
  return /^[1-9]\d{3}-\d{2}-\d{2}$/.test(dateStr);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function syncFilterControls(filters) {
  if (expenseSearch) expenseSearch.value = filters.search;
  if (filterCategory) filterCategory.value = filters.category;
  if (filterMinAmount) filterMinAmount.value = filters.minAmount;
  if (filterMaxAmount) filterMaxAmount.value = filters.maxAmount;
  if (sortExpenses) sortExpenses.value = filters.sort;
}

function renderAdminActivities(activities, pagination) {
  adminActivities.innerHTML = "";

  if (!activities.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No activity matches the current filters.";
    row.appendChild(cell);
    adminActivities.appendChild(row);
  }

  activities.forEach(activity => {
    const row = document.createElement("tr");
    appendCell(row, formatDateTime(activity.created_at));
    appendCell(row, `${activity.username} (${activity.role})`);
    appendCell(row, activity.action);
    appendCell(row, activity.details || "");
    adminActivities.appendChild(row);
  });

  activityPageInfo.textContent = `${pagination.page} of ${pagination.pageCount}`;
  activityPrevPage.disabled = pagination.page <= 1;
  activityNextPage.disabled = pagination.page >= pagination.pageCount;
}

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
  return cell;
}

function syncAdminUserFilterControls(filters) {
  if (adminUserSearch) adminUserSearch.value = filters.search;
  if (adminRoleFilter) adminRoleFilter.value = filters.role;
  if (adminActivityDateFilter) adminActivityDateFilter.value = filters.date;
  if (activityActionFilter) activityActionFilter.value = filters.action;
}

function hasAdminUserFilter(filters) {
  return Boolean(filters.search.trim() || filters.role || filters.date || filters.action);
}

function renderAdminUsers(users, filters, pagination) {
  adminUsers.innerHTML = "";
  userPageInfo.textContent = `${pagination.page} of ${pagination.pageCount}`;
  userPrevPage.disabled = pagination.page <= 1;
  userNextPage.disabled = pagination.page >= pagination.pageCount;

  if (!users.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = hasAdminUserFilter(filters) ? "No users match the current filters." : "No users found.";
    row.appendChild(cell);
    adminUsers.appendChild(row);
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");
    appendCell(row, user.id);
    appendCell(row, user.username);

    const roleCell = document.createElement("td");
    const roleSelect = document.createElement("select");
    roleSelect.className = "role-select";
    roleSelect.dataset.userId = user.id;

    ["user", "admin"].forEach(role => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      option.selected = user.role === role;
      roleSelect.appendChild(option);
    });

    roleCell.appendChild(roleSelect);
    row.appendChild(roleCell);

    appendCell(row, user.activity_count);
    appendCell(row, formatDateTime(user.last_activity_at));

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-danger-btn";
    deleteBtn.dataset.userId = user.id;
    deleteBtn.textContent = "Delete";
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    roleSelect.addEventListener("change", function () {
      updateUserRole(user.id, this.value);
    });

    deleteBtn.addEventListener("click", function () {
      deleteUser(user.id);
    });

    adminUsers.appendChild(row);
  });
}

function showAuthenticatedView() {
  const { authToken, activeUser } = getAppState();
  const signedIn = Boolean(authToken && activeUser);
  authView.classList.toggle("hidden", signedIn);
  appView.classList.toggle("hidden", !signedIn);

  statusMenuBtn.textContent = signedIn ? "Online" : "Offline";
  statusMenuBtn.classList.toggle("online", signedIn);
  statusMenuBtn.classList.toggle("offline", !signedIn);
  statusToggleOption.textContent = signedIn ? "Offline" : "Online";
  statusToggleOption.classList.toggle("online", !signedIn);
  statusToggleOption.classList.toggle("offline", signedIn);
  statusMenuOptions.classList.add("hidden");
  statusMenuBtn.setAttribute("aria-expanded", "false");

  if (!signedIn) return;

  currentUsername.textContent = activeUser.username;
  currentRole.textContent = activeUser.role;
  adminPanel.classList.toggle("hidden", activeUser.role !== "admin");
  expenseWorkspace.classList.toggle("hidden", activeUser.role === "admin");
  refreshAll();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    throw new Error(data.error || "Request failed");
  }

  return data;
}

function saveSession(data) {
  dispatch({ type: "SET_SESSION", payload: data });
}

function clearSession() {
  dispatch({ type: "CLEAR_SESSION" });
}

function showAuthMode(mode) {
  const registering = mode === "register";
  const changingPassword = mode === "change-password";
  loginCard.classList.toggle("hidden", registering || changingPassword);
  registerCard.classList.toggle("hidden", !registering);
  changePasswordCard.classList.toggle("hidden", !changingPassword);
}

showRegisterBtn.addEventListener("click", function () {
  showAuthMode("register");
});

showLoginBtn.addEventListener("click", function () {
  showAuthMode("login");
});

showChangePasswordBtn.addEventListener("click", function () {
  showAuthMode("change-password");
});

showLoginFromPasswordBtn.addEventListener("click", function () {
  showAuthMode("login");
});

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    const data = await requestJson(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("login-username").value.trim(),
        password: document.getElementById("login-password").value
      })
    });

    loginForm.reset();
    saveSession(data);
    showToast("Logged in successfully");
  } catch (error) {
    showToast(error.message);
  }
});

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    await requestJson(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("register-username").value.trim(),
        password: document.getElementById("register-password").value
      })
    });

    registerForm.reset();
    showAuthMode("login");
    showToast("Registration successful. You can log in now.");
  } catch (error) {
    showToast(error.message);
  }
});

changePasswordForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    await requestJson(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("change-password-username").value.trim(),
        currentPassword: document.getElementById("change-password-current").value,
        newPassword: document.getElementById("change-password-new").value
      })
    });

    changePasswordForm.reset();
    showAuthMode("login");
    showToast("Password changed successfully. You can log in now.");
  } catch (error) {
    showToast(error.message);
  }
});

async function goOffline() {
  try {
    await requestJson(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: authHeaders()
    });
  } catch (error) {
    console.error("Failed to record logout:", error);
  }

  clearSession();
  showToast("Logged out");
}

statusMenuBtn.addEventListener("click", function () {
  const open = statusMenuOptions.classList.toggle("hidden") === false;
  statusMenuBtn.setAttribute("aria-expanded", String(open));
});

statusToggleOption.addEventListener("click", async function () {
  const { authToken } = getAppState();

  if (authToken) {
    await goOffline();
    return;
  }

  showAuthMode("login");
  showAuthenticatedView();
});

function openAccountModal() {
  const { activeUser } = getAppState();
  accountUsername.value = activeUser?.username || "";
  accountCurrentPassword.value = "";
  accountNewPassword.value = "";
  accountModal.classList.remove("hidden");
}

function closeAccountModal() {
  accountModal.classList.add("hidden");
  accountForm.reset();
}

accountMenuBtn.addEventListener("click", openAccountModal);
cancelAccountBtn.addEventListener("click", closeAccountModal);

accountForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const newPassword = accountNewPassword.value;
  const currentPassword = accountCurrentPassword.value;

  if (newPassword && !currentPassword) {
    showToast("Current password is required to change password");
    return;
  }

  try {
    const data = await requestJson(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        username: accountUsername.value.trim(),
        currentPassword,
        newPassword
      })
    });

    saveSession(data);
    closeAccountModal();
    showToast("Account updated successfully");
  } catch (error) {
    showToast(error.message);
  }
});

accountModal.addEventListener("click", function (event) {
  if (event.target === accountModal) {
    closeAccountModal();
  }
});

document.addEventListener("click", function (event) {
  if (!statusMenuBtn.contains(event.target) && !statusMenuOptions.contains(event.target)) {
    statusMenuOptions.classList.add("hidden");
    statusMenuBtn.setAttribute("aria-expanded", "false");
  }
});

function createExpenseQueryString(filters) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.minAmount !== "") params.set("minAmount", filters.minAmount);
  if (filters.maxAmount !== "") params.set("maxAmount", filters.maxAmount);
  if (filters.sort) params.set("sort", filters.sort);

  return params.toString();
}

async function fetchExpenses() {
  const requestId = ++expenseRequestId;
  const { filters } = getAppState();

  try {
    const queryString = createExpenseQueryString(filters);
    const expenses = await requestJson(`${API_URL}?${queryString}`, {
      headers: authHeaders()
    });

    if (requestId !== expenseRequestId) return;

    dispatch({ type: "SET_EXPENSES", payload: { expenses } });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
  }
}

async function fetchCategorySummary() {
  try {
    const data = await requestJson(`${API_BASE}/summary/category`, {
      headers: authHeaders()
    });

    const summaryEl = document.getElementById("category-summary");
    summaryEl.innerHTML = "";

    data.forEach(item => {
      const p = document.createElement("p");
      p.textContent = `${item.category}: $${Number(item.total).toFixed(2)}`;
      summaryEl.appendChild(p);
    });
  } catch (error) {
    console.error("Failed to fetch category summary:", error);
  }
}

async function fetchMonthlySummary() {
  try {
    const data = await requestJson(`${API_BASE}/summary/monthly`, {
      headers: authHeaders()
    });

    const container = document.getElementById("monthly-summary");
    container.innerHTML = "";

    if (!Array.isArray(data)) return;

    data.forEach(item => {
      const p = document.createElement("p");
      const month = document.createElement("span");
      const total = document.createElement("span");
      month.textContent = item.month;
      total.textContent = `$${Number(item.total).toFixed(2)}`;
      p.append(month, total);
      container.appendChild(p);
    });
  } catch (error) {
    console.error("Failed to fetch monthly summary:", error);
  }
}

function createAdminQueryString(filters, pagination) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.role) params.set("role", filters.role);
  if (filters.date) params.set("date", filters.date);
  if (filters.action) params.set("action", filters.action);
  params.set("page", pagination.page);
  params.set("pageSize", pagination.pageSize);

  return params.toString();
}

async function fetchAdminUsers() {
  const { activeUser, adminUserFilters, adminUserPagination } = getAppState();
  if (activeUser?.role !== "admin") return;

  try {
    const data = await requestJson(`${API_BASE}/admin/users?${createAdminQueryString(adminUserFilters, adminUserPagination)}`, {
      headers: authHeaders()
    });

    dispatch({
      type: "SET_ADMIN_USERS",
      payload: {
        users: data.users || [],
        pagination: data.pagination || initialState.adminUserPagination
      }
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
}

async function fetchAdminActivities() {
  const { activeUser, adminUserFilters, activityFilters } = getAppState();
  if (activeUser?.role !== "admin") return;

  try {
    const data = await requestJson(`${API_BASE}/admin/activities?${createAdminQueryString(adminUserFilters, activityFilters)}`, {
      headers: authHeaders()
    });

    dispatch({
      type: "SET_ADMIN_ACTIVITIES",
      payload: {
        activities: data.activities || [],
        pagination: data.pagination || initialState.activityFilters
      }
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
  }
}

async function updateUserRole(userId, role) {
  try {
    await requestJson(`${API_BASE}/admin/users/${userId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ role })
    });

    showToast("User updated successfully");
    refreshAdmin();
  } catch (error) {
    showToast(error.message);
    refreshAdmin();
  }
}

async function deleteUser(userId) {
  if (!confirm("Delete this user account?")) return;

  try {
    await requestJson(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    showToast("User deleted successfully");
    refreshAdmin();
  } catch (error) {
    showToast(error.message);
  }
}

function refreshAdmin() {
  fetchAdminUsers();
  fetchAdminActivities();
}

function refreshAll() {
  const { authToken, activeUser } = getAppState();
  if (!authToken) return;

  if (activeUser?.role === "admin") {
    refreshAdmin();
    return;
  }

  fetchExpenses();
  fetchCategorySummary();
  fetchMonthlySummary();
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const expense = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    amount: parseFloat(document.getElementById("amount").value).toFixed(2),
    date: document.getElementById("date").value,
    description: document.getElementById("description").value
  };

  if (!isValidDate(expense.date)) {
    alert("Date must be in YYYY-MM-DD format, and the year must be 4 digits without leading zeros.");
    return;
  }

  try {
    await requestJson(API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(expense)
    });

    form.reset();
    refreshAll();
    showToast("Expense added successfully");
  } catch (error) {
    console.error("Failed to add expense:", error);
  }
});

if (editCancelBtn) {
  editCancelBtn.addEventListener("click", function () {
    dispatch({ type: "CANCEL_EDIT" });
  });
}

if (editForm) {
  editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const updatedExpense = {
      title: editTitle.value,
      category: editCategory.value,
      amount: parseFloat(editAmount.value).toFixed(2),
      date: editDate.value,
      description: editDescription.value
    };

    if (!isValidDate(updatedExpense.date)) {
      alert("Date must be in YYYY-MM-DD format, and the year must be 4 digits without leading zeros.");
      return;
    }

    try {
      await requestJson(`${API_URL}/${editId.value}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updatedExpense)
      });

      dispatch({ type: "CANCEL_EDIT" });
      refreshAll();
      showToast("Expense updated successfully");
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", function () {
    dispatch({ type: "CANCEL_DELETE" });
  });
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async function () {
    const { deleteTargetId } = getAppState();
    if (deleteTargetId === null) return;

    const targetId = deleteTargetId;
    const element = document.querySelector(`[data-id='${targetId}']`);

    if (element) {
      element.classList.add("removing");
    }

    setTimeout(async () => {
      try {
        await requestJson(`${API_URL}/${targetId}`, {
          method: "DELETE",
          headers: authHeaders()
        });

        dispatch({ type: "CANCEL_DELETE" });
        refreshAll();
        showToast("Expense deleted successfully");
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    }, 300);
  });
}

function getCategoryColors(category) {
  return CATEGORY_COLORS[category] || {
    ...CATEGORY_COLORS.default,
    border: "#b4babf"
  };
}

function applyCategoryColors(element, category) {
  const colors = getCategoryColors(category);
  element.style.setProperty("--expense-bg", colors.bg);
  element.style.setProperty("--expense-border", colors.border);
}

function createExpenseDetail(labelText, valueText, className = "") {
  const detail = document.createElement("p");
  detail.className = `expense-detail ${className}`.trim();

  const label = document.createElement("span");
  label.className = "expense-detail-label";
  label.textContent = `${labelText}: `;

  const value = document.createElement("span");
  value.className = "expense-detail-value";
  value.textContent = valueText;

  detail.append(label, value);
  return detail;
}

function createExpenseCard(expense, options = {}) {
  const showActions = options.showActions !== false;
  const displayDate = String(expense.expense_date).split("T")[0];
  const expenseItem = document.createElement("div");
  expenseItem.classList.add("expense-item");
  expenseItem.setAttribute("data-id", expense.id);
  applyCategoryColors(expenseItem, expense.category);

  const title = document.createElement("h3");
  title.textContent = expense.title;

  const category = createExpenseDetail("Category", expense.category || "Uncategorized", "expense-category");
  const amount = createExpenseDetail("Amount", `$${Number(expense.amount).toFixed(2)}`);
  const date = createExpenseDetail("Date", displayDate);
  const description = createExpenseDetail("Description", expense.description || "");

  expenseItem.append(title, category, amount, date, description);

  if (showActions) {
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    editBtn.addEventListener("click", function () {
      dispatch({ type: "START_EDIT", payload: { expense } });
    });

    deleteBtn.addEventListener("click", function () {
      dispatch({ type: "START_DELETE", payload: { id: expense.id } });
    });

    expenseItem.append(editBtn, deleteBtn);
  }

  expenseItem.classList.add("added");
  return expenseItem;
}

function sortNewestExpenses(expenses) {
  return [...expenses].sort((a, b) =>
    new Date(b.expense_date) - new Date(a.expense_date)
  );
}

function groupExpensesByCategory(expenses) {
  return expenses.reduce((groups, expense) => {
    const category = expense.category || "Uncategorized";
    if (!groups[category]) groups[category] = [];
    groups[category].push(expense);
    return groups;
  }, {});
}

function createCategoryLedger(category, categoryExpenses) {
  const sortedExpenses = sortNewestExpenses(categoryExpenses);
  const coverExpense = sortedExpenses[0];
  const ledger = document.createElement("button");
  ledger.type = "button";
  ledger.className = "category-ledger";
  ledger.setAttribute("aria-label", `Open ${category} ledger with ${sortedExpenses.length} expenses`);
  applyCategoryColors(ledger, category);

  const cover = createExpenseCard(coverExpense, { showActions: false });
  cover.classList.add("ledger-cover");

  const counter = document.createElement("span");
  counter.className = "ledger-counter";
  counter.textContent = `${sortedExpenses.length} ${sortedExpenses.length === 1 ? "bill" : "bills"}`;

  ledger.append(cover, counter);
  ledger.addEventListener("click", function () {
    dispatch({ type: "TOGGLE_CATEGORY_GROUP", payload: { category } });
  });
  return ledger;
}

function createLedgerPageButton(className, page, disabled, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ledger-page-btn ${className}`;
  button.disabled = disabled;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", function () {
    dispatch({ type: "SET_LEDGER_PAGE", payload: { page } });
  });
  return button;
}

function createExpandedLedger(category, categoryExpenses, ledgerPage) {
  const orderedExpenses = [...categoryExpenses];
  const pageCount = Math.max(1, Math.ceil(orderedExpenses.length / LEDGER_PAGE_SIZE));
  const currentPage = Math.min(Math.max(ledgerPage, 1), pageCount);
  const startIndex = (currentPage - 1) * LEDGER_PAGE_SIZE;
  const pageExpenses = orderedExpenses.slice(startIndex, startIndex + LEDGER_PAGE_SIZE);
  const ledger = document.createElement("section");
  ledger.className = "category-ledger-open";
  applyCategoryColors(ledger, category);

  const header = document.createElement("div");
  header.className = "category-ledger-header";

  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = `${category} Ledger`;

  const meta = document.createElement("p");
  meta.textContent = `${orderedExpenses.length} ${orderedExpenses.length === 1 ? "bill" : "bills"}`;
  titleWrap.append(title, meta);

  const pager = document.createElement("div");
  pager.className = "ledger-pager";

  const pageLabel = document.createElement("span");
  pageLabel.className = "ledger-page-label";
  pageLabel.textContent = `${currentPage} of ${pageCount}`;

  const previousPage = createLedgerPageButton(
    "ledger-page-prev",
    currentPage - 1,
    currentPage === 1,
    "Previous ledger page"
  );
  const nextPage = createLedgerPageButton(
    "ledger-page-next",
    currentPage + 1,
    currentPage === pageCount,
    "Next ledger page"
  );
  pager.append(previousPage, pageLabel, nextPage);

  const foldButton = document.createElement("button");
  foldButton.type = "button";
  foldButton.className = "ledger-bookmark";
  foldButton.textContent = "Fold";
  foldButton.setAttribute("aria-label", "Fold ledger back into category books");
  foldButton.addEventListener("click", function () {
    dispatch({ type: "TOGGLE_CATEGORY_GROUP", payload: { category } });
  });

  const cards = document.createElement("div");
  cards.className = "ledger-expenses";
  pageExpenses.forEach(function (expense) {
    cards.appendChild(createExpenseCard(expense));
  });

  header.append(titleWrap, foldButton);
  ledger.append(header, cards, pager);
  return ledger;
}

function renderExpenses(expenses, expandedCategories = {}, ledgerPage = 1) {
  expenseList.innerHTML = "";
  expenseList.classList.remove("open-ledger-view");
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  if (!expenses.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No expenses match your current filters.";
    expenseList.appendChild(empty);
    totalAmount.textContent = "0.00";
    return;
  }

  const expensesByCategory = groupExpensesByCategory(expenses);
  const openCategory = Object.keys(expandedCategories)
    .find(category => expensesByCategory[category]);

  if (openCategory) {
    expenseList.classList.add("open-ledger-view");
    expenseList.appendChild(createExpandedLedger(openCategory, expensesByCategory[openCategory], ledgerPage));
  } else {
    Object.entries(expensesByCategory).forEach(function ([category, categoryExpenses]) {
      expenseList.appendChild(createCategoryLedger(category, categoryExpenses));
    });
  }

  totalAmount.textContent = total.toFixed(2);
}

function showToast(message) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");

    toast.addEventListener("animationend", () => {
      toast.remove();
    }, { once: true });
  }, 2000);
}

function formatAmountInput(input) {
  let value = input.value;

  value = value.replace(/[^\d.]/g, "");

  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1];
  }

  if (parts[1]) {
    value = parts[0] + "." + parts[1].slice(0, 2);
  }

  input.value = value;
}

document.getElementById("amount").addEventListener("input", function () {
  formatAmountInput(this);
});

document.getElementById("edit-amount").addEventListener("input", function () {
  formatAmountInput(this);
});

if (expenseSearch) {
  expenseSearch.addEventListener("input", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "search", value: this.value } });
    fetchExpenses();
  });
}

if (filterCategory) {
  filterCategory.addEventListener("change", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "category", value: this.value } });
    fetchExpenses();
  });
}

if (filterMinAmount) {
  filterMinAmount.addEventListener("input", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "minAmount", value: this.value } });
    fetchExpenses();
  });
}

if (filterMaxAmount) {
  filterMaxAmount.addEventListener("input", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "maxAmount", value: this.value } });
    fetchExpenses();
  });
}

if (sortExpenses) {
  sortExpenses.addEventListener("change", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "sort", value: this.value } });
    fetchExpenses();
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", function () {
    dispatch({ type: "CLEAR_FILTERS" });
    fetchExpenses();
  });
}

if (adminUserSearch) {
  adminUserSearch.addEventListener("input", function () {
    dispatch({ type: "SET_ADMIN_USER_FILTER", payload: { name: "search", value: this.value } });
    refreshAdmin();
  });
}

if (adminRoleFilter) {
  adminRoleFilter.addEventListener("change", function () {
    dispatch({ type: "SET_ADMIN_USER_FILTER", payload: { name: "role", value: this.value } });
    refreshAdmin();
  });
}

if (adminActivityDateFilter) {
  adminActivityDateFilter.addEventListener("input", function () {
    dispatch({ type: "SET_ADMIN_USER_FILTER", payload: { name: "date", value: this.value } });
    refreshAdmin();
  });
}

if (activityActionFilter) {
  activityActionFilter.addEventListener("change", function () {
    dispatch({ type: "SET_ADMIN_USER_FILTER", payload: { name: "action", value: this.value } });
    refreshAdmin();
  });
}

if (adminClearFiltersBtn) {
  adminClearFiltersBtn.addEventListener("click", function () {
    dispatch({ type: "CLEAR_ADMIN_USER_FILTERS" });
    refreshAdmin();
  });
}

if (userPrevPage) {
  userPrevPage.addEventListener("click", function () {
    const { adminUserPagination } = getAppState();
    dispatch({ type: "SET_ADMIN_USER_PAGE", payload: { page: Math.max(1, adminUserPagination.page - 1) } });
    fetchAdminUsers();
  });
}

if (userNextPage) {
  userNextPage.addEventListener("click", function () {
    const { adminUserPagination } = getAppState();
    dispatch({ type: "SET_ADMIN_USER_PAGE", payload: { page: Math.min(adminUserPagination.pageCount, adminUserPagination.page + 1) } });
    fetchAdminUsers();
  });
}

if (activityPrevPage) {
  activityPrevPage.addEventListener("click", function () {
    const { activityFilters } = getAppState();
    dispatch({ type: "SET_ACTIVITY_PAGE", payload: { page: Math.max(1, activityFilters.page - 1) } });
    fetchAdminActivities();
  });
}

if (activityNextPage) {
  activityNextPage.addEventListener("click", function () {
    const { activityFilters } = getAppState();
    dispatch({ type: "SET_ACTIVITY_PAGE", payload: { page: Math.min(activityFilters.pageCount, activityFilters.page + 1) } });
    fetchAdminActivities();
  });
}

showAuthenticatedView();
