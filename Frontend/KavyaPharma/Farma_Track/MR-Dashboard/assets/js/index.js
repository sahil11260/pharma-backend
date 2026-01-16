// assets/js/index.js
// MR Dashboard - Robust attendance + debug helpers
(function () {
  "use strict";

  const LOG = "[MR-DASH]";
  function log(...a) { console.log(LOG, ...a); }
  function warn(...a) { console.warn(LOG, ...a); }
  function err(...a) { console.error(LOG, ...a); }

  // LocalStorage keys
  const LS = {
    DASH: "mr_dashboard_v1",
    ATT: "mr_attendance_v1"
  };

  // Default dashboard values (unchanged)
  const DEFAULTS = {
    sales: 85000,
    targetPercent: 72,
    visits: 18,
    expensesPending: 2500,
    expensesApproved: 9200
  };

  const API = {
    DASHBOARD: "https://pharma-backend-hxf9.onrender.com/api/mr-dashboard",
    ATT_TODAY: "https://pharma-backend-hxf9.onrender.com/api/attendance/today",
    ATT_CHECK_IN: "https://pharma-backend-hxf9.onrender.com/api/attendance/check-in",
    ATT_CHECK_OUT: "https://pharma-backend-hxf9.onrender.com/api/attendance/check-out",
    ATT_CLEAR_TODAY: "https://pharma-backend-hxf9.onrender.com/api/attendance/clear-today"
  };

  const $id = id => document.getElementById(id);
  let durationInterval = null;
  let attState = { checkInTs: null, checkOutTs: null };

  async function apiJson(url, options) {
    const res = await fetch(url, Object.assign({
      headers: { "Content-Type": "application/json" }
    }, options || {}));
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    if (res.status === 204) {
      return null;
    }
    return await res.json();
  }

  function formatINR(n) {
    if (n == null) return "--";
    if (typeof n !== "number") return n;
    return "₹" + n.toLocaleString("en-IN");
  }

  function loadDashboardFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LS.DASH);
      if (!raw) return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {
      warn("loadDashboard error:", e);
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveDashboardToLocalStorage(obj) {
    try {
      localStorage.setItem(LS.DASH, JSON.stringify(obj));
    } catch (e) {
      warn("saveDashboard error:", e);
    }
  }

  async function loadDashboard() {
    try {
      const data = await apiJson(API.DASHBOARD);
      return Object.assign({}, DEFAULTS, data || {});
    } catch (e) {
      warn("loadDashboard API error:", e);
      return loadDashboardFromLocalStorage();
    }
  }

  async function saveDashboard(obj) {
    try {
      const data = await apiJson(API.DASHBOARD, {
        method: "PUT",
        body: JSON.stringify(obj || {})
      });
      return Object.assign({}, DEFAULTS, data || {});
    } catch (e) {
      warn("saveDashboard API error:", e);
      saveDashboardToLocalStorage(obj);
      return Object.assign({}, DEFAULTS, obj || {});
    }
  }

  // Robust attendance load/save: coerce numbers
  function loadAttendanceFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LS.ATT);
      if (!raw) return { checkInTs: null, checkOutTs: null };
      const parsed = JSON.parse(raw);
      return {
        checkInTs: parsed.checkInTs != null ? Number(parsed.checkInTs) : null,
        checkOutTs: parsed.checkOutTs != null ? Number(parsed.checkOutTs) : null
      };
    } catch (e) {
      warn("loadAttendance error:", e);
      return { checkInTs: null, checkOutTs: null };
    }
  }

  function saveAttendanceToLocalStorage(obj) {
    try {
      const toSave = {
        checkInTs: obj.checkInTs != null ? Number(obj.checkInTs) : null,
        checkOutTs: obj.checkOutTs != null ? Number(obj.checkOutTs) : null
      };
      localStorage.setItem(LS.ATT, JSON.stringify(toSave));
    } catch (e) {
      warn("saveAttendance error:", e);
    }
  }

  function toAttendanceStateFromApi(record) {
    if (!record) {
      return { checkInTs: null, checkOutTs: null };
    }
    return {
      checkInTs: record.checkIn != null ? Number(record.checkIn) : null,
      checkOutTs: record.checkOut != null ? Number(record.checkOut) : null
    };
  }

  async function loadAttendance() {
    try {
      const record = await apiJson(API.ATT_TODAY);
      const st = toAttendanceStateFromApi(record);
      saveAttendanceToLocalStorage(st);
      return st;
    } catch (e) {
      warn("loadAttendance API error:", e);
      return loadAttendanceFromLocalStorage();
    }
  }

  async function attendanceCheckIn() {
    const record = await apiJson(API.ATT_CHECK_IN, { method: "POST" });
    const st = toAttendanceStateFromApi(record);
    saveAttendanceToLocalStorage(st);
    return st;
  }

  async function attendanceCheckOut() {
    const record = await apiJson(API.ATT_CHECK_OUT, { method: "POST" });
    const st = toAttendanceStateFromApi(record);
    saveAttendanceToLocalStorage(st);
    return st;
  }

  async function attendanceClearToday() {
    await apiJson(API.ATT_CLEAR_TODAY, { method: "POST" });
    const blank = { checkInTs: null, checkOutTs: null };
    saveAttendanceToLocalStorage(blank);
    return blank;
  }

  function renderSummary(data) {
    const elSales = $id("dashSales");
    const elTarget = $id("dashTarget");
    const elTargetBar = $id("dashTargetBar");
    const elVisits = $id("dashVisits");
    const elExpPending = $id("dashExpensesPending");
    const elExpApproved = $id("dashExpensesApproved");

    if (elSales) elSales.textContent = formatINR(Number(data.sales) || 0);
    if (elTarget) {
      const pct = Math.min(100, Math.max(0, Number(data.targetPercent || 0)));
      elTarget.textContent = `${pct}%`;
      if (elTargetBar) {
        elTargetBar.style.width = `${pct}%`;
        elTargetBar.setAttribute("aria-valuenow", String(pct));
      }
    }
    if (elVisits) elVisits.textContent = String(Number(data.visits) || 0);
    if (elExpPending) elExpPending.textContent = formatINR(Number(data.expensesPending) || 0);
    if (elExpApproved) elExpApproved.textContent = formatINR(Number(data.expensesApproved) || 0);
  }

  // Helpers for attendance UI
  function formatTime(ts) {
    if (ts == null) return "--:--";
    try {
      return new Date(Number(ts)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "--:--";
    }
  }

  function computeDurationMs(start, end) {
    if (start == null || end == null) return { hrs: 0, mins: 0 };
    const s = Number(start);
    const e = Number(end);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return { hrs: 0, mins: 0 };
    const diff = e - s;
    const mins = Math.floor(diff / 60000);
    return { hrs: Math.floor(mins / 60), mins: mins % 60 };
  }

  async function renderAttendance() {
    // load fresh data
    const att = await loadAttendance();
    attState = att;

    const statusEl = $id("attendanceStatus");
    const statusBadgeEl = $id("attendanceStatusBadge");
    const inEl = $id("checkInTime");
    const outEl = $id("checkOutTime");
    const totalEl = $id("totalHours");
    const inBtn = $id("checkInBtn");
    const outBtn = $id("checkOutBtn");

    // Basic DOM existence checks
    if (!statusEl || !statusBadgeEl || !inEl || !outEl || !totalEl || !inBtn || !outBtn) {
      err("One or more attendance DOM nodes missing. Check IDs in HTML.");
      // If nodes missing, stop to avoid silent failure
      return;
    }

    // clear previous interval
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
      log("Cleared existing duration interval.");
    }

    inEl.textContent = att.checkInTs ? formatTime(att.checkInTs) : "--:--";
    outEl.textContent = att.checkOutTs ? formatTime(att.checkOutTs) : "--:--";

    const updateDuration = (endTime) => {
      const startTs = attState.checkInTs;
      const finalEnd = endTime != null ? Number(endTime) : (attState.checkOutTs != null ? Number(attState.checkOutTs) : Date.now());
      const d = computeDurationMs(startTs, finalEnd);
      totalEl.textContent = `${d.hrs}h ${d.mins}m`;
    };

    if (att.checkInTs && !att.checkOutTs) {
      statusEl.textContent = "Checked-In";
      statusBadgeEl.className = "badge rounded-pill bg-success text-white fs-6 border";
      inBtn.disabled = true;
      outBtn.disabled = false;

      updateDuration(Date.now());
      // update every 1s to ensure minutes roll over correctly
      durationInterval = setInterval(() => updateDuration(Date.now()), 1000);
      log("Started live duration interval (1s).");

    } else if (att.checkInTs && att.checkOutTs) {
      statusEl.textContent = "Checked-Out";
      statusBadgeEl.className = "badge rounded-pill bg-danger text-white fs-6 border";
      inBtn.disabled = true;
      outBtn.disabled = true;
      updateDuration(att.checkOutTs);
      log("Rendered fixed duration for checked-out state.");

    } else {
      statusEl.textContent = "Not Checked-In";
      statusBadgeEl.className = "badge rounded-pill bg-light text-dark fs-6 border";
      inBtn.disabled = false;
      outBtn.disabled = true;
      totalEl.textContent = `0h 0m`;
      log("Rendered not checked-in state.");
    }

    // Helpful console print
    log("Attendance render:", att, "Total displayed:", totalEl.textContent);
  }

  function attachAttendanceHandlers() {
    const inBtn = $id("checkInBtn");
    const outBtn = $id("checkOutBtn");
    const clearBtn = $id("clearTodayBtn");

    if (!inBtn || !outBtn || !clearBtn) {
      err("Attendance buttons missing in DOM. Check IDs.");
      return;
    }

    inBtn.addEventListener("click", function () {
      (async function () {
        try {
          const current = await loadAttendance();
          if (current.checkInTs) {
            log("Attempted check-in but already checked in at:", current.checkInTs);
            return;
          }
          const next = await attendanceCheckIn();
          log("Checked in (user):", next.checkInTs);
          renderAttendance();
        } catch (e) {
          err("Check-in failed:", e);
        }
      })();
    });

    outBtn.addEventListener("click", function () {
      (async function () {
        try {
          const current = await loadAttendance();
          if (!current.checkInTs || current.checkOutTs) {
            log("Attempted check-out but invalid state:", current);
            return;
          }
          const next = await attendanceCheckOut();
          log("Checked out (user):", next.checkOutTs);
          renderAttendance();
        } catch (e) {
          err("Check-out failed:", e);
        }
      })();
    });

    clearBtn.addEventListener("click", function () {
      (async function () {
        try {
          warn("Attendance reset by user.");
          await attendanceClearToday();
          renderAttendance();
        } catch (e) {
          err("Clear attendance failed:", e);
        }
      })();
    });
  }

  // Initialization
  async function init() {
    log("Initializing MR Dashboard script");

    // Set Today's date in header
    const dateEl = $id("todayDate");
    if (dateEl) {
      const d = new Date();
      dateEl.textContent = d.toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' });
    } else {
      warn("#todayDate element not found.");
    }

    const dashboardData = await loadDashboard();
    renderSummary(dashboardData);

    attachAttendanceHandlers();
    renderAttendance();

    // Expose debug helpers for console
    window._mrDebugAttendance = function () {
      console.log(LOG, "localStorage raw:", localStorage.getItem(LS.ATT));
      console.log(LOG, "parsed:", loadAttendanceFromLocalStorage());
      const totalEl = $id("totalHours");
      console.log(LOG, "DOM totalHours text:", totalEl ? totalEl.textContent : "(missing)");
    };

    window._mrSimulateCheckIn = function () {
      (async function () {
        try {
          const next = await attendanceCheckIn();
          log("Simulated check-in:", next.checkInTs);
          renderAttendance();
        } catch (e) {
          err("Simulated check-in failed:", e);
        }
      })();
    };

    window._mrSimulateCheckOut = function () {
      (async function () {
        try {
          const current = await loadAttendance();
          if (!current.checkInTs) {
            warn("Cannot simulate check-out: no check-in timestamp.");
            return;
          }
          const next = await attendanceCheckOut();
          log("Simulated check-out:", next.checkOutTs);
          renderAttendance();
        } catch (e) {
          err("Simulated check-out failed:", e);
        }
      })();
    };

    window._mrForceRender = function () {
      renderAttendance();
      log("Force rendered attendance.");
    };

    // Backwards-compatible update helper
    window._mrUpdate = function (obj) {
      (async function () {
        try {
          const current = await loadDashboard();
          const merged = Object.assign({}, current, obj);
          const saved = await saveDashboard(merged);
          renderSummary(saved);
        } catch (e) {
          err("Dashboard update failed:", e);
        }
      })();
    };

    log("MR Dashboard ready. Use window._mrDebugAttendance(), _mrSimulateCheckIn(), _mrSimulateCheckOut().");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 10);
  }
})();
