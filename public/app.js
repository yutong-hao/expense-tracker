const API_BASE = "http://localhost:3000/api";
const API_URL = `${API_BASE}/expenses`;
const LEDGER_PAGE_SIZE = 6;
let expenseRequestId = 0;

const DEFAULT_CATEGORY_COLORS = {
  'Food':          { bg: '#ead5be', border: '#d4b896' },
  'Shopping':      { bg: 'hsl(207 51% 83%)', border: 'hsl(207 40% 71%)' },
  'Transport':     { bg: 'hsl(184 51% 83%)', border: 'hsl(184 40% 71%)' },
  'Utilities':     { bg: 'hsl(350 51% 83%)', border: 'hsl(350 40% 71%)' },
  'default':       { bg: 'hsl(210 20% 83%)', border: 'hsl(210 18% 71%)' },
};
let categoryColors = { ...DEFAULT_CATEGORY_COLORS };

let summaryMonthlyData = [];
let summarySelectedMonthExpenses = [];
let selectedSummaryYear = String(new Date().getFullYear());
let selectedSummaryMonth = "";
let selectedSummaryExpenseId = "";
let adminActivityDates = [];
let adminDatePickerMode = "year";
let adminDatePickerYear = "";
let adminDatePickerMonth = "";

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
const currentUsername = document.getElementById("current-username");
const currentRole = document.getElementById("current-role");
const currentStatus = document.getElementById("current-status");
const accountMenuBtn = document.getElementById("account-menu-btn");
const accountModal = document.getElementById("account-modal");
const accountForm = document.getElementById("account-form");
const accountUsername = document.getElementById("account-username");
const accountCurrentPassword = document.getElementById("account-current-password");
const accountNewPassword = document.getElementById("account-new-password");
const closeAccountBtn = document.getElementById("close-account");
const switchAccountBtn = document.getElementById("switch-account");
const logoutAccountBtn = document.getElementById("logout-account");
const adminPanel = document.getElementById("admin-panel");
const adminUsers = document.getElementById("admin-users");
const adminActivities = document.getElementById("admin-activities");
const manageCategoriesBtn = document.getElementById("manage-categories");
const categoryModal = document.getElementById("category-modal");
const categoryForm = document.getElementById("category-form");
const categoryId = document.getElementById("category-id");
const categoryName = document.getElementById("category-name");
const userCategories = document.getElementById("user-categories");
const saveCategoryBtn = document.getElementById("save-category");
const cancelCategoryEditBtn = document.getElementById("cancel-category-edit");
const closeCategoryModalBtn = document.getElementById("close-category-modal");
const adminUserSearch = document.getElementById("admin-user-search");
const adminRoleFilter = document.getElementById("admin-role-filter");
const adminDatePickerTrigger = document.getElementById("admin-date-picker-trigger");
const adminDatePickerLabel = document.getElementById("admin-date-picker-label");
const adminDatePickerPopover = document.getElementById("admin-date-picker-popover");
const adminDatePickerHeading = document.getElementById("admin-date-picker-heading");
const adminDatePickerGrid = document.getElementById("admin-date-picker-grid");
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
const categoryInput = document.getElementById("category");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");
const summaryYearBtn = document.getElementById("summary-year-btn");
const summaryYearLabel = document.getElementById("summary-year-label");
const summaryYearMenu = document.getElementById("summary-year-menu");
const monthlySummary = document.getElementById("monthly-summary");
const summaryLineChart = document.getElementById("summary-line-chart");
const summaryMonthExpenses = document.getElementById("summary-month-expenses");
const amountInput = document.getElementById("amount");
const expenseDate = document.getElementById("date");
const expenseSearch = document.getElementById("expense-search");
const filterCategory = document.getElementById("filter-category");
const filterMinAmount = document.getElementById("filter-min-amount");
const filterMaxAmount = document.getElementById("filter-max-amount");
const sortExpenses = document.getElementById("sort-expenses");
const clearFiltersBtn = document.getElementById("clear-filters");
const expensePrevPage = document.getElementById("expense-prev-page");
const expenseNextPage = document.getElementById("expense-next-page");
const expensePageInfo = document.getElementById("expense-page-info");

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
const deleteModalTitle = document.getElementById("delete-modal-title");
const deleteModalMessage = document.getElementById("delete-modal-message");
const cancelDeleteBtn = document.getElementById("cancel-delete");
const confirmDeleteBtn = document.getElementById("confirm-delete");

const DELETE_MODAL_TITLES = {
  category: "Delete Ledger?",
  expense: "Delete Expense?",
  user: "Delete User?"
};

function getDeleteModalMessage(deleteTarget) {
  const label = deleteTarget.label;
  const messages = {
    category: `Are you sure you want to delete ${label || "this ledger"}?\nAll bills in this ledger will be deleted too.`,
    expense: "Are you sure you want to delete this expense?",
    user: `Are you sure you want to delete ${label || "this user account"}?`
  };

  return messages[deleteTarget.type] || messages.expense;
}

