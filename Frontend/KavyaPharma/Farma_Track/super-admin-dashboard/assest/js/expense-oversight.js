document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "";
  const EXPENSES_API_BASE = `${API_BASE}/api/expenses`;
  const expenseTableBody = document.getElementById("expenseTableBody");
  const expenseForm = document.getElementById("expenseForm");
  const addExpenseModal = new bootstrap.Modal(
    document.getElementById("addExpenseModal")
  );
  const notificationBtn = document.getElementById("notificationBtn");
  const LOCAL_STORAGE_KEY = "kavyaPharmExpenses";
  let expensesApiMode = true;

  function getAuthHeader() {
    const token = localStorage.getItem("kavya_auth_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function apiJson(url, options) {
    const res = await fetch(
      url,
      Object.assign(
        {
          headers: Object.assign(
            { "Content-Type": "application/json" },
            getAuthHeader()
          ),
        },
        options || {}
      )
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  }

  function isNumericId(id) {
    return /^[0-9]+$/.test(String(id));
  }

  function parseRupeesToNumber(amount) {
    if (typeof amount === "number") return amount;
    const cleaned = String(amount || "").replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function formatRupees(amount) {
    const num = parseRupeesToNumber(amount);
    return num.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  }

  function toUiStatus(status) {
    const s = String(status || "").toLowerCase();
    if (s === "approved") return "Approved";
    if (s === "rejected") return "Rejected";
    return "Pending";
  }

  function normalizeExpenseFromApi(e) {
    const receiptName =
      e.attachments && Array.isArray(e.attachments) && e.attachments.length
        ? e.attachments[0]
        : "No Receipt Uploaded";
    return {
      id: String(e.id),
      employee: e.mrName,
      category: e.category,
      description: e.description || "",
      amount: formatRupees(e.amount),
      date: String(e.expenseDate || e.submittedDate || ""),
      status: toUiStatus(e.status),
      receiptName: receiptName,
      _attachments: e.attachments || [],
      _rawAmount: e.amount,
    };
  }

  async function refreshExpensesFromApiOrFallback() {
    try {
      const data = await apiJson(EXPENSES_API_BASE);
      if (Array.isArray(data)) {
        const apiExpenses = data.map(normalizeExpenseFromApi);
        const localExisting = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
        const localOnly = Array.isArray(localExisting)
          ? localExisting.filter((x) => x && !isNumericId(x.id))
          : [];
        allExpenses = apiExpenses.concat(localOnly);
        saveExpenses(allExpenses);
        expensesApiMode = true;
        return;
      }
      expensesApiMode = false;
    } catch (e) {
      console.warn("Expenses API unavailable, using localStorage.", e);
      expensesApiMode = false;
    }
  }

  async function updateExpenseApi(id, payload) {
    return await apiJson(`${EXPENSES_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // --- Utility Functions for Local Storage ---

  function loadExpenses() {
    const expenses = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
    // Include the initial hardcoded expenses if storage is empty
    if (expenses.length === 0) {
      return getInitialExpenses();
    }
    return expenses;
  }

  function saveExpenses(expenses) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
  }

  function getInitialExpenses() {
    // Manually defined initial data to ensure 10 rows for pagination
    return [
      {
        id: "EXP001",
        employee: "Rajesh Kumar",
        category: "Travel",
        description: "Client meeting travel to Delhi",
        amount: "₹15,000",
        date: "2025-10-25",
        status: "Approved",
        receiptName: "Flight_Receipt_R.pdf",
      },
      {
        id: "EXP002",
        employee: "Priya Sharma",
        category: "Meals",
        description: "Doctor lunch meeting",
        amount: "₹2,500",
        date: "2025-10-24",
        status: "Pending",
        receiptName: "Lunch_Bill_P.jpg",
      },
      {
        id: "EXP003",
        employee: "Amit Singh",
        category: "Medical Samples",
        description: "Product samples for doctors in Mumbai region",
        amount: "₹8,000",
        date: "2025-10-23",
        status: "Approved",
        receiptName: "Samples_Invoice_A.pdf",
      },
      {
        id: "EXP004",
        employee: "Suresh Reddy",
        category: "Accommodation",
        description: "Hotel stay during national sales conference in Bangalore",
        amount: "₹12,000",
        date: "2025-10-22",
        status: "Rejected",
        receiptName: "Hotel_Bill_S.pdf",
      },
      {
        id: "EXP005",
        employee: "Vikram Patel",
        category: "Transportation",
        description: "Cab charges for field visits to multiple clinics in Pune",
        amount: "₹3,500",
        date: "2025-10-21",
        status: "Approved",
        receiptName: "Cab_Receipts_V.pdf",
      },
      // --- ADDED 5 MORE DATA POINTS FOR 10 PER PAGE ---
      {
        id: "EXP006",
        employee: "Anjali Rao",
        category: "Marketing",
        description: "Printed promotional materials for product launch event",
        amount: "₹22,000",
        date: "2025-10-20",
        status: "Pending",
        receiptName: "Print_Invoice_A.pdf",
      },
      {
        id: "EXP007",
        employee: "Gaurav Joshi",
        category: "Travel",
        description: "Train ticket to regional office for training",
        amount: "₹4,200",
        date: "2025-10-19",
        status: "Approved",
        receiptName: "Train_Ticket_G.pdf",
      },
      {
        id: "EXP008",
        employee: "Kirti Menon",
        category: "Office Supplies",
        description:
          "Purchase of stationery and printer ink for regional office",
        amount: "₹1,800",
        date: "2025-10-18",
        status: "Pending",
        receiptName: "Supplies_Bill_K.jpg",
      },
      {
        id: "EXP009",
        employee: "Rahul Desai",
        category: "Meals",
        description:
          "Dinner with key account doctor and hospital administrator",
        amount: "₹7,500",
        date: "2025-10-17",
        status: "Approved",
        receiptName: "Dinner_Receipt_R2.pdf",
      },
      {
        id: "EXP010",
        employee: "Deepak Yadav",
        category: "Transportation",
        description: "Fuel refill for company vehicle for month of October",
        amount: "₹5,500",
        date: "2025-10-16",
        status: "Rejected",
        receiptName: "Fuel_Slip_D.jpg",
      },
    ];
  }

  // --- Rendering and Event Listeners ---

  function createExpenseRow(expense) {
    const newRow = document.createElement("tr");
    let statusClass = "bg-warning"; // Default to Pending
    if (expense.status === "Approved") statusClass = "bg-success";
    if (expense.status === "Rejected") statusClass = "bg-danger";

    const statusBadge = `<span class="badge ${statusClass}">${expense.status}</span>`;

    newRow.innerHTML = `
        <td>${expense.id}</td>
        <td>${expense.employee}</td>
        <td>${expense.category}</td>
        <td class="expense-description" data-full-desc="${expense.description
      }">${expense.description.substring(0, 50)}${expense.description.length > 50 ? "..." : ""
      }</td>
        <td data-receipt-name="${expense.receiptName}" data-receipt-url="#">${expense.amount
      }</td>
        <td>${expense.date}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-sm btn-outline-info view-expense-btn" data-bs-toggle="modal" data-bs-target="#viewExpenseModal">
                <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-success approve-btn">
                <i class="bi bi-check-circle"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger reject-btn">
                <i class="bi bi-x-circle"></i>
            </button>
        </td>
    `;
    return newRow;
  }

  // NOTE: This renderExpenses function will now handle all 10 items.
  // The pagination *visuals* are currently hardcoded in the HTML
  // to show pages 1, 2, 3, but the JavaScript displays all 10 rows.
  // To truly implement 10-per-page logic, the pagination functions would need to be modified.
  // Since the request was to "return same as it is" with 10 data points,
  // I am maintaining the function as is, which renders all loaded data.
  function renderExpenses(expenses) {
    // Clear the existing rows
    expenseTableBody.innerHTML = "";

    // Render the expenses from the storage array
    expenses.forEach((expense) => {
      const row = createExpenseRow(expense);
      expenseTableBody.appendChild(row);
    });

    // Reattach event listeners to new rows
    attachViewExpenseListeners();
    attachStatusChangeListeners();
  }

  // Initial load and render
  let allExpenses = loadExpenses();
  renderExpenses(allExpenses);

  (async function () {
    await refreshExpensesFromApiOrFallback();
    renderExpenses(allExpenses);
  })();

  // --- Form Submission Handler ---

  expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const expenseId = document.getElementById("expenseId").value;
    const employeeName = document.getElementById("employeeName").value;
    const expenseCategory = document.getElementById("expenseCategory").value;
    const rawAmount = parseFloat(
      document.getElementById("expenseAmount").value
    );
    // Formatting the amount as Indian Rupees
    const expenseAmount = rawAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
    const expenseDate = document.getElementById("expenseDate").value;
    const expenseDescription =
      document.getElementById("expenseDescription").value;
    const expenseReceipt = document.getElementById("expenseReceipt").files[0];

    let receiptName = "No Receipt Uploaded";
    if (expenseReceipt) receiptName = expenseReceipt.name;

    const newExpense = {
      id: expenseId,
      employee: employeeName,
      category: expenseCategory,
      description: expenseDescription,
      amount: expenseAmount,
      date: expenseDate,
      status: "Pending", // New expenses are always pending
      receiptName: receiptName,
    };

    (async function () {
      if (expensesApiMode) {
        try {
          const created = await apiJson(EXPENSES_API_BASE, {
            method: "POST",
            body: JSON.stringify({
              mrName: newExpense.employee,
              category: newExpense.category,
              amount: parseRupeesToNumber(newExpense.amount),
              expenseDate: newExpense.date,
              description: newExpense.description,
              attachments:
                receiptName && receiptName !== "No Receipt Uploaded"
                  ? [receiptName]
                  : [],
            }),
          });

          if (created) {
            allExpenses.unshift(normalizeExpenseFromApi(created));
            saveExpenses(allExpenses);
            renderExpenses(allExpenses);
            expenseForm.reset();
            addExpenseModal.hide();
            return;
          }
        } catch (err) {
          console.warn("Expense create API failed. Falling back to localStorage.", err);
          expensesApiMode = false;
        }
      }

      allExpenses.unshift(newExpense);
      saveExpenses(allExpenses);
      renderExpenses(allExpenses);
      expenseForm.reset();
      addExpenseModal.hide();
    })();
  });

  // --- Status Change Handlers ---

  function attachStatusChangeListeners() {
    document.querySelectorAll(".approve-btn").forEach((button) => {
      button.onclick = function () {
        const row = this.closest("tr");
        const expenseId = row.querySelector("td:first-child").textContent;

        const expenseIndex = allExpenses.findIndex(
          (exp) => exp.id === expenseId
        );
        if (expenseIndex !== -1) {
          (async function () {
            allExpenses[expenseIndex].status = "Approved";

            if (expensesApiMode && isNumericId(expenseId)) {
              try {
                const exp = allExpenses[expenseIndex];
                const approvedBy = localStorage.getItem("signup_name") || "SuperAdmin";
                const updated = await updateExpenseApi(expenseId, {
                  mrName: exp.employee,
                  category: exp.category,
                  amount: parseRupeesToNumber(exp._rawAmount != null ? exp._rawAmount : exp.amount),
                  status: "Approved",
                  expenseDate: exp.date,
                  description: exp.description,
                  attachments: exp._attachments || (exp.receiptName && exp.receiptName !== "No Receipt Uploaded" ? [exp.receiptName] : []),
                  approvedBy: approvedBy,
                  approvedDate: new Date().toISOString().split("T")[0],
                  rejectionReason: null,
                });
                if (updated) {
                  allExpenses[expenseIndex] = normalizeExpenseFromApi(updated);
                }
              } catch (err) {
                console.warn("Expense approve API failed. Falling back to localStorage.", err);
                expensesApiMode = false;
              }
            }

            saveExpenses(allExpenses);
            renderExpenses(allExpenses);
          })();
        } else {
          // Fallback for non-persistent data (if somehow an unsaved row is approved)
          const statusCell = row.querySelector("td:nth-child(7)");
          statusCell.innerHTML = `<span class="badge bg-success">Approved</span>`;
        }
      };
    });

    document.querySelectorAll(".reject-btn").forEach((button) => {
      button.onclick = function () {
        const row = this.closest("tr");
        const expenseId = row.querySelector("td:first-child").textContent;

        const expenseIndex = allExpenses.findIndex(
          (exp) => exp.id === expenseId
        );
        if (expenseIndex !== -1) {
          (async function () {
            allExpenses[expenseIndex].status = "Rejected";

            if (expensesApiMode && isNumericId(expenseId)) {
              try {
                const exp = allExpenses[expenseIndex];
                const updated = await updateExpenseApi(expenseId, {
                  mrName: exp.employee,
                  category: exp.category,
                  amount: parseRupeesToNumber(exp._rawAmount != null ? exp._rawAmount : exp.amount),
                  status: "Rejected",
                  expenseDate: exp.date,
                  description: exp.description,
                  attachments: exp._attachments || (exp.receiptName && exp.receiptName !== "No Receipt Uploaded" ? [exp.receiptName] : []),
                  approvedBy: null,
                  approvedDate: null,
                  rejectionReason: "Rejected",
                });
                if (updated) {
                  allExpenses[expenseIndex] = normalizeExpenseFromApi(updated);
                }
              } catch (err) {
                console.warn("Expense reject API failed. Falling back to localStorage.", err);
                expensesApiMode = false;
              }
            }

            saveExpenses(allExpenses);
            renderExpenses(allExpenses);
          })();
        } else {
          // Fallback for non-persistent data
          const statusCell = row.querySelector("td:nth-child(7)");
          statusCell.innerHTML = `<span class="badge bg-danger">Rejected</span>`;
        }
      };
    });
  }

  // --- View Expense Modal Listener (Existing logic adapted) ---

  const viewExpenseModalEl = document.getElementById("viewExpenseModal");

  // Create the View Expense Modal HTML dynamically as it's missing in your HTML
  const viewModalHTML = `
        <div class="modal fade" id="viewExpenseModal" tabindex="-1" aria-labelledby="viewExpenseModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="viewExpenseModalLabel">Expense Details: <span id="viewExpenseId"></span></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <strong>Employee Name:</strong> <span id="viewEmployeeName"></span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <strong>Category:</strong> <span id="viewExpenseCategory"></span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <strong>Amount:</strong> <span id="viewExpenseAmount"></span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <strong>Date:</strong> <span id="viewExpenseDate"></span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <strong>Status:</strong> <span id="viewExpenseStatus"></span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <strong>Receipt:</strong> <div id="viewExpenseReceipt"></div>
                            </div>
                            <div class="col-12 mb-3">
                                <strong>Description:</strong> <p id="viewExpenseDescription" class="mt-2"></p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  if (!viewExpenseModalEl) {
    document.body.insertAdjacentHTML("beforeend", viewModalHTML);
  }

  function attachViewExpenseListeners() {
    document.querySelectorAll(".view-expense-btn").forEach((button) => {
      button.onclick = function () {
        const row = this.closest("tr");
        const cells = row.querySelectorAll("td");
        const id = cells[0].textContent;
        const employee = cells[1].textContent;
        const category = cells[2].textContent;
        const descriptionElement = row.querySelector(".expense-description");
        const description = descriptionElement
          ? descriptionElement.getAttribute("data-full-desc") ||
          descriptionElement.textContent
          : "N/A";
        const amount = cells[4].textContent;
        const date = cells[5].textContent;
        const statusHTML = cells[6].innerHTML;
        const receiptName =
          cells[4].getAttribute("data-receipt-name") || "No Receipt Uploaded";

        document.getElementById("viewExpenseId").textContent = id;
        document.getElementById("viewEmployeeName").textContent = employee;
        document.getElementById("viewExpenseCategory").textContent = category;
        document.getElementById("viewExpenseAmount").textContent = amount;
        document.getElementById("viewExpenseDate").textContent = date;
        document.getElementById("viewExpenseDescription").textContent =
          description;
        document.getElementById("viewExpenseStatus").innerHTML = statusHTML;

        const receiptDiv = document.getElementById("viewExpenseReceipt");
        receiptDiv.innerHTML = "";
        if (receiptName !== "No Receipt Uploaded") {
          receiptDiv.innerHTML = `<a href="#" onclick="return false;">${receiptName} (Preview Link)</a>`;
        } else {
          receiptDiv.textContent = receiptName;
        }
      };
    });
  }

  // Attach listeners initially (will be re-attached on render)
  attachViewExpenseListeners();
  attachStatusChangeListeners();

  // --- Search Functionality (Existing logic adapted) ---

  const searchInput = document.getElementById("expenseSearchInput");
  searchInput.addEventListener("keyup", function () {
    const filter = searchInput.value.toLowerCase();
    const rows = expenseTableBody.getElementsByTagName("tr");

    Array.from(rows).forEach((row) => {
      const cells = row.getElementsByTagName("td");
      let found = false;

      Array.from(cells).forEach((cell, index) => {
        // Exclude actions column (index 7) from search
        if (index < 7 && cell.textContent.toLowerCase().includes(filter)) {
          found = true;
        }
      });

      row.style.display = found ? "" : "none";
    });
  });

  // --- Notification Button Logic (Existing logic adapted) ---

  if (notificationBtn) {
    notificationBtn.addEventListener("click", function () {
      const existingPopup = document.getElementById("notificationPopup");
      if (existingPopup) {
        existingPopup.remove();
        return;
      }

      const popup = document.createElement("div");
      popup.id = "notificationPopup";
      // Using CSS variables for better theme integration
      popup.innerHTML = `
        <div style="position: fixed; background: var(--bs-body-bg); border: 1px solid var(--bs-border-color); border-radius: 8px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; min-width: 250px;">
          <h6 style="margin: 0 0 10px 0; font-weight: bold;">Notifications</h6>
          <div style="margin-bottom: 8px;">• New order received</div>
          <div style="margin-bottom: 8px;">• Inventory low alert</div>
          <div style="margin-bottom: 8px;">• System update available</div>
          <div style="margin-bottom: 8px; color: var(--bs-primary); cursor: pointer;">• View all notifications</div>
        </div>
      `;

      document.body.appendChild(popup);
      const btnRect = notificationBtn.getBoundingClientRect();
      const popupEl = popup.querySelector("div");
      // Positioning logic to avoid overflow/better alignment
      const viewportWidth = window.innerWidth;
      let leftPosition = btnRect.right - popupEl.offsetWidth;
      // If the calculated position overflows the viewport, align it to the button's left
      if (
        leftPosition < 0 ||
        leftPosition + popupEl.offsetWidth > viewportWidth
      ) {
        leftPosition = btnRect.left;
      }
      popupEl.style.left = leftPosition + "px";
      popupEl.style.top = btnRect.bottom + 5 + "px";

      document.addEventListener("click", function closePopup(e) {
        if (!notificationBtn.contains(e.target) && !popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener("click", closePopup);
        }
      });
    });
  }
});

// --- Notification Popup Logic ---
const notificationBtn = document.getElementById("notificationBtn");
if (notificationBtn) {
  notificationBtn.addEventListener("click", function () {
    const existingPopup = document.getElementById("notificationPopup");
    if (existingPopup) {
      existingPopup.remove();
      return;
    }

    const popup = document.createElement("div");
    popup.id = "notificationPopup";
    popup.innerHTML = `
                <div style="position: fixed; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; min-width: 250px;">
                  <h6 style="margin: 0 0 10px 0; font-weight: bold;">Notifications</h6>
                  <div style="margin-bottom: 8px;">• New order received</div>
                  <div style="margin-bottom: 8px;">• Inventory low alert</div>
                  <div style="margin-bottom: 8px;">• System update available</div>
                  <div style="margin-bottom: 8px;">• View all notifications</div>
                </div>
              `;

    document.body.appendChild(popup);

    const btnRect = notificationBtn.getBoundingClientRect();
    const popupEl = popup.querySelector("div");
    popupEl.style.left = btnRect.left - 200 + "px";
    popupEl.style.top = btnRect.bottom + 5 + "px";

    document.addEventListener("click", function closePopup(e) {
      if (!notificationBtn.contains(e.target) && !popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener("click", closePopup);
      }
    });
  });
}
