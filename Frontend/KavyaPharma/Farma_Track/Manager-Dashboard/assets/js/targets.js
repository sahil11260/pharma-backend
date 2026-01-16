// targets-full.js
// Complete JavaScript for Targets Page with:
// - view details modal (with "Download PDF")
// - edit modal (save changes)
// - delete functionality
// - safe DOM checks and re-rendering of charts/cards
// - exposes global functions for inline onclick compatibility
(() => {
  // -------------------------
  // Mock / initial data (window scoped so global functions can access)
  // -------------------------
  window.mrData = [
    { id: 1, name: "Rajesh Kumar" },
    { id: 2, name: "Priya Sharma" },
    { id: 3, name: "Amit Singh" },
    { id: 4, name: "Sneha Patel" },
    { id: 5, name: "Manish Patel" },
    { id: 6, name: "Kavita Jain" },
  ];

  // Persistence setup
  const STORAGE_KEY = "kavyaPharmTargetsData";

  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const TARGETS_API_BASE = `${API_BASE}/api/targets`;
  let targetsApiMode = true;

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

  function normalizeTargetFromApi(t) {
    return {
      id: Number(t.id),
      mrName: t.mrName,
      period: t.period,
      salesTarget: Number(t.salesTarget) || 0,
      salesAchievement: Number(t.salesAchievement) || 0,
      visitsTarget: Number(t.visitsTarget) || 0,
      visitsAchievement: Number(t.visitsAchievement) || 0,
      startDate: t.startDate || "",
      endDate: t.endDate || "",
      achievementPercentage: Number(t.achievementPercentage) || 0,
      status: t.status,
      lastUpdated: t.lastUpdated || ""
    };
  }

  async function refreshTargetsFromApiOrFallback() {
    try {
      const data = await apiJson(TARGETS_API_BASE);
      if (Array.isArray(data)) {
        window.targetsData = data.map(normalizeTargetFromApi);
        saveStoredData(STORAGE_KEY, window.targetsData);
        targetsApiMode = true;
        return;
      }
      targetsApiMode = false;
    } catch (e) {
      console.warn("Targets API unavailable, using localStorage.", e);
      targetsApiMode = false;
    }
  }

  async function createTargetApi(newTarget) {
    const payload = {
      mrName: newTarget.mrName,
      period: newTarget.period,
      salesTarget: Number(newTarget.salesTarget) || 0,
      visitsTarget: Number(newTarget.visitsTarget) || 0,
      startDate: newTarget.startDate || null,
      endDate: newTarget.endDate || null
    };
    return await apiJson(TARGETS_API_BASE, { method: "POST", body: JSON.stringify(payload) });
  }

  async function updateTargetApi(id, target) {
    const payload = {
      mrName: target.mrName,
      period: target.period,
      salesTarget: Number(target.salesTarget) || 0,
      salesAchievement: Number(target.salesAchievement) || 0,
      visitsTarget: Number(target.visitsTarget) || 0,
      visitsAchievement: Number(target.visitsAchievement) || 0,
      startDate: target.startDate || null,
      endDate: target.endDate || null,
      status: target.status
    };
    return await apiJson(`${TARGETS_API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  async function deleteTargetApi(id) {
    await apiJson(`${TARGETS_API_BASE}/${id}`, { method: "DELETE" });
  }

  // Helper to safely parse JSON from localStorage
  function getStoredData(key, initialData) {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(`Error loading data from ${key}:`, e);
    }
    // Save initial data to storage if none exists
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }

  // Helper to save data to localStorage
  function saveStoredData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving data to ${key}:`, e);
    }
  }

  const initialTargetsData = [
    {
      id: 1,
      mrName: "Rajesh Kumar",
      period: "monthly",
      salesTarget: 80000,
      salesAchievement: 75000,
      visitsTarget: 120,
      visitsAchievement: 98,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      achievementPercentage: 94,
      status: "excellent",
      lastUpdated: "2025-11-08",
    },
    {
      id: 2,
      mrName: "Priya Sharma",
      period: "monthly",
      salesTarget: 75000,
      salesAchievement: 68000,
      visitsTarget: 110,
      visitsAchievement: 95,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      achievementPercentage: 91,
      status: "excellent",
      lastUpdated: "2025-11-08",
    },
    {
      id: 3,
      mrName: "Amit Singh",
      period: "monthly",
      salesTarget: 70000,
      salesAchievement: 55000,
      visitsTarget: 100,
      visitsAchievement: 78,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      achievementPercentage: 79,
      status: "good",
      lastUpdated: "2025-11-07",
    },
    {
      id: 4,
      mrName: "Sneha Patel",
      period: "monthly",
      salesTarget: 65000,
      salesAchievement: 62000,
      visitsTarget: 95,
      visitsAchievement: 88,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      achievementPercentage: 95,
      status: "excellent",
      lastUpdated: "2025-11-08",
    },
    {
      id: 5,
      mrName: "Manish Patel",
      period: "monthly",
      salesTarget: 70000,
      salesAchievement: 35000,
      visitsTarget: 105,
      visitsAchievement: 52,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      achievementPercentage: 50,
      status: "average",
      lastUpdated: "2025-11-06",
    },
    {
      id: 6,
      mrName: "Kavita Jain",
      period: "monthly",
      salesTarget: 75000,
      salesAchievement: 72000,
      visitsTarget: 115,
      visitsAchievement: 102,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      achievementPercentage: 96,
      status: "excellent",
      lastUpdated: "2025-11-08",
    },
  ];

  window.targetsData = getStoredData(STORAGE_KEY, initialTargetsData);

  window.performanceTrendData = [
    { month: "Aug", averageAchievement: 85 },
    { month: "Sep", averageAchievement: 88 },
    { month: "Oct", averageAchievement: 82 },
    { month: "Nov", averageAchievement: 87 },
  ];

  // -------------------------
  // Utilities
  // -------------------------
  function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getAchievementBadge(percentage) {
    if (percentage >= 90)
      return '<span class="badge bg-success">Excellent</span>';
    if (percentage >= 75) return '<span class="badge bg-info">Good</span>';
    if (percentage >= 50)
      return '<span class="badge bg-warning text-dark">Average</span>';
    return '<span class="badge bg-danger">Needs Improvement</span>';
  }

  function getProgressBarClass(percentage) {
    if (percentage >= 90) return "bg-success";
    if (percentage >= 75) return "bg-info";
    if (percentage >= 50) return "bg-warning";
    return "bg-danger";
  }

  function getStatusBadgeClass(status) {
    const classes = {
      excellent: "bg-success",
      good: "bg-info",
      average: "bg-warning text-dark",
      poor: "bg-danger",
    };
    return classes[status] || "bg-secondary";
  }

  // -------------------------
  // Modal creators (dynamically create modals if not present)
  // -------------------------
  function ensureViewModal() {
    if (document.getElementById("viewTargetModal")) return;
    const html = `
      <div class="modal fade" id="viewTargetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Target Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div id="viewTargetContent"></div>
            </div>
            <div class="modal-footer">
              <button id="downloadTargetPdfBtn" class="btn btn-outline-secondary"><i class="bi bi-download"></i> Download PDF</button>
              <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    document
      .getElementById("downloadTargetPdfBtn")
      .addEventListener("click", () => {
        const id = Number(
          document.getElementById("downloadTargetPdfBtn").dataset.targetId || 0
        );
        if (!id) return alert("No target selected.");
        downloadTargetPdf(id);
      });
  }

  function ensureEditModal() {
    if (document.getElementById("editTargetModal")) return;
    const html = `
      <div class="modal fade" id="editTargetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Target</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="editTargetForm">
                <input type="hidden" id="editTargetId" />
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label">MR</label>
                    <select id="editTargetMR" class="form-select"></select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Period</label>
                    <select id="editTargetPeriod" class="form-select">
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div class="row g-2 mt-2">
                  <div class="col-md-6">
                    <label class="form-label">Sales Target (₹)</label>
                    <input id="editSalesTarget" type="number" min="0" class="form-control" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Sales Achievement (₹)</label>
                    <input id="editSalesAchievement" type="number" min="0" class="form-control" required />
                  </div>
                </div>
                <div class="row g-2 mt-2">
                  <div class="col-md-6">
                    <label class="form-label">Visits Target</label>
                    <input id="editVisitsTarget" type="number" min="0" class="form-control" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Visits Achievement</label>
                    <input id="editVisitsAchievement" type="number" min="0" class="form-control" required />
                  </div>
                </div>
                <div class="row g-2 mt-2">
                  <div class="col-md-6"><label class="form-label">Start Date</label><input id="editStartDate" type="date" class="form-control" /></div>
                  <div class="col-md-6"><label class="form-label">End Date</label><input id="editEndDate" type="date" class="form-control" /></div>
                </div>
                <div class="mt-2"><label class="form-label">Status</label>
                  <select id="editStatus" class="form-select">
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button id="saveEditTargetBtn" class="btn btn-primary">Save</button>
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);

    // populate MR dropdown on open
    document
      .getElementById("editTargetModal")
      .addEventListener("show.bs.modal", () => {
        const sel = document.getElementById("editTargetMR");
        sel.innerHTML = window.mrData
          .map(
            (m) =>
              `<option value="${escapeHtml(m.name)}">${escapeHtml(
                m.name
              )}</option>`
          )
          .join("");
      });

    document
      .getElementById("saveEditTargetBtn")
      .addEventListener("click", () => {
        const id = Number(document.getElementById("editTargetId").value);
        const idx = window.targetsData.findIndex((t) => t.id === id);
        if (idx === -1) return alert("Target not found.");
        const t = window.targetsData[idx];

        // Get values
        const salesTarget =
          Number(document.getElementById("editSalesTarget").value) || 0;
        const salesAchievement =
          Number(document.getElementById("editSalesAchievement").value) || 0;
        const visitsTarget =
          Number(document.getElementById("editVisitsTarget").value) || 0;
        const visitsAchievement =
          Number(document.getElementById("editVisitsAchievement").value) || 0;
        const achievementPercentage = salesTarget
          ? Math.round((salesAchievement / salesTarget) * 100)
          : 0;

        // Update
        t.mrName = document.getElementById("editTargetMR").value;
        t.period = document.getElementById("editTargetPeriod").value;
        t.salesTarget = salesTarget;
        t.salesAchievement = salesAchievement;
        t.visitsTarget = visitsTarget;
        t.visitsAchievement = visitsAchievement;
        t.startDate =
          document.getElementById("editStartDate").value || t.startDate;
        t.endDate = document.getElementById("editEndDate").value || t.endDate;
        t.achievementPercentage = achievementPercentage;
        t.status = document.getElementById("editStatus").value;
        t.lastUpdated = new Date().toISOString().split("T")[0];

        (async function () {
          if (targetsApiMode) {
            try {
              await updateTargetApi(t.id, t);
              await refreshTargetsFromApiOrFallback();
            } catch (e) {
              console.warn("Target update API failed. Falling back to localStorage.", e);
              targetsApiMode = false;
            }
          }

          saveStoredData(STORAGE_KEY, window.targetsData);

          bootstrap.Modal.getInstance(
            document.getElementById("editTargetModal")
          ).hide();
          refreshAllDisplays();
        })();
      });
  }

  // -------------------------
  // Rendering functions
  // -------------------------
  function renderTargetTable(data) {
    const tbody = document.getElementById("targetsList");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((target) => {
      const achievementBadge = getAchievementBadge(
        target.achievementPercentage
      );
      const statusBadge = `<span class="badge ${getStatusBadgeClass(
        target.status
      )}">${escapeHtml(
        target.status.charAt(0).toUpperCase() + target.status.slice(1)
      )}</span>`;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(target.mrName)}</td>
        <td>₹${target.salesTarget.toLocaleString()}</td>
        <td>₹${target.salesAchievement.toLocaleString()}</td>
        <td>${target.visitsTarget}</td>
        <td>${target.visitsAchievement}</td>
        <td>${target.achievementPercentage}%</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-outline-info btn-sm" data-action="view" data-id="${target.id
        }"><i class="bi bi-eye"></i></button>
          <button class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${target.id
        }"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-success btn-sm" data-action="performance" data-id="${target.id
        }"><i class="bi bi-graph-up"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // attach event listeners
    tbody
      .querySelectorAll('[data-action="view"]')
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          openViewTargetModal(Number(e.currentTarget.dataset.id))
        )
      );
    tbody
      .querySelectorAll('[data-action="edit"]')
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          openEditTargetModal(Number(e.currentTarget.dataset.id))
        )
      );
    tbody
      .querySelectorAll('[data-action="performance"]')
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          showTargetPerformance(Number(e.currentTarget.dataset.id))
        )
      );
  }

  function renderSummaryCards(data) {
    const container = document.getElementById("summaryCards");
    if (!container) return;
    const totalTarget = data.reduce((s, t) => s + (t.salesTarget || 0), 0);
    const totalAchievement = data.reduce(
      (s, t) => s + (t.salesAchievement || 0),
      0
    );
    const avgAchievement = totalTarget
      ? Math.round((totalAchievement / totalTarget) * 100)
      : 0;
    const topPerformer = data.reduce(
      (prev, cur) =>
        prev.achievementPercentage > cur.achievementPercentage ? prev : cur,
      data[0] || { mrName: "-" }
    );
    container.innerHTML = `
      <div class="col-md-3"><div class="card summary-card summary-total-target"><div class="card-body"><div class="card-content"><h3>₹${totalTarget.toLocaleString()}</h3><h5>Total Target</h5></div><div class="card-icon"><i class="bi bi-bullseye"></i></div></div></div></div>
      <div class="col-md-3"><div class="card summary-card summary-total-achievement"><div class="card-body"><div class="card-content"><h3>₹${totalAchievement.toLocaleString()}</h3><h5>Total Achievement</h5></div><div class="card-icon"><i class="bi bi-trophy"></i></div></div></div></div>
      <div class="col-md-3"><div class="card summary-card summary-avg-achievement"><div class="card-body"><div class="card-content"><h3>${avgAchievement}%</h3><h5>Avg Achievement</h5></div><div class="card-icon"><i class="bi bi-graph-up"></i></div></div></div></div>
      <div class="col-md-3"><div class="card summary-card summary-top-performer"><div class="card-body"><div class="card-content"><h3>${escapeHtml(
      (topPerformer.mrName || "-").split(" ")[0]
    )}</h3><h5>Top Performer</h5></div><div class="card-icon"><i class="bi bi-star"></i></div></div></div></div>
    `;
  }

  function renderTopPerformersTable(data) {
    const tbody = document.getElementById("topPerformersTableBody");
    if (!tbody) return;
    const sorted = [...data].sort(
      (a, b) => b.achievementPercentage - a.achievementPercentage
    );
    tbody.innerHTML = "";
    sorted.forEach((t, i) => {
      const rank = i + 1;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="badge ${rank <= 0 ? `badge-${rank}` : "bg-light text-dark"
        }">${rank}</span></td>
        <td>${escapeHtml(t.mrName)}</td>
        <td>₹${t.salesTarget.toLocaleString()}</td>
        <td>₹${t.salesAchievement.toLocaleString()}</td>
        <td><strong>${t.achievementPercentage}%</strong></td>
        <td><span class="badge ${getStatusBadgeClass(t.status)}">${escapeHtml(
          t.status.charAt(0).toUpperCase() + t.status.slice(1)
        )}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  let _targetChartInstance = null;
  function renderTargetAchievementChart(data) {
    const canvas = document.getElementById("targetAchievementChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (_targetChartInstance) _targetChartInstance.destroy();
    const ctx = canvas.getContext("2d");
    _targetChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.mrName.split(" ")[0]),
        datasets: [
          {
            label: "Target (₹)",
            data: data.map((d) => d.salesTarget),
            backgroundColor: "#6c757d",
          },
          {
            label: "Achievement (₹)",
            data: data.map((d) => d.salesAchievement),
            backgroundColor: "#28a745",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => "₹" + v / 1000 + "K" },
          },
        },
        plugins: { legend: { position: "top" } },
      },
    });
  }

  let _trendChartInstance = null;
  function renderPerformanceTrendChart(data) {
    const canvas = document.getElementById("performanceTrendChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (_trendChartInstance) _trendChartInstance.destroy();
    const ctx = canvas.getContext("2d");
    _trendChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: "Average Achievement %",
            data: data.map((d) => d.averageAchievement),
            borderColor: "#0d6efd",
            backgroundColor: "rgba(13,110,253,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } },
      },
    });
  }

  // -------------------------
  // Actions: View/Edit/Delete/Performance & Download PDF
  // -------------------------
  function openViewTargetModal(id) {
    const t = window.targetsData.find((x) => x.id === id);
    if (!t) return alert("Target not found.");
    ensureViewModal();
    const content = document.getElementById("viewTargetContent");
    content.innerHTML = `
      <h5>${escapeHtml(t.mrName)} — ${escapeHtml(
      t.period.charAt(0).toUpperCase() + t.period.slice(1)
    )} Target</h5>
      <div class="row">
        <div class="col-md-6"><p><strong>Sales Target:</strong> ₹${t.salesTarget.toLocaleString()}</p></div>
        <div class="col-md-6"><p><strong>Sales Achievement:</strong> ₹${t.salesAchievement.toLocaleString()}</p></div>
      </div>
      <div class="row">
        <div class="col-md-6"><p><strong>Visits Target:</strong> ${t.visitsTarget
      }</p></div>
        <div class="col-md-6"><p><strong>Visits Done:</strong> ${t.visitsAchievement
      }</p></div>
      </div>
      <p><strong>Achievement:</strong> ${t.achievementPercentage
      }% — ${getAchievementBadge(t.achievementPercentage)}</p>
      <p><strong>Period:</strong> ${formatDate(t.startDate)} to ${formatDate(
        t.endDate
      )}</p>
      <p><small class="text-muted">Last Updated: ${formatDate(
        t.lastUpdated
      )}</small></p>
    `;
    const dlBtn = document.getElementById("downloadTargetPdfBtn");
    if (dlBtn) dlBtn.dataset.targetId = String(id);
    const modal = new bootstrap.Modal(
      document.getElementById("viewTargetModal")
    );
    modal.show();
  }

  function downloadTargetPdf(id) {
    const t = window.targetsData.find((x) => x.id === id);
    if (!t) return alert("Target not found.");
    const html = `
      <html>
      <head>
        <title>Target - ${escapeHtml(t.mrName)}</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}h1{font-size:18px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}</style>
      </head>
      <body>
        <h1>Target Details — ${escapeHtml(t.mrName)}</h1>
        <table>
          <tr><th>Period</th><td>${escapeHtml(t.period)}</td></tr>
          <tr><th>Sales Target (₹)</th><td>₹${t.salesTarget.toLocaleString()}</td></tr>
          <tr><th>Sales Achievement (₹)</th><td>₹${t.salesAchievement.toLocaleString()}</td></tr>
          <tr><th>Visits Target</th><td>${t.visitsTarget}</td></tr>
          <tr><th>Visits Done</th><td>${t.visitsAchievement}</td></tr>
          <tr><th>Achievement %</th><td>${t.achievementPercentage}%</td></tr>
          <tr><th>Status</th><td>${escapeHtml(t.status)}</td></tr>
          <tr><th>Start Date</th><td>${formatDate(t.startDate)}</td></tr>
          <tr><th>End Date</th><td>${formatDate(t.endDate)}</td></tr>
          <tr><th>Last Updated</th><td>${formatDate(t.lastUpdated)}</td></tr>
        </table>
        <footer style="margin-top:12px;color:#666">Generated: ${new Date().toLocaleString(
      "en-IN"
    )}</footer>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=800,height=900,scrollbars=yes");
    if (!w) return alert("Popup blocked. Allow popups to download PDF.");
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try {
        w.print();
      } catch (e) { }
    }, 500);
  }

  function openEditTargetModal(id) {
    const t = window.targetsData.find((x) => x.id === id);
    if (!t) return alert("Target not found.");
    ensureEditModal();
    // populate fields
    document.getElementById("editTargetId").value = String(t.id);
    document.getElementById("editTargetMR").value = t.mrName;
    document.getElementById("editTargetPeriod").value = t.period;
    document.getElementById("editSalesTarget").value = t.salesTarget;
    document.getElementById("editSalesAchievement").value = t.salesAchievement;
    document.getElementById("editVisitsTarget").value = t.visitsTarget;
    document.getElementById("editVisitsAchievement").value =
      t.visitsAchievement;
    document.getElementById("editStartDate").value = t.startDate || "";
    document.getElementById("editEndDate").value = t.endDate || "";
    document.getElementById("editStatus").value = t.status || "average";
    const modal = new bootstrap.Modal(
      document.getElementById("editTargetModal")
    );
    modal.show();
  }

  function showTargetPerformance(id) {
    const t = window.targetsData.find((x) => x.id === id);
    if (!t) return alert("Target not found.");
    alert(
      `${t.mrName}'s Performance\n\nAchievement Rate: ${t.achievementPercentage
      }%\nStatus: ${t.status.charAt(0).toUpperCase() + t.status.slice(1)
      }\n\nSales: ₹${t.salesAchievement.toLocaleString()} / ₹${t.salesTarget.toLocaleString()}\nVisits: ${t.visitsAchievement
      } / ${t.visitsTarget}`
    );
  }

  function deleteTarget(id) {
    const idx = window.targetsData.findIndex((x) => x.id === id);
    if (idx === -1) return alert("Target not found.");
    if (!confirm(`Delete target for ${window.targetsData[idx].mrName}?`))
      return;

    (async function () {
      if (targetsApiMode) {
        try {
          await deleteTargetApi(id);
          await refreshTargetsFromApiOrFallback();
          refreshAllDisplays();
          return;
        } catch (e) {
          console.warn("Target delete API failed. Falling back to localStorage.", e);
          targetsApiMode = false;
        }
      }

      window.targetsData.splice(idx, 1);
      saveStoredData(STORAGE_KEY, window.targetsData);
      refreshAllDisplays();
    })();
  }

  // Expose deleteTarget globally for compatibility in case markup uses onclick
  window.deleteTarget = deleteTarget;
  window.viewTargetDetails = openViewTargetModal;
  window.editTarget = openEditTargetModal;
  window.viewPerformance = showTargetPerformance;

  // -------------------------
  // Filters, search and add target
  // -------------------------
  function populateMRDropdowns() {
    const filterMR = document.getElementById("filterMR");
    const targetMR = document.getElementById("targetMR");
    const performanceMRSelection = document.getElementById(
      "performanceMRSelection"
    );
    if (filterMR)
      filterMR.innerHTML =
        `<option value="">All MRs</option>` +
        window.mrData
          .map(
            (m) =>
              `<option value="${escapeHtml(m.name)}">${escapeHtml(
                m.name
              )}</option>`
          )
          .join("");
    if (targetMR)
      targetMR.innerHTML =
        `<option value="">Select MR</option>` +
        window.mrData
          .map(
            (m) =>
              `<option value="${escapeHtml(m.name)}">${escapeHtml(
                m.name
              )}</option>`
          )
          .join("");
    if (performanceMRSelection)
      performanceMRSelection.innerHTML =
        `<option value="">All MRs</option>` +
        window.mrData
          .map(
            (m) =>
              `<option value="${escapeHtml(m.name)}">${escapeHtml(
                m.name
              )}</option>`
          )
          .join("");
  }

  function applyFilters() {
    const searchInput = document.getElementById("searchTarget");
    const filterPeriod = document.getElementById("filterPeriod");
    const filterAchievement = document.getElementById("filterAchievement");
    const filterMR = document.getElementById("filterMR");

    let filtered = window.targetsData.slice();
    const q = searchInput ? (searchInput.value || "").trim().toLowerCase() : "";
    if (q)
      filtered = filtered.filter((t) =>
        (t.mrName || "").toLowerCase().includes(q)
      );
    if (filterPeriod && filterPeriod.value)
      filtered = filtered.filter((t) => t.period === filterPeriod.value);
    if (filterAchievement && filterAchievement.value) {
      switch (filterAchievement.value) {
        case "excellent":
          filtered = filtered.filter((t) => t.achievementPercentage >= 90);
          break;
        case "good":
          filtered = filtered.filter(
            (t) => t.achievementPercentage >= 75 && t.achievementPercentage < 90
          );
          break;
        case "average":
          filtered = filtered.filter(
            (t) => t.achievementPercentage >= 50 && t.achievementPercentage < 75
          );
          break;
        case "poor":
          filtered = filtered.filter((t) => t.achievementPercentage < 50);
          break;
      }
    }
    if (filterMR && filterMR.value)
      filtered = filtered.filter((t) => t.mrName === filterMR.value);
    renderTargetTable(filtered);
  }

  // Set targets (Add new)
  function setupAddTargetListener() {
    const saveBtn = document.getElementById("saveTargetBtn");
    if (!saveBtn) return;
    saveBtn.addEventListener("click", () => {
      const form = document.getElementById("setTargetsForm");
      if (!form) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const mrName = document.getElementById("targetMR").value || "";
      const period = document.getElementById("targetPeriod").value || "monthly";
      const salesTarget =
        Number(document.getElementById("salesTarget").value) || 0;
      const visitsTarget =
        Number(document.getElementById("visitsTarget").value) || 0;
      const startDate = document.getElementById("targetStartDate").value || "";
      const endDate = document.getElementById("targetEndDate").value || "";
      const newTarget = {
        id: window.targetsData.reduce((m, t) => Math.max(m, t.id), 0) + 1,
        mrName,
        period,
        salesTarget,
        salesAchievement: 0,
        visitsTarget,
        visitsAchievement: 0,
        startDate,
        endDate,
        achievementPercentage: 0,
        status: "poor",
        lastUpdated: new Date().toISOString().split("T")[0],
      };

      (async function () {
        if (targetsApiMode) {
          try {
            await createTargetApi(newTarget);
            await refreshTargetsFromApiOrFallback();
            // close modal if present
            try {
              bootstrap.Modal.getInstance(
                document.getElementById("setTargetsModal")
              ).hide();
            } catch (e) { }
            form.reset();
            refreshAllDisplays();
            return;
          } catch (e) {
            console.warn("Target create API failed. Falling back to localStorage.", e);
            targetsApiMode = false;
          }
        }

        window.targetsData.push(newTarget);
        saveStoredData(STORAGE_KEY, window.targetsData);
        // close modal if present
        try {
          bootstrap.Modal.getInstance(
            document.getElementById("setTargetsModal")
          ).hide();
        } catch (e) { }
        form.reset();
        refreshAllDisplays();
      })();
    });
  }

  // -------------------------
  // Refresh utilities
  // -------------------------
  function refreshAllDisplays() {
    renderTargetTable(window.targetsData);
    renderSummaryCards(window.targetsData);
    renderTopPerformersTable(window.targetsData);
    renderTargetAchievementChart(window.targetsData);
    renderPerformanceTrendChart(window.performanceTrendData);
  }

  // -------------------------
  // Initialization on DOMContentLoaded
  // -------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // sidebar & theme toggles (if present)
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    if (sidebarToggle && sidebar && mainContent) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        mainContent.classList.toggle("expanded");
      });
    }
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      // Load theme
      if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
      }
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    }

    // populate MR dropdowns and render UI
    populateMRDropdowns();
    ensureViewModal();
    ensureEditModal();

    (async function () {
      await refreshTargetsFromApiOrFallback();
      refreshAllDisplays();
    })();
    renderNotificationsIfPresent();

    // wire search & filter inputs
    const searchInput = document.getElementById("searchTarget");
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    const filterPeriod = document.getElementById("filterPeriod");
    if (filterPeriod) filterPeriod.addEventListener("change", applyFilters);
    const filterAchievement = document.getElementById("filterAchievement");
    if (filterAchievement)
      filterAchievement.addEventListener("change", applyFilters);
    const filterMR = document.getElementById("filterMR");
    if (filterMR) filterMR.addEventListener("change", applyFilters);

    // refresh button
    const refreshBtn = document.getElementById("refreshTargetsBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        refreshBtn.innerHTML =
          '<i class="bi bi-arrow-clockwise bi-spin"></i> Refreshing...';
        (async function () {
          await refreshTargetsFromApiOrFallback();
          setTimeout(() => {
            refreshAllDisplays();
            refreshBtn.innerHTML =
              '<i class="bi bi-arrow-clockwise"></i> Refresh';
          }, 800);
        })();
      });
    }

    // add target listener
    setupAddTargetListener();

    // performance report UI (if present)
    const perfPeriod = document.getElementById("performancePeriod");
    const perfCustom = document.getElementById("performanceCustomDateRange");
    if (perfPeriod && perfCustom) {
      perfPeriod.addEventListener("change", () => {
        perfCustom.style.display =
          perfPeriod.value === "custom" ? "block" : "none";
      });
    }
    const genPerfBtn = document.getElementById("generatePerformanceReportBtn");
    if (genPerfBtn)
      genPerfBtn.addEventListener("click", () => {
        const type = document.getElementById("performanceReportType")
          ? document.getElementById("performanceReportType").value
          : "Summary";
        const period = document.getElementById("performancePeriod")
          ? document.getElementById("performancePeriod").value
          : "monthly";
        const mrSel = document.getElementById("performanceMRSelection")
          ? document.getElementById("performanceMRSelection").value
          : "";
        alert(
          `Generating ${type} performance report for ${period}. MR: ${mrSel || "All"
          }.`
        );
        try {
          bootstrap.Modal.getInstance(
            document.getElementById("performanceReportModal")
          ).hide();
        } catch (e) { }
      });

    // profile info if present
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    if (profileName)
      profileName.textContent =
        localStorage.getItem("signup_name") || "Admin User";
    if (profileEmail)
      profileEmail.textContent =
        localStorage.getItem("signup_email") || "admin@kavyapharm.com";
  });

  // -------------------------
  // Optional notifications rendering (if markup includes notificationsList)
  // -------------------------
  function renderNotificationsIfPresent() {
    const container = document.getElementById("notificationsList");
    if (!container) return;
    const recentActivities = [
      {
        icon: "bi-person-plus",
        iconClass: "bg-primary",
        title: "New MR Assigned",
        description: "Sneha Patel assigned to Central Delhi region",
        time: "2 hours ago",
      },
      {
        icon: "bi-currency-rupee",
        iconClass: "bg-success",
        title: "Sales Target Achieved",
        description: "Rajesh Kumar achieved 112% of monthly target",
        time: "4 hours ago",
      },
      {
        icon: "bi-hospital",
        iconClass: "bg-info",
        title: "Doctor Visit Completed",
        description: "15 doctor visits completed today",
        time: "6 hours ago",
      },
      {
        icon: "bi-bell",
        iconClass: "bg-warning",
        title: "Meeting Reminder",
        description: "Team meeting scheduled for tomorrow 10 AM",
        time: "8 hours ago",
      },
      {
        icon: "bi-box-seam",
        iconClass: "bg-secondary",
        title: "Sample Stock Updated",
        description: "Diabetex 500mg stock replenished",
        time: "1 day ago",
      },
    ];
    const alertsData = [
      {
        icon: "bi-exclamation-triangle",
        iconClass: "bg-danger",
        title: "Low Stock Alert",
        description: "CardioCare 10mg running low in North Delhi",
        type: "urgent",
      },
      {
        icon: "bi-calendar-x",
        iconClass: "bg-warning",
        title: "Pending Approvals",
        description: "12 expense reports awaiting your approval",
        type: "warning",
      },
      {
        icon: "bi-graph-down",
        iconClass: "bg-info",
        title: "Performance Alert",
        description: "Manish Patel below 80% target achievement",
        type: "info",
      },
      {
        icon: "bi-check-circle",
        iconClass: "bg-success",
        title: "Task Completed",
        description: "Monthly report submitted successfully",
        type: "success",
      },
    ];
    const allNotifications = [
      ...alertsData.map((alert) => ({ ...alert, type: "alert" })),
      ...recentActivities.map((activity) => ({
        ...activity,
        type: "activity",
      })),
    ];

    container.innerHTML = allNotifications
      .slice(0, 10) // Show latest 10 notifications
      .map(
        (notification) => `
      <div class="notification-item p-3 border-bottom">
        <div class="d-flex align-items-start">
          <div class="notification-icon ${notification.iconClass || "bg-primary"
          } text-white me-3">
            <i class="bi ${notification.icon}"></i>
          </div>
          <div class="flex-grow-1">
            <h6 class="mb-1">${notification.title}</h6>
            <p class="mb-1 text-muted small">${notification.description}</p>
            <small class="text-muted">${notification.time || "Just now"}</small>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // expose refresh function (optional)
  window.refreshTargetsUI = refreshAllDisplays;
})();
