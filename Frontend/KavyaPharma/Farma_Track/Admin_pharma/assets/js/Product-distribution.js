// product-distribution.js
// Product Distribution with Price Display
document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const PRODUCTS_API_BASE = `${API_BASE}/api/products`;
  const STOCK_STORAGE_KEY = "receivedStock";
  const ALLOCATIONS_STORAGE_KEY = "allocations";
  const ALT_STOCK_STORAGE_KEY = "kavyaPharmAdminProductStockData";
  const ALT_ALLOCATIONS_STORAGE_KEY = "kavyaPharmAdminProductAllocationsData";
  let productsApiMode = true;

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

  function parsePrice(value) {
    const n = parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function saveStockToStorage() {
    try {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(receivedStock));
    } catch (e) { }
  }

  function saveAllocationsToStorage() {
    try {
      localStorage.setItem(ALLOCATIONS_STORAGE_KEY, JSON.stringify(allocations));
    } catch (e) { }
  }

  function loadFromStorageIfAny() {
    try {
      const rawAlloc = localStorage.getItem(ALLOCATIONS_STORAGE_KEY) || localStorage.getItem(ALT_ALLOCATIONS_STORAGE_KEY);
      if (rawAlloc) {
        const parsed = JSON.parse(rawAlloc);
        if (Array.isArray(parsed)) allocations = parsed;
        localStorage.setItem(ALLOCATIONS_STORAGE_KEY, JSON.stringify(allocations));
      } else {
        localStorage.setItem(ALLOCATIONS_STORAGE_KEY, JSON.stringify(allocations));
      }
    } catch (e) { }

    try {
      const rawStock = localStorage.getItem(STOCK_STORAGE_KEY) || localStorage.getItem(ALT_STOCK_STORAGE_KEY);
      if (rawStock) {
        const parsed = JSON.parse(rawStock);
        if (Array.isArray(parsed)) receivedStock = parsed;
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(receivedStock));
      }
    } catch (e) { }
  }

  async function refreshStockFromApiOrFallback() {
    try {
      const data = await apiJson(PRODUCTS_API_BASE);
      if (Array.isArray(data)) {
        receivedStock = data.map((p) => ({
          id: Number(p.id),
          name: p.name,
          available: Number(p.stock) || 0,
          price: parsePrice(p.price),
          priceStr: String(p.price || "0"),
          category: p.category || "General"
        }));
        saveStockToStorage();
        productsApiMode = true;
        hideApiRetryBanner();
        return;
      }
      productsApiMode = false;
      showApiRetryBanner();
    } catch (e) {
      console.warn("Products API unavailable, using localStorage.", e);
      productsApiMode = false;
      showApiRetryBanner();
    }
  }

  async function updateProductStockApi(product, newStock) {
    if (!product || product.id == null) return;
    const payload = {
      name: product.name,
      category: product.category || "General",
      price: String(product.priceStr != null ? product.priceStr : (product.price != null ? product.price : "0")),
      stock: Number(newStock) || 0
    };
    return await apiJson(`${PRODUCTS_API_BASE}/${product.id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  // Dynamic stock & allocations (API-first)
  let receivedStock = [];
  let allocations = [];

  function showApiRetryBanner() {
    if (document.getElementById("productDistApiRetryBanner")) return;
    const banner = document.createElement("div");
    banner.id = "productDistApiRetryBanner";
    banner.className = "alert alert-warning text-center";
    banner.style.margin = "10px 0";
    banner.innerHTML = '<strong>Products API unreachable.</strong> Some actions will use local data. ' +
      '<button id="productDistApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(banner, container.firstChild);
    document.getElementById("productDistApiRetryBtn").addEventListener("click", async function () {
      hideApiRetryBanner();
      try {
        await refreshStockFromApiOrFallback();
        populateProductSelect();
        renderSummary();
        renderTable();
      } catch (e) {
        showApiRetryBanner();
      }
    });
  }

  function hideApiRetryBanner() {
    const b = document.getElementById("productDistApiRetryBanner");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  // Pagination state
  const itemsPerPage = 6;
  let currentPage = 1;
  let currentFilter = "All";
  let currentSearch = "";

  // Elements
  const receivedSummaryRow = document.getElementById("receivedSummaryRow");
  const distributionTableBody = document.getElementById("distributionTableBody");
  const pagination = document.getElementById("pagination");
  const searchInput = document.getElementById("searchInput");
  const productSelect = document.getElementById("productSelect");
  const allocateQty = document.getElementById("allocateQty");
  const allocateTo = document.getElementById("allocateTo");
  const allocateRole = document.getElementById("allocateRole");
  const allocateStatus = document.getElementById("allocateStatus");
  const availableInfo = document.getElementById("availableInfo");
  const allocateForm = document.getElementById("allocateForm");
  const allocateModalTitle = document.getElementById("allocateModalTitle");
  const editingIndexInput = document.getElementById("editingIndex");
  const refreshBtn = document.getElementById("refreshBtn");

  // Filters
  document.getElementById("filterAll").addEventListener("click", () => setFilter("All"));
  document.getElementById("filterPending").addEventListener("click", () => setFilter("Pending"));
  document.getElementById("filterCompleted").addEventListener("click", () => setFilter("Completed"));

  // Search
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    currentPage = 1;
    renderTable();
  });

  // Refresh
  refreshBtn && refreshBtn.addEventListener("click", () => {
    (async function () {
      await refreshStockFromApiOrFallback();
      populateProductSelect();
      renderSummary();
      renderTable();
    })();
  });

  // ✅ Populate product dropdown (now showing price)
  function populateProductSelect() {
    productSelect.innerHTML = receivedStock
      .map(
        (p) =>
          `<option value="${p.id}">
            ${p.name} — ₹${p.price}/unit (Available: ${p.available})
          </option>`
      )
      .join("");
    updateAvailableInfo();
  }

  // ✅ Update available info on product/qty change
  productSelect.addEventListener("change", updateAvailableInfo);
  allocateQty.addEventListener("input", updateAvailableInfo);

  function updateAvailableInfo() {
    const pid = parseInt(productSelect.value, 10);
    const product = receivedStock.find((p) => p.id === pid);
    const qty = Number(allocateQty.value || 0);
    if (product) {
      const after = product.available - qty;
      availableInfo.textContent = `Available: ${product.available} units — After allocation: ${after >= 0 ? after : "--- (insufficient)"
        } | Price: ₹${product.price}/unit`;
      if (after < 0) availableInfo.classList.add("text-danger");
      else availableInfo.classList.remove("text-danger");
    } else {
      availableInfo.textContent = "";
    }
  }

  // ✅ Render received stock summary cards (showing price also)
  function renderSummary() {
    receivedSummaryRow.innerHTML = receivedStock
      .map(
        (p) => `
      <div class="col-12 col-sm-6 col-md-4 mb-3">
        <div class="card summary-card shadow-sm border-0">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-1 fw-semibold">${p.name}</h6>
              <div class="small text-muted">₹${p.price} per unit</div>
            </div>
            <div class="text-end">
              <h4 class="mb-0 text-primary">${p.available}</h4>
              <div class="small text-success">In stock</div>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // ✅ Render distribution table
  function renderTable() {
    let filtered = allocations.filter((a) => {
      if (currentFilter !== "All" && a.status !== currentFilter) return false;
      if (!currentSearch) return true;
      return (
        (a.productName && a.productName.toLowerCase().includes(currentSearch)) ||
        (a.allocateTo && a.allocateTo.toLowerCase().includes(currentSearch)) ||
        (a.role && a.role.toLowerCase().includes(currentSearch))
      );
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    distributionTableBody.innerHTML = pageItems
      .map(
        (a) => `
      <tr>
        <td>${a.date}</td>
        <td>${a.productName}</td>
        <td>${a.allocateTo}</td>
        <td>${a.role}</td>
        <td>${a.qty}</td>
        <td>${a.availableAfter}</td>
        <td><span class="badge ${a.status === "Completed" ? "bg-success" : "bg-warning"
          }">${a.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="pd_edit(${allocations.indexOf(
            a
          )})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="pd_delete(${allocations.indexOf(
            a
          )})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`
      )
      .join("");

    renderPagination(totalPages);
  }

  // Pagination controls
  function renderPagination(totalPages) {
    pagination.innerHTML = "";
    const prev = document.createElement("li");
    prev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prev.innerHTML = `<a class="page-link" href="#" onclick="pd_changePage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prev);

    const range = 2;
    const start = Math.max(1, currentPage - range);
    const end = Math.min(totalPages, currentPage + range);

    for (let i = start; i <= end; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#" onclick="pd_changePage(${i})">${i}</a>`;
      pagination.appendChild(li);
    }

    const next = document.createElement("li");
    next.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    next.innerHTML = `<a class="page-link" href="#" onclick="pd_changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(next);
  }

  function setFilter(f) {
    currentFilter = f;
    currentPage = 1;
    renderTable();
  }

  // ✅ Add/Edit Allocation form
  allocateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const editingIndex = Number(editingIndexInput.value);
    const pid = Number(productSelect.value);
    const product = receivedStock.find((p) => p.id === pid);
    const qty = Number(allocateQty.value);
    const to = allocateTo.value.trim();
    const role = allocateRole.value;
    const status = allocateStatus.value;

    if (!product) return alert("Select a product");
    if (!to) return alert("Please enter a name");
    if (!qty || qty <= 0) return alert("Enter a valid quantity");

    (async function () {
      const prev = editingIndex >= 0 ? allocations[editingIndex] : null;
      const prevIsCompleted = Boolean(prev && prev.status === "Completed");
      const prevProd = prevIsCompleted
        ? receivedStock.find((p) => p.id === Number(prev.productId))
        : null;

      if (status === "Completed") {
        let availableForCheck = product.available;
        if (prevIsCompleted && prevProd && Number(prev.productId) === Number(product.id)) {
          availableForCheck += Number(prev.qty);
        }
        if (qty > availableForCheck) {
          alert("Quantity exceeds available stock");
          return;
        }
      }

      if (editingIndex >= 0) {
        if (prev && prev.status === "Completed") {
          const prevProd = receivedStock.find((p) => p.id === prev.productId);
          if (prevProd) {
            prevProd.available += Number(prev.qty);
            if (productsApiMode) {
              try {
                await updateProductStockApi(prevProd, prevProd.available);
              } catch (err) {
                console.warn("Stock refund API failed. Falling back to localStorage.", err);
                productsApiMode = false;
              }
            }
          }
        }
      }

      if (status === "Completed") {
        product.available -= qty;
        if (productsApiMode) {
          try {
            await updateProductStockApi(product, product.available);
          } catch (err) {
            console.warn("Stock deduct API failed. Falling back to localStorage.", err);
            productsApiMode = false;
          }
        }
      }

      const today = new Date().toISOString().split("T")[0];
      const entry = {
        date: today,
        productId: product.id,
        productName: product.name,
        allocateTo: to,
        role,
        qty,
        availableAfter: product.available,
        status,
      };

      if (editingIndex >= 0) {
        allocations[editingIndex] = entry;
        editingIndexInput.value = -1;
      } else {
        allocations.unshift(entry);
      }

      saveAllocationsToStorage();
      saveStockToStorage();

      populateProductSelect();
      renderSummary();
      renderTable();
      allocateForm.reset();
      bootstrap.Modal.getInstance(document.getElementById("allocateModal")).hide();
    })();
  });

  // ✅ Global functions for edit/delete/page change
  window.pd_edit = function (index) {
    const item = allocations[index];
    if (!item) return;
    editingIndexInput.value = index;
    productSelect.value = item.productId;
    allocateTo.value = item.allocateTo;
    allocateRole.value = item.role;
    allocateQty.value = item.qty;
    allocateStatus.value = item.status;
    updateAvailableInfo();
    allocateModalTitle.textContent = "Edit Allocation";
    new bootstrap.Modal(document.getElementById("allocateModal")).show();
  };

  window.pd_delete = function (index) {
    if (!confirm("Delete this allocation?")) return;
    (async function () {
      const removed = allocations.splice(index, 1)[0];
      if (removed && removed.status === "Completed") {
        const prod = receivedStock.find((p) => p.id === removed.productId);
        if (prod) {
          prod.available += Number(removed.qty);
          if (productsApiMode) {
            try {
              await updateProductStockApi(prod, prod.available);
            } catch (err) {
              console.warn("Stock refund API failed. Falling back to localStorage.", err);
              productsApiMode = false;
            }
          }
        }
      }

      saveAllocationsToStorage();
      saveStockToStorage();
      populateProductSelect();
      renderSummary();
      renderTable();
    })();
  };

  window.pd_changePage = function (page) {
    const totalPages = Math.max(1, Math.ceil(allocations.length / itemsPerPage));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
    renderTable();
  };

  // ✅ Initial render
  loadFromStorageIfAny();
  (async function () {
    await refreshStockFromApiOrFallback();
    populateProductSelect();
    renderSummary();
    renderTable();
  })();
});
