// Samples Page JavaScript
let samplesData; // Declare as global to be accessible by global functions
let distributionHistory;
let mrData;
let productsData;
let recentActivities;
let alertsData;

// --- Persistence Functions ---

// Function to load data from localStorage or use mock data
function loadInitialData(key, mockData) {
  const storedData = localStorage.getItem(key);
  if (storedData) {
    return JSON.parse(storedData);
  }
  return mockData;
}

// Function to save data to localStorage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const API_BASE = "";
const MR_STOCK_API_BASE = `${API_BASE}/api/mr-stock`;
const STOCK_RECEIVED_API_BASE = `${API_BASE}/api/stock-received`;
let samplesApiMode = true;

function getAuthHeader() {
  const token = localStorage.getItem("kavya_auth_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiJson(url, options) {
  const res = await fetch(url, Object.assign({
    headers: Object.assign({ "Content-Type": "application/json" }, getAuthHeader()),
  }, options || {}));

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}

async function refreshSamplesFromApiOrFallback() {
  try {
    const stockItems = await apiJson(MR_STOCK_API_BASE);
    if (!Array.isArray(stockItems)) {
      samplesApiMode = false;
      return;
    }

    const existingLocal = Array.isArray(samplesData) ? samplesData : [];
    const localByProductId = new Map(existingLocal.map((s) => [String(s.productId || s.id), s]));

    samplesData = stockItems.map((it, idx) => {
      const productId = String(it.id);
      const prev = localByProductId.get(productId);
      const prevDistributed = prev ? Number(prev.distributed) || 0 : 0;
      const remaining = Number(it.stock) || 0;

      return {
        id: productId,
        productId: productId,
        productName: it.name,
        batchNumber: prev ? prev.batchNumber : productId,
        totalStock: remaining + prevDistributed,
        distributed: prevDistributed,
        remaining: remaining,
        unitPrice: prev ? prev.unitPrice : 0,
        expiryDate: prev ? prev.expiryDate : "",
        mrStocks: prev ? (prev.mrStocks || {}) : {},
        description: prev ? (prev.description || "") : "",
      };
    });

    productsData = stockItems.map((it, idx) => ({
      id: String(it.id),
      name: it.name,
      category: "Sample",
    }));

    saveData("samplesData", samplesData);
    saveData("productsData", productsData);
    samplesApiMode = true;
  } catch (e) {
    console.warn("Samples API unavailable, using localStorage.", e);
    samplesApiMode = false;
  }
}

// --- Mock Data Definitions (Used only if no data in localStorage) ---
const mockMrData = [
  { id: 1, name: "Rajesh Kumar" },
  { id: 2, name: "Priya Sharma" },
  { id: 3, name: "Amit Singh" },
  { id: 4, name: "Sneha Patel" },
  { id: 5, name: "Manish Patel" },
  { id: 6, name: "Kavita Jain" },
];

const mockProductsData = [
  { id: 1, name: "Diabetex 500mg", category: "Diabetes" },
  { id: 2, name: "CardioCare 10mg", category: "Cardiology" },
  { id: 3, name: "PainRelief 200mg", category: "Pain Management" },
  { id: 4, name: "NeuroMax 50mg", category: "Neurology" },
  { id: 5, name: "ImmunoBoost 100mg", category: "Immunology" },
];

const mockSamplesData = [
  {
    id: 1,
    productName: "Diabetex 500mg",
    batchNumber: "DBT20251101",
    totalStock: 500,
    distributed: 320,
    remaining: 180,
    unitPrice: 25.5,
    expiryDate: "2026-11-01",
    mrStocks: {
      "Rajesh Kumar": 45,
      "Priya Sharma": 38,
      "Amit Singh": 42,
      "Sneha Patel": 35,
      "Manish Patel": 20,
    },
    description: "Advanced diabetes medication with improved efficacy",
  },
  {
    id: 2,
    productName: "CardioCare 10mg",
    batchNumber: "CRC20251102",
    totalStock: 300,
    distributed: 280,
    remaining: 20,
    unitPrice: 45.0,
    expiryDate: "2026-08-15",
    mrStocks: {
      "Rajesh Kumar": 25,
      "Priya Sharma": 30,
      "Amit Singh": 28,
      "Sneha Patel": 22,
      "Kavita Jain": 15,
    },
    description: "Cardiovascular health supplement",
  },
  {
    id: 3,
    productName: "PainRelief 200mg",
    batchNumber: "PNR20251103",
    totalStock: 800,
    distributed: 650,
    remaining: 150,
    unitPrice: 15.75,
    expiryDate: "2027-01-20",
    mrStocks: {
      "Rajesh Kumar": 60,
      "Priya Sharma": 55,
      "Amit Singh": 58,
      "Sneha Patel": 52,
      "Manish Patel": 45,
      "Kavita Jain": 40,
    },
    description: "Fast-acting pain relief medication",
  },
  {
    id: 4,
    productName: "NeuroMax 50mg",
    batchNumber: "NRM20251104",
    totalStock: 200,
    distributed: 180,
    remaining: 20,
    unitPrice: 85.0,
    expiryDate: "2026-05-10",
    mrStocks: {
      "Rajesh Kumar": 15,
      "Priya Sharma": 18,
      "Amit Singh": 12,
      "Sneha Patel": 20,
    },
    description: "Neurological disorder treatment",
  },
  {
    id: 5,
    productName: "ImmunoBoost 100mg",
    batchNumber: "IMB20251105",
    totalStock: 400,
    distributed: 350,
    remaining: 50,
    unitPrice: 35.25,
    expiryDate: "2026-12-30",
    mrStocks: {
      "Rajesh Kumar": 30,
      "Priya Sharma": 28,
      "Amit Singh": 32,
      "Sneha Patel": 25,
      "Manish Patel": 22,
      "Kavita Jain": 18,
    },
    description: "Immune system booster supplement",
  },
];

const mockDistributionHistory = [
  {
    id: 1,
    date: "2025-11-08",
    product: "Diabetex 500mg",
    mr: "Rajesh Kumar",
    quantity: 10,
    recipient: "Dr. Ramesh Gupta",
    status: "completed",
  },
  {
    id: 2,
    date: "2025-11-07",
    product: "CardioCare 10mg",
    mr: "Priya Sharma",
    quantity: 15,
    recipient: "MedPlus Pharmacy",
    status: "completed",
  },
  {
    id: 3,
    date: "2025-11-06",
    product: "PainRelief 200mg",
    mr: "Amit Singh",
    quantity: 20,
    recipient: "Dr. Vikram Singh",
    status: "completed",
  },
  {
    id: 4,
    date: "2025-11-05",
    product: "NeuroMax 50mg",
    mr: "Sneha Patel",
    quantity: 5,
    recipient: "Wellness Chemist",
    status: "completed",
  },
  {
    id: 5,
    date: "2025-11-04",
    product: "ImmunoBoost 100mg",
    mr: "Kavita Jain",
    quantity: 12,
    recipient: "City Pharmacy",
    status: "completed",
  },
];

// Mock Recent Activities
recentActivities = [
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

// Mock Alerts & Notifications
alertsData = [
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

// --- Document Ready ---
document.addEventListener("DOMContentLoaded", () => {
  // --- Data Initialization (Updated to use Persistence) ---
  samplesData = loadInitialData("samplesData", mockSamplesData);
  distributionHistory = loadInitialData(
    "distributionHistory",
    mockDistributionHistory
  );
  mrData = loadInitialData("mrData", mockMrData); // Assuming MR data is static or updated elsewhere
  productsData = loadInitialData("productsData", mockProductsData); // Assuming Products data is static or updated elsewhere

  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
  });

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  // Load theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // Populate dropdowns
  function populateDropdowns() {
    // Product filter dropdown
    const filterProduct = document.getElementById("filterProduct");
    filterProduct.innerHTML = '<option value="">All Products</option>'; // Reset and add 'All' option
    productsData.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.name;
      option.textContent = product.name;
      filterProduct.appendChild(option);
    });

    // MR filter dropdown
    const filterMR = document.getElementById("filterMR");
    filterMR.innerHTML = '<option value="">All MRs</option>'; // Reset and add 'All' option
    mrData.forEach((mr) => {
      const option = document.createElement("option");
      option.value = mr.name;
      option.textContent = mr.name;
      filterMR.appendChild(option);
    });

    // Distribute product dropdown
    const distributeProduct = document.getElementById("distributeProduct");
    distributeProduct.innerHTML = '<option value="">Select Product</option>'; // Reset and add default option
    productsData.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.name;
      option.textContent = product.name;
      distributeProduct.appendChild(option);
    });

    // Distribute MR dropdown
    const distributeMR = document.getElementById("distributeMR");
    distributeMR.innerHTML = '<option value="">Select MR</option>'; // Reset and add default option
    mrData.forEach((mr) => {
      const option = document.createElement("option");
      option.value = mr.name;
      option.textContent = mr.name;
      distributeMR.appendChild(option);
    });
  }

  // Function to render sample table
  function renderSampleTable(data) {
    const samplesList = document.getElementById("samplesList");
    samplesList.innerHTML = "";

    data.forEach((sample) => {
      let stockBadge = "";

      if (sample.remaining === 0) {
        stockBadge = '<span class="badge bg-danger">Out of Stock</span>';
      } else if (sample.remaining < 50) {
        stockBadge = '<span class="badge bg-warning">Low Stock</span>';
      } else {
        stockBadge = '<span class="badge bg-success">In Stock</span>';
      }

      const row = document.createElement("tr");
      row.innerHTML = `
                <td><i class="bi bi-box-seam me-2"></i>${sample.productName
        }</td>
                <td>${sample.batchNumber}</td>
                <td>${sample.totalStock}</td>
                <td>${sample.distributed}</td>
                <td>${sample.remaining}</td>
                <td>₹${sample.unitPrice}</td>
                <td>${formatDate(sample.expiryDate)}</td>
                <td>
                  <button class="btn btn-outline-info btn-sm me-1" onclick="viewMRStocks()">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary btn-sm" onclick="distributeSample(${JSON.stringify(
          sample.id
        )})">
                    <i class="bi bi-truck"></i>
                  </button>
                </td>
              `;
      samplesList.appendChild(row);
    });
  }

  // Function to render summary cards
  function renderSummaryCards(data) {
    const summaryCards = document.getElementById("summaryCards");
    const totalStock = data.reduce((sum, sample) => sum + sample.totalStock, 0);
    const totalDistributed = data.reduce(
      (sum, sample) => sum + sample.distributed,
      0
    );
    const lowStock = data.filter(
      (sample) => sample.remaining < 50 && sample.remaining > 0
    ).length;
    const outOfStock = data.filter((sample) => sample.remaining === 0).length;

    summaryCards.innerHTML = `
                <div class="col-md-3">
                  <div class="card summary-card summary-total-stock">
                    <div class="card-body">
                      <div class="card-content">
                        <h3>${totalStock}</h3>
                        <h5>Total Stock</h5>
                      </div>
                      <div class="card-icon">
                        <i class="bi bi-boxes"></i>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card summary-card summary-distributed">
                    <div class="card-body">
                      <div class="card-content">
                        <h3>${totalDistributed}</h3>
                        <h5>Distributed</h5>
                      </div>
                      <div class="card-icon">
                        <i class="bi bi-truck"></i>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card summary-card summary-low-stock">
                    <div class="card-body">
                      <div class="card-content">
                        <h3>${lowStock}</h3>
                        <h5>Low Stock</h5>
                      </div>
                      <div class="card-icon">
                        <i class="bi bi-exclamation-triangle"></i>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card summary-card summary-out-stock">
                    <div class="card-body">
                      <div class="card-content">
                        <h3>${outOfStock}</h3>
                        <h5>Out of Stock</h5>
                      </div>
                      <div class="card-icon">
                        <i class="bi bi-x-circle"></i>
                      </div>
                    </div>
                  </div>
                </div>
              `;
  }

  // Function to render distribution history
  function renderDistributionHistory(data) {
    const tableBody = document.getElementById("distributionTableBody");
    tableBody.innerHTML = "";

    data.forEach((distribution) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${formatDate(distribution.date)}</td>
                <td>${distribution.product}</td>
                <td>${distribution.mr}</td>
                <td>${distribution.quantity}</td>
                <td>${distribution.recipient}</td>
                <td><span class="badge bg-success status-badge">Completed</span></td>
              `;
      tableBody.appendChild(row);
    });
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Search functionality
  const searchInput = document.getElementById("searchSample");
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = samplesData.filter(
      (sample) =>
        sample.productName.toLowerCase().includes(searchTerm) ||
        sample.batchNumber.toLowerCase().includes(searchTerm) ||
        sample.description.toLowerCase().includes(searchTerm)
    );
    renderSampleTable(filteredData);
  });

  // Filter functionality
  const filterProduct = document.getElementById("filterProduct");
  const filterMR = document.getElementById("filterMR");
  const filterStockStatus = document.getElementById("filterStockStatus");

  function applyFilters() {
    let filteredData = samplesData;

    if (filterProduct.value) {
      filteredData = filteredData.filter(
        (sample) => sample.productName === filterProduct.value
      );
    }

    if (filterMR.value) {
      filteredData = filteredData.filter(
        (sample) => sample.mrStocks[filterMR.value] !== undefined
      );
    }

    if (filterStockStatus.value) {
      switch (filterStockStatus.value) {
        case "low":
          filteredData = filteredData.filter(
            (sample) => sample.remaining < 50 && sample.remaining > 0
          );
          break;
        case "medium":
          filteredData = filteredData.filter(
            (sample) => sample.remaining >= 50 && sample.remaining <= 100
          );
          break;
        case "high":
          filteredData = filteredData.filter(
            (sample) => sample.remaining > 100
          );
          break;
        case "out":
          filteredData = filteredData.filter(
            (sample) => sample.remaining === 0
          );
          break;
      }
    }

    renderSampleTable(filteredData);
  }

  filterProduct.addEventListener("change", applyFilters);
  filterMR.addEventListener("change", applyFilters);
  filterStockStatus.addEventListener("change", applyFilters);

  // Add stock functionality (UPDATED)
  const saveStockBtn = document.getElementById("saveStockBtn");
  saveStockBtn.addEventListener("click", () => {
    const form = document.getElementById("addStockForm");
    if (form.checkValidity()) {
      const quantityAdded = parseInt(
        document.getElementById("quantityAdded").value
      );
      const productName = document.getElementById("productName").value;

      // Check if product already exists
      let existingSample = samplesData.find(
        (s) => s.productName === productName
      );

      (async function () {
        if (samplesApiMode) {
          if (!existingSample || !existingSample.productId) {
            alert("This product is not available in the backend stock list. Please add it through the backend/Products workflow.");
            return;
          }

          try {
            await apiJson(STOCK_RECEIVED_API_BASE, {
              method: "POST",
              body: JSON.stringify({
                productId: String(existingSample.productId),
                quantity: quantityAdded,
                date: new Date().toISOString(),
                notes: `Added stock via Manager Samples page`,
              }),
            });

            await refreshSamplesFromApiOrFallback();
            populateDropdowns();
            renderSampleTable(samplesData);
            renderSummaryCards(samplesData);

            const modal = bootstrap.Modal.getInstance(
              document.getElementById("addStockModal")
            );
            modal.hide();
            form.reset();
            return;
          } catch (e) {
            console.warn("Add stock API failed. Falling back to localStorage.", e);
            samplesApiMode = false;
          }
        }

        if (existingSample) {
          // If exists, update stock
          existingSample.totalStock += quantityAdded;
          existingSample.remaining += quantityAdded;
        } else {
          // If new product, create new sample object
          const newSample = {
            id: samplesData.length + 1,
            productId: null,
            productName: productName,
            batchNumber: document.getElementById("batchNumber").value,
            totalStock: quantityAdded,
            distributed: 0,
            remaining: quantityAdded,
            unitPrice: parseFloat(document.getElementById("unitPrice").value),
            expiryDate: document.getElementById("expiryDate").value,
            mrStocks: {},
            description: document.getElementById("productDescription").value,
          };
          samplesData.push(newSample);

          // Add to static productsData to update dropdowns immediately
          productsData.push({
            id: productsData.length + 1,
            name: newSample.productName,
            category: "New",
          });
          saveData("productsData", productsData); // Save updated products list
          populateDropdowns(); // Re-populate dropdowns with new product
        }

        // Save updated samples data to localStorage
        saveData("samplesData", samplesData);

        renderSampleTable(samplesData);
        renderSummaryCards(samplesData);

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("addStockModal")
        );
        modal.hide();
        form.reset();
      })();
    } else {
      form.reportValidity();
    }
  });

  // Distribute sample functionality (UPDATED)
  const distributeBtn = document.getElementById("distributeBtn");
  distributeBtn.addEventListener("click", () => {
    const form = document.getElementById("distributeSampleForm");
    if (form.checkValidity()) {
      const productName = document.getElementById("distributeProduct").value;
      const mrName = document.getElementById("distributeMR").value;
      const quantity = parseInt(
        document.getElementById("distributeQuantity").value
      );
      const recipientName = document.getElementById("recipientName").value;

      // Find the sample and update stock
      const sample = samplesData.find((s) => s.productName === productName);
      if (sample && sample.remaining >= quantity) {
        (async function () {
          if (samplesApiMode && sample.productId) {
            try {
              const stockItem = await apiJson(`${MR_STOCK_API_BASE}/${sample.productId}`);
              const currentStock = Number(stockItem.stock) || 0;
              const nextStock = currentStock - quantity;
              if (nextStock < 0) {
                alert("Insufficient stock!");
                return;
              }

              await apiJson(`${MR_STOCK_API_BASE}/${sample.productId}`, {
                method: "PUT",
                body: JSON.stringify({
                  name: stockItem.name,
                  stock: nextStock,
                }),
              });

              // Keep local MR distribution tracking for UI, but use backend remaining
              sample.distributed += quantity;
              sample.remaining = nextStock;
              sample.totalStock = sample.remaining + (Number(sample.distributed) || 0);
            } catch (e) {
              console.warn("Distribute API failed. Falling back to localStorage.", e);
              samplesApiMode = false;
            }
          }

          if (!samplesApiMode) {
            sample.distributed += quantity;
            sample.remaining -= quantity;
          }

          // Update MR stock
          if (!sample.mrStocks[mrName]) {
            sample.mrStocks[mrName] = 0;
          }
          sample.mrStocks[mrName] += quantity;

          // Add to distribution history
          const newDistribution = {
            id: distributionHistory.length + 1,
            date: new Date().toISOString().split("T")[0],
            product: productName,
            mr: mrName,
            quantity: quantity,
            recipient: recipientName,
            status: "completed",
          };
          distributionHistory.unshift(newDistribution);

          // Save updated data to localStorage
          saveData("samplesData", samplesData);
          saveData("distributionHistory", distributionHistory);

          renderSampleTable(samplesData);
          renderSummaryCards(samplesData);
          renderDistributionHistory(distributionHistory);

          // Close modal and reset form
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("distributeSampleModal")
          );
          modal.hide();
          form.reset();

          if (samplesApiMode) {
            await refreshSamplesFromApiOrFallback();
            populateDropdowns();
            renderSampleTable(samplesData);
            renderSummaryCards(samplesData);
          }
        })();
      } else {
        alert("Insufficient stock or invalid product!");
      }
    } else {
      form.reportValidity();
    }
  });

  // Render Notifications for Modal
  function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

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
                        <p class="mb-1 text-muted small">${notification.description
          }</p>
                        <small class="text-muted">${notification.time || "Just now"
          }</small>
                      </div>
                    </div>
                  </div>
                `
      )
      .join("");
  }

  // Profile Modal Data Load
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");

  const savedName = localStorage.getItem("signup_name") || "Admin User";
  const savedEmail =
    localStorage.getItem("signup_email") || "admin@kavyapharm.com";

  profileName.textContent = savedName;
  profileEmail.textContent = savedEmail;

  (async function () {
    await refreshSamplesFromApiOrFallback();
    populateDropdowns();
    renderSampleTable(samplesData);
    renderSummaryCards(samplesData);
    renderDistributionHistory(distributionHistory);
    renderNotifications();
  })();
});

