(() => {
  const EXPENSES_KEY = "kavyaPharmExpensesData";
  const MR_KEY = "kavyaPharmMrData";
  const NOTIFICATIONS_KEY = "kavyaPharmNotificationsData";
  const ALERTS_KEY = "kavyaPharmAlertsData";

  // Fallback data (used only if localStorage is empty/corrupt)
  const fallbackMrData = [
    { id: 1, name: "Rajesh Kumar" },
    { id: 2, name: "Priya Sharma" },
    { id: 3, name: "Amit Singh" },
    { id: 4, name: "Sneha Patel" },
  ];

  // NOTE: intentionally no 'paid' status anywhere
  const fallbackExpenses = [
    {
      id: 1,
      mrName: "Rajesh Kumar",
      category: "travel",
      amount: 2500,
      description: "Taxi fare for doctor visits",
      status: "pending",
      submittedDate: "2025-11-06",
      expenseDate: "2025-11-05",
      attachments: ["receipt1.jpg"],
    },
    {
      id: 2,
      mrName: "Priya Sharma",
      category: "meals",
      amount: 850,
      description: "Lunch meeting",
      status: "approved",
      submittedDate: "2025-11-05",
      expenseDate: "2025-11-04",
      attachments: ["receipt2.jpg"],
      approvedBy: "Admin",
      approvedDate: "2025-11-06",
    },
    {
      id: 3,
      mrName: "Amit Singh",
      category: "accommodation",
      amount: 3200,
      description: "Hotel during conference",
      status: "pending",
      submittedDate: "2025-11-07",
      expenseDate: "2025-11-03",
      attachments: ["hotel_bill.pdf"],
    },
  ];

  const fallbackNotifications = [
    {
      icon: "bi-bell",
      iconClass: "bg-primary",
      title: "Welcome",
      description: "Manager dashboard ready",
      time: "Just now",
    },
    {
      icon: "bi-clock-history",
      iconClass: "bg-warning",
      title: "12 expense reports awaiting your approval",
      description: "Review pending expenses and approve or reject them.",
      time: "2 hrs ago",
    },
  ];
  const fallbackAlerts = [
    {
      icon: "bi-exclamation-triangle",
      iconClass: "bg-warning",
      title: "Reminder",
      description: "Check pending expenses",
      type: "warning",
    },
  ];

  // Robust localStorage helpers
  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify(fallback));
        // return deep copy
        return JSON.parse(JSON.stringify(fallback));
      }
      const parsed = JSON.parse(raw);
      // defensive: if parsed is not array/object, reset
      if (!Array.isArray(parsed) && typeof parsed !== "object") {
        localStorage.setItem(key, JSON.stringify(fallback));
        return JSON.parse(JSON.stringify(fallback));
      }
      return parsed;
    } catch (err) {
      console.error(`[expenses-manager] read error for ${key}`, err);
      try {
        localStorage.setItem(key, JSON.stringify(fallback));
      } catch (e) {
        console.error(`[expenses-manager] fallback write failed for ${key}`, e);
      }
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  function safeSet(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`[expenses-manager] write error for ${key}`, err);
    }
  }

  // Load / init data
  let mrData = safeGet(MR_KEY, fallbackMrData);
  let expensesData = safeGet(EXPENSES_KEY, fallbackExpenses);
  let notificationsData = safeGet(NOTIFICATIONS_KEY, fallbackNotifications);
  let alertsData = safeGet(ALERTS_KEY, fallbackAlerts);

  // Expose for debugging in console if needed
  window._mgr_expensesData = expensesData;
  window._mgr_mrData = mrData;

  // Small utilities
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function fmtDate(d) {
    if (!d) return "-";
    // keep only date (no time)
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  function catIcon(c) {
    const map = {
      travel: "bi bi-car-front",
      meals: "bi bi-cup-straw",
      accommodation: "bi bi-house",
      samples: "bi bi-box-seam",
      miscellaneous: "bi bi-three-dots",
      fuel: "bi bi-fuel-pump",
      office_supplies: "bi bi-pencil-square",
      entertainment: "bi bi-music-note-list",
    };
    return map[(c || "").toLowerCase()] || "bi bi-receipt";
  }
  function statusBadge(s) {
    const map = {
      pending: '<span class="badge bg-warning">Pending</span>',
      approved: '<span class="badge bg-success">Approved</span>',
      rejected: '<span class="badge bg-danger">Rejected</span>',
    };
    return map[s] || `<span class="badge bg-secondary">${esc(s)}</span>`;
  }

  // Pagination & state
  let currentPage = 1;
  const perPage = 6;
  let currentFiltered = [];

  /* -------------------------
     Renderers
  ------------------------- */

  function renderSummary() {
    const el = document.getElementById("summaryCards");
    if (!el) return;
    const all = Array.isArray(expensesData) ? expensesData : [];
    const pending = all.filter((x) => x.status === "pending").length;
    const approved = all.filter((x) => x.status === "approved").length;
    const rejected = all.filter((x) => x.status === "rejected").length;
    const totalAmt = all.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // All cards same size (HTML/CSS should supply classes for colouring; this is content)
    el.innerHTML = `
      <div class="col-md-3">
        <div class="card summary-card summary-pending">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div><h4 class="mb-0">${pending}</h4><small>Pending</small></div>
            <i class="bi bi-clock fs-3 text-white"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card summary-card summary-approved">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div><h4 class="mb-0">${approved}</h4><small>Approved</small></div>
            <i class="bi bi-check-circle fs-3 text-white"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card summary-card summary-rejected">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div><h4 class="mb-0">${rejected}</h4><small>Rejected</small></div>
            <i class="bi bi-x-circle fs-3 text-white"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card summary-card summary-total">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div><h5 class="mb-0">₹${totalAmt.toLocaleString()}</h5><small>Total</small></div>
            <i class="bi bi-cash-stack fs-3 text-white"></i>
          </div>
        </div>
      </div>
    `;
  }

  function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    // detect dark mode and pick classes so text remains visible
    const isDark = document.body.classList.contains("dark-mode");

    // Build notification entries array (alerts first)
    const all = [...(alertsData || []), ...(notificationsData || [])];

    container.innerHTML = all
      .map((n) => {
        // Choose title/desc classes depending on theme
        const titleClass = isDark ? "fw-bold text-white" : "fw-bold text-dark";
        const descClass = isDark ? "small text-light" : "small text-muted";
        const timeClass = isDark ? "small text-light" : "small text-muted";

        // Ensure icon wrapper has reasonable contrast — iconClass typically background classes like bg-primary
        const iconWrapperClass = `${esc(n.iconClass || "bg-primary")} text-white me-3 p-2 rounded`;

        return `
      <div class="p-3 border-bottom" style="${isDark ? 'background:transparent;' : ''}">
        <div class="d-flex align-items-start">
          <div class="${iconWrapperClass}"><i class="bi ${esc(n.icon)}"></i></div>
          <div class="flex-grow-1">
            <div class="${titleClass}">${esc(n.title)}</div>
            <div class="${descClass} mt-1">${esc(n.description)}</div>
            ${n.time ? `<div class="${timeClass} mt-1">${esc(n.time)}</div>` : ""}
          </div>
        </div>
      </div>
    `;
      })
      .join("");
  }

  function renderTable(items) {
    const tbody = document.getElementById("expensesList");
    if (!tbody) return;
    items = Array.isArray(items) ? items : [];
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * perPage;
    const pageItems = items.slice(start, start + perPage);

    tbody.innerHTML =
      pageItems
        .map((exp) => {
          const isPending = exp.status === "pending";
          const isApproved = exp.status === "approved";
          // Date column shows submittedDate (formatted)
          return `
        <tr>
          <td><i class="${catIcon(exp.category)} me-2"></i>${esc(exp.mrName)}</td>
          <td>${esc(exp.category)}</td>
          <td>₹${Number(exp.amount || 0).toFixed(2)}</td>
          <td>${statusBadge(exp.status)}</td>
          <td>${fmtDate(exp.submittedDate)}</td>
          <td class="table-actions">
            ${isPending ? `<button class="btn btn-outline-success btn-sm btn-approve me-1" data-id="${exp.id}" title="Approve"><i class="bi bi-check-lg"></i></button>` : `<button class="btn btn-outline-success btn-sm me-1 disabled-btn" disabled><i class="bi bi-check-lg"></i></button>`}
            <button class="btn btn-outline-primary btn-sm btn-edit me-1" data-id="${exp.id}" title="Edit"><i class="bi bi-pencil"></i></button>
            ${isApproved ? `<button class="btn btn-outline-danger btn-sm me-1 disabled-btn" disabled title="Cannot reject approved"><i class="bi bi-x-lg"></i></button>` : `<button class="btn btn-outline-danger btn-sm btn-reject me-1" data-id="${exp.id}" title="Reject"><i class="bi bi-x-lg"></i></button>`}
            <button class="btn btn-outline-danger btn-sm btn-delete" data-id="${exp.id}" title="Delete"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
        })
        .join("") || `<tr><td colspan="6" class="text-center text-muted">No expenses found</td></tr>`;

    wireTableButtons();
    renderPagination(Math.max(1, Math.ceil(items.length / perPage)));
    const tableCount = document.getElementById("tableCount");
    if (tableCount) tableCount.textContent = `${items.length} item(s)`;
  }

  function wireTableButtons() {
    const tbody = document.getElementById("expensesList");
    if (!tbody) return;
    tbody.querySelectorAll(".btn-approve").forEach((b) => {
      b.removeEventListener("click", onApprove);
      b.addEventListener("click", onApprove);
    });
    tbody.querySelectorAll(".btn-edit").forEach((b) => {
      b.removeEventListener("click", onEdit);
      b.addEventListener("click", onEdit);
    });
    tbody.querySelectorAll(".btn-reject").forEach((b) => {
      b.removeEventListener("click", onReject);
      b.addEventListener("click", onReject);
    });
    tbody.querySelectorAll(".btn-delete").forEach((b) => {
      b.removeEventListener("click", onDelete);
      b.addEventListener("click", onDelete);
    });
  }

  function renderPagination(totalPages) {
    const ul = document.getElementById("pagination");
    if (!ul) return;
    if (totalPages <= 1) {
      ul.innerHTML = "";
      return;
    }
    let html = `<li class="page-item ${currentPage === 1 ? "disabled" : ""}"><a class="page-link" href="#" data-page="prev">Prev</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? "active" : ""}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}"><a class="page-link" href="#" data-page="next">Next</a></li>`;
    ul.innerHTML = html;
    ul.querySelectorAll(".page-link").forEach((a) => {
      a.removeEventListener("click", onPageClick);
      a.addEventListener("click", onPageClick);
    });
  }
  function onPageClick(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    const totalPages = Math.max(1, Math.ceil(currentFiltered.length / perPage));
    if (page === "prev" && currentPage > 1) currentPage--;
    else if (page === "next" && currentPage < totalPages) currentPage++;
    else if (!isNaN(Number(page))) currentPage = Number(page);
    renderTable(currentFiltered);
  }

  /* -------------------------
     Filters (search, month, status)
  ------------------------- */
  function applyFilters() {
    const q = (document.getElementById("searchExpense")?.value || "").trim().toLowerCase();
    const month = (document.getElementById("monthFilter")?.value || "");
    const status = (document.getElementById("filterStatus")?.value || "");

    currentFiltered = (Array.isArray(expensesData) ? expensesData : []).filter((e) => {
      let ok = true;
      if (q) {
        ok =
          (e.mrName || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q);
      }
      if (ok && month) {
        const d = new Date(e.expenseDate || e.submittedDate || "");
        const m = isNaN(d.getTime()) ? "" : d.toLocaleString("default", { month: "long" });
        ok = m === month;
      }
      if (ok && status) ok = e.status === status;
      return ok;
    });

    currentPage = 1;
    renderTable(currentFiltered);
  }

  /* -------------------------
     Actions: approve, reject, delete, edit, download
  ------------------------- */
  function onApprove(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!confirm("Approve this expense?")) return;
    const idx = expensesData.findIndex((x) => x.id === id);
    if (idx === -1) return alert("Expense not found");
    if (expensesData[idx].status !== "pending") return alert("Only pending expenses can be approved");
    expensesData[idx].status = "approved";
    expensesData[idx].approvedBy = localStorage.getItem("signup_name") || "Manager";
    expensesData[idx].approvedDate = new Date().toISOString().split("T")[0];
    safeSet(EXPENSES_KEY, expensesData);
    applyFilters();
    renderSummary();
  }

  function onReject(e) {
    const id = Number(e.currentTarget.dataset.id);
    const reason = prompt("Enter rejection reason:");
    if (!reason || !reason.trim()) return alert("Rejection cancelled - reason required.");
    const idx = expensesData.findIndex((x) => x.id === id);
    if (idx === -1) return alert("Expense not found");
    if (expensesData[idx].status !== "pending") return alert("Only pending expenses can be rejected");
    expensesData[idx].status = "rejected";
    expensesData[idx].rejectionReason = reason.trim();
    expensesData[idx].approvedBy = localStorage.getItem("signup_name") || "Manager";
    expensesData[idx].approvedDate = new Date().toISOString().split("T")[0];
    safeSet(EXPENSES_KEY, expensesData);
    applyFilters();
    renderSummary();
  }

  function onDelete(e) {
    const id = Number(e.currentTarget.dataset.id);
    const idx = expensesData.findIndex((x) => x.id === id);
    if (idx === -1) return alert("Expense not found");
    if (!confirm(`Delete expense #${id} (${expensesData[idx].mrName} - ₹${Number(expensesData[idx].amount).toFixed(2)})?`)) return;
    expensesData.splice(idx, 1);
    safeSet(EXPENSES_KEY, expensesData);
    applyFilters();
    renderSummary();
  }

  function onEdit(e) {
    const id = Number(e.currentTarget.dataset.id);
    openEditModal(id);
  }

  /* -------------------------
     Edit modal + attachments + status dropdown
  ------------------------- */
  function openEditModal(id) {
    // create modal once (on demand)
    if (!document.getElementById("editExpenseModal")) {
      const html = `
        <div class="modal fade" id="editExpenseModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header"><h5 class="modal-title">Edit Expense</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
              <div class="modal-body">
                <form id="editExpenseForm">
                  <input type="hidden" id="editExpenseId" />
                  <div class="row g-2">
                    <div class="col-md-6"><label class="form-label">MR</label><select id="editMrSelect" class="form-select"></select></div>
                    <div class="col-md-6"><label class="form-label">Expense Category</label>
                      <!-- CHANGED: input -> select to match Add Expense categories -->
                      <select id="editCategorySelect" class="form-select">
                        <option value="">Select category</option>
                        <option value="travel">Travel</option>
                        <option value="meals">Meals</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="samples">Samples</option>
                        <option value="fuel">Fuel</option>
                        <option value="office_supplies">Office Supplies</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="miscellaneous">Miscellaneous</option>
                      </select>
                    </div>
                  </div>
                  <div class="row g-2 mt-2">
                    <div class="col-md-6"><label class="form-label">Amount</label><input id="editAmount" type="number" step="0.01" class="form-control" required /></div>
                    <div class="col-md-6"><label class="form-label">Expense Date</label><input id="editExpenseDate" type="date" class="form-control" required /></div>
                  </div>
                  <div class="mt-2"><label class="form-label">Description</label><textarea id="editDescription" rows="3" class="form-control"></textarea></div>
                  <div class="mt-2"><label class="form-label">Attachments</label><div id="editAttachmentsList" class="small mb-2"></div><div><label class="form-label">Add Attachment (optional)</label><input id="editAttachmentFile" type="file" class="form-control" accept="image/*,.pdf" /></div></div>

                  <div class="row g-2 mt-3">
                    <div class="col-md-4"><label class="form-label">Status</label><select id="editStatus" class="form-select"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
                    <div class="col-md-8"><label class="form-label">Rejection Reason (optional)</label><input id="editRejectionReason" class="form-control" placeholder="If rejected, provide reason" /></div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button id="downloadExpenseBtn" class="btn btn-outline-primary">Download Expense</button>
                <button id="saveEditBtn" class="btn btn-primary">Save</button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", html);

      // populate MR select inside edit modal
      const mrSel = document.getElementById("editMrSelect");
      if (mrSel && Array.isArray(mrData)) {
        mrSel.innerHTML = mrData.map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join("");
      }

      // Save handler
      document.getElementById("saveEditBtn").addEventListener("click", () => {
        const id = Number(document.getElementById("editExpenseId").value);
        const idx = expensesData.findIndex((x) => x.id === id);
        if (idx === -1) return alert("Expense not found");
        const mrName = document.getElementById("editMrSelect").value;
        const category = document.getElementById("editCategorySelect").value || "";
        const amount = parseFloat(document.getElementById("editAmount").value) || 0;
        const expenseDate = document.getElementById("editExpenseDate").value;
        const description = document.getElementById("editDescription").value;
        const status = document.getElementById("editStatus").value;
        const rejReasonInput = document.getElementById("editRejectionReason").value;

        const fileEl = document.getElementById("editAttachmentFile");
        if (fileEl && fileEl.files && fileEl.files[0]) {
          expensesData[idx].attachments = (expensesData[idx].attachments || []).concat([fileEl.files[0].name]);
        }

        // If setting to rejected and no reason provided, prompt
        if (status === "rejected" && (!rejReasonInput || !rejReasonInput.trim())) {
          const rr = prompt("You set status to Rejected. Enter rejection reason:");
          if (!rr || !rr.trim()) return alert("Rejection cancelled - reason required.");
          expensesData[idx].rejectionReason = rr.trim();
        } else {
          expensesData[idx].rejectionReason = rejReasonInput ? rejReasonInput.trim() : null;
        }

        expensesData[idx].mrName = mrName;
        expensesData[idx].category = category;
        expensesData[idx].amount = amount;
        expensesData[idx].expenseDate = expenseDate;
        expensesData[idx].description = description;

        if (status === "approved") {
          expensesData[idx].status = "approved";
          expensesData[idx].approvedBy = localStorage.getItem("signup_name") || "Manager";
          expensesData[idx].approvedDate = new Date().toISOString().split("T")[0];
        } else if (status === "rejected") {
          expensesData[idx].status = "rejected";
          // approvedBy/approvedDate used to mark action taker
          expensesData[idx].approvedBy = localStorage.getItem("signup_name") || "Manager";
          expensesData[idx].approvedDate = new Date().toISOString().split("T")[0];
        } else {
          expensesData[idx].status = "pending";
          expensesData[idx].approvedBy = null;
          expensesData[idx].approvedDate = null;
        }

        safeSet(EXPENSES_KEY, expensesData);
        bootstrap.Modal.getInstance(document.getElementById("editExpenseModal"))?.hide();
        applyFilters();
        renderSummary();
      });

      // Download from edit modal
      document.getElementById("downloadExpenseBtn").addEventListener("click", () => {
        const id = Number(document.getElementById("editExpenseId").value);
        downloadPdf(id);
      });
    }

    const idx = expensesData.findIndex((x) => x.id === id);
    if (idx === -1) return alert("Expense not found");
    const exp = expensesData[idx];

    document.getElementById("editExpenseId").value = String(exp.id);
    document.getElementById("editMrSelect").value = exp.mrName || "";
    document.getElementById("editCategorySelect").value = exp.category || "";
    document.getElementById("editAmount").value = Number(exp.amount || 0);
    document.getElementById("editExpenseDate").value = exp.expenseDate || "";
    document.getElementById("editDescription").value = exp.description || "";
    document.getElementById("editStatus").value = exp.status || "pending";
    document.getElementById("editRejectionReason").value = exp.rejectionReason || "";

    // Attachments list — show as "filename [View file]" with link to assets/uploads/<filename> for local files
    const attList = document.getElementById("editAttachmentsList");
    attList.innerHTML = "";
    if (Array.isArray(exp.attachments) && exp.attachments.length) {
      exp.attachments.forEach((a) => {
        const name = esc(a);
        const href = /^https?:\/\//i.test(a) ? a : `assets/uploads/${a}`;
        attList.innerHTML += `<div>${name} <a class="attachment-link" href="${href}" target="_blank" rel="noopener">[View file]</a></div>`;
      });
    } else {
      attList.innerHTML = `<div class="text-muted">No attachments</div>`;
    }

    const modal = new bootstrap.Modal(document.getElementById("editExpenseModal"));
    modal.show();
  }

  // PDF/download helper (simple printable page)
  function downloadPdf(id) {
    const exp = expensesData.find((x) => x.id === id);
    if (!exp) return alert("Expense not found");
    const html = `
      <html><head><title>Expense #${exp.id}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}</style>
      </head><body>
      <h2>Expense #${exp.id} — ${esc(exp.mrName)}</h2>
      <table>
        <tr><th>Category</th><td>${esc(exp.category)}</td></tr>
        <tr><th>Amount</th><td>₹${Number(exp.amount).toFixed(2)}</td></tr>
        <tr><th>Expense Date</th><td>${fmtDate(exp.expenseDate)}</td></tr>
        <tr><th>Submitted</th><td>${fmtDate(exp.submittedDate)}</td></tr>
        <tr><th>Description</th><td>${esc(exp.description)}</td></tr>
        <tr><th>Attachments</th><td>${(exp.attachments || []).map((a) => esc(a)).join("<br/>")}</td></tr>
        <tr><th>Status</th><td>${esc(exp.status)}</td></tr>
      </table>
      <script>setTimeout(()=>window.print(),400);</script>
      </body></html>
    `;
    const popup = window.open("", "_blank", "width=800,height=800,scrollbars=yes");
    if (!popup) return alert("Popup blocked — allow popups to download.");
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
  }

  /* -------------------------
     Add Expense (manager)
     - category is manual input field (not dropdown)
     - status forced to "pending"
  ------------------------- */
  function wireAdd() {
    const sel = document.getElementById("addMrSelect");
    if (sel && Array.isArray(mrData)) {
      sel.innerHTML = `<option value="">Select MR</option>` + mrData.map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join("");
    }
    const form = document.getElementById("addExpenseForm");
    if (!form) return;
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const mrName = document.getElementById("addMrSelect").value;
      // category is now a select (id="addCategory")
      const category = (document.getElementById("addCategory")?.value || "").trim();
      const amount = parseFloat(document.getElementById("addAmount").value) || 0;
      const expenseDate = document.getElementById("addExpenseDate").value;
      const description = document.getElementById("addDescription").value;
      const fileEl = document.getElementById("addAttachment");
      const attachments = [];
      if (fileEl && fileEl.files && fileEl.files[0]) attachments.push(fileEl.files[0].name);

      if (!mrName || !category || !expenseDate || amount <= 0) return alert("Please fill required fields correctly.");

      const nextId = (expensesData.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
      const newExp = {
        id: nextId,
        mrName,
        category,
        amount,
        description,
        status: "pending",
        submittedDate: new Date().toISOString().split("T")[0],
        expenseDate,
        attachments,
      };

      expensesData.unshift(newExp);
      safeSet(EXPENSES_KEY, expensesData);
      form.reset();
      bootstrap.Modal.getInstance(document.getElementById("addExpenseModal"))?.hide();
      applyFilters();
      renderSummary();
    });
  }

  /* -------------------------
     Quick details modal (openExpenseDetails)
  ------------------------- */
  window.openExpenseDetails = function (id) {
    const exp = expensesData.find((x) => x.id === id);
    if (!exp) return alert("Expense not found");
    const content = document.getElementById("expenseDetailsContent");
    if (!content) return alert("Details modal not present");
    content.innerHTML = `
      <h6><i class="bi bi-person"></i> MR: ${esc(exp.mrName)}</h6>
      <p><strong>Category:</strong> ${esc(exp.category)}</p>
      <p><strong>Amount:</strong> ₹${Number(exp.amount).toFixed(2)}</p>
      <p><strong>Date:</strong> ${fmtDate(exp.submittedDate)}</p>
      <p><strong>Description:</strong><br/>${esc(exp.description)}</p>
      ${
        exp.attachments && exp.attachments.length
          ? `<p><strong>Attachments:</strong><br/>${exp.attachments
              .map((a) => {
                const href = /^https?:\/\//i.test(a) ? a : `assets/uploads/${a}`;
                return `<div>${esc(a)} <a href="${href}" target="_blank" rel="noopener">[View file]</a></div>`;
              })
              .join("")}</p>`
          : ""
      }
      <hr/>
      <p><strong>Status:</strong> ${statusBadge(exp.status)}</p>
      ${exp.rejectionReason ? `<p class="text-danger"><strong>Rejection Reason:</strong> ${esc(exp.rejectionReason)}</p>` : ""}
    `;

    const approveBtn = document.getElementById("approveExpenseBtn");
    const rejectBtn = document.getElementById("rejectExpenseBtn");

    if (approveBtn) {
      approveBtn.dataset.expenseId = String(id);
      approveBtn.onclick = () => {
        if (!confirm("Approve this expense?")) return;
        const idx = expensesData.findIndex((x) => x.id === id);
        if (idx === -1) return alert("Expense not found");
        if (expensesData[idx].status !== "pending") return alert("Only pending expenses can be approved");
        expensesData[idx].status = "approved";
        expensesData[idx].approvedBy = localStorage.getItem("signup_name") || "Manager";
        expensesData[idx].approvedDate = new Date().toISOString().split("T")[0];
        safeSet(EXPENSES_KEY, expensesData);
        applyFilters();
        renderSummary();
        bootstrap.Modal.getInstance(document.getElementById("expenseDetailsModal"))?.hide();
      };
    }

    if (rejectBtn) {
      rejectBtn.dataset.expenseId = String(id);
      rejectBtn.onclick = () => {
        const reason = prompt("Enter rejection reason:");
        if (!reason || !reason.trim()) return alert("Reject cancelled - reason required.");
        const idx = expensesData.findIndex((x) => x.id === id);
        if (idx === -1) return alert("Expense not found");
        if (expensesData[idx].status !== "pending") return alert("Only pending expenses can be rejected");
        expensesData[idx].status = "rejected";
        expensesData[idx].rejectionReason = reason.trim();
        expensesData[idx].approvedBy = localStorage.getItem("signup_name") || "Manager";
        expensesData[idx].approvedDate = new Date().toISOString().split("T")[0];
        safeSet(EXPENSES_KEY, expensesData);
        applyFilters();
        renderSummary();
        bootstrap.Modal.getInstance(document.getElementById("expenseDetailsModal"))?.hide();
      };
      // disable reject when already approved
      if (exp.status === "approved") {
        rejectBtn.classList.add("disabled-btn");
        rejectBtn.disabled = true;
      } else {
        rejectBtn.classList.remove("disabled-btn");
        rejectBtn.disabled = false;
      }
    }

    new bootstrap.Modal(document.getElementById("expenseDetailsModal")).show();
  };

  /* -------------------------
     Initialization
  ------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    console.info("[expenses-manager] init start");

    // sidebar toggle
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    if (sidebarToggle && sidebar && mainContent) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        mainContent.classList.toggle("expanded");
      });
    }

    // theme toggle (moon)
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
        // Re-render notifications so they update color when theme changes
        renderNotifications();
      });
    }

    // wire filters
    const searchEl = document.getElementById("searchExpense");
    if (searchEl) searchEl.addEventListener("input", applyFilters);
    const monthEl = document.getElementById("monthFilter");
    if (monthEl) monthEl.addEventListener("change", applyFilters);
    const statusEl = document.getElementById("filterStatus");
    if (statusEl) statusEl.addEventListener("change", applyFilters);

    // add expense wiring
    wireAdd();

    // initial render
    renderSummary();
    renderNotifications();

    // initial filter/render (this sets currentFiltered and draws first page)
    applyFilters();

    console.info("[expenses-manager] init done — expenses:", expensesData.length, "MRs:", mrData.length);
  });
})();