const initialState = {
  authToken: localStorage.getItem("expense_token"),
  activeUser: JSON.parse(localStorage.getItem("expense_user") || "null"),
  categories: [],
  expenses: [],
  expensePagination: {
    page: 1,
    pageSize: 24,
    pageCount: 1,
    total: 0
  },
  expandedCategories: {},
  ledgerPage: 1,
  adminUserRecords: [],
  adminUserFilters: {
    search: "",
    role: "",
    dateYear: "",
    dateMonth: "",
    dateDay: "",
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
    sort: "date-desc",
    month: "",
    expenseId: ""
  },
  editingExpense: null,
  deleteTarget: null
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
        categories: [],
        expenses: [],
        expensePagination: initialState.expensePagination,
        expandedCategories: {},
        ledgerPage: 1,
        adminUserRecords: [],
        adminUserFilters: initialState.adminUserFilters,
        adminUserPagination: initialState.adminUserPagination,
        adminActivities: [],
        activityFilters: initialState.activityFilters,
        editingExpense: null,
        deleteTarget: null
      };
    case "SET_CATEGORIES":
      return {
        ...state,
        categories: action.payload.categories
      };
    case "SET_EXPENSES":
      return {
        ...state,
        expenses: action.payload.expenses,
        expensePagination: action.payload.pagination || state.expensePagination,
        ledgerPage: 1
      };
    case "SET_FILTER":
      {
        const nextFilters = {
          ...state.filters,
          [action.payload.name]: action.payload.value
        };

        return {
          ...state,
          filters: nextFilters,
          expensePagination: {
            ...state.expensePagination,
            page: 1
          },
          expandedCategories: nextFilters.category
            ? { [nextFilters.category]: true }
            : {},
          ledgerPage: 1
        };
      }
    case "SET_SUMMARY_EXPENSE_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          month: action.payload.month || "",
          expenseId: action.payload.expenseId || ""
        },
        expensePagination: {
          ...state.expensePagination,
          page: 1
        },
        expandedCategories: {},
        ledgerPage: 1
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: {
          ...initialState.filters,
          month: state.filters.month,
          expenseId: state.filters.expenseId
        },
        expensePagination: {
          ...state.expensePagination,
          page: 1
        },
        expandedCategories: {},
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
    case "SET_EXPENSE_PAGE":
      return {
        ...state,
        expensePagination: {
          ...state.expensePagination,
          page: action.payload.page
        }
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
      {
        const nextAdminUserFilters = {
          ...state.adminUserFilters,
          [action.payload.name]: action.payload.value
        };

        if (action.payload.name === "dateYear") {
          nextAdminUserFilters.dateMonth = "";
          nextAdminUserFilters.dateDay = "";
        }

        if (action.payload.name === "dateMonth") {
          nextAdminUserFilters.dateDay = "";
        }

        if (!nextAdminUserFilters.dateYear) {
          nextAdminUserFilters.dateMonth = "";
          nextAdminUserFilters.dateDay = "";
        }

        if (!nextAdminUserFilters.dateMonth) {
          nextAdminUserFilters.dateDay = "";
        }

        return {
          ...state,
          adminUserFilters: nextAdminUserFilters,
          activityFilters: {
            ...state.activityFilters,
            page: 1
          },
          adminUserPagination: {
            ...state.adminUserPagination,
            page: 1
          }
        };
      }
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
        deleteTarget: action.payload
      };
    case "CANCEL_DELETE":
      return {
        ...state,
        deleteTarget: null
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
      hideModal(editModal);
      hideModal(deleteModal);
      editForm.reset();
    }

    showAuthenticatedView();
  }

  if (action.type === "SET_FILTER" || action.type === "CLEAR_FILTERS") {
    syncFilterControls(state.filters);
  }

  if (action.type === "SET_CATEGORIES") {
    syncCategoryState(state.categories);
    renderUserCategories(state.categories);
    if (state.expenses.length) {
      renderExpenses(state.expenses, state.expandedCategories, state.ledgerPage);
    }
  }

  if (action.type === "SET_SUMMARY_EXPENSE_FILTER") {
    syncFilterControls(state.filters);
  }

  if (action.type === "SET_EXPENSES" || action.type === "TOGGLE_CATEGORY_GROUP" || action.type === "SET_LEDGER_PAGE") {
    syncFilterControls(state.filters);
    renderExpenses(state.expenses, state.expandedCategories, state.ledgerPage);
    renderExpensePagination(state.expensePagination);
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
      showModal(editModal);
    } else {
      hideModal(editModal, function () {
        editForm.reset();
      });
    }
  }

  if (state.deleteTarget !== previousState.deleteTarget) {
    if (state.deleteTarget === null) {
      hideModal(deleteModal);
    } else {
      if (deleteModalTitle) {
        deleteModalTitle.textContent = DELETE_MODAL_TITLES[state.deleteTarget.type] || DELETE_MODAL_TITLES.expense;
      }

      if (deleteModalMessage) {
        deleteModalMessage.textContent = getDeleteModalMessage(state.deleteTarget);
      }

      showModal(deleteModal);
    }
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

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureDate(dateStr) {
  return isValidDate(dateStr) && dateStr > getTodayDateString();
}

function isPositiveAmount(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) && amount > 0;
}

function validateExpenseInputs(amountElement, dateElement, amountValue = amountElement?.value, dateValue = dateElement?.value) {
  if (!setAmountValidity(amountElement, amountValue)) {
    amountElement.reportValidity();
    return false;
  }

  if (!isValidDate(dateValue)) {
    dateElement.setCustomValidity("Date must be YYYY-MM-DD and the year cannot start with 0");
    dateElement.reportValidity();
    return false;
  }

  if (isFutureDate(dateValue)) {
    dateElement.setCustomValidity("Future dates cannot be selected");
    dateElement.reportValidity();
    return false;
  }

  dateElement.setCustomValidity("");
  return true;
}

function validateExpenseFields(amountValue, dateValue) {
  return validateExpenseInputs(amountInput, expenseDate, amountValue, dateValue);
}

function validateEditExpenseFields() {
  return validateExpenseInputs(editAmount, editDate);
}

function setAmountValidity(input, value = input?.value) {
  if (!input) return true;
  const valid = isPositiveAmount(value);
  input.setCustomValidity(valid ? "" : "Amount must be greater than 0");
  return valid;
}

function configureDateInputs() {
  const today = getTodayDateString();

  [expenseDate, editDate].forEach(input => {
    if (!input) return;
    input.max = today;
    input.addEventListener("input", function () {
      if (isFutureDate(this.value)) {
        this.value = "";
        this.setCustomValidity("Future dates cannot be selected");
        this.reportValidity();
        return;
      }

      this.setCustomValidity("");
    });
  });
}

function showModal(modal) {
  if (!modal) return;
  modal.classList.remove("modal-closing");
  modal.classList.remove("hidden");
}

