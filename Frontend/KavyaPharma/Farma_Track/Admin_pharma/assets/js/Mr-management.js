document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const USERS_API = `${API_BASE}/api/users`;

  const tableBody = document.getElementById("mrTableBody");
  const paginationEl = document.getElementById("pagination");
  const searchInput = document.getElementById("searchMR");
  const mrForm = document.getElementById("mrForm");
  const modalTitle = document.querySelector("#mrModal .modal-title");
  const submitBtn = mrForm.querySelector('button[type="submit"]');
  const passwordInput = document.getElementById("mrPassword");
  const togglePassword = document.getElementById("togglePassword");

  const mrModal = new bootstrap.Modal(document.getElementById("mrModal"));

  let mrs = [];
  let filteredMrs = [];
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
  async function fetchMrs() {
    try {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
      const data = await apiRequest(USERS_API);
      // Filter only MRs
      mrs = data.filter(user => user.role === "MR");
      applyFilter();
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load MRs: ${error.message}</td></tr>`;
    }
  }

  function applyFilter() {
    const term = searchInput.value.toLowerCase();
    filteredMrs = mrs.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      (m.territory && m.territory.toLowerCase().includes(term)) ||
      (m.assignedManager && m.assignedManager.toLowerCase().includes(term))
    );
    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredMrs.slice(start, end);

    if (pageData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No MRs found.</td></tr>';
      renderPagination();
      return;
    }

    pageData.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.email}</td>
        <td>${m.phone || "—"}</td>
        <td>${m.assignedManager || "—"}</td>
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
      btn.addEventListener("click", () => deleteMr(btn.dataset.id));
    });

    renderPagination();
  }

  function renderPagination() {
    paginationEl.innerHTML = "";
    const totalPages = Math.ceil(filteredMrs.length / rowsPerPage);
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
    modalTitle.textContent = "Add MR";
    mrForm.reset();
    document.getElementById("mrEmail").disabled = false;
    document.getElementById("mrPassword").required = true;
    mrModal.show();
  };

  async function openEditModal(id) {
    const mr = mrs.find(m => String(m.id) === String(id));
    if (!mr) return;

    editMode = true;
    currentEditId = id;
    modalTitle.textContent = "Edit MR";

    document.getElementById("mrName").value = mr.name;
    document.getElementById("mrEmail").value = mr.email;
    document.getElementById("mrPhone").value = mr.phone || "";
    document.getElementById("mrManager").value = mr.assignedManager || "";
    document.getElementById("mrTerritory").value = mr.territory || "";
    document.getElementById("mrPassword").value = "";
    document.getElementById("mrPassword").required = false;
    document.getElementById("mrEmail").disabled = true;

    mrModal.show();
  }

  async function deleteMr(id) {
    if (!confirm("Are you sure you want to delete this MR?")) return;
    try {
      await apiRequest(`${USERS_API}/${id}`, { method: "DELETE" });
      alert("MR deleted successfully.");
      fetchMrs();
    } catch (error) {
      alert("Failed to delete MR: " + error.message);
    }
  }

  mrForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById("mrName").value,
      email: document.getElementById("mrEmail").value,
      role: "MR",
      phone: document.getElementById("mrPhone").value,
      territory: document.getElementById("mrTerritory").value,
      assignedManager: document.getElementById("mrManager").value,
      status: "ACTIVE"
    };

    const password = document.getElementById("mrPassword").value;
    if (password) payload.password = password;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

      if (editMode) {
        await apiRequest(`${USERS_API}/${currentEditId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("MR updated successfully.");
      } else {
        await apiRequest(USERS_API, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        alert("MR added successfully.");
      }

      mrModal.hide();
      fetchMrs();
    } catch (error) {
      alert("Failed to save MR: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  });

  // --- Search & Utils ---
  searchInput.addEventListener("input", applyFilter);

  togglePassword?.addEventListener("click", function () {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("bi-eye");
    this.classList.toggle("bi-eye-slash");
  });

  // --- Initial Load ---
  const addBtn = document.querySelector('[data-bs-target="#mrModal"]');
  if (addBtn) {
    addBtn.removeAttribute("data-bs-toggle");
    addBtn.addEventListener("click", openAddModal);
  }

  fetchMrs();
});