// Global functions for sample actions
function viewMRStocks() {
  const modalElement = document.getElementById("mrStocksModal");
  const modalTitle = modalElement.querySelector(".modal-title");
  const modalBody = modalElement.querySelector(".modal-body");

  // Update modal content
  modalTitle.innerHTML = `<i class="bi bi-person-badge me-2"></i> All MR Stocks`;

  // Aggregate all MR stocks across all products
  const allMRStocks = {};
  let totalWarehouseStock = 0;

  samplesData.forEach((sample) => {
    totalWarehouseStock += sample.remaining;
    Object.entries(sample.mrStocks).forEach(([mr, stock]) => {
      if (!allMRStocks[mr]) {
        allMRStocks[mr] = 0;
      }
      allMRStocks[mr] += stock;
    });
  });

  let tableHtml = `<div class="table-responsive"><table class="table table-striped table-hover">
                <thead><tr><th>MR Name</th><th>Total Stock Quantity</th></tr></thead>
                <tbody>`;

  let totalMRStock = 0;
  Object.entries(allMRStocks).forEach(([mr, stock]) => {
    tableHtml += `<tr><td>${mr}</td><td><span class="badge bg-primary">${stock} units</span></td></tr>`;
    totalMRStock += stock;
  });

  tableHtml += `</tbody><tfoot><tr class="table-dark"><td><strong>Total Assigned to MRs:</strong></td><td><strong>${totalMRStock} units</strong></td></tr></tfoot></table></div>`;

  // Add total warehouse remaining stock
  tableHtml += `<p class="mt-3"><strong>Total Warehouse Remaining Stock:</strong> <span class="badge bg-success">${totalWarehouseStock} units</span></p>`;

  modalBody.innerHTML = tableHtml;

  // Show the modal
  const mrStocksModal = new bootstrap.Modal(modalElement);
  mrStocksModal.show();
}

function distributeSample(sampleId) {
  // Find the sample to pre-select the product
  const sample = samplesData.find((s) => String(s.id) === String(sampleId));
  if (sample) {
    // 1. Pre-select the product in the distribution modal dropdown
    const distributeProductSelect =
      document.getElementById("distributeProduct");

    // This assumes the product options have been populated in populateDropdowns()
    distributeProductSelect.value = sample.productName;

    // 2. Open the distribute modal
    const modal = new bootstrap.Modal(
      document.getElementById("distributeSampleModal")
    );
    modal.show();
  }
}