function hideModal(modal, afterClose) {
  if (!modal || modal.classList.contains("hidden")) {
    if (afterClose) afterClose();
    return;
  }

  modal.classList.add("modal-closing");
  modal.addEventListener("animationend", function handleClose(event) {
    if (event.target !== modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("modal-closing");
    if (afterClose) afterClose();
  }, { once: true });
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

function setSelectOptions(select, categories, firstOptionText, firstOptionValue = "") {
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = firstOptionValue;
  firstOption.textContent = firstOptionText;
  select.appendChild(firstOption);

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    select.appendChild(option);
  });

  if ([...select.options].some(option => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function syncCategoryState(categories) {
  categoryColors = {
    ...DEFAULT_CATEGORY_COLORS,
    ...categories.reduce((colors, category) => {
      colors[category.name] = {
        bg: category.bg_color,
        border: category.border_color
      };
      return colors;
    }, {})
  };

  setSelectOptions(categoryInput, categories, "Select category");
  setSelectOptions(editCategory, categories, "Select category");
  setSelectOptions(filterCategory, categories, "All categories");
}

function renderUserCategories(categories) {
  if (!userCategories) return;
  userCategories.innerHTML = "";

  if (!categories.length) {
    const empty = document.createElement("p");
    empty.className = "summary-empty";
    empty.textContent = "No ledgers found.";
    userCategories.appendChild(empty);
    return;
  }

  categories.forEach(category => {
    const item = document.createElement("div");
    item.className = "category-manager-item";
    const name = document.createElement("span");
    name.textContent = category.name;

    const swatches = document.createElement("div");
    swatches.className = "category-swatches";
    [category.bg_color, category.border_color].forEach(color => {
      const swatch = document.createElement("span");
      swatch.className = "category-swatch";
      swatch.style.background = color;
      swatch.title = color;
      swatches.appendChild(swatch);
    });

    const actions = document.createElement("div");
    actions.className = "category-manager-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "small-tool-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      categoryId.value = category.id;
      categoryName.value = category.name;
      saveCategoryBtn.textContent = "Save";
      cancelCategoryEditBtn.classList.remove("hidden");
      categoryName.focus();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "small-danger-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      deleteCategory(category.id, category.name);
    });

    actions.append(editBtn, deleteBtn);
    item.append(swatches, name, actions);
    userCategories.appendChild(item);
  });
}

function renderExpensePagination(pagination) {
  if (!expensePageInfo || !expensePrevPage || !expenseNextPage) return;
  expensePageInfo.textContent = `${pagination.page} of ${pagination.pageCount}`;
  expensePrevPage.disabled = pagination.page <= 1;
  expenseNextPage.disabled = pagination.page >= pagination.pageCount;
}

function getActivityDateParts(date) {
  const [year = "", month = "", day = ""] = String(date || "").split("-");
  return { year, month, day };
}

function getAvailableActivityYears() {
  return [...new Set(adminActivityDates.map(date => getActivityDateParts(date).year).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
}

function getAvailableActivityMonths(year) {
  return [...new Set(adminActivityDates
    .map(date => getActivityDateParts(date))
    .filter(parts => parts.year === year)
    .map(parts => parts.month)
    .filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
}

function getAvailableActivityDays(year, month) {
  return [...new Set(adminActivityDates
    .map(date => getActivityDateParts(date))
    .filter(parts => parts.year === year && parts.month === month)
    .map(parts => parts.day)
    .filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
}

function getMonthName(month) {
  const date = new Date(2020, Number(month) - 1, 1);
  return date.toLocaleString("en-AU", { month: "short" });
}

function formatAdminDateFilterLabel(filters) {
  if (filters.dateYear && filters.dateMonth && filters.dateDay) {
    return `${filters.dateDay} ${getMonthName(filters.dateMonth)} ${filters.dateYear}`;
  }

  if (filters.dateYear && filters.dateMonth) {
    return `${getMonthName(filters.dateMonth)} ${filters.dateYear}`;
  }

  if (filters.dateYear) {
    return filters.dateYear;
  }

  return "All dates";
}

function getAdminDateModeFromFilters(filters) {
  if (filters.dateYear && filters.dateMonth && filters.dateDay) return "day";
  if (filters.dateYear && filters.dateMonth) return "month";
  return "year";
}

function setAdminDatePickerMode(mode) {
  adminDatePickerMode = mode;
  renderAdminDateFilterOptions(getAppState().adminUserFilters);
}

function closeAdminDatePicker() {
  if (!adminDatePickerPopover || !adminDatePickerTrigger) return;
  adminDatePickerPopover.classList.add("hidden");
  adminDatePickerTrigger.setAttribute("aria-expanded", "false");
}

function toggleAdminDatePicker() {
  if (!adminDatePickerPopover || !adminDatePickerTrigger) return;
  const shouldOpen = adminDatePickerPopover.classList.contains("hidden");
  adminDatePickerPopover.classList.toggle("hidden", !shouldOpen);
  adminDatePickerTrigger.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) {
    renderAdminDateFilterOptions(getAppState().adminUserFilters);
  }
}

function selectAdminActivityDateFilter(nextFilter) {
  ["dateYear", "dateMonth", "dateDay"].forEach(name => {
    dispatch({
      type: "SET_ADMIN_USER_FILTER",
      payload: { name, value: nextFilter[name] || "" }
    });
  });

  closeAdminDatePicker();
  refreshAdmin();
}

function createAdminDateButton(label, className, onClick, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.disabled = Boolean(options.disabled);
  if (options.active) button.classList.add("active");
  button.addEventListener("click", onClick);
  return button;
}

function renderAdminDateYearStrip(filters) {
  const years = getAvailableActivityYears();
  const strip = document.createElement("div");
  strip.className = "admin-date-year-strip";

  years.forEach(year => {
    strip.appendChild(createAdminDateButton(year, "admin-date-chip", function () {
      adminDatePickerYear = year;
      const months = getAvailableActivityMonths(adminDatePickerYear);
      adminDatePickerMonth = months.includes(adminDatePickerMonth)
        ? adminDatePickerMonth
        : (months[0] || "");
      renderAdminDateFilterOptions(filters);
    }, {
      active: adminDatePickerYear === year
    }));
  });

  return strip;
}

function renderAdminDateMonthStrip(filters) {
  const months = getAvailableActivityMonths(adminDatePickerYear);
  const strip = document.createElement("div");
  strip.className = "admin-date-month-strip";

  months.forEach(month => {
    strip.appendChild(createAdminDateButton(getMonthName(month), "admin-date-chip", function () {
      adminDatePickerMonth = month;
      renderAdminDateFilterOptions(filters);
    }, {
      active: adminDatePickerMonth === month
    }));
  });

  return strip;
}

function renderAdminYearPicker(filters) {
  adminDatePickerHeading.textContent = "Select year";
  getAvailableActivityYears().forEach(year => {
    adminDatePickerGrid.appendChild(createAdminDateButton(year, "admin-date-cell", function () {
      selectAdminActivityDateFilter({ dateYear: year });
    }, {
      active: filters.dateYear === year && !filters.dateMonth
    }));
  });
}

function renderAdminMonthPicker(filters) {
  adminDatePickerHeading.textContent = `Select month in ${adminDatePickerYear || "year"}`;
  adminDatePickerGrid.appendChild(renderAdminDateYearStrip(filters));

  const monthGrid = document.createElement("div");
  monthGrid.className = "admin-date-picker-grid admin-date-month-grid";
  getAvailableActivityMonths(adminDatePickerYear).forEach(month => {
    monthGrid.appendChild(createAdminDateButton(getMonthName(month), "admin-date-cell", function () {
      selectAdminActivityDateFilter({
        dateYear: adminDatePickerYear,
        dateMonth: month
      });
    }, {
      active: filters.dateYear === adminDatePickerYear && filters.dateMonth === month && !filters.dateDay
    }));
  });

  adminDatePickerGrid.appendChild(monthGrid);
}

function renderAdminDayPicker(filters) {
  adminDatePickerHeading.textContent = `Select day in ${getMonthName(adminDatePickerMonth)} ${adminDatePickerYear}`;
  adminDatePickerGrid.appendChild(renderAdminDateYearStrip(filters));
  adminDatePickerGrid.appendChild(renderAdminDateMonthStrip(filters));

  const dayGrid = document.createElement("div");
  dayGrid.className = "admin-date-calendar-grid";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(dayName => {
    const label = document.createElement("span");
    label.className = "admin-date-weekday";
    label.textContent = dayName;
    dayGrid.appendChild(label);
  });

  const activeDays = getAvailableActivityDays(adminDatePickerYear, adminDatePickerMonth);
  const daysInMonth = new Date(Number(adminDatePickerYear), Number(adminDatePickerMonth), 0).getDate();
  const firstDate = new Date(Number(adminDatePickerYear), Number(adminDatePickerMonth) - 1, 1);
  const leadingBlanks = (firstDate.getDay() + 6) % 7;

  for (let index = 0; index < leadingBlanks; index += 1) {
    const blank = document.createElement("span");
    blank.className = "admin-date-calendar-blank";
    dayGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayValue = String(day).padStart(2, "0");
    dayGrid.appendChild(createAdminDateButton(String(day), "admin-date-day", function () {
      selectAdminActivityDateFilter({
        dateYear: adminDatePickerYear,
        dateMonth: adminDatePickerMonth,
        dateDay: dayValue
      });
    }, {
      disabled: !activeDays.includes(dayValue),
      active: filters.dateYear === adminDatePickerYear && filters.dateMonth === adminDatePickerMonth && filters.dateDay === dayValue
    }));
  }

  adminDatePickerGrid.appendChild(dayGrid);
}

function renderAdminDateFilterOptions(filters) {
  if (!adminDatePickerTrigger || !adminDatePickerLabel || !adminDatePickerGrid || !adminDatePickerHeading) return;

  const years = getAvailableActivityYears();
  if (!years.length) {
    adminDatePickerLabel.textContent = "No activity dates";
    adminDatePickerTrigger.disabled = true;
    return;
  }

  adminDatePickerTrigger.disabled = false;
  adminDatePickerLabel.textContent = formatAdminDateFilterLabel(filters);

  if (adminDatePickerPopover?.classList.contains("hidden")) {
    adminDatePickerMode = getAdminDateModeFromFilters(filters);
  }

  adminDatePickerYear = filters.dateYear || adminDatePickerYear || years[0];
  if (!years.includes(adminDatePickerYear)) {
    adminDatePickerYear = years[0];
  }

  const months = getAvailableActivityMonths(adminDatePickerYear);
  adminDatePickerMonth = filters.dateMonth || adminDatePickerMonth || months[0] || "";
  if (months.length && !months.includes(adminDatePickerMonth)) {
    adminDatePickerMonth = months[0];
  }

  document.querySelectorAll(".admin-date-mode").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === adminDatePickerMode);
  });

  adminDatePickerGrid.innerHTML = "";

  if (adminDatePickerMode === "month") {
    renderAdminMonthPicker(filters);
    return;
  }

  if (adminDatePickerMode === "day") {
    renderAdminDayPicker(filters);
    return;
  }

  renderAdminYearPicker(filters);
}

function syncAdminUserFilterControls(filters) {
  if (adminUserSearch) adminUserSearch.value = filters.search;
  if (adminRoleFilter) adminRoleFilter.value = filters.role;
  renderAdminDateFilterOptions(filters);
  if (activityActionFilter) activityActionFilter.value = filters.action;
}

function hasAdminUserFilter(filters) {
  return Boolean(filters.search.trim() || filters.role || filters.dateYear || filters.dateMonth || filters.dateDay || filters.action);
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
      deleteUser(user.id, user.username);
    });

    adminUsers.appendChild(row);
  });
}

