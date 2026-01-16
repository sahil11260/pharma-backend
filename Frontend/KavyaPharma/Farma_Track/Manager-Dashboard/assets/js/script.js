

document.addEventListener("DOMContentLoaded", () => {
 
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

  function injectDarkCardStyles() {
    if (document.getElementById("dark-card-styles")) return;
    const style = document.createElement("style");
    style.id = "dark-card-styles";
    style.innerHTML = `
      /* Styles applied to the two equal-height cards when dark mode is active */
      #mainContent .card.equal-height.dark-card .card-header,
      #mainContent .card.equal-height.dark-card .card-body,
      #mainContent .card.equal-height.dark-card h5.mb-0 {
        color: #ffffff !important;
      }
      #mainContent .card.equal-height.dark-card .activity-content h6,
      #mainContent .card.equal-height.dark-card .activity-content p,
      #mainContent .card.equal-height.dark-card .activity-content small {
        color: #ffffff !important;
      }
      #mainContent .card.equal-height.dark-card .activity-icon i {
        color: #ffffff !important;
      }

      /* Notifications modal dark style (applied to .modal-content.dark-modal) */
      .modal-content.dark-modal {
        background-color: #0b0b0b !important;
        color: #ffffff !important;
        border: 1px solid #222 !important;
      }
      .modal-content.dark-modal .modal-header,
      .modal-content.dark-modal .modal-footer {
        border-color: #222 !important;
      }
      .modal-content.dark-modal .text-muted {
        color: rgba(255,255,255,0.70) !important;
      }
      .modal-content.dark-modal .notification-item {
        border-bottom-color: rgba(255,255,255,0.06) !important;
      }
      .modal-content.dark-modal .notification-icon { opacity: 0.95; }
    `;
    document.head.appendChild(style);
  }

  function applyDarkToEqualHeightCards(enable) {
    const cards = document.querySelectorAll("#mainContent .card.equal-height");
    if (!cards || cards.length === 0) return;
    cards.forEach((card) => card.classList.toggle("dark-card", !!enable));
  }

  function applyDarkToNotificationsModal(enable) {
    const modal = document.getElementById("notificationsModal");
    if (!modal) return;
    const content = modal.querySelector(".modal-content");
    if (!content) return;
    content.classList.toggle("dark-modal", !!enable);

    const items = content.querySelectorAll(".notification-item");
    items.forEach((it) => {
      if (enable) {
        it.style.color = "#ffffff";
        const muted = it.querySelectorAll(".text-muted");
        muted.forEach((m) => (m.style.color = "rgba(255,255,255,0.7)"));
      } else {
        it.style.color = "";
        const muted = it.querySelectorAll(".text-muted");
        muted.forEach((m) => (m.style.color = ""));
      }
    });
  }

  // Load theme from storage
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    injectDarkCardStyles();
    applyDarkToEqualHeightCards(true);
    applyDarkToNotificationsModal(true);
    const ic = themeToggle && themeToggle.querySelector("i");
    if (ic) {
      ic.classList.remove("bi-moon");
      ic.classList.add("bi-sun");
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      if (isDark) injectDarkCardStyles();
      applyDarkToEqualHeightCards(isDark);
      applyDarkToNotificationsModal(isDark);
      const icon = themeToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("bi-moon", !isDark);
        icon.classList.toggle("bi-sun", isDark);
      }
    });
  }

  // -----------------------
  // Mock / dashboard data
  // -----------------------
  const dashboardData = {
    totalMRs: 6,
    totalSales: 1250000,
    totalVisits: 245,
    pendingTasks: 18,
    period: "month",
  };

  const mrPerformanceData = [
    { name: "Rajesh Kumar", sales: 280000, visits: 45, target: 250000, avatar: "RK" },
    { name: "Priya Sharma", sales: 240000, visits: 42, target: 230000, avatar: "PS" },
    { name: "Amit Singh", sales: 220000, visits: 38, target: 220000, avatar: "AS" },
    { name: "Sneha Patel", sales: 210000, visits: 40, target: 200000, avatar: "SP" },
    { name: "Manish Patel", sales: 180000, visits: 35, target: 200000, avatar: "MP" },
    { name: "Kavita Jain", sales: 160000, visits: 45, target: 180000, avatar: "KJ" },
  ];

  const recentActivities = [
    { icon: "bi-person-plus", iconClass: "bg-primary", title: "New MR Assigned", description: "Sneha Patel assigned to Central Delhi region", time: "2 hours ago" },
    { icon: "bi-currency-rupee", iconClass: "bg-success", title: "Sales Target Achieved", description: "Rajesh Kumar achieved 112% of monthly target", time: "4 hours ago" },
    { icon: "bi-hospital", iconClass: "bg-info", title: "Doctor Visit Completed", description: "15 doctor visits completed today", time: "6 hours ago" },
    { icon: "bi-bell", iconClass: "bg-warning", title: "Meeting Reminder", description: "Team meeting scheduled for tomorrow 10 AM", time: "8 hours ago" },
    { icon: "bi-box-seam", iconClass: "bg-secondary", title: "Sample Stock Updated", description: "Diabetex 500mg stock replenished", time: "1 day ago" },
  ];

  const alertsData = [
    { icon: "bi-exclamation-triangle", iconClass: "bg-danger", title: "Low Stock Alert", description: "CardioCare 10mg running low in North Delhi", type: "urgent", time: "1 hour ago" },
    { icon: "bi-calendar-x", iconClass: "bg-warning", title: "Pending Approvals", description: "12 expense reports awaiting your approval", type: "warning", time: "3 hours ago" },
    { icon: "bi-graph-down", iconClass: "bg-info", title: "Performance Alert", description: "Manish Patel below 80% target achievement", type: "info", time: "6 hours ago" },
    { icon: "bi-check-circle", iconClass: "bg-success", title: "Task Completed", description: "Monthly report submitted successfully", type: "success", time: "1 day ago" },
  ];

  // -----------------------
  // Product Sales (per-month ascending stacked bars)
  // -----------------------
  // NOTE: user requested only FOUR products in this chart
  const productList = [
    "CardioCare",
    "Diabetex",
    "ImmunoPlus",
    "NeuroX"
  ];

  // LAST 6 MONTHS labels
  const months6 = (() => {
    const now = new Date();
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString("default", { month: "short" }));
    }
    return labels;
  })();

  // -----------------------
  // UPDATED salesData: only four products (6 months each)
  // Diabetex intentionally spikes in the 2nd month
  // -----------------------
  const salesData = {
    "CardioCare": [120000, 130000, 125000, 140000, 150000, 160000],
    "Diabetex":   [90000, 220000, 90000, 95000, 110000, 115000],
    "ImmunoPlus": [60000, 65000, 70000, 72000, 75000, 78000],
    "NeuroX":     [40000, 42000, 45000, 47000, 49000, 52000]
  };

  function getPaletteColor(i, alpha) {
    const palette = [
      '102,126,234', // indigo
      '240,147,251', // pink
      '40,167,69',   // green
      '255,193,7'    // amber
    ];
    const rgb = palette[i % palette.length];
    return `rgba(${rgb}, ${alpha})`;
  }

  function generateMockProductSales() {
    return productList.map((p, idx) => {
      const vals = [];
      for (let m = 0; m < 6; m++) {
        const base = 30 + idx * 8;
        const noise = Math.round(Math.random() * 20);
        vals.push((base + noise) * 1000);
      }
      return vals;
    });
  }

  // Validate and build sales arrays (prefer salesData)
  function buildSalesArrays() {
    const arrays = [];
    let valid = true;
    for (let i = 0; i < productList.length; i++) {
      const p = productList[i];
      if (salesData && salesData[p] && Array.isArray(salesData[p]) && salesData[p].length === 6) {
        arrays.push(salesData[p].slice());
      } else {
        valid = false;
        break;
      }
    }
    if (!valid) return generateMockProductSales();
    return arrays;
  }

  // We'll create datasets per (product × month) so we can control stacking order per month.
  let productSalesChartInstance = null;
  let productDatasetIndexMap = {};

  function renderProductSales(stacked = true) {
    const canvas = document.getElementById("productSalesChart");
    const togglesContainer = document.getElementById("productToggles");
    if (!canvas || !togglesContainer) return;

    const salesArrays = buildSalesArrays();

    const monthData = [];
    for (let m = 0; m < months6.length; m++) {
      const arr = [];
      for (let p = 0; p < productList.length; p++) {
        arr.push({ productIndex: p, productName: productList[p], value: salesArrays[p][m] || 0 });
      }
      // sort ascending so the highest value is drawn on top of the stack
      arr.sort((a, b) => a.value - b.value);
      monthData.push(arr);
    }

    const datasets = [];
    productDatasetIndexMap = {};
    for (let p = 0; p < productList.length; p++) productDatasetIndexMap[productList[p]] = [];

    let datasetIndex = 0;
    for (let m = 0; m < months6.length; m++) {
      const stackId = 'stack_' + m;
      const sortedArr = monthData[m];
      for (let itemIdx = 0; itemIdx < sortedArr.length; itemIdx++) {
        const item = sortedArr[itemIdx];
        const dataArr = new Array(months6.length).fill(0);
        dataArr[m] = item.value;

        const color = getPaletteColor(item.productIndex, 0.9);
        const border = getPaletteColor(item.productIndex, 1);

        const ds = {
          label: item.productName,
          data: dataArr,
          backgroundColor: color,
          borderColor: border,
          borderWidth: 1,
          stack: stackId,
          _productIndex: item.productIndex,
          _productName: item.productName
        };

        datasets.push(ds);
        productDatasetIndexMap[item.productName].push(datasetIndex);
        datasetIndex++;
      }
    }

    if (productSalesChartInstance) {
      try { productSalesChartInstance.destroy(); } catch (e) {}
      productSalesChartInstance = null;
    }

    const ctx = canvas.getContext("2d");
    productSalesChartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: months6, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Removed X-axis title and oriented ticks vertically
        scales: {
          x: {
            stacked: stacked,
            title: { display: false }, // <-- removed "Month" label
            categoryPercentage: 0.6,
            barPercentage: 1.0,
            offset: true,
            ticks: {
              // rotate ticks so they read upwards and avoid horizontal compression
              maxRotation: 90,
              minRotation: 90,
              autoSkip: false
            }
          },
          y: {
            stacked: stacked,
            beginAtZero: true,
            title: { display: true, text: 'Sales (₹)' },
            ticks: {
              callback: function (value) {
                if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'K';
                return '₹' + value;
              }
            }
          }
        },
        elements: {
          bar: {
            borderRadius: 3,
            // keep bars wide, but safe enough so chart fits without horizontal scroll
            barThickness: 34,
            maxBarThickness: 64
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const ds = context.dataset;
                const value = context.raw ?? context.parsed?.y ?? 0;
                if (value === 0) return null;
                if (value >= 1000) return ds._productName + ': ₹' + (value / 1000).toLocaleString() + 'K';
                return ds._productName + ': ₹' + value;
              }
            }
          },
          legend: { display: false }
        },
        layout: {
          padding: {
            top: 6,
            bottom: 6,
            left: 6,
            right: 6
          }
        }
      }
    });

    // toggles
    togglesContainer.innerHTML = '';
    for (let p = 0; p < productList.length; p++) {
      const name = productList[p];
      const id = `prodToggle_${p}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'form-check form-check-inline';

      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.id = id;
      input.checked = true;
      input.dataset.product = name;

      const label = document.createElement('label');
      label.className = 'form-check-label small';
      label.htmlFor = id;
      label.textContent = name;

      input.addEventListener('change', (e) => {
        const prod = e.target.dataset.product;
        const visible = e.target.checked;
        const indices = productDatasetIndexMap[prod] || [];
        indices.forEach((dsIndex) => {
          if (productSalesChartInstance) {
            productSalesChartInstance.setDatasetVisibility(dsIndex, visible);
          }
        });
        if (productSalesChartInstance) productSalesChartInstance.update();
      });

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      togglesContainer.appendChild(wrapper);
    }

    // dark-mode adjustments
    if (document.body.classList.contains("dark-mode")) {
      injectDarkCardStyles();
      applyDarkToEqualHeightCards(true);
    }
  }

  // -----------------------
  // Update stats & notifications
  // -----------------------
  function updateStats() {
    const elTotalMRs = document.getElementById("totalMRs");
    const elTotalSales = document.getElementById("totalSales");
    const elTotalVisits = document.getElementById("totalVisits");
    const elPendingTasks = document.getElementById("pendingTasks");

    if (elTotalMRs) elTotalMRs.textContent = dashboardData.totalMRs;
    if (elTotalSales) elTotalSales.textContent = `₹${(dashboardData.totalSales / 100000).toFixed(1)}L`;
    if (elTotalVisits) elTotalVisits.textContent = dashboardData.totalVisits;
    if (elPendingTasks) elPendingTasks.textContent = dashboardData.pendingTasks;
  }

  function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    const allNotifications = [
      ...alertsData.map((alert) => ({ ...alert, type: "alert" })),
      ...recentActivities.map((activity) => ({ ...activity, type: "activity" })),
    ];

    container.innerHTML = allNotifications
      .slice(0, 10)
      .map(
        (notification) => `
      <div class="notification-item p-3 border-bottom">
        <div class="d-flex align-items-start">
          <div class="notification-icon ${notification.iconClass || "bg-primary"} text-white me-3 rounded-circle d-inline-flex align-items-center justify-content-center" style="width:40px;height:40px;">
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

    if (document.body.classList.contains("dark-mode")) {
      injectDarkCardStyles();
      applyDarkToNotificationsModal(true);
    }
  }

  // -----------------------
  // Map (kept)
  // -----------------------
  let dashboardMap;
  function initDashboardMap() {
    const el = document.getElementById("dashboardMap");
    if (!el) return;
    dashboardMap = L.map("dashboardMap").setView([21.1458, 79.0882], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(dashboardMap);

    const mrLocations = [
      { name: "Rajesh Kumar", lat: 21.1458, lng: 79.0882, status: "online" },
      { name: "Priya Sharma", lat: 21.125, lng: 79.05, status: "moving" },
      { name: "Amit Singh", lat: 21.165, lng: 79.12, status: "stopped" },
      { name: "Sneha Patel", lat: 21.135, lng: 79.07, status: "online" },
      { name: "Manish Patel", lat: 21.155, lng: 79.1, status: "moving" },
      { name: "Kavita Jain", lat: 21.115, lng: 79.03, status: "offline" },
    ];

    mrLocations.forEach((mr) => {
      const marker = L.marker([mr.lat, mr.lng]).addTo(dashboardMap);
      marker.bindPopup(`<b>${mr.name}</b><br>Status: ${mr.status}`);
    });
  }

  // -----------------------
  // Performance, Sales & Expense charts (unchanged)
  // -----------------------
  let performanceChart;
  function initPerformanceChart() {
    const ctx = document.getElementById("performanceChart");
    if (!ctx) {
      console.error("Performance chart canvas not found");
      return;
    }
    const context = ctx.getContext("2d");
    if (!context) {
      console.error("Could not get 2D context for performance chart");
      return;
    }

    performanceChart = new Chart(context, {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            label: "Team Sales (₹)",
            data: [280000, 320000, 290000, 350000],
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Target (₹)",
            data: [300000, 300000, 300000, 300000],
            borderColor: "#f093fb",
            backgroundColor: "rgba(240, 147, 251, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (value) { return "₹" + (value / 1000).toFixed(0) + "K"; } },
          },
        },
      },
    });
  }

  function initSalesChart() {
    const ctx = document.getElementById("salesChart");
    if (!ctx) return;
    const context = ctx.getContext("2d");
    new Chart(context, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Sales (₹)",
            data: [850000, 920000, 880000, 1050000, 980000, 1120000],
            backgroundColor: "#667eea",
          },
          {
            label: "Target (₹)",
            data: [900000, 900000, 900000, 1000000, 1000000, 1100000],
            backgroundColor: "#f093fb",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (value) { return "₹" + (value / 1000).toFixed(0) + "K"; } },
          },
        },
      },
    });
  }

  function initExpenseChart() {
    const canvas = document.getElementById("expenseChart");
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      parent.style.height = "260px";
      parent.style.maxHeight = "320px";
      parent.style.minHeight = "160px";
    }

    canvas.removeAttribute("height");

    const ctx = canvas.getContext("2d");

    if (window._expenseChartInstance) {
      try { window._expenseChartInstance.destroy(); } catch (e) {}
      window._expenseChartInstance = null;
    }

    window._expenseChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Travel", "Meals", "Samples", "Marketing", "Other"],
        datasets: [
          {
            data: [35000, 15000, 25000, 20000, 10000],
            backgroundColor: ["#667eea", "#f093fb", "#28a745", "#ffc107", "#6c757d"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // -----------------------
  // Chart controls
  // -----------------------
  window.switchChart = function (type) {
    const buttons = document.querySelectorAll(".btn-group .btn");
    buttons.forEach((btn) => btn.classList.remove("active"));

    const activeBtn = document.activeElement;
    if (activeBtn && activeBtn.classList && activeBtn.classList.contains("btn")) {
      activeBtn.classList.add("active");
    } else {
      buttons.forEach((btn) => {
        if (btn.textContent.trim().toLowerCase() === type) btn.classList.add("active");
      });
    }

    if (!performanceChart) {
      console.warn("performanceChart not initialized yet");
      return;
    }

    const currencyTick = function (value) { return "₹" + (value / 1000).toFixed(0) + "K"; };
    const plainTick = function (value) { return value; };
    const percentTick = function (value) { return value + "%"; };

    switch (type) {
      case "sales":
        performanceChart.data.datasets[0].data = [280000, 320000, 290000, 350000];
        performanceChart.data.datasets[0].label = "Team Sales (₹)";
        performanceChart.data.datasets[0].borderColor = "#667eea";
        performanceChart.data.datasets[0].backgroundColor = "rgba(102, 126, 234, 0.1)";
        if (performanceChart.data.datasets[1]) {
          performanceChart.data.datasets[1].data = [300000, 300000, 300000, 300000];
          performanceChart.data.datasets[1].label = "Target (₹)";
          performanceChart.data.datasets[1].borderColor = "#f093fb";
          performanceChart.data.datasets[1].backgroundColor = "rgba(240, 147, 251, 0.1)";
        }
        performanceChart.options.scales.y.ticks.callback = currencyTick;
        break;

      case "visits":
        performanceChart.data.datasets[0].data = [180, 220, 195, 245];
        performanceChart.data.datasets[0].label = "Doctor Visits";
        performanceChart.data.datasets[0].borderColor = "#28a745";
        performanceChart.data.datasets[0].backgroundColor = "rgba(40, 167, 69, 0.1)";
        if (performanceChart.data.datasets[1]) {
          performanceChart.data.datasets[1].data = [0, 0, 0, 0];
          performanceChart.data.datasets[1].label = "";
        }
        performanceChart.options.scales.y.ticks.callback = plainTick;
        break;

      case "targets":
        performanceChart.data.datasets[0].data = [85, 92, 88, 95];
        performanceChart.data.datasets[0].label = "Target Achievement (%)";
        performanceChart.data.datasets[0].borderColor = "#f093fb";
        performanceChart.data.datasets[0].backgroundColor = "rgba(240, 147, 251, 0.1)";
        if (performanceChart.data.datasets[1]) {
          performanceChart.data.datasets[1].data = [0, 0, 0, 0];
          performanceChart.data.datasets[1].label = "";
        }
        performanceChart.options.scales.y.ticks.callback = percentTick;
        break;

      default:
        console.warn("Unknown chart type:", type);
        break;
    }

    performanceChart.update();
  };

  window.changePeriod = function (period) {
    dashboardData.period = period;
    const button = document.getElementById("periodDropdown");
    const labels = { today: "Today", week: "This Week", month: "This Month", quarter: "This Quarter" };
    if (button) button.innerHTML = `<i class="bi bi-calendar"></i> ${labels[period]}`;

    const items = document.querySelectorAll(".dropdown-menu .dropdown-item");
    items.forEach((item) => item.classList.remove("active"));
    items.forEach((item) => {
      if (item.textContent.trim().toLowerCase() === labels[period].toLowerCase()) {
        item.classList.add("active");
      }
    });

    updateStats();
    renderProductSales(true);
  };

  // -----------------------
  // Quick actions
  // -----------------------
  window.quickAction = function (action) {
    switch (action) {
      case "assignTask": window.location.href = "tasks.html"; break;
      case "sendNotification": window.location.href = "notifications.html"; break;
      case "viewReports": window.location.href = "reports.html"; break;
      case "trackMR": window.location.href = "tracking.html"; break;
    }
  };

  // -----------------------
  // Refresh behavior
  // -----------------------
  // const refreshBtn = document.getElementById("refreshDashboardBtn");
  // if (refreshBtn) {
  //   refreshBtn.addEventListener("click", () => {
  //     const btn = document.getElementById("refreshDashboardBtn");
  //     btn.innerHTML = '<i class="bi bi-arrow-clockwise bi-spin"></i> Refreshing...';
  //     setTimeout(() => {
  //       dashboardData.totalSales += Math.floor(Math.random() * 50000);
  //       dashboardData.totalVisits += Math.floor(Math.random() * 5);
  //       dashboardData.pendingTasks = Math.max(0, dashboardData.pendingTasks - Math.floor(Math.random() * 3));
  //       updateStats();
  //       renderProductSales(true);
  //       renderNotifications();
  //       btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
  //     }, 1200);
  //   });
  // }

  // -----------------------
  // Notifications modal hooks
  // -----------------------
  const notificationsModal = document.getElementById("notificationsModal");
  if (notificationsModal) {
    notificationsModal.addEventListener("show.bs.modal", function () {
      renderNotifications();
      if (document.body.classList.contains("dark-mode")) {
        injectDarkCardStyles();
        applyDarkToNotificationsModal(true);
      }
    });
    notificationsModal.addEventListener("shown.bs.modal", function () {
      if (document.body.classList.contains("dark-mode")) {
        applyDarkToNotificationsModal(true);
      }
    });
  }

  // -----------------------
  // Init dashboard
  // -----------------------
  function initDashboard() {
    updateStats();
    renderProductSales(true);
    renderNotifications();
    initPerformanceChart();
    initSalesChart();
    initExpenseChart();
  }

  initDashboard();

  // expose for quick debugging
  window._kavyaDashboard = {
    renderProductSales,
    productSalesChartInstance: () => productSalesChartInstance,
    renderNotifications,
    updateStats,
    initDashboardMap
  };

}); // end DOMContentLoaded

// Profile modal loader
document.addEventListener("DOMContentLoaded", () => {
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const savedName = localStorage.getItem("signup_name") || "Admin User";
  const savedEmail = localStorage.getItem("signup_email") || "admin@kavyapharm.com";
  if (profileName) profileName.textContent = savedName;
  if (profileEmail) profileEmail.textContent = savedEmail;
});
