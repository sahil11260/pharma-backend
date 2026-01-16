// Run script after DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.querySelector(".loader");
  if (loader) {
    window.addEventListener("load", () => {
      loader.classList.add("fade-out");
      setTimeout(() => (loader.style.display = "none"), 500);
    });
  }

  // Sidebar Toggle
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  if (sidebarToggle && sidebar && mainContent) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      mainContent.classList.toggle("expanded");
    });
  }

  // ✅ Dark Mode Toggle (fixed to match HTML id="themeToggle")
  const darkModeToggle = document.getElementById("themeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const logo = document.querySelector(".logo");
      const icon = darkModeToggle.querySelector("i");
      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        if (logo) logo.src = "assest/image/logo-dark.png";
        if (icon) icon.className = "bi bi-sun";
      } else {
        localStorage.setItem("theme", "light");
        if (logo) logo.src = "assest/image/image.png";
        if (icon) icon.className = "bi bi-moon";
      }
    });
  }

  // Apply saved dark mode preference on load
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const logo = document.querySelector(".logo");
    if (logo) logo.src = "assest/image/logo-dark.png";
    const icon = document.querySelector("#themeToggle i");
    if (icon) icon.className = "bi bi-sun";
  } else {
    // Default to light mode
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
    const logo = document.querySelector(".logo");
    if (logo) logo.src = "assest/image/image.png";
    const icon = document.querySelector("#themeToggle i");
    if (icon) icon.className = "bi bi-moon";
  }

  // Logout functionality
  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    if (item.textContent.trim() === "Logout") {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        alert("Logged out successfully");
        //window.location.href = "login.html";
        window.location.href = "../index.html";
      });
    }
  });

  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const API = {
    USERS: `${API_BASE}/api/users`,
    DOCTORS: `${API_BASE}/api/doctors`,
    DCRS: `${API_BASE}/api/dcrs`,
    EXPENSES: `${API_BASE}/api/expenses`,
    TARGETS: `${API_BASE}/api/targets`,
  };

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
            getAuthHeader(),
            (options && options.headers) || {}
          ),
        },
        options || {}
      )
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  }

  // Dummy Data for Tables
  let visits = [
    {
      date: "2025-11-01",
      mr: "Rahul Mehta",
      doctor: "Dr. Sharma",
      location: "Mumbai",
      feedback: "Positive",
      status: "Completed",
    },
    {
      date: "2025-11-02",
      mr: "Pooja Singh",
      doctor: "Dr. Patel",
      location: "Delhi",
      feedback: "Follow-up required",
      status: "Pending",
    },
    {
      date: "2025-11-03",
      mr: "Amit Verma",
      doctor: "Dr. Khan",
      location: "Pune",
      feedback: "Interested in new products",
      status: "Completed",
    },
  ];

  let expenses = [
    { category: "Travel", amount: 15000 },
    { category: "Meals", amount: 2500 },
    { category: "Samples", amount: 8000 },
    { category: "Accommodation", amount: 12000 },
  ];

  let usersApi = null;
  let doctorsApi = null;
  let dcrsApi = null;
  let expensesApi = null;
  let targetsApi = null;

  try {
    const [usersRes, doctorsRes, dcrsRes, expensesRes, targetsRes] =
      await Promise.allSettled([
        apiJson(API.USERS),
        apiJson(API.DOCTORS),
        apiJson(API.DCRS),
        apiJson(API.EXPENSES),
        apiJson(API.TARGETS),
      ]);

    usersApi =
      usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
        ? usersRes.value
        : null;
    doctorsApi =
      doctorsRes.status === "fulfilled" && Array.isArray(doctorsRes.value)
        ? doctorsRes.value
        : null;
    dcrsApi =
      dcrsRes.status === "fulfilled" && Array.isArray(dcrsRes.value)
        ? dcrsRes.value
        : null;
    expensesApi =
      expensesRes.status === "fulfilled" && Array.isArray(expensesRes.value)
        ? expensesRes.value
        : null;
    targetsApi =
      targetsRes.status === "fulfilled" && Array.isArray(targetsRes.value)
        ? targetsRes.value
        : null;
  } catch (_) {
  }

  const totalMRsEl = document.getElementById("totalMRs");
  const totalDoctorsEl = document.getElementById("totalDoctors");
  const totalVisitsEl = document.getElementById("totalVisits");
  const totalExpensesEl = document.getElementById("totalExpenses");
  const totalSalesEl = document.getElementById("totalSales");
  const targetAchieveEl = document.getElementById("targetAchieve");
  const totalManagersEl = document.getElementById("totalManagers");
  const activeMRsEl = document.getElementById("activeMRs");
  const topMREl = document.getElementById("topMR");
  const topMRVisitsEl = document.getElementById("topMRVisits");

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let monthlyVisits = null;
  let monthlySales = null;
  let monthlyTargets = null;

  if (usersApi) {
    const totalMRs = usersApi.filter((u) => String(u.role) === "MR").length;
    const totalManagers = usersApi.filter((u) => String(u.role) === "MANAGER")
      .length;
    const activeMRs = usersApi.filter(
      (u) => String(u.role) === "MR" && String(u.status) === "ACTIVE"
    ).length;

    if (totalMRsEl) totalMRsEl.textContent = String(totalMRs);
    if (totalManagersEl) totalManagersEl.textContent = String(totalManagers);
    if (activeMRsEl) activeMRsEl.textContent = String(activeMRs);
  }

  if (doctorsApi && totalDoctorsEl) {
    totalDoctorsEl.textContent = String(doctorsApi.length);
  }

  if (dcrsApi) {
    if (totalVisitsEl) totalVisitsEl.textContent = String(dcrsApi.length);
    visits = dcrsApi.slice(0, 50).map((d) => ({
      date: String(d.dateTime || "").slice(0, 10) || "-",
      mr: "-",
      doctor: d.doctorName || "-",
      location: d.clinicLocation || "-",
      feedback: d.rating ? `Rating: ${d.rating}` : "-",
      status: "Completed",
    }));

    const mv = new Array(12).fill(0);
    for (const d of dcrsApi) {
      const raw = d && d.dateTime ? String(d.dateTime) : "";
      const dt = raw ? new Date(raw) : null;
      if (!dt || Number.isNaN(dt.getTime())) continue;
      mv[dt.getMonth()] += 1;
    }
    monthlyVisits = mv;
  }

  if (expensesApi) {
    const total = expensesApi.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
    if (totalExpensesEl) totalExpensesEl.textContent = `₹${Math.round(total)}`;
    expenses = expensesApi
      .reduce((acc, e) => {
        const category = e.category || "Other";
        const amount = Number(e.amount) || 0;
        const existing = acc.find((x) => x.category === category);
        if (existing) {
          existing.amount += amount;
        } else {
          acc.push({ category, amount });
        }
        return acc;
      }, [])
      .sort((a, b) => b.amount - a.amount);
  }

  if (targetsApi) {
    const sales = targetsApi.reduce(
      (sum, t) => sum + (Number(t.salesAchievement) || 0),
      0
    );
    if (totalSalesEl) totalSalesEl.textContent = `₹${Math.round(sales)}`;

    const sumTarget = targetsApi.reduce(
      (sum, t) => sum + (Number(t.salesTarget) || 0),
      0
    );
    const sumAch = targetsApi.reduce(
      (sum, t) => sum + (Number(t.salesAchievement) || 0),
      0
    );
    const percent = sumTarget > 0 ? Math.round((sumAch / sumTarget) * 100) : 0;
    if (targetAchieveEl) targetAchieveEl.textContent = `${percent}%`;

    const best = targetsApi
      .filter((t) => t && t.mrName)
      .sort((a, b) => (Number(b.visitsAchievement) || 0) - (Number(a.visitsAchievement) || 0))[0];
    if (best) {
      if (topMREl) topMREl.textContent = best.mrName;
      if (topMRVisitsEl)
        topMRVisitsEl.textContent = String(Number(best.visitsAchievement) || 0);
    }

    const ms = new Array(12).fill(0);
    const mt = new Array(12).fill(0);

    for (const t of targetsApi) {
      if (!t) continue;
      const start = t.startDate ? new Date(String(t.startDate)) : null;
      const end = t.endDate ? new Date(String(t.endDate)) : null;
      if (!start || !end) continue;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      const startMonth = start.getMonth();
      const endMonth = end.getMonth();
      const monthCount =
        end.getFullYear() === start.getFullYear()
          ? endMonth - startMonth + 1
          : 1;
      if (monthCount <= 0) continue;

      const ach = Number(t.salesAchievement) || 0;
      const tgt = Number(t.salesTarget) || 0;
      const perMonthAch = ach / monthCount;
      const perMonthTgt = tgt / monthCount;

      if (end.getFullYear() === start.getFullYear()) {
        for (let m = startMonth; m <= endMonth; m++) {
          ms[m] += perMonthAch;
          mt[m] += perMonthTgt;
        }
      } else {
        ms[startMonth] += perMonthAch;
        mt[startMonth] += perMonthTgt;
      }
    }

    monthlySales = ms.map((v) => Math.round(v));
    monthlyTargets = mt.map((v) => Math.round(v));
  }

  // -------------------------
  // Render Doctor Visits Table + Search Functionality
  // -------------------------
  const tableBody = document.getElementById("tableBody");
  const searchInput = document.getElementById("searchInput");

  // Reusable renderer for the table rows
  const renderTable = (data) => {
    if (!tableBody) return;
    if (!data || data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No matching records found</td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = data
      .map(
        (v) => `
      <tr>
        <td>${v.date}</td>
        <td>${v.mr}</td>
        <td>${v.doctor}</td>
        <td>${v.location}</td>
        <td>${v.feedback}</td>
        <td><span class="badge ${v.status === "Completed" ? "bg-success" : "bg-warning"
          }">${v.status}</span></td>
      </tr>`
      )
      .join("");
  };

  // Initial render of full dataset
  renderTable(visits);

  // Working search (live filtering)
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.trim().toLowerCase();

      if (term === "") {
        // empty -> show all
        renderTable(visits);
        return;
      }

      const filtered = visits.filter((v) => {
        // convert each field to string and check inclusion
        return (
          String(v.date).toLowerCase().includes(term) ||
          String(v.mr).toLowerCase().includes(term) ||
          String(v.doctor).toLowerCase().includes(term) ||
          String(v.location).toLowerCase().includes(term) ||
          String(v.feedback).toLowerCase().includes(term) ||
          String(v.status).toLowerCase().includes(term)
        );
      });

      renderTable(filtered);
    });
  }

  // -------------------------
  // Pagination (kept as-is)
  // -------------------------
  const pagination = document.getElementById("pagination");
  if (pagination) {
    pagination.innerHTML = `
      <li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>
      <li class="page-item active"><a class="page-link" href="#">1</a></li>
      <li class="page-item"><a class="page-link" href="#">2</a></li>
      <li class="page-item"><a class="page-link" href="#">3</a></li>
      <li class="page-item"><a class="page-link" href="#">Next</a></li>
    `;
  }

  // Charts Initialization
  const visitsChartCanvas = document.getElementById("visitsChart");
  const salesChartCanvas = document.getElementById("salesChart");
  const expenseChartCanvas = document.getElementById("expenseChart");

  if (visitsChartCanvas && salesChartCanvas && expenseChartCanvas) {
    renderCharts(
      visitsChartCanvas,
      salesChartCanvas,
      expenseChartCanvas,
      expenses,
      monthLabels,
      monthlyVisits,
      monthlySales,
      monthlyTargets
    );
  }
});