function showAuthenticatedView() {
  const { authToken, activeUser } = getAppState();
  const signedIn = Boolean(authToken && activeUser);
  authView.classList.toggle("hidden", signedIn);
  appView.classList.toggle("hidden", !signedIn);

  if (currentStatus) {
    currentStatus.textContent = signedIn ? "Online" : "Offline";
    currentStatus.classList.toggle("online", signedIn);
    currentStatus.classList.toggle("offline", !signedIn);
  }

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

async function goOffline(options = {}) {
  const showMessage = options.showMessage !== false;

  try {
    await requestJson(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: authHeaders()
    });
  } catch (error) {
    console.error("Failed to record logout:", error);
  }

  clearSession();
  if (showMessage) {
    showToast("Logged out");
  }
}

function openAccountModal() {
  const { activeUser } = getAppState();
  accountUsername.value = activeUser?.username || "";
  accountCurrentPassword.value = "";
  accountNewPassword.value = "";
  accountMenuBtn.setAttribute("aria-expanded", "true");
  showModal(accountModal);
}

function closeAccountModal() {
  accountMenuBtn.setAttribute("aria-expanded", "false");
  hideModal(accountModal, function () {
    accountForm.reset();
  });
}

accountMenuBtn.addEventListener("click", openAccountModal);
closeAccountBtn.addEventListener("click", closeAccountModal);

