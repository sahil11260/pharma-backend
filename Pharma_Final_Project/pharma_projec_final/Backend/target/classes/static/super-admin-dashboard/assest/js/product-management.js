document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "";
  const PRODUCTS_API_BASE = `${API_BASE}/api/products`;
  const STORAGE_KEY = "kavyaPharmProducts";
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

  function normalizeProductFromApi(p) {
    return {
      id: String(p.id),
      name: p.name,
      category: p.category,
      price: p.price,
      stock: Number(p.stock) || 0,
    };
  }

  function saveProductsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productsData));
    } catch (e) { }
  }

  function loadProductsFromStorageIfAny() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return null;
  }

  async function refreshProductsFromApiOrFallback() {
    try {
      const data = await apiJson(PRODUCTS_API_BASE);
      if (Array.isArray(data)) {
        productsData = data.map(normalizeProductFromApi);
        saveProductsToStorage();
        productsApiMode = true;
        try { hideApiRetryBanner(); } catch (e) { }
        return;
      }
      productsApiMode = false;
    } catch (e) {
      console.warn("Products API unavailable, using localStorage.", e);
      productsApiMode = false;
      showApiRetryBanner();
    }
  }

  async function createProductApi(payload) {
    return await apiJson(PRODUCTS_API_BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function updateProductApi(id, payload) {
    return await apiJson(`${PRODUCTS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async function deleteProductApi(id) {
    return await apiJson(`${PRODUCTS_API_BASE}/${id}`, { method: "DELETE" });
  }

  const tableBody = document.getElementById("productTableBody");
  const addProductModal = document.getElementById("addProductModal");
  const form = addProductModal.querySelector("form");
  const saveButton = addProductModal.querySelector(
    ".modal-footer .btn-primary"
  );
  const modalTitle = document.getElementById("addProductModalLabel");
  const modalInstance = new bootstrap.Modal(addProductModal);
  const totalProductsElement = document.getElementById("totalProducts");
  const activeProductsElement = document.getElementById("activeProducts");
  const paginationUl = document.querySelector(
    ".pagination.justify-content-center"
  );

  const ROWS_PER_PAGE = 10;
  let currentPage = 1;
  let productsData = [];
  let filteredData = [];
  let currentOperationMode = "add";
  let editingProductId = null;

  function showToastNotification(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `position-fixed top-0 start-50 translate-middle-x d-flex align-items-center`;
    toast.style.zIndex = "1050";
    toast.style.minWidth = "280px";
    toast.style.padding = "12px 20px";
    toast.style.marginTop = "60px";
    toast.style.borderRadius = "8px";
    toast.style.backgroundColor = type === "danger" ? "#f8d7da" : "#d4edda";
    toast.style.color = type === "danger" ? "#721c24" : "#155724";
    toast.style.border =
      type === "danger" ? "1px solid #f5c6cb" : "1px solid #c3e6cb";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.fontWeight = "500";
    const iconClass =
      type === "success"
        ? "bi bi-check-circle-fill"
        : "bi bi-exclamation-triangle-fill";
    toast.innerHTML = `<i class="${iconClass} me-2 fs-5"></i><div>${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast) toast.remove();
    }, 3000);
  }

  // Show a small banner when the API is unavailable with a Retry button
  function showApiRetryBanner() {
    if (document.getElementById("apiRetryBanner")) return;
    const banner = document.createElement("div");
    banner.id = "apiRetryBanner";
    banner.style.position = "fixed";
    banner.style.bottom = "20px";
    banner.style.right = "20px";
    banner.style.background = "#fff3cd";
    banner.style.border = "1px solid #ffeeba";
    banner.style.padding = "12px 16px";
    banner.style.borderRadius = "8px";
    banner.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    banner.style.zIndex = "2000";
    banner.innerHTML = `<div style=\"display:flex;gap:12px;align-items:center;\">` +
      `<div style=\"font-weight:600;color:#856404;\">API unreachable — using local data</div>` +
      `<button id=\"apiRetryBtn\" class=\"btn btn-sm btn-outline-primary\">Retry</button>` +
      `</div>`;
    document.body.appendChild(banner);
    document.getElementById("apiRetryBtn").addEventListener("click", async function () {
      try {
        hideApiRetryBanner();
        await refreshProductsFromApiOrFallback();
        if (!productsData || productsData.length === 0) productsData = loadProducts();
        renderProductTable(productsData, 1);
      } catch (e) {
        console.warn("Retry failed", e);
        showToastNotification("Retry failed — still offline", "danger");
      }
    });
  }

  function hideApiRetryBanner() {
    const b = document.getElementById("apiRetryBanner");
    if (b) b.remove();
  }

  function getProductStatus(stock) {
    let status = "Active";
    let badgeClass = "bg-success";
    stock = parseInt(stock);
    if (stock === 0) {
      status = "Out of Stock";
      badgeClass = "bg-warning";
    } else if (stock > 0 && stock <= 50) {
      status = "Low Stock";
      badgeClass = "bg-danger";
    }
    return { status, badgeClass };
  }

  function renderProductTable(products, page = 1) {
    currentPage = page;
    filteredData = products;
    tableBody.innerHTML = "";
    const totalPages = Math.ceil(products.length / ROWS_PER_PAGE);
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageData = products.slice(start, end);
    let totalCount = 0;
    let activeCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    pageData.forEach((product) => {
      const { status, badgeClass } = getProductStatus(product.stock);
      const newRow = document.createElement("tr");
      newRow.setAttribute("data-product-id", product.id);
      newRow.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.price}</td>
        <td>${product.stock}</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-info edit-btn"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-btn"><i class="bi bi-trash"></i></button>
        </td>`;
      tableBody.appendChild(newRow);
    });

    products.forEach((product) => {
      const { status } = getProductStatus(product.stock);
      totalCount++;
      if (status === "Active") activeCount++;
      else if (status === "Low Stock") lowStockCount++;
      else if (status === "Out of Stock") outOfStockCount++;
    });

    if (totalProductsElement) totalProductsElement.textContent = totalCount;
    if (activeProductsElement) activeProductsElement.textContent = activeCount;
    const lowStockElement = document.getElementById("lowStock");
    if (lowStockElement) lowStockElement.textContent = lowStockCount;
    const outOfStockElement = document.getElementById("outOfStock");
    if (outOfStockElement) outOfStockElement.textContent = outOfStockCount;

    attachDeleteListeners();
    attachEditListeners();
    updatePaginationControls(totalPages);
  }

  function updatePaginationControls(totalPages) {
    paginationUl.innerHTML = "";
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1
      }">Previous</a>`;
    if (currentPage > 1) {
      prevLi.addEventListener("click", (e) => {
        e.preventDefault();
        renderProductTable(filteredData, currentPage - 1);
      });
    }
    paginationUl.appendChild(prevLi);
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${currentPage === i ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        renderProductTable(filteredData, i);
      });
      paginationUl.appendChild(li);
    }
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""
      }`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1
      }">Next</a>`;
    if (currentPage < totalPages) {
      nextLi.addEventListener("click", (e) => {
        e.preventDefault();
        renderProductTable(filteredData, currentPage + 1);
      });
    }
    paginationUl.appendChild(nextLi);
  }

  function loadProducts() {
    const cached = loadProductsFromStorageIfAny();
    if (cached) return cached;
    const initialData = [
      {
        id: "1001",
        name: "Paracetamol 500mg",
        category: "Pain Relief",
        price: "₹25.00",
        stock: 150,
      },
      {
        id: "1002",
        name: "Amoxicillin 250mg",
        category: "Antibiotic",
        price: "₹45.00",
        stock: 80,
      },
      {
        id: "1003",
        name: "Vitamin C 1000mg",
        category: "Supplements",
        price: "₹30.00",
        stock: 200,
      },
      {
        id: "1004",
        name: "Ibuprofen 200mg",
        category: "Pain Relief",
        price: "₹15.00",
        stock: 0,
      },
      {
        id: "1005",
        name: "Aspirin 75mg",
        category: "Cardiovascular",
        price: "₹20.00",
        stock: 120,
      },
      {
        id: "1006",
        name: "Metformin 500mg",
        category: "Diabetics",
        price: "₹80.00",
        stock: 300,
      },
      {
        id: "1007",
        name: "Cetirizine 10mg",
        category: "Anti-Allergy",
        price: "₹10.00",
        stock: 450,
      },
      {
        id: "1008",
        name: "Omeprazole 20mg",
        category: "Gastric",
        price: "₹50.00",
        stock: 15,
      },
      {
        id: "1009",
        name: "Atorvastatin 10mg",
        category: "Cardiovascular",
        price: "₹120.00",
        stock: 0,
      },
      {
        id: "1010",
        name: "Clopidogrel 75mg",
        category: "Cardiovascular",
        price: "₹150.00",
        stock: 60,
      },
      {
        id: "1011",
        name: "Lisinopril 10mg",
        category: "Hypertension",
        price: "₹90.00",
        stock: 180,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  function attachDeleteListeners() {
    tableBody.removeEventListener("click", handleDelete);
    tableBody.addEventListener("click", handleDelete);
  }

  function handleDelete(event) {
    const deleteBtn = event.target.closest(".delete-btn");
    if (!deleteBtn) return;
    const row = deleteBtn.closest("tr");
    const productIdToDelete = row.getAttribute("data-product-id");
    const productName = row.cells[1].textContent;
    if (
      confirm(
        `Are you sure you want to delete product ID ${productIdToDelete} (${productName})?`
      )
    ) {
      (async function () {
        // Attempt API delete when ID looks numeric. We try regardless of productsApiMode
        // so intermittent API availability can be recovered by retries.
        if (productIdToDelete && /^[0-9]+$/.test(String(productIdToDelete))) {
          try {
            await deleteProductApi(productIdToDelete);
            productsData = productsData.filter(
              (product) => String(product.id) !== String(productIdToDelete)
            );
            saveProductsToStorage();
            const totalPages = Math.ceil(productsData.length / ROWS_PER_PAGE);
            let newPage = currentPage > totalPages ? totalPages : currentPage;
            if (newPage === 0) newPage = 1;
            renderProductTable(productsData, newPage);
            try { hideApiRetryBanner(); } catch (e) { }
            showToastNotification(
              `Product ${productIdToDelete} deleted permanently.`,
              "danger"
            );
            return;
          } catch (e) {
            console.warn("Product delete API failed. Falling back to localStorage.", e);
            showApiRetryBanner();
          }
        }

        productsData = productsData.filter(
          (product) => String(product.id) !== String(productIdToDelete)
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productsData));
        const totalPages = Math.ceil(productsData.length / ROWS_PER_PAGE);
        let newPage = currentPage > totalPages ? totalPages : currentPage;
        if (newPage === 0) newPage = 1;
        renderProductTable(productsData, newPage);
        showToastNotification(
          `Product ${productIdToDelete} deleted permanently.`,
          "danger"
        );
      })();
    }
  }

  function attachEditListeners() {
    tableBody.removeEventListener("click", handleEdit);
    tableBody.addEventListener("click", handleEdit);
  }

  function handleEdit(event) {
    const editBtn = event.target.closest(".edit-btn");
    if (!editBtn) return;
    const row = editBtn.closest("tr");
    const productId = row.getAttribute("data-product-id");
    const productToEdit = productsData.find((p) => p.id === productId);
    if (productToEdit) {
      currentOperationMode = "edit";
      editingProductId = productId;
      modalTitle.textContent = "Edit Product: " + productToEdit.name;
      saveButton.textContent = "Save Changes";
      document.getElementById("productId").value = productToEdit.id;
      const priceValue = productToEdit.price.replace("₹", "");
      document.getElementById("productName").value = productToEdit.name;
      document.getElementById("productCategory").value = productToEdit.category;
      document.getElementById("productPrice").value = priceValue;
      document.getElementById("productStock").value = productToEdit.stock;
      document.getElementById("productId").setAttribute("readonly", true);
      modalInstance.show();
    }
  }

  // Start with empty data and prefer API results. Only fall back to localStorage
  // if the API is unavailable. This prevents accidental local-only persistence
  // when the backend is reachable.
  productsData = [];

  (async function () {
    await refreshProductsFromApiOrFallback();
    // If API returned nothing or was unavailable, load from localStorage / initial data
    if (!productsData || productsData.length === 0) {
      productsData = loadProducts();
    }
    renderProductTable(productsData, 1);
  })();

  if (saveButton) {
    saveButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const priceValue = parseFloat(
        document.getElementById("productPrice").value
      );
      const stockValue = parseInt(
        document.getElementById("productStock").value
      );

      // ✅ Show error if negative value
      if (priceValue < 0 || stockValue < 0) {
        showToastNotification("Does not allow negative value.", "danger");
        return;
      }

      const productData = {
        id: document.getElementById("productId").value,
        name: document.getElementById("productName").value,
        category: document.getElementById("productCategory").value,
        price: "₹" + priceValue.toFixed(2),
        stock: stockValue,
      };

      let notificationMessage = "";
      let targetPage = currentPage;

      (async function () {
        // Try API save even if productsApiMode is false; this helps recover from
        // transient failures without forcing the app into local-only mode.
        if (true) {
          try {
            if (currentOperationMode === "add") {
              const created = await createProductApi({
                name: productData.name,
                category: productData.category,
                price: productData.price,
                stock: productData.stock,
              });
              if (created) {
                productsData.unshift(normalizeProductFromApi(created));
                saveProductsToStorage();
                try { hideApiRetryBanner(); } catch (e) { }
              }
              targetPage = 1;
              notificationMessage = `Product "${productData.name}" added successfully!`;
            } else if (currentOperationMode === "edit") {
              const updated = await updateProductApi(editingProductId, {
                name: productData.name,
                category: productData.category,
                price: productData.price,
                stock: productData.stock,
              });
              if (updated) {
                const idx = productsData.findIndex(
                  (p) => String(p.id) === String(editingProductId)
                );
                if (idx !== -1) {
                  productsData[idx] = normalizeProductFromApi(updated);
                  saveProductsToStorage();
                  try { hideApiRetryBanner(); } catch (e) { }
                }
              }
              notificationMessage = `Product "${productData.name}" updated successfully!`;
            }

            renderProductTable(productsData, targetPage);
            form.reset();
            form.classList.remove("was-validated");
            modalInstance.hide();
            showToastNotification(notificationMessage, "success");
            return;
          } catch (e) {
            console.warn("Product save API failed. Falling back to localStorage.", e);
            showApiRetryBanner();
          }
        }

        if (currentOperationMode === "add") {
          productsData.push(productData);
          targetPage = Math.ceil(productsData.length / ROWS_PER_PAGE);
          notificationMessage = `Product "${productData.name}" added successfully!`;
        } else if (currentOperationMode === "edit") {
          const index = productsData.findIndex((p) => p.id === editingProductId);
          if (index !== -1) {
            productsData[index] = { ...productsData[index], ...productData };
            notificationMessage = `Product "${productData.name}" updated successfully!`;
          }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(productsData));
        renderProductTable(productsData, targetPage);
        form.reset();
        form.classList.remove("was-validated");
        modalInstance.hide();
        showToastNotification(notificationMessage, "success");
      })();
    });

    addProductModal.addEventListener("hidden.bs.modal", function () {
      form.classList.remove("was-validated");
      form.reset();
      currentOperationMode = "add";
      editingProductId = null;
      modalTitle.textContent = "Add New Product";
      saveButton.textContent = "Save Product";
      document.getElementById("productId").removeAttribute("readonly");
    });
  }

  const searchInput = document.getElementById("productSearchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const filter = searchInput.value.toLowerCase();
      const results = productsData.filter((product) => {
        const productValues = Object.values(product).join(" ").toLowerCase();
        return productValues.includes(filter);
      });
      renderProductTable(results, 1);
    });
  }

  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", function () {
      const existingPopup = document.getElementById("notificationPopup");
      if (existingPopup) {
        existingPopup.remove();
        return;
      }
      const popup = document.createElement("div");
      popup.id = "notificationPopup";
      popup.innerHTML = `
        <div style="position: fixed; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; min-width: 250px; color: black;">
          <h6 style="margin: 0 0 10px 0; font-weight: bold;">Notifications</h6>
          <div style="margin-bottom: 8px;">• New order received</div>
          <div style="margin-bottom: 8px;">• Inventory low alert</div>
          <div style="margin-bottom: 8px;">• System update available</div>
          <div style="margin-bottom: 8px;">• View all notifications</div>
        </div>`;
      document.body.appendChild(popup);
      const btnRect = notificationBtn.getBoundingClientRect();
      const popupEl = popup.querySelector("div");
      popupEl.style.left = btnRect.left - 200 + "px";
      popupEl.style.top = btnRect.bottom + 5 + "px";
      document.addEventListener("click", function closePopup(e) {
        if (!notificationBtn.contains(e.target) && !popup.contains(e.target)) {
          if (popup) popup.remove();
          document.removeEventListener("click", closePopup);
        }
      });
    });
  }
});










