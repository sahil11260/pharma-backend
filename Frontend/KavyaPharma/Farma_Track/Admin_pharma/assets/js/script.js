document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     📌 Sidebar Toggle
  ============================ */
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
  });

  /* ============================
     🌙 Theme Toggle
  ============================ */
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  /* ============================
     📆 Dynamic Months (Auto-update till current month)
  ============================ */
  function getMonthsTillToday() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth(); // 0 - 11
    return months.slice(0, currentMonth + 1);
  }

  const dynamicMonths = getMonthsTillToday();



  /* ============================
     📈 Sales vs Target Chart
  ============================ */
  const salesCtx = document.getElementById("salesChart").getContext("2d");

  new Chart(salesCtx, {
    type: "line",
    data: {
      labels: dynamicMonths,
      datasets: [
        {
          label: "Sales",
          data: dynamicMonths.map(() => Math.floor(Math.random() * 80000) + 120000),
          borderColor: "#198754",
          backgroundColor: "rgba(25,135,84,0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Target",
          data: dynamicMonths.map(() => Math.floor(Math.random() * 80000) + 100000),
          borderColor: "#dc3545",
          backgroundColor: "rgba(220,53,69,0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });




  /* ============================
     📊 Doctor Visits Trend
  ============================ */
  const visitsCtx = document.getElementById("visitsChart").getContext("2d");

  new Chart(visitsCtx, {
    type: "bar",
    data: {
      labels: dynamicMonths,
      datasets: [
        {
          label: "Doctor Visits",
          data: dynamicMonths.map(() => Math.floor(Math.random() * 500) + 200),
          backgroundColor: "#0d6efd",
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });



  /* ============================
     🥧 Expense Breakdown Chart
  ============================ */
  const expenseCtx = document.getElementById("expenseChart").getContext("2d");

  new Chart(expenseCtx, {
    type: "pie",
    data: {
      labels: ["Travel", "Meals", "Samples", "Accommodation"],
      datasets: [
        {
          data: [50000, 12000, 20000, 15000],
          backgroundColor: ["#0d6efd", "#ffc107", "#28a745", "#dc3545"],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });



  /* ============================
     👤 Profile Modal Auto Data Load
  ============================ */
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");

  const savedName = localStorage.getItem("signup_name") || "Admin User";
  const savedEmail = localStorage.getItem("signup_email") || "admin@kavyapharm.com";

  profileName.textContent = savedName;
  profileEmail.textContent = savedEmail;

});
