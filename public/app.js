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
const logoutBtn = document.getElementById("logout-btn");
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
        editingExpense: null,
        deleteTargetId: null
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

function showAuthenticatedView() {
  const { authToken, activeUser } = getAppState();
  const signedIn = Boolean(authToken && activeUser);
  authView.classList.toggle("hidden", signedIn);
  appView.classList.toggle("hidden", !signedIn);

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

logoutBtn.addEventListener("click", async function () {
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

async function fetchExpenses() {
  try {
    const expenses = await requestJson(API_URL, {
      headers: authHeaders()
    });
    renderExpenses(expenses);
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
      p.innerHTML = `
        <span>${item.month}</span>
        <span>$${Number(item.total).toFixed(2)}</span>
      `;
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
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>
          <select class="role-select" data-user-id="${user.id}">
            <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
        <td>${user.activity_count}</td>
        <td>${formatDateTime(user.last_activity_at)}</td>
        <td><button class="small-danger-btn" data-user-id="${user.id}">Delete</button></td>
      `;

      row.querySelector(".role-select").addEventListener("change", function () {
        updateUserRole(user.id, this.value);
      });

      row.querySelector(".small-danger-btn").addEventListener("click", function () {
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
      row.innerHTML = `
        <td>${formatDateTime(activity.created_at)}</td>
        <td>${activity.username} (${activity.role})</td>
        <td>${activity.action}</td>
        <td>${activity.details || ""}</td>
      `;
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

  expenses.forEach(function (expense) {
    total += Number(expense.amount);

    const displayDate = String(expense.expense_date).split("T")[0];

    const expenseItem = document.createElement("div");
    expenseItem.classList.add("expense-item");
    expenseItem.setAttribute("data-id", expense.id);

    expenseItem.innerHTML = `
      <h3>${expense.title}</h3>
      <p><strong>Category:</strong> ${expense.category}</p>
      <p><strong>Amount:</strong> $${Number(expense.amount).toFixed(2)}</p>
      <p><strong>Date:</strong> ${displayDate}</p>
      <p><strong>Description:</strong> ${expense.description || ""}</p>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;

    expenseItem.querySelector(".edit-btn").addEventListener("click", function () {
      dispatch({ type: "START_EDIT", payload: { expense } });
    });

    expenseItem.querySelector(".delete-btn").addEventListener("click", function () {
      dispatch({ type: "START_DELETE", payload: { id: expense.id } });
    });

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

showAuthenticatedView();