switchAccountBtn.addEventListener("click", async function () {
  closeAccountModal();
  await goOffline({ showMessage: false });
  showAuthMode("login");
  loginForm.reset();
  document.getElementById("login-username").focus();
  showToast("Choose another account");
});

logoutAccountBtn.addEventListener("click", async function () {
  closeAccountModal();
  await goOffline();
});

accountForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const newPassword = accountNewPassword.value;
  const currentPassword = accountCurrentPassword.value;

  if (newPassword && !currentPassword) {
    showToast("Current password is required to change password");
    return;
  }

  if (newPassword && newPassword === currentPassword) {
    showToast("New password must be different from current password");
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

if (manageCategoriesBtn) {
  manageCategoriesBtn.addEventListener("click", openCategoryModal);
}

if (closeCategoryModalBtn) {
  closeCategoryModalBtn.addEventListener("click", closeCategoryModal);
}

if (categoryModal) {
  categoryModal.addEventListener("click", function (event) {
    if (event.target === categoryModal) {
      closeCategoryModal();
    }
  });
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !accountModal.classList.contains("hidden")) {
    closeAccountModal();
  }
  if (event.key === "Escape" && categoryModal && !categoryModal.classList.contains("hidden")) {
    closeCategoryModal();
  }
});

if (summaryYearBtn) {
  summaryYearBtn.addEventListener("click", function () {
    const open = summaryYearMenu.classList.toggle("hidden") === false;
    summaryYearBtn.setAttribute("aria-expanded", String(open));
  });
}

document.addEventListener("click", function (event) {
  if (!summaryYearBtn || !summaryYearMenu) return;
  if (summaryYearBtn.contains(event.target) || summaryYearMenu.contains(event.target)) return;

  summaryYearMenu.classList.add("hidden");
  summaryYearBtn.setAttribute("aria-expanded", "false");
});

function createExpenseQueryString(filters, pagination) {
  const params = new URLSearchParams();

  appendExpenseFilterParams(params, filters);
  if (filters.month) params.set("month", filters.month);
  if (filters.expenseId) params.set("id", filters.expenseId);
  if (pagination) {
    params.set("page", pagination.page);
    params.set("pageSize", pagination.pageSize);
  }

  return params.toString();
}

function appendExpenseFilterParams(params, filters) {
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.minAmount !== "") params.set("minAmount", filters.minAmount);
  if (filters.maxAmount !== "") params.set("maxAmount", filters.maxAmount);
  if (filters.sort) params.set("sort", filters.sort);
}

function createSummaryMonthExpenseQueryString(month) {
  const { filters } = getAppState();
  const params = new URLSearchParams();

  params.set("month", month);
  appendExpenseFilterParams(params, filters);

  return params.toString();
}

async function fetchExpenses() {
  const requestId = ++expenseRequestId;
  const { filters, expensePagination } = getAppState();

  try {
    const queryString = createExpenseQueryString(filters, expensePagination);
    const data = await requestJson(`${API_URL}?${queryString}`, {
      headers: authHeaders()
    });

    if (requestId !== expenseRequestId) return;

    const expenses = Array.isArray(data) ? data : (data.expenses || []);
    dispatch({
      type: "SET_EXPENSES",
      payload: {
        expenses,
        pagination: data.pagination || expensePagination
      }
    });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    showToast(error.message || "Failed to fetch expenses");
  }
}

async function fetchSummaryMonthExpenses(month) {
  const queryString = createSummaryMonthExpenseQueryString(month);
  const data = await requestJson(`${API_BASE}/summary/month-expenses?${queryString}`, {
    headers: authHeaders()
  });

  return Array.isArray(data) ? data : [];
}

async function refreshSelectedSummaryMonthExpenses() {
  if (!selectedSummaryMonth) return;

  try {
    summarySelectedMonthExpenses = await fetchSummaryMonthExpenses(selectedSummaryMonth);
  } catch (error) {
    summarySelectedMonthExpenses = [];
    console.error("Failed to fetch month expenses:", error);
  }

  renderSummaryMonthExpenses();
}

async function refreshExpenseFilters() {
  fetchExpenses();
  refreshSelectedSummaryMonthExpenses();
}

async function fetchCategories() {
  try {
    const categories = await requestJson(`${API_BASE}/categories`, {
      headers: authHeaders()
    });
    dispatch({ type: "SET_CATEGORIES", payload: { categories: Array.isArray(categories) ? categories : [] } });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    showToast(error.message || "Failed to fetch categories");
  }
}

function formatSummaryMonth(month) {
  const date = new Date(`${month}-01T00:00:00`);
  return date.toLocaleString("en", { month: "short" });
}

function getSummaryYears(monthlyData) {
  const years = [
    ...new Set([
      String(new Date().getFullYear()),
      ...monthlyData.map(item => String(item.month).slice(0, 4))
    ])
  ];
  return years.sort((a, b) => b.localeCompare(a));
}

