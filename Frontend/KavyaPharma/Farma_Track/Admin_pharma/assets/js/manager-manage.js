document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const USERS_API = `${API_BASE}/api/users`;

  const tableBody = document.getElementById("managerTableBody");
  const paginationEl = document.getElementById("pagination");
  const searchInput = document.getElementById("searchManager");
  const managerForm = document.getElementById("managerForm");
  const modalTitle = document.querySelector("#managerModal .modal-title");
  const submitBtn = managerForm.querySelector('button[type="submit"]');
  const passwordInput = document.getElementById("managerPassword");
  const togglePassword = document.getElementById("togglePassword");

  const managerModal = new bootstrap.Modal(document.getElementById("managerModal"));

  let managers = [];
  let filteredManagers = [];
  let editMode = false;
  let currentEditId = null;
  let currentPage = 1;
  const rowsPerPage = 5;

  // --- Helpers ---
  function getAuthHeader() {
    const token = localStorage.getItem("kavya_auth_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  async function apiRequest(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorMsg;
        } catch (e) { }
        throw new Error(errorMsg);
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      console.error("API Request Failed:", error);
      throw error;
    }
  }

  // --- Core CRUD ---
  async function fetchManagers() {
    try {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
      const data = await apiRequest(USERS_API);
      // Filter only managers
      managers = data.filter(user => user.role === "MANAGER");
      applyFilter();
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load managers: ${error.message}</td></tr>`;
    }
  }

  function applyFilter() {
    const term = searchInput.value.toLowerCase();
    filteredManagers = managers.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      (m.territory && m.territory.toLowerCase().includes(term))
    );
    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredManagers.slice(start, end);

    if (pageData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No managers found.</td></tr>';
      renderPagination();
      return;
    }

    pageData.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.email}</td>
        <td>${m.phone || "—"}</td>
        <td>${m.territory || "—"}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${m.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${m.id}"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach local listeners
    tableBody.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    tableBody.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteManager(btn.dataset.id));
    });

    renderPagination();
  }

  function renderPagination() {
    paginationEl.innerHTML = "";
    const totalPages = Math.ceil(filteredManagers.length / rowsPerPage);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i;
        renderTable();
      });
      paginationEl.appendChild(li);
    }
  }

  // --- Actions ---
  window.openAddModal = function () {
    editMode = false;
    currentEditId = null;
    modalTitle.textContent = "Add Manager";
    managerForm.reset();
    document.getElementById("managerEmail").disabled = false;
    document.getElementById("managerPassword").required = true;
    managerModal.show();
  };

  async function openEditModal(id) {
    const manager = managers.find(m => String(m.id) === String(id));
    if (!manager) return;

    editMode = true;
    currentEditId = id;
    modalTitle.textContent = "Edit Manager";

    document.getElementById("managerName").value = manager.name;
    document.getElementById("managerEmail").value = manager.email;
    document.getElementById("managerPhone").value = manager.phone || "";
    document.getElementById("managerTerritory").value = manager.territory || "";
    document.getElementById("managerPassword").value = "";
    document.getElementById("managerPassword").required = false;
    document.getElementById("managerEmail").disabled = true;

    managerModal.show();
  }

  async function deleteManager(id) {
    if (!confirm("Are you sure you want to delete this manager?")) return;
    try {
      await apiRequest(`${USERS_API}/${id}`, { method: "DELETE" });
      alert("Manager deleted successfully.");
      fetchManagers();
    } catch (error) {
      alert("Failed to delete manager: " + error.message);
    }
  }

  managerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById("managerName").value,
      email: document.getElementById("managerEmail").value,
      role: "MANAGER",
      phone: document.getElementById("managerPhone").value,
      territory: document.getElementById("managerTerritory").value,
      status: "ACTIVE"
    };

    const password = document.getElementById("managerPassword").value;
    if (password) payload.password = password;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

      if (editMode) {
        await apiRequest(`${USERS_API}/${currentEditId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("Manager updated successfully.");
      } else {
        await apiRequest(USERS_API, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        alert("Manager added successfully.");
      }

      managerModal.hide();
      fetchManagers();
    } catch (error) {
      alert("Failed to save manager: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  });

  // --- Search & Utils ---
  searchInput.addEventListener("input", applyFilter);

  togglePassword.addEventListener("click", function () {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("bi-eye");
    this.classList.toggle("bi-eye-slash");
  });

  // --- Initial Load ---
  // Fix for the Add Manager button in HTML which might use data-bs-toggle
  // We'll override the click if needed or just use the window function
  const addManagerBtn = document.querySelector('[data-bs-target="#managerModal"]');
  if (addManagerBtn) {
    addManagerBtn.removeAttribute("data-bs-toggle");
    addManagerBtn.addEventListener("click", openAddModal);
  }

  fetchManagers();
});