// -------------------------
// Chart Rendering Function (12-Month Charts)
// -------------------------
function renderCharts(
  visitsChartCanvas,
  salesChartCanvas,
  expenseChartCanvas,
  expenses,
  monthLabels,
  monthlyVisits,
  monthlySales,
  monthlyTargets
) {
  // --- Doctor Visits Chart (12 Months) ---
  const visitsCtx = visitsChartCanvas.getContext("2d");
  new Chart(visitsCtx, {
    type: "bar",
    data: {
      labels: Array.isArray(monthLabels) ? monthLabels : [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Doctor Visits",
          data: Array.isArray(monthlyVisits)
            ? monthlyVisits
            : [65, 59, 80, 81, 56, 55, 70, 75, 85, 90, 95, 100],
          backgroundColor: "#0d6efd",
          borderColor: "#0d6efd",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });

  // --- Sales vs Target Chart (12 Months) ---
  const salesCtx = salesChartCanvas.getContext("2d");
  new Chart(salesCtx, {
    type: "line",
    data: {
      labels: Array.isArray(monthLabels) ? monthLabels : [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Sales",
          data: Array.isArray(monthlySales)
            ? monthlySales
            : [400, 450, 470, 520, 580, 600, 650, 700, 720, 750, 780, 820],
          borderColor: "#198754",
          backgroundColor: "rgba(25,135,84,0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Target",
          data: Array.isArray(monthlyTargets)
            ? monthlyTargets
            : [380, 420, 450, 500, 550, 580, 620, 680, 700, 740, 760, 800],
          borderColor: "#dc3545",
          backgroundColor: "rgba(220,53,69,0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });

  // --- Expense Distribution Chart (unchanged) ---
  const expenseCtx = expenseChartCanvas.getContext("2d");
  new Chart(expenseCtx, {
    type: "pie",
    data: {
      labels: expenses.map((exp) => exp.category),
      datasets: [
        {
          data: expenses.map((exp) => exp.amount),
          backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545"],
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