function getSummaryMonthsForYear(year) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

function getSummaryYearTotal(year) {
  return summaryMonthlyData
    .filter(item => String(item.month).slice(0, 4) === String(year))
    .reduce((sum, item) => sum + Number(item.total || 0), 0);
}

function renderSummaryTotal() {
  if (!totalAmount) return;
  const summaryTotal = selectedSummaryMonth
    ? getSummaryMonthTotal(selectedSummaryMonth)
    : getSummaryYearTotal(selectedSummaryYear);
  totalAmount.textContent = summaryTotal.toFixed(2);
}

function renderSummaryYearMenu(years) {
  summaryYearMenu.innerHTML = "";
  summaryYearLabel.textContent = selectedSummaryYear;

  years.forEach(year => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "summary-year-option";
      button.textContent = year;
      button.classList.toggle("active", year === selectedSummaryYear);
      button.addEventListener("click", function () {
        selectedSummaryYear = year;
        clearSummarySelectionState();
        summaryYearMenu.classList.add("hidden");
        summaryYearBtn.setAttribute("aria-expanded", "false");
        dispatch({ type: "SET_SUMMARY_EXPENSE_FILTER", payload: { month: "", expenseId: "" } });
        fetchExpenses();
        renderInteractiveSummary();
      });
    summaryYearMenu.appendChild(button);
  });
}

function renderMonthlySummaryRows() {
  monthlySummary.innerHTML = "";
  const totalsByMonth = new Map(
    summaryMonthlyData.map(item => [item.month, Number(item.total)])
  );

  getSummaryMonthsForYear(selectedSummaryYear)
    .filter(month => totalsByMonth.has(month))
    .forEach(month => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "summary-month-row";
      row.classList.toggle("active", month === selectedSummaryMonth);
      row.addEventListener("click", async function () {
        await selectSummaryMonth(month);
      });

      const monthLabel = document.createElement("span");
      monthLabel.textContent = formatSummaryMonth(month);

      const total = document.createElement("span");
      total.textContent = `$${(totalsByMonth.get(month) || 0).toFixed(2)}`;

      row.append(monthLabel, total);
      monthlySummary.appendChild(row);
    });
}

function getSummaryMonthlyTotals() {
  const totalsByMonth = new Map(summaryMonthlyData.map(item => [item.month, Number(item.total)]));
  return getSummaryMonthsForYear(selectedSummaryYear)
    .filter(month => totalsByMonth.has(month))
    .map(month => ({
    month,
    total: totalsByMonth.get(month)
  }));
}

function getSummaryMonthTotal(month) {
  const item = summaryMonthlyData.find(entry => entry.month === month);
  return item ? Number(item.total) : 0;
}

function clearSummarySelectionState() {
  selectedSummaryMonth = "";
  selectedSummaryExpenseId = "";
  summarySelectedMonthExpenses = [];
}

async function selectSummaryMonth(month) {
  if (selectedSummaryMonth === month) {
    selectedSummaryMonth = "";
    selectedSummaryExpenseId = "";
    summarySelectedMonthExpenses = [];
    dispatch({ type: "SET_SUMMARY_EXPENSE_FILTER", payload: { month: "", expenseId: "" } });
    fetchExpenses();
    renderInteractiveSummary();
    return;
  }

  selectedSummaryMonth = month;
  selectedSummaryExpenseId = "";
  dispatch({ type: "SET_SUMMARY_EXPENSE_FILTER", payload: { month, expenseId: "" } });
  fetchExpenses();

  try {
    summarySelectedMonthExpenses = await fetchSummaryMonthExpenses(month);
  } catch (error) {
    summarySelectedMonthExpenses = [];
    console.error("Failed to fetch month expenses:", error);
  }

  renderInteractiveSummary();
}

function renderSummaryLineChart() {
  summaryLineChart.innerHTML = "";
  const points = getSummaryMonthlyTotals();
  const annualTotal = points.reduce((sum, item) => sum + item.total, 0);
  const average = points.length ? annualTotal / points.length : 0;
  const maxTotal = Math.max(average, ...points.map(item => item.total), 1);
  const width = 260;
  const height = 150;
  const left = 24;
  const right = 12;
  const top = 18;
  const bottom = 28;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const toX = index => left + (points.length <= 1 ? chartWidth / 2 : (chartWidth / (points.length - 1)) * index);
  const toY = value => top + chartHeight - (value / maxTotal) * chartHeight;
  const linePoints = points.map((item, index) => `${toX(index)},${toY(item.total)}`).join(" ");
  const averageY = toY(average);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "summary-line-svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${selectedSummaryYear} monthly spending line chart`);

  const averageLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  averageLine.setAttribute("class", "summary-average-line");
  averageLine.setAttribute("x1", String(left));
  averageLine.setAttribute("x2", String(width - right));
  averageLine.setAttribute("y1", String(averageY));
  averageLine.setAttribute("y2", String(averageY));
  svg.appendChild(averageLine);

  const averageLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  averageLabel.setAttribute("class", "summary-average-label");
  averageLabel.setAttribute("x", String(left));
  averageLabel.setAttribute("y", String(Math.max(10, averageY - 5)));
  averageLabel.textContent = `$${average.toFixed(2)}`;
  svg.appendChild(averageLabel);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("class", "summary-spend-line");
  line.setAttribute("points", linePoints);
  svg.appendChild(line);

  points.forEach((item, index) => {
    const isActive = item.month === selectedSummaryMonth;
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("class", `summary-line-point${isActive ? " active" : ""}`);
    point.setAttribute("cx", String(toX(index)));
    point.setAttribute("cy", String(toY(item.total)));
    point.setAttribute("r", isActive ? "6" : "4");
    point.setAttribute("tabindex", "0");
    point.setAttribute("aria-label", `${formatSummaryMonth(item.month)} $${item.total.toFixed(2)}`);
    point.addEventListener("click", function () {
      selectSummaryMonth(item.month);
    });
    point.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSummaryMonth(item.month);
      }
    });
    svg.appendChild(point);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "summary-line-month");
    label.setAttribute("x", String(toX(index)));
    label.setAttribute("y", String(height - 8));
    label.textContent = String(Number(item.month.slice(5, 7)));
    svg.appendChild(label);

    if (isActive) {
      const amount = document.createElementNS("http://www.w3.org/2000/svg", "text");
      amount.setAttribute("class", "summary-point-amount");
      amount.setAttribute("x", String(toX(index)));
      amount.setAttribute("y", String(Math.max(12, toY(item.total) - 12)));
      amount.textContent = `$${item.total.toFixed(2)}`;
      svg.appendChild(amount);
    }
  });

  summaryLineChart.appendChild(svg);
}

