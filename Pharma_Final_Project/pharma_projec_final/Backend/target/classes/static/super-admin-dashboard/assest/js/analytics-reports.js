// Global variable to hold the intended report type (set by quick buttons)
let currentReportType = "sales"; // Default to sales
const RECENT_REPORTS_KEY = "kavyaPharmRecentReports";
const TARGETS_STORAGE_KEY = "kavyaPharmTargets"; // Key for Target data

// --- Persistence Functions ---

function loadRecentReports() {
  const storedReports = localStorage.getItem(RECENT_REPORTS_KEY);
  const initialReports = [
    {
      name: "October Sales Report",
      type: "Sales",
      generatedBy: "Admin",
      date: "2025-10-30",
      format: "PDF",
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      region: "All Regions",
    },
    {
      name: "Q4 Performance Summary",
      type: "Performance",
      generatedBy: "Manager",
      date: "2025-10-28",
      format: "Excel",
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      region: "All Regions",
    },
    {
      name: "Doctor Visit Analytics",
      type: "Visits",
      generatedBy: "Analytics",
      date: "2025-10-25",
      format: "PDF",
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      region: "All Regions",
    },
  ];

  // If no reports are stored in local storage, use the hardcoded initial list.
  return storedReports ? JSON.parse(storedReports) : initialReports;
}

function saveRecentReports(reports) {
  localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(reports));
}

