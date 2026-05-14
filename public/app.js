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
const cancelEditBtn = document.getElementById("cancel-edit");

const deleteModal = document.getElementById("delete-modal");
const cancelDeleteBtn = document.getElementById("cancel-delete");
const confirmDeleteBtn = document.getElementById("confirm-delete");

const API_URL = "http://localhost:3000/api/expenses";

let deleteTargetId = null;

function isValidDate(dateStr) {
  return /^[1-9]\d{3}-\d{2}-\d{2}$/.test(dateStr);
}

async function fetchExpenses() {
  try {
    const response = await fetch(API_URL);
    const expenses = await response.json();
    renderExpenses(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
  }
}

async function fetchCategorySummary() {
  const res = await fetch("http://localhost:3000/api/summary/category");
  const data = await res.json();

  const summaryEl = document.getElementById("category-summary");
  summaryEl.innerHTML = "";

  data.forEach(item => {
    const p = document.createElement("p");
    p.textContent = `${item.category}: $${Number(item.total).toFixed(2)}`;
    summaryEl.appendChild(p);
  });
}

function refreshAll() {
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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(expense)
    });

    if (!response.ok) {
      throw new Error("Failed to add expense");
    }

    form.reset();
    refreshAll();
    showToast("Expense added successfully");
  } catch (error) {
    console.error("Failed to add expense:", error);
  }
});

function editExpense(expense) {
  editId.value = expense.id;
  editTitle.value = expense.title;
  editCategory.value = expense.category;
  editAmount.value = expense.amount;
  editDate.value = String(expense.expense_date).split("T")[0];
  editDescription.value = expense.description || "";

  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editModal.classList.add("hidden");
  editForm.reset();
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", closeEditModal);
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
      const response = await fetch(`${API_URL}/${editId.value}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedExpense)
      });

      if (!response.ok) {
        throw new Error("Failed to update expense");
      }

      closeEditModal();
      refreshAll();
      showToast("Expense updated successfully");
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  });
}

function deleteExpense(id) {
  deleteTargetId = id;
  deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  deleteTargetId = null;
  deleteModal.classList.add("hidden");
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async function () {
    if (deleteTargetId === null) return;

    const element = document.querySelector(`[data-id='${deleteTargetId}']`);

    if (element) {
      element.classList.add("removing");
    }

    setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/${deleteTargetId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error("Failed to delete expense");
        }

        closeDeleteModal();
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
      editExpense(expense);
    });

    expenseItem.querySelector(".delete-btn").addEventListener("click", function () {
      deleteExpense(expense.id);
    });

    expenseList.appendChild(expenseItem);

  
    expenseItem.classList.add("added");
  });

  totalAmount.textContent = total.toFixed(2);
}

refreshAll();


function showToast(message) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = "👍 " + message;

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
async function fetchMonthlySummary() {
  try {
    const res = await fetch("http://localhost:3000/api/summary/monthly");
    const data = await res.json();

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
refreshAll();