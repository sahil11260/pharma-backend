document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const EXPENSES_API_BASE = `${API_BASE}/api/expenses`;
  const STORAGE_KEY = "kavyaPharmAdminExpensesData";
  let expensesApiMode = true;

  const cardsContainer = document.getElementById("expenseCards");
  const form = document.getElementById("expenseForm");
  const searchInput = document.getElementById("searchExpense");
  const monthFilter = document.getElementById("monthFilter");
  const statusFilter = document.getElementById("statusFilter");
  const pagination = document.getElementById("pagination");

  function getAuthHeader() {
    const token = localStorage.getItem("kavya_auth_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function apiJson(url, options) {
    const res = await fetch(url, Object.assign({
      headers: Object.assign({ "Content-Type": "application/json" }, getAuthHeader())
    }, options || {}));
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  }

  async function uploadFile(file) {
    if (!file) return "";
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("https://pharma-backend-hxf9.onrender.com/api/uploads", {
        method: "POST",
        headers: getAuthHeader(),
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.filename;
      }
    } catch (e) {
      console.error("Upload failed", e);
    }
    return file.name;
  }

  function toUiStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v === "approved") return "Approved";
    if (v === "rejected") return "Rejected";
    return "Pending";
  }

  function toApiStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v.includes("approved")) return "approved";
    if (v.includes("rejected")) return "rejected";
    return "pending";
  }

  function billUrlFromAttachments(attachments) {
    if (!Array.isArray(attachments) || attachments.length === 0) return "";
    const a = attachments[0];
    if (!a) return "";
    if (/^https?:\/\//i.test(a)) return a;
    return `assets/uploads/${a}`;
  }

  function normalizeExpenseFromApi(e) {
    return {
      id: Number(e.id),
      person: e.mrName,
      type: e.category,
      amount: Number(e.amount) || 0,
      date: e.expenseDate ? String(e.expenseDate) : (e.submittedDate ? String(e.submittedDate) : ""),
      status: toUiStatus(e.status),
      bill: billUrlFromAttachments(e.attachments),
      attachments: Array.isArray(e.attachments) ? e.attachments : []
    };
  }

  async function refreshExpensesFromApiOrFallback() {
    try {
      const data = await apiJson(EXPENSES_API_BASE);
      if (Array.isArray(data)) {
        expenses = data.map(normalizeExpenseFromApi);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        expensesApiMode = true;
        return;
      }
      expensesApiMode = false;
    } catch (e) {
      console.warn("Expenses API unavailable, using localStorage.", e);
      expensesApiMode = false;
    }
  }

  async function createExpenseApi(payload) {
    return await apiJson(EXPENSES_API_BASE, { method: "POST", body: JSON.stringify(payload) });
  }

  async function updateExpenseApi(id, payload) {
    return await apiJson(`${EXPENSES_API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  async function deleteExpenseApi(id) {
    await apiJson(`${EXPENSES_API_BASE}/${id}`, { method: "DELETE" });
  }

  function loadExpensesFromStorageIfAny() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) expenses = parsed;
    } catch (e) {
      console.warn("Failed to parse stored admin expenses.", e);
    }
  }

  let expenses = [
    {
      id: 1,
      person: "Rahul Mehta",
      type: "Travel",
      amount: 1500,
      date: "2025-02-03",
      status: "Pending",
      bill: "https://via.placeholder.com/150?text=Travel+Bill",
    },
    {
      id: 2,
      person: "Pooja Singh",
      type: "Meals",
      amount: 700,
      date: "2025-01-15",
      status: "Approved",
      bill: "https://via.placeholder.com/150?text=Meal+Receipt",
    },
    {
      id: 3,
      person: "Amit Verma",
      type: "Hotel Stay",
      amount: 3200,
      date: "2025-03-10",
      status: "Pending",
      bill: "https://via.placeholder.com/150?text=Hotel+Bill",
    },
    {
      id: 4,
      person: "Karan Joshi",
      type: "Fuel",
      amount: 900,
      date: "2025-03-02",
      status: "Rejected",
      bill: "https://via.placeholder.com/150?text=Fuel+Bill",
    },
  ];

  let currentPage = 1;
  const itemsPerPage = 4;
  let editIndex = null;

  // ---------------------------------------------------------
  // 🔥 Render Cards
  // ---------------------------------------------------------
  function renderCards() {
    let filtered = expenses.filter(
      (e) =>
        (e.person.toLowerCase().includes(searchInput.value.toLowerCase()) ||
          e.type.toLowerCase().includes(searchInput.value.toLowerCase())) &&
        (monthFilter.value === "" ||
          new Date(e.date).toLocaleString("default", { month: "long" }) ===
          monthFilter.value) &&
        (statusFilter.value === "" || e.status === statusFilter.value)
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    cardsContainer.innerHTML =
      paginated
        .map(
          (e, i) => `
        <div class="col-md-3 col-sm-6">
          <div class="card expense-card shadow-sm border-0 h-100">
            <div class="card-body">
              <h5 class="card-title text-success">${e.type}</h5>
              <p><strong>MR:</strong> ${e.person}</p>
              <p><strong>Amount:</strong> ₹${e.amount}</p>
              <p><strong>Date:</strong> ${e.date}</p>
              <p><strong>Receipt:</strong> ${e.bill
              ? `<a href="${e.bill}" target="_blank" class="text-primary">View Bill</a>`
              : `<span class="text-muted">Not Uploaded</span>`
            }</p>
              <span class="badge ${e.status === "Approved"
              ? "bg-success"
              : e.status === "Rejected"
                ? "bg-danger"
                : "bg-warning text-dark"
            }">${e.status}</span>
            </div>

            <div class="card-footer bg-transparent border-0 d-flex justify-content-between">
              <div>
                ${e.status === "Pending"
              ? `
                    <button class="btn btn-sm btn-outline-success me-1" onclick="approveExpense(${e.id})"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-sm btn-outline-danger me-1" onclick="rejectExpense(${e.id})"><i class="bi bi-x-lg"></i></button>`
              : ""
            }
              </div>

              <div>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editExpense(${e.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${e.id})"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`
        )
        .join("") || `<p class="text-center text-muted">No expenses found</p>`;

    renderPagination(totalPages);
  }

  // ---------------------------------------------------------
  // 🔥 Pagination (Previous + Numbers + Next)
  // ---------------------------------------------------------
  function renderPagination(totalPages) {
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    let html = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="prev">Previous</a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="next">Next</a>
      </li>
    `;

    pagination.innerHTML = html;

    document.querySelectorAll(".page-link").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const value = btn.dataset.page;

        if (value === "prev" && currentPage > 1) currentPage--;
        else if (value === "next" && currentPage < totalPages) currentPage++;
        else if (!isNaN(value)) currentPage = parseInt(value);

        renderCards();
      })
    );
  }

  // ---------------------------------------------------------
  // 🔥 Validation
  // ---------------------------------------------------------
  function validateForm() {
    const name = form.expensePerson.value.trim();
    const type = form.expenseType.value.trim();
    const amount = Number(form.expenseAmount.value);
    const date = form.expenseDate.value;
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!name || !type || !amount || !date) {
      alert("⚠️ Please fill all fields.");
      return false;
    }

    if (!nameRegex.test(name)) {
      alert("⚠ MR Name must contain only letters.");
      return false;
    }

    if (amount <= 0) {
      alert("⚠ Amount must be positive.");
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------
  // 🔥 CRUD Operations
  // ---------------------------------------------------------
  window.approveExpense = (id) => {
    const idx = expenses.findIndex((x) => Number(x.id) === Number(id));
    if (idx === -1) return;
    expenses[idx].status = "Approved";

    (async function () {
      if (expensesApiMode) {
        try {
          await updateExpenseApi(id, {
            mrName: expenses[idx].person,
            category: expenses[idx].type,
            amount: Number(expenses[idx].amount) || 0,
            status: "approved",
            expenseDate: expenses[idx].date || null,
            description: "",
            attachments: expenses[idx].attachments || [],
            approvedBy: localStorage.getItem("signup_name") || "Admin",
            approvedDate: new Date().toISOString().split("T")[0],
            rejectionReason: null,
          });
          await refreshExpensesFromApiOrFallback();
        } catch (e) {
          console.warn("Expense approve API failed. Falling back to localStorage.", e);
          expensesApiMode = false;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      renderCards();
    })();
  };

  window.rejectExpense = (id) => {
    const idx = expenses.findIndex((x) => Number(x.id) === Number(id));
    if (idx === -1) return;
    expenses[idx].status = "Rejected";

    (async function () {
      if (expensesApiMode) {
        try {
          await updateExpenseApi(id, {
            mrName: expenses[idx].person,
            category: expenses[idx].type,
            amount: Number(expenses[idx].amount) || 0,
            status: "rejected",
            expenseDate: expenses[idx].date || null,
            description: "",
            attachments: expenses[idx].attachments || [],
            approvedBy: localStorage.getItem("signup_name") || "Admin",
            approvedDate: new Date().toISOString().split("T")[0],
            rejectionReason: "Rejected",
          });
          await refreshExpensesFromApiOrFallback();
        } catch (e) {
          console.warn("Expense reject API failed. Falling back to localStorage.", e);
          expensesApiMode = false;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      renderCards();
    })();
  };

  window.deleteExpense = (id) => {
    if (!confirm("Delete this expense?")) return;

    (async function () {
      if (expensesApiMode) {
        try {
          await deleteExpenseApi(id);
          await refreshExpensesFromApiOrFallback();
          renderCards();
          return;
        } catch (e) {
          console.warn("Expense delete API failed. Falling back to localStorage.", e);
          expensesApiMode = false;
        }
      }
      const idx = expenses.findIndex((x) => Number(x.id) === Number(id));
      if (idx !== -1) expenses.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      renderCards();
    })();
  };

  window.editExpense = (id) => {
    const e = expenses.find((x) => Number(x.id) === Number(id));
    if (!e) return;
    editIndex = Number(id);

    form.expensePerson.value = e.person;
    form.expenseType.value = e.type;
    form.expenseAmount.value = e.amount;
    form.expenseDate.value = e.date;
    form.expenseStatus.value = e.status;

    new bootstrap.Modal(document.getElementById("expenseModal")).show();
  };

  // ---------------------------------------------------------
  // 🔥 Add / Update Expense
  // ---------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const billFile = form.expenseBill.files[0];
    let uploadedFilename = "";
    if (billFile) {
      uploadedFilename = await uploadFile(billFile);
    }
    let billUrl = uploadedFilename ? `assets/uploads/${uploadedFilename}` : "";

    if (editIndex !== null && !billFile) {
      const existing = expenses.find((x) => Number(x.id) === Number(editIndex));
      billUrl = existing ? existing.bill : "";
    }

    const data = {
      id: editIndex !== null ? Number(editIndex) : ((expenses.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1),
      person: form.expensePerson.value.trim(),
      type: form.expenseType.value.trim(),
      amount: Number(form.expenseAmount.value) || 0,
      date: form.expenseDate.value,
      status: form.expenseStatus.value,
      bill: billUrl,
      attachments: uploadedFilename ? [uploadedFilename] : [],
    };

    (async function () {
      if (expensesApiMode) {
        try {
          if (editIndex !== null) {
            const existing = expenses.find((x) => Number(x.id) === Number(editIndex));
            const mergedAttachments = uploadedFilename
              ? (existing && Array.isArray(existing.attachments) ? existing.attachments.concat([uploadedFilename]) : [uploadedFilename])
              : (existing && Array.isArray(existing.attachments) ? existing.attachments : []);

            await updateExpenseApi(editIndex, {
              mrName: data.person,
              category: data.type,
              amount: Number(data.amount) || 0,
              status: toApiStatus(data.status),
              expenseDate: data.date || null,
              description: "",
              attachments: mergedAttachments,
              approvedBy: toApiStatus(data.status) === "approved" || toApiStatus(data.status) === "rejected" ? (localStorage.getItem("signup_name") || "Admin") : null,
              approvedDate: toApiStatus(data.status) === "approved" || toApiStatus(data.status) === "rejected" ? new Date().toISOString().split("T")[0] : null,
              rejectionReason: toApiStatus(data.status) === "rejected" ? "Rejected" : null,
            });
          } else {
            const created = await createExpenseApi({
              mrName: data.person,
              category: data.type,
              amount: Number(data.amount) || 0,
              expenseDate: data.date || null,
              description: "",
              attachments: data.attachments || [],
            });

            const desired = toApiStatus(data.status);
            if (created && created.id && desired !== "pending") {
              await updateExpenseApi(created.id, {
                mrName: data.person,
                category: data.type,
                amount: Number(data.amount) || 0,
                status: desired,
                expenseDate: data.date || null,
                description: "",
                attachments: data.attachments || [],
                approvedBy: localStorage.getItem("signup_name") || "Admin",
                approvedDate: new Date().toISOString().split("T")[0],
                rejectionReason: desired === "rejected" ? "Rejected" : null,
              });
            }
          }

          await refreshExpensesFromApiOrFallback();
          form.reset();
          bootstrap.Modal.getInstance(document.getElementById("expenseModal")).hide();
          editIndex = null;
          renderCards();
          return;
        } catch (e) {
          console.warn("Expense save API failed. Falling back to localStorage.", e);
          expensesApiMode = false;
        }
      }

      if (editIndex !== null) {
        const idx = expenses.findIndex((x) => Number(x.id) === Number(editIndex));
        if (idx !== -1) {
          const existing = expenses[idx];
          data.attachments = billFile
            ? (existing && Array.isArray(existing.attachments) ? existing.attachments.concat([billFile.name]) : [billFile.name])
            : (existing && Array.isArray(existing.attachments) ? existing.attachments : []);
          expenses[idx] = data;
        }
        editIndex = null;
      } else {
        expenses.push(data);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      form.reset();
      bootstrap.Modal.getInstance(document.getElementById("expenseModal")).hide();
      renderCards();
    })();
  });

  // ---------------------------------------------------------
  // 🔥 Filters
  // ---------------------------------------------------------
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderCards();
  });

  monthFilter.addEventListener("change", () => {
    currentPage = 1;
    renderCards();
  });

  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    renderCards();
  });

  loadExpensesFromStorageIfAny();
  (async function () {
    await refreshExpensesFromApiOrFallback();
    renderCards();
  })();
});