function renderRecentReportsTable(reports) {
  const tableBody = document.getElementById("recentReportsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  // Limit to the top 5 reports
  reports.slice(0, 5).forEach((report) => {
    const newReportRow = `
            <tr>
              <td>${report.name}</td>
              <td>${report.type}</td>
              <td>${report.generatedBy}</td>
              <td>${report.date}</td>
              <td>${report.format}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary download-report-btn" data-report-name="${report.name}" data-report-format="${report.format}">
                  <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-sm btn-outline-info view-report-btn" data-report-name="${report.name}" data-start-date="${report.startDate}" data-end-date="${report.endDate}" data-region="${report.region}" data-type="${report.type}" data-format="${report.format}">
                  <i class="bi bi-eye"></i>
                </button>
              </td>
            </tr>
        `;
    tableBody.insertAdjacentHTML("beforeend", newReportRow);
  });

  attachRecentReportListeners();
}

// --- NEW HELPER FUNCTION: Load Target Data from Target Management logic ---
function loadTargets() {
  const storedTargets = localStorage.getItem(TARGETS_STORAGE_KEY);
  if (storedTargets) {
    return JSON.parse(storedTargets);
  }

  // Fallback initial data (matching the target-management.html initial table for consistency)
  return [
    {
      id: "T001",
      name: "Q4 Sales Target",
      assignedTo: "Rajesh Kumar",
      type: "Sales",
      targetValue: "₹500,000",
      currentProgressValue: "₹385,000",
      currentProgressPercent: 77,
      deadline: "2025-12-31",
      status: "On Track",
    },
    {
      id: "T002",
      name: "Doctor Visits Target",
      assignedTo: "Priya Sharma",
      type: "Visits",
      targetValue: "250 visits",
      currentProgressValue: "198 visits",
      currentProgressPercent: 79,
      deadline: "2025-12-31",
      status: "On Track",
    },
    {
      id: "T003",
      name: "Product Launch Goal",
      assignedTo: "Amit Singh",
      type: "Product",
      targetValue: "100 units",
      currentProgressValue: "45 units",
      currentProgressPercent: 45,
      deadline: "2025-11-30",
      status: "Behind",
    },
    {
      id: "T004",
      name: "Training Completion",
      assignedTo: "Suresh Reddy",
      type: "Training",
      targetValue: "15 sessions",
      currentProgressValue: "12 sessions",
      currentProgressPercent: 80,
      deadline: "2025-10-31",
      status: "On Track",
    },
    {
      id: "T005",
      name: "Market Expansion",
      assignedTo: "Vikram Patel",
      type: "Market",
      targetValue: "5 new areas",
      currentProgressValue: "2 areas",
      currentProgressPercent: 40,
      deadline: "2025-12-31",
      status: "Behind",
    },
  ];
}

// Helper function to load expense data (for Expense Report) - Unchanged
function loadExpenses() {
  const storedExpenses = localStorage.getItem("kavyaPharmExpenses");
  let expenses = JSON.parse(storedExpenses) || [];

  if (expenses.length === 0) {
    // Manually defined initial data to simulate expense list
    expenses = [
      {
        id: "EXP001",
        employee: "Rajesh Kumar",
        category: "Travel",
        description: "Client meeting travel to Delhi",
        amount: "₹15,000",
        date: "2025-10-25",
        status: "Approved",
        rawAmount: 15000,
      },
      {
        id: "EXP002",
        employee: "Priya Sharma",
        category: "Meals",
        description: "Doctor lunch meeting",
        amount: "₹2,500",
        date: "2025-10-24",
        status: "Pending",
        rawAmount: 2500,
      },
      {
        id: "EXP003",
        employee: "Amit Singh",
        category: "Medical Samples",
        description: "Product samples for doctors in Mumbai region",
        amount: "₹8,000",
        date: "2025-10-23",
        status: "Approved",
        rawAmount: 8000,
      },
      {
        id: "EXP004",
        employee: "Suresh Reddy",
        category: "Accommodation",
        description: "Hotel stay during national sales conference in Bangalore",
        amount: "₹12,000",
        date: "2025-10-22",
        status: "Rejected",
        rawAmount: 12000,
      },
      {
        id: "EXP005",
        employee: "Vikram Patel",
        category: "Transportation",
        description: "Cab charges for field visits to multiple clinics in Pune",
        amount: "₹3,500",
        date: "2025-10-21",
        status: "Approved",
        rawAmount: 3500,
      },
      {
        id: "EXP006",
        employee: "Anjali Rao",
        category: "Marketing",
        description: "Printed promotional materials for product launch event",
        amount: "₹22,000",
        date: "2025-10-20",
        status: "Pending",
        rawAmount: 22000,
      },
      {
        id: "EXP007",
        employee: "Gaurav Joshi",
        category: "Travel",
        description: "Train ticket to regional office for training",
        amount: "₹4,200",
        date: "2025-10-19",
        status: "Approved",
        rawAmount: 4200,
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
        rawAmount: 1800,
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
        rawAmount: 7500,
      },
      {
        id: "EXP010",
        employee: "Deepak Yadav",
        category: "Transportation",
        description: "Fuel refill for company vehicle for month of October",
        amount: "₹5,500",
        date: "2025-10-16",
        status: "Rejected",
        rawAmount: 5500,
      },
    ];
  }

  // Ensure rawAmount and statusBadge are correctly formatted
  return expenses.map((exp) => ({
    ...exp,
    rawAmount: exp.rawAmount || parseFloat(exp.amount.replace(/[^0-9.]/g, "")),
    statusBadge: `<span class="badge ${
      exp.status === "Approved"
        ? "bg-success"
        : exp.status === "Rejected"
        ? "bg-danger"
        : "bg-warning"
    }">${exp.status}</span>`,
  }));
}

/**
 * Hides the displayed custom report section.
 */
function clearCustomReportDisplay() {
  const reportDisplay = document.getElementById("customReportDisplay");
  reportDisplay.style.display = "none";
}

/**
 * Resets the Overview Cards to their default titles and standard data values.
 */
function resetOverviewCards() {
  // Reset Card Titles to original (Dashboard defaults)
  document.querySelectorAll(".overview-card .card-title")[0].textContent =
    "Total Revenue";
  document.querySelectorAll(".overview-card .card-title")[1].textContent =
    "Total Sales";
  document.querySelectorAll(".overview-card .card-title")[2].textContent =
    "Doctor Visits";
  document.querySelectorAll(".overview-card .card-title")[3].textContent =
    "Reports Generated";

  // Reset Data (using initial hardcoded values from the HTML)
  document.getElementById("totalRevenue").textContent = "₹12,45,000";
  document.getElementById("totalSales").textContent = "₹8,90,000";
  document.getElementById("doctorVisits").textContent = "1,247";
  document.getElementById("reportsGenerated").textContent = "89";
}

/**
 * Handles the click event for the quick report buttons and manages the active state.
 * @param {string} type - The type of report ('sales', 'visits', 'expense').
 */
function generateReport(type) {
  currentReportType = type;
  const typeName = type.charAt(0).toUpperCase() + type.slice(1);

  // --- Reset visibility and cards when a new report type button is clicked ---
  clearCustomReportDisplay();
  resetOverviewCards();

  // --- Manage Active Button State ---
  document.querySelectorAll(".report-type-btn").forEach((btn) => {
    const btnType = btn.id.replace("ReportBtn", "");
    const defaultOutlineClass =
      "btn-outline-" +
      (btnType === "sales"
        ? "primary"
        : btnType === "visits"
        ? "success"
        : btnType === "expense"
        ? "info"
        : "warning");
    const fullColorClass =
      "btn-" +
      (btnType === "sales"
        ? "primary"
        : btnType === "visits"
        ? "success"
        : btnType === "expense"
        ? "info"
        : "warning");

    // Reset all buttons to outline
    btn.classList.remove(fullColorClass);
    btn.classList.add(defaultOutlineClass);

    // Set the clicked button to full color (active appearance)
    if (btn.id === type + "ReportBtn") {
      btn.classList.remove(defaultOutlineClass);
      btn.classList.add(fullColorClass);
    }
  });

  // --- Display Alert Message ---
  if (type === "sales" || type === "expense") {
    alert(
      `Selected **${typeName} Report**. Please select a Start Date and End Date below, and then click 'Generate Custom Report' to see the detailed analysis on this page.`
    );
  } else {
    alert(
      `Generating ${typeName} report... This would typically create and download a ${typeName} report file.`
    );
  }
}

/**
 * Function to generate and display the custom report (Sales or Expense) on the page
 * This function is called by the "Generate Custom Report" button.
 */
function generateCustomReport() {
  const startDateStr = document.getElementById("reportStartDate").value;
  const endDateStr = document.getElementById("reportEndDate").value;
  const format = document.getElementById("reportFormat").value;
  const region = document.getElementById("reportRegion").value;

  if (!startDateStr || !endDateStr) {
    alert("Please select both start and end dates.");
    return;
  }

  // Set Date objects to midnight for accurate day-based filtering
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Ensure endDate includes the entire day by moving the comparison point to the start of the next day
  endDate.setDate(endDate.getDate() + 1);

  const reportDisplay = document.getElementById("customReportDisplay");
  const reportTitle = document.getElementById("customReportTitle");
  const reportCriteria = document.getElementById("reportCriteria");
  const reportTableBody = document.getElementById("customReportTableBody");
  const tableEl = reportTableBody.closest("table");

  // --- Reset cards and display area before rendering new data (Safety reset) ---
  resetOverviewCards();
  clearCustomReportDisplay();

  // --- 1. Expense Report Generation Logic (Unchanged) ---
  if (currentReportType === "expense") {
    const allExpenses = loadExpenses();
    let totalExpense = 0;
    let expenseReportRowsHTML = "";
    let totalApproved = 0;
    let totalPending = 0;
    let totalRejected = 0;

    // Filter expenses by date range using date objects
    const filteredExpenses = allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      // Compare expenseDate (set to midnight) >= startDate AND expenseDate < endDate (start of next day)
      return expenseDate >= startDate && expenseDate < endDate;
    });

    // Populate table rows and calculate totals
    filteredExpenses.forEach((expense) => {
      totalExpense += expense.rawAmount;

      if (expense.status === "Approved") totalApproved += expense.rawAmount;
      else if (expense.status === "Pending") totalPending += expense.rawAmount;
      else if (expense.status === "Rejected")
        totalRejected += expense.rawAmount;

      expenseReportRowsHTML += `
          <tr>
            <td>${expense.id}</td>
            <td>${expense.employee}</td>
            <td>${expense.category}</td>
            <td>${expense.amount}</td>
            <td>${expense.date}</td>
            <td>${expense.statusBadge}</td>
          </tr>
        `;
    });

    // Update the custom report section for Expense data
    reportTitle.innerHTML = `<i class="bi bi-bar-chart-line me-2"></i>Custom Expense Report (${region})`;

    // Define new table headers for Expense report
    const expenseTableHeaders = `
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
    `;

    reportCriteria.innerHTML = `**Criteria:** **Dates:** ${startDateStr} to ${endDateStr} | **Region:** ${region} | **Format:** ${format.toUpperCase()}. **Total Expenses in Range:** ₹${totalExpense.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}`;

    // Insert headers and rows
    tableEl.innerHTML =
      expenseTableHeaders + `<tbody>${expenseReportRowsHTML}</tbody>`;

    // Update Overview Cards to reflect Expense Data
    document.getElementById(
      "totalRevenue"
    ).textContent = `₹${totalExpense.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
    document.getElementById(
      "totalSales"
    ).textContent = `₹${totalApproved.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
    document.getElementById(
      "doctorVisits"
    ).textContent = `₹${totalPending.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
    document.getElementById(
      "reportsGenerated"
    ).textContent = `₹${totalRejected.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;

    // Change card titles for context
    document.querySelectorAll(".overview-card .card-title")[0].textContent =
      "Total Expense (in Range)";
    document.querySelectorAll(".overview-card .card-title")[1].textContent =
      "Approved Expense";
    document.querySelectorAll(".overview-card .card-title")[2].textContent =
      "Pending Expense";
    document.querySelectorAll(".overview-card .card-title")[3].textContent =
      "Rejected Expense";

    reportDisplay.style.display = "block"; // MAKE IT VISIBLE NOW

    // Update Recent Reports Section and Save to Local Storage
    updateRecentReportsList(
      currentReportType,
      region,
      format,
      startDateStr,
      endDateStr
    );

    return;
  }

  // --- MODIFIED SALES REPORT LOGIC: Display Target Management Data ---

  if (currentReportType === "sales") {
    const targets = loadTargets(); // Load Target data instead of Product data
    let totalTargetValue = 0;
    let totalCurrentProgress = 0;
    let targetReportRowsHTML = "";
    let achievedTargetsCount = 0;
    let inProgressTargetsCount = 0;

    // Filter/Iterate through Targets
    targets.forEach((target) => {
      // For simplicity, converting currency strings to numbers by removing non-numeric chars
      const targetNumber = parseFloat(
        target.targetValue.replace(/[^0-9.]/g, "")
      );
      const progressNumber = parseFloat(
        target.currentProgressValue.replace(/[^0-9.]/g, "")
      );

      if (!isNaN(targetNumber)) {
        totalTargetValue += targetNumber;
      }
      if (!isNaN(progressNumber)) {
        totalCurrentProgress += progressNumber;
      }

      if (target.currentProgressPercent >= 95 || target.status === "Complete") {
        achievedTargetsCount++;
      } else if (
        target.currentProgressPercent > 50 &&
        target.status !== "Complete"
      ) {
        inProgressTargetsCount++;
      }

      targetReportRowsHTML += `
          <tr>
            <td>${target.id} - ${target.name}</td>
            <td>${target.assignedTo}</td>
            <td>${target.type}</td>
            <td>${target.targetValue}</td>
            <td>${target.currentProgressValue} (${target.currentProgressPercent}%)</td>
            <td>${target.deadline}</td>
          </tr>
        `;
    });

    // --- 3. Update Overview Cards to reflect Target Data Totals ---
    document.getElementById(
      "totalRevenue"
    ).textContent = `₹${totalTargetValue.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
    document.getElementById(
      "totalSales"
    ).textContent = `₹${totalCurrentProgress.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
    document.getElementById(
      "doctorVisits"
    ).textContent = `${achievedTargetsCount}`;
    document.getElementById(
      "reportsGenerated"
    ).textContent = `${inProgressTargetsCount}`;

    // Change card titles for context
    document.querySelectorAll(".overview-card .card-title")[0].textContent =
      "Total Target Value";
    document.querySelectorAll(".overview-card .card-title")[1].textContent =
      "Total Progress Value";
    document.querySelectorAll(".overview-card .card-title")[2].textContent =
      "Targets Achieved (>=95%)";
    document.querySelectorAll(".overview-card .card-title")[3].textContent =
      "Targets In Progress (50-95%)";

    // --- 4. Render Report Data on the same page for Sales (using Target data) ---
    reportTitle.innerHTML = `<i class="bi bi-bar-chart-line me-2"></i>Custom Sales Report (Target Analysis - ${region})`;

    const salesTargetHeaders = `
        <thead>
          <tr>
            <th>Target Name / ID</th>
            <th>Assigned To</th>
            <th>Type</th>
            <th>Target Value</th>
            <th>Current Progress</th>
            <th>Deadline</th>
          </tr>
        </thead>
    `;

    reportCriteria.innerHTML = `**Criteria:** **Dates:** ${startDateStr} to ${endDateStr} (Target Data Shown) | **Region:** ${region} | **Format:** ${format.toUpperCase()}. **Total Target Value:** ₹${totalTargetValue.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}`;

    // Insert new headers and target rows
    tableEl.innerHTML =
      salesTargetHeaders + `<tbody>${targetReportRowsHTML}</tbody>`;

    reportDisplay.style.display = "block"; // MAKE IT VISIBLE NOW

    // --- 5. Update Recent Reports Section and Save to Local Storage ---
    updateRecentReportsList(
      currentReportType,
      region,
      format,
      startDateStr,
      endDateStr
    );
  } else {
    // This handles the 'Visits' report, which currently only shows an alert.
    alert(
      `Generating ${currentReportType} report... This would typically create and download a ${currentReportType} report file.`
    );
  }
}

// --- NEW FUNCTION: Manages saving new reports and rendering the table (Unchanged) ---
function updateRecentReportsList(
  reportType,
  region,
  format,
  startDate,
  endDate
) {
  const today = new Date().toISOString().split("T")[0];
  const reportName = reportType.charAt(0).toUpperCase() + reportType.slice(1);

  const newReport = {
    name: `Custom ${reportName} Report (${region})`,
    type: reportName,
    generatedBy: "User/Manager", // Static for this simulation
    date: today,
    format: format.toUpperCase(),
    startDate: startDate,
    endDate: endDate,
    region: region,
  };

  // Load existing reports, add the new one, and save (keeping only the top 5)
  let reports = loadRecentReports();
  // Check if the current report already exists (prevents duplicate initial reports if local storage wasn't cleared)
  // This check is very basic and just prevents duplicates of the last generated report
  const isDuplicate = reports.some(
    (r) => r.name === newReport.name && r.date === newReport.date
  );

  if (!isDuplicate) {
    // Check if the top item is one of the initial seeded reports and remove it if adding a custom one
    if (reports.length > 0 && reports[0].generatedBy !== "User/Manager") {
      reports = reports.slice(1);
    }
    reports.unshift(newReport); // Add to the beginning
  }

  reports = reports.slice(0, 5); // Keep only the top 5
  saveRecentReports(reports);

  // Re-render the table from the saved data
  renderRecentReportsTable(reports);
}

/**
 * NEW FUNCTION: Re-runs the custom report generation logic based on data stored in the recent report button.
 */
function reRunReportFromRecent(type, startDate, endDate, region, format) {
  // 1. Set the global state to match the saved report
  currentReportType = type.toLowerCase();

  // 2. Set the form inputs to match the saved report (to reflect criteria)
  document.getElementById("reportStartDate").value = startDate;
  document.getElementById("reportEndDate").value = endDate;
  // Handle case sensitivity for select dropdowns
  document.getElementById("reportFormat").value = format.toLowerCase();
  document.getElementById("reportRegion").value = region.toLowerCase();

  // 3. Update the active button visually
  generateReport(currentReportType); // This also clears old reports/cards

  // 4. Force run the custom report display logic
  generateCustomReport();
}

/**
 * Attaches click handlers to View and Download buttons in the Recent Reports table.
 */
function attachRecentReportListeners() {
  document.querySelectorAll(".view-report-btn").forEach((button) => {
    button.onclick = function () {
      // Fetch data attributes
      const type = this.getAttribute("data-type");
      const start = this.getAttribute("data-start-date");
      const end = this.getAttribute("data-end-date");
      const region = this.getAttribute("data-region");
      const format = this.getAttribute("data-format");

      // Re-run the report generation process using the saved criteria
      reRunReportFromRecent(type, start, end, region, format);
    };
  });

  document.querySelectorAll(".download-report-btn").forEach((button) => {
    button.onclick = function () {
      const name = this.getAttribute("data-report-name");
      const format = this.getAttribute("data-report-format");

      // The download button should confirm the format is PDF, as requested.
      alert(
        `DOWNLOADING Report: ${name} in ${format} format.\n\n(File download simulated for a ${format} file.)`
      );
    };
  });
}

// Initialize Charts on page load (Unchanged)
document.addEventListener("DOMContentLoaded", function () {
  // --- Load and Render Persistent Reports on page load ---
  const reports = loadRecentReports();
  renderRecentReportsTable(reports);
  // --------------------------------------------------------

  // Sales Chart (Simulated for dashboard visualization)
  const salesCtx = document.getElementById("salesChart")?.getContext("2d");
  if (salesCtx) {
    new Chart(salesCtx, {
      type: "line",
      data: {
        labels: [
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
        ],
        datasets: [
          {
            label: "Sales (₹)",
            data: [
              65000, 72000, 68000, 85000, 92000, 88000, 95000, 102000, 98000,
              124500,
            ],
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "₹" + value / 1000 + "K";
              },
            },
          },
        },
      },
    });
  }

  // Visits Chart (Simulated for dashboard visualization)
  const visitsCtx = document.getElementById("visitsChart")?.getContext("2d");
  if (visitsCtx) {
    new Chart(visitsCtx, {
      type: "bar",
      data: {
        labels: [
          "Mumbai",
          "Delhi",
          "Bangalore",
          "Chennai",
          "Pune",
          "Hyderabad",
        ],
        datasets: [
          {
            label: "Doctor Visits",
            data: [245, 198, 167, 145, 123, 98],
            backgroundColor: [
              "#667eea",
              "#764ba2",
              "#f093fb",
              "#f5576c",
              "#4facfe",
              "#00f2fe",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  // Product Chart (Simulated for dashboard visualization)
  const productCtx = document.getElementById("productChart")?.getContext("2d");
  if (productCtx) {
    new Chart(productCtx, {
      type: "doughnut",
      data: {
        labels: [
          "Paracetamol",
          "Amoxicillin",
          "Vitamin C",
          "Ibuprofen",
          "Aspirin",
          "Others",
        ],
        datasets: [
          {
            data: [35, 25, 20, 10, 5, 5],
            backgroundColor: [
              "#667eea",
              "#764ba2",
              "#f093fb",
              "#f5576c",
              "#4facfe",
              "#00f2fe",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // Expense Chart (Simulated for dashboard visualization)
  const expenseCtx = document.getElementById("expenseChart")?.getContext("2d");
  if (expenseCtx) {
    new Chart(expenseCtx, {
      type: "pie",
      data: {
        labels: [
          "Travel",
          "Meals",
          "Medical Samples",
          "Accommodation",
          "Transportation",
        ],
        datasets: [
          {
            data: [40, 25, 15, 12, 8],
            backgroundColor: [
              "#667eea",
              "#764ba2",
              "#f093fb",
              "#f5576c",
              "#4facfe",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }
});

function enableEndDate() {
  const startDate = document.getElementById("reportStartDate").value;
  const endDate = document.getElementById("reportEndDate");
  if (startDate) {
    endDate.disabled = false;
    endDate.min = startDate; // optional: prevent selecting before start date
  } else {
    endDate.disabled = true;
  }
}
