const API_BASE = "http://localhost:3000/api";
const API_URL = `${API_BASE}/expenses`;

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
const expenseWorkspace = document.getElementById("expense-workspace");

const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");
const expenseSearch = document.getElementById("expense-search");
const filterCategory = document.getElementById("filter-category");
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
  filters: {
    search: "",
    category: "",
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
        editingExpense: null,
        deleteTargetId: null
      };
    case "SET_EXPENSES":
      return {
        ...state,
        expenses: action.payload.expenses
      };
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.name]: action.payload.value
        }
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: initialState.filters
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

  if (action.type === "SET_EXPENSES" || action.type === "SET_FILTER" || action.type === "CLEAR_FILTERS") {
    syncFilterControls(state.filters);
    renderExpenses(getVisibleExpenses(state.expenses, state.filters));
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
  if (sortExpenses) sortExpenses.value = filters.sort;
}

function getVisibleExpenses(expenses, filters) {
  const search = filters.search.trim().toLowerCase();

  return expenses
    .filter(expense => {
      const searchable = [
        expense.title,
        expense.category,
        expense.description
      ].join(" ").toLowerCase();

      if (search && !searchable.includes(search)) return false;
      if (filters.category && expense.category !== filters.category) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const dateA = String(a.expense_date).split("T")[0];
      const dateB = String(b.expense_date).split("T")[0];

      switch (filters.sort) {
        case "date-asc":
          return dateA.localeCompare(dateB);
        case "amount-desc":
          return Number(b.amount) - Number(a.amount);
        case "amount-asc":
          return Number(a.amount) - Number(b.amount);
        case "title-asc":
          return String(a.title).localeCompare(String(b.title));
        default:
          return dateB.localeCompare(dateA);
      }
    });
}

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
  return cell;
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

async function fetchExpenses() {
  try {
    const expenses = await requestJson(API_URL, {
      headers: authHeaders()
    });
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

async function fetchAdminUsers() {
  const { activeUser } = getAppState();
  if (activeUser?.role !== "admin") return;

  try {
    const users = await requestJson(`${API_BASE}/admin/users`, {
      headers: authHeaders()
    });

    adminUsers.innerHTML = "";

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
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
}

async function fetchAdminActivities() {
  const { activeUser } = getAppState();
  if (activeUser?.role !== "admin") return;

  try {
    const activities = await requestJson(`${API_BASE}/admin/activities`, {
      headers: authHeaders()
    });

    adminActivities.innerHTML = "";

    activities.forEach(activity => {
      const row = document.createElement("tr");
      appendCell(row, formatDateTime(activity.created_at));
      appendCell(row, `${activity.username} (${activity.role})`);
      appendCell(row, activity.action);
      appendCell(row, activity.details || "");
      adminActivities.appendChild(row);
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

function renderExpenses(expenses) {
  expenseList.innerHTML = "";
  let total = 0;

  if (!expenses.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No expenses match your current filters.";
    expenseList.appendChild(empty);
    totalAmount.textContent = "0.00";
    return;
  }

  expenses.forEach(function (expense) {
    total += Number(expense.amount);

    const displayDate = String(expense.expense_date).split("T")[0];

    const expenseItem = document.createElement("div");
    expenseItem.classList.add("expense-item");
    expenseItem.setAttribute("data-id", expense.id);

    const title = document.createElement("h3");
    title.textContent = expense.title;

    const category = document.createElement("p");
    category.textContent = `Category: ${expense.category}`;

    const amount = document.createElement("p");
    amount.textContent = `Amount: $${Number(expense.amount).toFixed(2)}`;

    const date = document.createElement("p");
    date.textContent = `Date: ${displayDate}`;

    const description = document.createElement("p");
    description.textContent = `Description: ${expense.description || ""}`;

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

    expenseItem.append(title, category, amount, date, description, editBtn, deleteBtn);
    expenseList.appendChild(expenseItem);
    expenseItem.classList.add("added");
  });

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
  });
}

if (filterCategory) {
  filterCategory.addEventListener("change", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "category", value: this.value } });
  });
}

if (sortExpenses) {
  sortExpenses.addEventListener("change", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "sort", value: this.value } });
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", function () {
    dispatch({ type: "CLEAR_FILTERS" });
  });
}

showAuthenticatedView();
