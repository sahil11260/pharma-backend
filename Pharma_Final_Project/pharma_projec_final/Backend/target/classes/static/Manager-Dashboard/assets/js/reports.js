(() => {

  window.mrData = [
    { id: 1, name: "Rajesh Kumar" },
    { id: 2, name: "Priya Sharma" },
    { id: 3, name: "Amit Singh" },
    { id: 4, name: "Sneha Patel" },
    { id: 5, name: "Manish Patel" },
    { id: 6, name: "Kavita Jain" },
  ];

  const initialReportsData = [
    {
      id: 1,
      type: "visit-report",
      mrName: "Rajesh Kumar",
      title: "Weekly Doctor Visit Report - North Delhi",
      status: "pending",
      submittedDate: "2025-11-08",
      visitDate: "2025-11-07",
      doctorName: "Dr. Ramesh Gupta",
      clinicName: "Apollo Hospital",
      visitSummary:
        "Discussed new diabetes medication promotion. Doctor showed interest in clinical trial data. Requested additional samples for patient trials.",
      keyOutcomes:
        "Doctor agreed to participate in upcoming awareness campaign. Prescribed our medication to 15 new patients this week.",
      followUpActions:
        "Schedule product training session next week. Provide additional marketing materials.",
      // single attachment entry
      attachments: ["visit_notes.pdf"],
      feedback: {
        doctorSatisfaction: 4,
        productInterest: 5,
        overallExperience: 4,
        comments:
          "Very informative discussion. Looking forward to more detailed product information.",
      },
      approvedBy: null,
      approvedDate: null,
      rejectionReason: null,
    },
    {
      id: 2,
      type: "doctor-feedback",
      mrName: "Priya Sharma",
      title: "Feedback from Dr. Sunita Verma",
      status: "approved",
      submittedDate: "2025-11-07",
      visitDate: "2025-11-06",
      doctorName: "Dr. Sunita Verma",
      clinicName: "Max Super Speciality Hospital",
      visitSummary:
        "Monthly review meeting with diabetes specialist. Presented Q4 sales data and upcoming product launches.",
      keyOutcomes:
        "Doctor provided valuable feedback on current medication efficacy. Agreed to participate in patient education program.",
      followUpActions: "Send detailed patient education materials. Schedule follow-up meeting in 2 weeks.",
      attachments: ["feedback_form.pdf"],
      feedback: {
        doctorSatisfaction: 5,
        productInterest: 4,
        overallExperience: 5,
        comments:
          "Excellent presentation and data. The new medication shows promising results in clinical practice.",
      },
      approvedBy: "Admin",
      approvedDate: "2025-11-07",
      rejectionReason: null,
    },
    {
      id: 3,
      type: "chemist-feedback",
      mrName: "Amit Singh",
      title: "Chemist Network Feedback - South Delhi",
      status: "requires-action",
      submittedDate: "2025-11-06",
      visitDate: "2025-11-05",
      doctorName: "MedPlus Pharmacy",
      clinicName: "MedPlus Pharmacy Chain",
      visitSummary:
        "Visited 5 major pharmacies in South Delhi. Discussed inventory management and promotional activities.",
      keyOutcomes:
        "Pharmacies reported good sales of our OTC products. Requested better discount structure for bulk purchases.",
      followUpActions: "Review pricing strategy with management. Provide improved discount schemes.",
      attachments: ["inventory_report.xlsx"],
      feedback: {
        doctorSatisfaction: 3,
        productInterest: 4,
        overallExperience: 3,
        comments: "Good products but pricing needs to be more competitive. Consider volume discounts.",
      },
      approvedBy: null,
      approvedDate: null,
      rejectionReason: null,
    },
    {
      id: 4,
      type: "product-feedback",
      mrName: "Sneha Patel",
      title: "Product Trial Feedback - Orthopedic Segment",
      status: "rejected",
      submittedDate: "2025-11-05",
      visitDate: "2025-11-04",
      doctorName: "Dr. Vikram Singh",
      clinicName: "AIIMS Hospital",
      visitSummary:
        "Presented new orthopedic medication to senior surgeon. Discussed clinical trial results and patient outcomes.",
      keyOutcomes: "Doctor expressed concerns about side effects. Requested more comprehensive safety data.",
      followUpActions: "Provide additional clinical trial data. Schedule meeting with medical affairs team.",
      attachments: ["trial_data.pdf"],
      feedback: {
        doctorSatisfaction: 2,
        productInterest: 2,
        overallExperience: 2,
        comments:
          "Insufficient safety data provided. Cannot recommend until comprehensive studies are available.",
      },
      approvedBy: "Admin",
      approvedDate: "2025-11-06",
      rejectionReason: "Report lacks sufficient detail and supporting documentation",
    },
    {
      id: 5,
      type: "visit-report",
      mrName: "Manish Patel",
      title: "Monthly Chemist Visit Summary",
      status: "approved",
      submittedDate: "2025-11-08",
      visitDate: "2025-11-07",
      doctorName: "Wellness Chemist",
      clinicName: "Wellness Chemist",
      visitSummary:
        "Monthly stock review and promotional planning. Discussed upcoming product launches and marketing campaigns.",
      keyOutcomes:
        "Chemist agreed to prime shelf space for our new wellness products. Committed to promotional displays.",
      followUpActions: "Deliver promotional materials by end of week. Schedule product launch event.",
      attachments: ["stock_review.pdf"],
      feedback: {
        doctorSatisfaction: 4,
        productInterest: 5,
        overallExperience: 4,
        comments: "Strong partnership developing. Looking forward to new product launches.",
      },
      approvedBy: "Admin",
      approvedDate: "2025-11-08",
      rejectionReason: null,
    },
    {
      id: 6,
      type: "doctor-feedback",
      mrName: "Kavita Jain",
      title: "Pediatric Specialist Feedback",
      status: "pending",
      submittedDate: "2025-11-08",
      visitDate: "2025-11-07",
      doctorName: "Dr. Meera Joshi",
      clinicName: "Fortis Hospital",
      visitSummary:
        "Introduced pediatric medication line. Discussed child-friendly formulations and dosing guidelines.",
      keyOutcomes:
        "Doctor interested in pediatric clinical trials. Requested samples for hospital formulary review.",
      followUpActions: "Provide pediatric samples and dosing guidelines. Arrange clinical trial discussion.",
      attachments: ["pediatric_guidelines.pdf"],
      feedback: {
        doctorSatisfaction: 4,
        productInterest: 4,
        overallExperience: 4,
        comments: "Good formulations for pediatric use. Need more clinical data for hospital adoption.",
      },
      approvedBy: null,
      approvedDate: null,
      rejectionReason: null,
    },
  ];

  // notifications / alerts
  window.recentActivities = [
    { icon: "bi-person-plus", iconClass: "bg-primary", title: "New MR Assigned", description: "Sneha Patel assigned to Central Delhi region", time: "2 hours ago" },
    { icon: "bi-currency-rupee", iconClass: "bg-success", title: "Sales Target Achieved", description: "Rajesh Kumar achieved 112% of monthly target", time: "4 hours ago" },
    { icon: "bi-hospital", iconClass: "bg-info", title: "Doctor Visit Completed", description: "15 doctor visits completed today", time: "6 hours ago" }
  ];

  window.alertsData = [
    { icon: "bi-exclamation-triangle", iconClass: "bg-danger", title: "Low Stock Alert", description: "CardioCare 10mg running low in North Delhi", type: "urgent" },
    { icon: "bi-calendar-x", iconClass: "bg-warning", title: "Pending Approvals", description: "12 expense reports awaiting your approval", type: "warning" }
  ];

  // global data
  window.reportsData = [];

  // pagination state
  let currentPage = 1;
  const pageSize = 5;

  // -------------------------
  // Persistence
  // -------------------------
  function loadReportsData() {
    try {
      const persistedData = localStorage.getItem("reportsData");
      if (persistedData) {
        window.reportsData = JSON.parse(persistedData);
      } else {
        window.reportsData = initialReportsData;
        saveReportsData();
      }
    } catch (e) {
      console.error("Error loading reports data from localStorage:", e);
      window.reportsData = initialReportsData;
    }
  }

  function saveReportsData() {
    try {
      localStorage.setItem("reportsData", JSON.stringify(window.reportsData));
    } catch (e) {
      console.error("Error saving reports data to localStorage:", e);
    }
  }

  // -------------------------
  // Utilities
  // -------------------------
  function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function getReportTypeIcon(type) {
    const icons = { "visit-report": "bi bi-clipboard-check", "doctor-feedback": "bi bi-chat-quote", "chemist-feedback": "bi bi-shop", "product-feedback": "bi bi-star" };
    return icons[type] || "bi bi-file-earmark-text";
  }

  // -------------------------
  // Rendering with pagination
  // -------------------------
  function renderReportTable(data) {
    const container = document.getElementById("reportsList");
    if (!container) return;
    container.innerHTML = "";

    const totalItems = Array.isArray(data) ? data.length : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const pageItems = (data || []).slice(start, start + pageSize);

    if (!pageItems.length) {
      container.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No reports found.</td></tr>`;
      renderPagination(totalItems, totalPages);
      return;
    }

    pageItems.forEach((report) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><i class="${getReportTypeIcon(report.type)} me-2"></i>${escapeHtml(report.title)}</td>
        <td>${escapeHtml(report.mrName)}</td>
        <td>${escapeHtml(report.type.replace("-", " ").toUpperCase())}</td>
        <td>${escapeHtml(report.doctorName)}</td>
        <td>
          <button class="btn btn-outline-info btn-sm btn-view me-1" data-id="${report.id}" title="View"><i class="bi bi-eye"></i></button>
          <button class="btn btn-outline-primary btn-sm btn-download me-1" data-id="${report.id}" title="Download"><i class="bi bi-download"></i></button>
          <button class="btn btn-outline-danger btn-sm btn-delete" data-id="${report.id}" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      `;
      container.appendChild(row);
    });

    // wire buttons
    container.querySelectorAll(".btn-view").forEach((b) => {
      b.removeEventListener("click", onViewClick);
      b.addEventListener("click", onViewClick);
    });
    container.querySelectorAll(".btn-download").forEach((b) => {
      b.removeEventListener("click", onDownloadClick);
      b.addEventListener("click", onDownloadClick);
    });
    container.querySelectorAll(".btn-delete").forEach((b) => {
      b.removeEventListener("click", onDeleteClick);
      b.addEventListener("click", onDeleteClick);
    });

    renderPagination(totalItems, totalPages);
  }

  function renderPagination(totalItems, totalPages) {
    const pag = document.getElementById("reportsPagination");
    if (!pag) return;
    pag.innerHTML = "";

    const createPageItem = (label, disabled, handler, extraClass = "") => {
      const li = document.createElement("li");
      li.className = "page-item " + (disabled ? "disabled" : "") + " " + extraClass;
      li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
      if (!disabled) li.addEventListener("click", (e) => { e.preventDefault(); handler(); });
      return li;
    };

    // Prev
    pag.appendChild(createPageItem("Prev", currentPage === 1, () => { currentPage = Math.max(1, currentPage - 1); applyFilters(); }));

    // page numbers (condensed)
    const maxPagesToShow = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = "page-item " + (i === currentPage ? "active" : "");
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => { e.preventDefault(); if (i === currentPage) return; currentPage = i; applyFilters(); });
      pag.appendChild(li);
    }

    // Next
    pag.appendChild(createPageItem("Next", currentPage >= totalPages, () => { currentPage = Math.min(totalPages, currentPage + 1); applyFilters(); }));
  }

  // -------------------------
  // Notifications renderer
  // -------------------------
  function buildNotificationHtml(n) {
    return `
      <div class="notification-item p-3 border-bottom">
        <div class="d-flex align-items-start">
          <div class="notification-icon ${escapeHtml(n.iconClass || "bg-primary")} text-white me-3" style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <i class="${escapeHtml(n.icon || "bi-bell")}"></i>
          </div>
          <div class="flex-grow-1 ms-2">
            <h6 class="mb-1">${escapeHtml(n.title)}</h6>
            <p class="mb-1 small" style="opacity:0.9;color:inherit">${escapeHtml(n.description || "")}</p>
            <small style="opacity:0.85;color:inherit">${escapeHtml(n.time || "Just now")}</small>
          </div>
        </div>
      </div>
    `;
  }

  function populateNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;
    const alerts = Array.isArray(window.alertsData) ? window.alertsData : [];
    const recent = Array.isArray(window.recentActivities) ? window.recentActivities : [];
    const all = alerts.concat(recent);
    if (!all.length) {
      container.innerHTML = `<div class="p-3 text-muted small">No notifications available.</div>`;
      return;
    }
    container.innerHTML = all.slice(0, 20).map(buildNotificationHtml).join("");
  }

  // -------------------------
  // Filtering / search
  // -------------------------
  function getFilteredReports() {
    let data = Array.isArray(window.reportsData) ? window.reportsData.slice() : [];

    const searchEl = document.getElementById("searchReport");
    const typeEl = document.getElementById("filterReportType");

    const searchVal = searchEl ? (searchEl.value || "").trim().toLowerCase() : "";
    const typeVal = typeEl ? (typeEl.value || "").trim() : "";

    if (searchVal) {
      data = data.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const mr = (r.mrName || "").toLowerCase();
        const doc = (r.doctorName || "").toLowerCase();
        return title.includes(searchVal) || mr.includes(searchVal) || doc.includes(searchVal);
      });
    }

    if (typeVal) {
      data = data.filter((r) => (r.type || "") === typeVal);
    }

    return data;
  }

  function applyFilters() {
    const filtered = getFilteredReports();
    refreshAndPersist(filtered);
  }

  // Debounce
  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // -------------------------
  // Button handlers
  // -------------------------
  function onViewClick(e) {
    openReportDetails(Number(e.currentTarget.dataset.id));
  }
  function onDownloadClick(e) {
    const id = Number(e.currentTarget.dataset.id);
    const r = window.reportsData.find((x) => x.id === id);
    if (!r) return alert("Report not found");
    const file = (r.attachments || [])[0];
    if (!file) return alert("No attachment available to download.");
    downloadAttachment(file);
  }
  function onDeleteClick(e) {
    const id = Number(e.currentTarget.dataset.id);
    deleteReport(id);
  }

  // -------------------------
  // Actions
  // -------------------------
  function openReportDetails(reportId) {
    const r = window.reportsData.find((x) => x.id === reportId);
    if (!r) return alert("Report not found.");
    const content = document.getElementById("reportDetailsContent");

    // Single attachment (first one) shown with filename + Download only
    let attachmentHtml = "";
    const single = (r.attachments && r.attachments.length) ? r.attachments[0] : null;
    if (single) {
      attachmentHtml = `
        <div class="mt-2">
          <h6>Attachment</h6>
          <div class="mb-2">
            <span class="me-2">${escapeHtml(single)}</span>
            <button class="btn btn-sm btn-outline-primary" data-file="${encodeURIComponent(single)}" onclick="(function(el){ const file=decodeURIComponent(el.dataset.file); window.__downloadAttachment(file); })(this)">
              <i class="bi bi-download"></i> Download
            </button>
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div>
        <h5>${escapeHtml(r.title)}</h5>
        <p><strong>MR:</strong> ${escapeHtml(r.mrName)} &nbsp; <strong>Type:</strong> ${escapeHtml(r.type)}</p>
        <p><strong>Doctor:</strong> ${escapeHtml(r.doctorName || '')} &nbsp; <strong>Clinic:</strong> ${escapeHtml(r.clinicName || '')}</p>
        <p><strong>Visit Date:</strong> ${formatDate(r.visitDate)} &nbsp; <strong>Submitted:</strong> ${formatDate(r.submittedDate)}</p>
        <hr/>
        <h6>Visit Summary</h6><p>${escapeHtml(r.visitSummary)}</p>
        <h6>Key Outcomes</h6><p>${escapeHtml(r.keyOutcomes)}</p>
        <h6>Follow-up Actions</h6><p>${escapeHtml(r.followUpActions)}</p>
        ${attachmentHtml}
        ${
          r.rejectionReason
            ? `<div class="alert alert-danger mt-3">Rejection Reason: ${escapeHtml(r.rejectionReason)}</div>`
            : ""
        }
      </div>
    `;

    try {
      new bootstrap.Modal(document.getElementById("reportDetailsModal")).show();
    } catch (e) {
      console.error("Bootstrap modal error:", e);
    }
  }

  // helper for inline download
  window.__downloadAttachment = function (filename) {
    downloadAttachment(filename);
  };

  function downloadAttachment(filename) {
    if (!filename) return alert("No file specified.");
    const url = `assets/attachments/${encodeURIComponent(filename)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function deleteReport(reportId) {
    if (!confirm(`Are you sure you want to delete report #${reportId}?`)) return;
    const initialLength = window.reportsData.length;
    window.reportsData = window.reportsData.filter((r) => r.id !== reportId);
    if (window.reportsData.length < initialLength) {
      alert(`Report #${reportId} deleted successfully.`);
      // adjust current page if needed
      const filtered = getFilteredReports();
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      applyFilters();
      saveReportsData();
    } else {
      alert("Report not found or deletion failed.");
    }
  }

  // -------------------------
  // Initialization
  // -------------------------
  function initialize() {
    loadReportsData();
    wireFilterControls();

    // notifications button: populate and open modal
    const notifyBtn = document.getElementById("notifyBtn");
    if (notifyBtn) {
      notifyBtn.addEventListener("click", () => {
        populateNotifications();
        try { new bootstrap.Modal(document.getElementById("notificationsModal")).show(); } catch (e) {}
      });
    }

    // initial render
    refreshAndPersist(window.reportsData);
    populateNotifications();
  }

  function refreshAndPersist(filtered = null) {
    const dataToRender = Array.isArray(filtered) ? filtered : window.reportsData;
    renderReportTable(dataToRender);
    saveReportsData();
  }

  // Theme toggle
  document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");
    if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    }
  });

  function wireFilterControls() {
    const searchEl = document.getElementById("searchReport");
    const typeEl = document.getElementById("filterReportType");
    if (searchEl) {
      // when user types, reset to page 1
      const debounced = debounce(() => { currentPage = 1; applyFilters(); }, 300);
      searchEl.addEventListener("input", debounced);
    }
    if (typeEl) {
      typeEl.addEventListener("change", () => { currentPage = 1; applyFilters(); });
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);

  // Sidebar toggle
  document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    if (!sidebarToggle) return;
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      mainContent.classList.toggle("expanded");
    });
  });

  // expose download helper if needed
  window.downloadAttachment = downloadAttachment;
})();