function renderSummaryMonthExpenses() {
  summaryMonthExpenses.innerHTML = "";

  if (!selectedSummaryMonth) {
    summaryMonthExpenses.classList.add("hidden");
    return;
  }

  summaryMonthExpenses.classList.remove("hidden");

  const heading = document.createElement("div");
  heading.className = "summary-expense-heading";
  heading.textContent = `${formatSummaryMonth(selectedSummaryMonth)} bills`;
  summaryMonthExpenses.appendChild(heading);

  if (!summarySelectedMonthExpenses.length) {
    const empty = document.createElement("p");
    empty.className = "summary-empty";
    empty.textContent = "No bills this month";
    summaryMonthExpenses.appendChild(empty);
    return;
  }

  summarySelectedMonthExpenses.forEach(expense => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "summary-expense-item";
    item.classList.toggle("active", String(expense.id) === String(selectedSummaryExpenseId));
    item.addEventListener("click", function () {
      selectedSummaryExpenseId = String(expense.id) === String(selectedSummaryExpenseId)
        ? ""
        : String(expense.id);
      dispatch({
        type: "SET_SUMMARY_EXPENSE_FILTER",
        payload: { month: selectedSummaryMonth, expenseId: selectedSummaryExpenseId }
      });
      fetchExpenses();
      renderSummaryMonthExpenses();
    });

    const title = document.createElement("span");
    title.textContent = expense.title;

    const amount = document.createElement("strong");
    amount.textContent = `$${Number(expense.amount).toFixed(2)}`;

    item.append(title, amount);
    summaryMonthExpenses.appendChild(item);
  });
}

function renderInteractiveSummary() {
  if (!monthlySummary || !summaryYearBtn || !summaryYearMenu || !summaryLineChart || !summaryMonthExpenses) return;

  const years = getSummaryYears(summaryMonthlyData);
  if (!years.includes(selectedSummaryYear)) {
    selectedSummaryYear = years.includes(String(new Date().getFullYear()))
      ? String(new Date().getFullYear())
      : (years[0] || String(new Date().getFullYear()));
  }

  renderSummaryYearMenu(years);
  renderSummaryTotal();
  renderMonthlySummaryRows();
  renderSummaryLineChart();
  renderSummaryMonthExpenses();
}

async function fetchMonthlySummary() {
  try {
    const monthlyData = await requestJson(`${API_BASE}/summary/monthly`, { headers: authHeaders() });
    summaryMonthlyData = Array.isArray(monthlyData) ? monthlyData : [];
    renderInteractiveSummary();
  } catch (error) {
    console.error("Failed to fetch monthly summary:", error);
  }
}

function createAdminQueryString(filters, pagination) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.role) params.set("role", filters.role);
  if (filters.dateYear) params.set("dateYear", filters.dateYear);
  if (filters.dateMonth) params.set("dateMonth", filters.dateMonth);
  if (filters.dateDay) params.set("dateDay", filters.dateDay);
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

async function fetchAdminActivityDates() {
  const { activeUser } = getAppState();
  if (activeUser?.role !== "admin") return;

  try {
    const data = await requestJson(`${API_BASE}/admin/activity-dates`, {
      headers: authHeaders()
    });

    adminActivityDates = Array.isArray(data.dates) ? data.dates : [];
    syncAdminUserFilterControls(getAppState().adminUserFilters);
  } catch (error) {
    console.error("Failed to fetch activity dates:", error);
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

function deleteUser(userId, username) {
  dispatch({
    type: "START_DELETE",
    payload: {
      type: "user",
      id: userId,
      label: username ? `user ${username}` : "this user account"
    }
  });
}

function resetCategoryForm() {
  if (!categoryForm) return;
  categoryForm.reset();
  categoryId.value = "";
  saveCategoryBtn.textContent = "Add";
  cancelCategoryEditBtn.classList.add("hidden");
}

function openCategoryModal() {
  resetCategoryForm();
  renderUserCategories(getAppState().categories);
  showModal(categoryModal);
}

function closeCategoryModal() {
  hideModal(categoryModal, resetCategoryForm);
}

async function saveCategory() {
  const editing = Boolean(categoryId.value);
  const url = editing
    ? `${API_BASE}/categories/${categoryId.value}`
    : `${API_BASE}/categories`;

  try {
    await requestJson(url, {
      method: editing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: categoryName.value.trim()
      })
    });

    resetCategoryForm();
    await fetchCategories();
    await fetchExpenses();
    showToast(editing ? "Category updated successfully" : "Category added successfully");
  } catch (error) {
    showToast(error.message);
  }
}

function deleteCategory(categoryIdValue, categoryNameValue) {
  dispatch({
    type: "START_DELETE",
    payload: {
      type: "category",
      id: categoryIdValue,
      label: categoryNameValue ? `ledger ${categoryNameValue}` : "this ledger"
    }
  });
}

function refreshAdmin() {
  fetchAdminActivityDates();
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

  fetchCategories();
  fetchExpenses();
  fetchMonthlySummary();
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const amountValue = amountInput.value;
  const dateValue = expenseDate.value;

  if (!validateExpenseFields(amountValue, dateValue)) {
    return;
  }

  const expense = {
    title: document.getElementById("title").value,
    category: categoryInput.value,
    amount: parseFloat(amountValue).toFixed(2),
    date: dateValue,
    description: document.getElementById("description").value
  };

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
    showToast(error.message || "Failed to add expense");
  }
});

