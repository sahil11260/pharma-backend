document.addEventListener("DOMContentLoaded", () => {
  // ===== Sidebar Toggle =====
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  const sidebarToggle = document.getElementById("sidebarToggle");

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
  });

  // ===== Theme Toggle (Dark / Light Mode) =====
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;
  const lightLogo = document.querySelector(".light-logo");
  const darkLogo = document.querySelector(".dark-logo");

  // Load theme from local storage
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    if (darkLogo) darkLogo.style.display = "block";
    if (lightLogo) lightLogo.style.display = "none";
  } else {
    if (darkLogo) darkLogo.style.display = "none";
    if (lightLogo) lightLogo.style.display = "block";
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    if (body.classList.contains("dark-mode")) {
      themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
      localStorage.setItem("theme", "dark");
      if (darkLogo) darkLogo.style.display = "block";
      if (lightLogo) lightLogo.style.display = "none";
    } else {
      themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
      localStorage.setItem("theme", "light");
      if (darkLogo) darkLogo.style.display = "none";
      if (lightLogo) lightLogo.style.display = "block";
    }
  });

  // ===== Dummy Report Data =====
  const reportTableBody = document.getElementById("reportTableBody");
  const tableSearch = document.getElementById("tableSearch");

  const reports = [
    { date: "2025-01-10", mr: "Rohan Sharma", doctor: "Dr. Mehta", region: "Mumbai", feedback: "Positive", status: "Completed" },
    { date: "2025-01-12", mr: "Priya Desai", doctor: "Dr. Patil", region: "Pune", feedback: "Follow-up needed", status: "Pending" },
    { date: "2025-01-14", mr: "Amit Verma", doctor: "Dr. Joshi", region: "Nagpur", feedback: "Successful", status: "Completed" },
    { date: "2025-01-16", mr: "Ritika Singh", doctor: "Dr. Shah", region: "Surat", feedback: "Good", status: "Completed" },
  ];

  function renderTable(data) {
    reportTableBody.innerHTML = data
      .map(
        (r) => `
      <tr>
        <td>${r.date}</td>
        <td>${r.mr}</td>
        <td>${r.doctor}</td>
        <td>${r.region}</td>
        <td>${r.feedback}</td>
        <td><span class="badge ${r.status === "Completed" ? "bg-success" : "bg-warning text-dark"}">${r.status}</span></td>
      </tr>`
      )
      .join("");
  }

  renderTable(reports);

  tableSearch.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = reports.filter(
      (r) =>
        r.mr.toLowerCase().includes(term) ||
        r.doctor.toLowerCase().includes(term) ||
        r.region.toLowerCase().includes(term)
    );
    renderTable(filtered);
  });

  // ===== Charts =====
  const regionSalesCtx = document.getElementById("regionSalesChart").getContext("2d");
  const expenseCtx = document.getElementById("expenseChart").getContext("2d");

  // 🌍 Regional Sales Overview (Bar)
  new Chart(regionSalesCtx, {
    type: "bar",
    data: {
      labels: ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad"],
      datasets: [{
        label: "Sales (₹ in Lakhs)",
        data: [220, 180, 150, 170, 130],
        backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1"]
      }]
    },
 options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } }
}

  });

  // 💰 Expense Breakdown (Pie)
  new Chart(expenseCtx, {
    type: "pie",
    data: {
      labels: ["Travel", "Samples", "Meetings", "Miscellaneous"],
      datasets: [{
        data: [40, 25, 20, 15],
        backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545"]
      }]
    },
options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } }
}

  });
});