if (categoryForm) {
  categoryForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    await saveCategory();
  });
}

if (cancelCategoryEditBtn) {
  cancelCategoryEditBtn.addEventListener("click", resetCategoryForm);
}

if (editCancelBtn) {
  editCancelBtn.addEventListener("click", function () {
    dispatch({ type: "CANCEL_EDIT" });
  });
}

if (editForm) {
  editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!validateEditExpenseFields()) {
      return;
    }

    const updatedExpense = {
      title: editTitle.value,
      category: editCategory.value,
      amount: parseFloat(editAmount.value).toFixed(2),
      date: editDate.value,
      description: editDescription.value
    };

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
      showToast(error.message || "Failed to update expense");
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
    const { deleteTarget } = getAppState();
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    const targetType = deleteTarget.type || "expense";
    const element = targetType === "expense" ? document.querySelector(`[data-id='${targetId}']`) : null;

    if (element) {
      element.classList.add("removing");
    }

    setTimeout(async () => {
      try {
        const deleteUrls = {
          category: `${API_BASE}/categories/${targetId}`,
          expense: `${API_URL}/${targetId}`,
          user: `${API_BASE}/admin/users/${targetId}`
        };
        const url = deleteUrls[targetType] || deleteUrls.expense;

        await requestJson(url, {
          method: "DELETE",
          headers: authHeaders()
        });

        dispatch({ type: "CANCEL_DELETE" });
        if (targetType === "user") {
          refreshAdmin();
          showToast("User deleted successfully");
        } else if (targetType === "category") {
          resetCategoryForm();
          await fetchCategories();
          await fetchExpenses();
          await fetchMonthlySummary();
          showToast("Category deleted successfully");
        } else {
          refreshAll();
          showToast("Expense deleted successfully");
        }
      } catch (error) {
        console.error(`Failed to delete ${targetType}:`, error);
        showToast(error.message || `Failed to delete ${targetType}`);
      }
    }, 300);
  });
}

function getCategoryColors(category) {
  return categoryColors[category] || {
    ...DEFAULT_CATEGORY_COLORS.default,
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
    const actions = document.createElement("div");
    actions.className = "expense-card-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn expense-action-btn";
    editBtn.textContent = "Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn expense-action-btn danger-action";
    deleteBtn.textContent = "Delete";

    editBtn.addEventListener("click", function () {
      dispatch({ type: "START_EDIT", payload: { expense } });
    });

    deleteBtn.addEventListener("click", function () {
      dispatch({ type: "START_DELETE", payload: { type: "expense", id: expense.id } });
    });

    actions.append(editBtn, deleteBtn);
    expenseItem.appendChild(actions);
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

  if (!expenses.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No expenses match your current filters.";
    expenseList.appendChild(empty);
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

  if (value && Number.parseFloat(value) === 0) {
    input.value = "";
    input.setCustomValidity("Amount must be greater than 0");
    input.reportValidity();
    return;
  }

  setAmountValidity(input);
}

function blockZeroAmountEntry(input) {
  if (!input) return;

  input.addEventListener("beforeinput", function (event) {
    if (event.inputType !== "insertText" || event.data !== "0") return;
    const start = this.selectionStart ?? this.value.length;
    const end = this.selectionEnd ?? this.value.length;
    const nextValue = `${this.value.slice(0, start)}${event.data}${this.value.slice(end)}`;

    if (Number.parseFloat(nextValue) === 0) {
      event.preventDefault();
      this.setCustomValidity("Amount must be greater than 0");
      this.reportValidity();
    }
  });

  input.addEventListener("input", function () {
    formatAmountInput(this);
  });
}

blockZeroAmountEntry(amountInput);
blockZeroAmountEntry(editAmount);
configureDateInputs();

if (expenseSearch) {
  expenseSearch.addEventListener("input", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "search", value: this.value } });
    refreshExpenseFilters();
  });
}

if (filterCategory) {
  filterCategory.addEventListener("change", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "category", value: this.value } });
    refreshExpenseFilters();
  });
}

if (filterMinAmount) {
  filterMinAmount.addEventListener("input", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "minAmount", value: this.value } });
    refreshExpenseFilters();
  });
}

if (filterMaxAmount) {
  filterMaxAmount.addEventListener("input", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "maxAmount", value: this.value } });
    refreshExpenseFilters();
  });
}

if (sortExpenses) {
  sortExpenses.addEventListener("change", function () {
    dispatch({ type: "SET_FILTER", payload: { name: "sort", value: this.value } });
    refreshExpenseFilters();
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", function () {
    dispatch({ type: "CLEAR_FILTERS" });
    refreshExpenseFilters();
  });
}

if (expensePrevPage) {
  expensePrevPage.addEventListener("click", function () {
    const { expensePagination } = getAppState();
    dispatch({ type: "SET_EXPENSE_PAGE", payload: { page: Math.max(1, expensePagination.page - 1) } });
    fetchExpenses();
  });
}

if (expenseNextPage) {
  expenseNextPage.addEventListener("click", function () {
    const { expensePagination } = getAppState();
    dispatch({ type: "SET_EXPENSE_PAGE", payload: { page: Math.min(expensePagination.pageCount, expensePagination.page + 1) } });
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

if (adminDatePickerTrigger) {
  adminDatePickerTrigger.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleAdminDatePicker();
  });
}

document.querySelectorAll(".admin-date-mode").forEach(button => {
  button.addEventListener("click", function (event) {
    event.stopPropagation();
    setAdminDatePickerMode(this.dataset.mode || "year");
  });
});

if (adminDatePickerPopover) {
  adminDatePickerPopover.addEventListener("click", function (event) {
    event.stopPropagation();
  });
}

document.addEventListener("click", closeAdminDatePicker);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeAdminDatePicker();
  }
});

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
