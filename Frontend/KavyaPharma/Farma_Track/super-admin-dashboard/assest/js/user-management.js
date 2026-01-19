document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const USERS_API_BASE = `${API_BASE}/api/users`;

  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("userSearchInput");
  const saveUserBtn = document.getElementById("saveUserBtn");
  const roleFilterButtons = document.getElementById("roleFilterButtons");
  const paginationNav = document.querySelector(".pagination");
  const addUserModalEl = document.getElementById("addUserModal");
  const viewUserDetailsBody = document.getElementById("viewUserDetailsBody");
  const viewUserModalLabel = document.getElementById("viewUserModalLabel");

  const addUserModal = new bootstrap.Modal(addUserModalEl);
  const viewUserModal = new bootstrap.Modal(document.getElementById("viewUserModal"));

  let allUsers = [];
  let filteredUsers = [];
  let currentPage = 1;
  const ROWS_PER_PAGE = 10;
  let activeFilterRole = "All";
  let editingUserId = null;

  // --- Auth Helpers ---
  function getAuthHeader() {
    const token = localStorage.getItem("kavya_auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function apiRequest(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers || {}),
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  }

  // --- Role Mappings ---
  function apiRoleToUiRole(role) {
    const r = String(role || "").toUpperCase();
    if (r === "ADMIN") return "Admin";
    if (r === "HR") return "HR";
    if (r === "MANAGER") return "Area Manager";
    if (r === "MR") return "Medical Rep";
    if (r === "DOCTOR") return "Doctor";
    if (r === "SUPERADMIN") return "Super Admin";
    return role;
  }

  function uiRoleToApiRole(uiRole) {
    const r = String(uiRole || "").toLowerCase();
    if (r === "admin") return "ADMIN";
    if (r === "hr") return "HR";
    if (r === "area manager") return "MANAGER";
    if (r === "medical rep") return "MR";
    if (r === "doctor") return "DOCTOR";
    if (r === "super admin") return "SUPERADMIN";
    return "MR";
  }

  // --- Core CRUD ---
  async function fetchUsers() {
    try {
      userTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
      const data = await apiRequest(USERS_API_BASE);
      allUsers = data;
      applyFilters();
    } catch (error) {
      userTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load users: ${error.message}</td></tr>`;
    }
  }

  function applyFilters() {
    const term = searchInput.value.toLowerCase().trim();

    filteredUsers = allUsers.filter(u => {
      // Role Filter
      let roleMatches = true;
      if (activeFilterRole !== "All") {
        const activeRoles = activeFilterRole.split(",");
        const uiRole = apiRoleToUiRole(u.role);
        roleMatches = activeRoles.some(r => uiRole.toLowerCase().includes(r.toLowerCase()));
      }

      // Search Filter
      const searchMatches =
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.territory && u.territory.toLowerCase().includes(term)) ||
        apiRoleToUiRole(u.role).toLowerCase().includes(term);

      return roleMatches && searchMatches;
    });

    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    userTableBody.innerHTML = "";
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageData = filteredUsers.slice(start, end);

    if (pageData.length === 0) {
      userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No users found.</td></tr>';
      renderPagination();
      return;
    }

    pageData.forEach(u => {
      const uiRole = apiRoleToUiRole(u.role);
      const territory = u.role === "DOCTOR" && u.territory && u.territory.includes("|")
        ? u.territory.split("|")[1]
        : (u.territory || "—");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><strong>${uiRole}</strong></td>
        <td>${territory}</td>
        <td><span class="badge ${u.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'}">${u.status || 'ACTIVE'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-success view-btn" data-id="${u.id}"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-info edit-btn" data-id="${u.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${u.id}"><i class="bi bi-trash"></i></button>
        </td>
      `;
      userTableBody.appendChild(tr);
    });

    // Event Listeners for buttons
    userTableBody.querySelectorAll(".view-btn").forEach(btn => btn.addEventListener("click", () => showUserDetails(btn.dataset.id)));
    userTableBody.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", () => openEditModal(btn.dataset.id)));
    userTableBody.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", () => deleteUser(btn.dataset.id)));

    renderPagination();
  }

  function renderPagination() {
    paginationNav.innerHTML = "";
    const totalPages = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);
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
      paginationNav.appendChild(li);
    }
  }

  // --- Actions ---
  async function showUserDetails(id) {
    const user = allUsers.find(u => String(u.id) === String(id));
    if (!user) return;

    viewUserModalLabel.textContent = `${apiRoleToUiRole(user.role)} Details`;
    let detailsHtml = `
      <div class="list-group list-group-flush bg-dark">
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>ID:</span> <strong>${user.id}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Name:</span> <strong>${user.name}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Email:</span> <strong>${user.email}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Role:</span> <strong>${apiRoleToUiRole(user.role)}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Phone:</span> <strong>${user.phone || "—"}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Territory:</span> <strong>${user.territory || "—"}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Status:</span> <strong>${user.status || "ACTIVE"}</strong></div>
        <div class="list-group-item bg-dark text-white d-flex justify-content-between"><span>Last Login:</span> <strong>${user.lastLogin || "—"}</strong></div>
      </div>
    `;
    viewUserDetailsBody.innerHTML = detailsHtml;
    viewUserModal.show();
  }

  function openEditModal(id) {
    const user = allUsers.find(u => String(u.id) === String(id));
    if (!user) return;

    editingUserId = id;
    const uiRole = apiRoleToUiRole(user.role);

    // Simulate clicking the correct role button to show form
    let btnId = "";
    if (uiRole === "Admin" || uiRole === "HR") btnId = "adminBtn";
    else if (uiRole === "Area Manager") btnId = "managerBtn";
    else if (uiRole === "Doctor") btnId = "doctorBtn";
    else btnId = "mrBtn";

    document.getElementById(btnId).click();
    document.getElementById("addUserModalLabel").textContent = "Edit User";
    saveUserBtn.textContent = "Update User";

    const activeForm = document.querySelector(".user-form[style*='display: block']");
    if (!activeForm) return;

    const prefix = activeForm.id.replace("Form", "");
    document.getElementById(`${prefix}Name`).value = user.name;
    document.getElementById(`${prefix}Email`).value = user.email;
    document.getElementById(`${prefix}Email`).disabled = true;
    if (document.getElementById(`${prefix}Phone`)) document.getElementById(`${prefix}Phone`).value = user.phone || "";
    if (document.getElementById(`${prefix}Territory`)) document.getElementById(`${prefix}Territory`).value = user.territory || "";

    if (uiRole === "Doctor") {
      const parts = (user.territory || "").split("|");
      document.getElementById("doctorSpeciality").value = parts[0] || "";
      document.getElementById("doctorCity").value = parts[1] || "";
      document.getElementById("doctorAssignedMr").value = parts[2] || "";
      document.getElementById("doctorType").value = parts[3] || "";
    }

    addUserModal.show();
  }

  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await apiRequest(`${USERS_API_BASE}/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  saveUserBtn.addEventListener("click", async function () {
    const activeForm = Array.from(document.querySelectorAll(".user-form")).find(f => f.style.display === "block");
    if (!activeForm) return;

    const form = activeForm.querySelector("form");
    const prefix = activeForm.id.replace("Form", "");

    const payload = {
      name: document.getElementById(`${prefix}Name`).value,
      email: document.getElementById(`${prefix}Email`).value,
      phone: document.getElementById(`${prefix}Phone`) ? document.getElementById(`${prefix}Phone`).value : "",
      status: "ACTIVE"
    };

    const password = document.getElementById(`${prefix}Password`).value;
    if (password) payload.password = password;

    let uiRole = "";
    if (prefix === "admin") uiRole = "Admin";
    else if (prefix === "manager") uiRole = "Area Manager";
    else if (prefix === "doctor") uiRole = "Doctor";
    else uiRole = "Medical Rep";

    payload.role = uiRoleToApiRole(uiRole);

    if (prefix === "manager") payload.territory = document.getElementById("managerTerritory").value;
    else if (prefix === "mr") {
      payload.territory = document.getElementById("mrTerritory").value;
      payload.assignedManager = document.getElementById("mrAssignedManager").value;
    } else if (prefix === "doctor") {
      payload.territory = `${document.getElementById("doctorSpeciality").value}|${document.getElementById("doctorCity").value}|${document.getElementById("doctorAssignedMr").value}|${document.getElementById("doctorType").value}`;
    }

    try {
      saveUserBtn.disabled = true;
      saveUserBtn.textContent = "Saving...";

      if (editingUserId) {
        await apiRequest(`${USERS_API_BASE}/${editingUserId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiRequest(USERS_API_BASE, { method: "POST", body: JSON.stringify(payload) });
      }

      addUserModal.hide();
      fetchUsers();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      saveUserBtn.disabled = false;
      saveUserBtn.textContent = "Save User";
    }
  });

  // --- UI Interactivity ---
  if (roleFilterButtons) {
    roleFilterButtons.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", function () {
        roleFilterButtons.querySelectorAll("button").forEach(b => b.classList.replace("btn-dark", "btn-outline-dark"));
        this.classList.replace("btn-outline-dark", "btn-dark");
        activeFilterRole = this.dataset.roleFilter;
        applyFilters();
      });
    });
  }

  searchInput.addEventListener("input", applyFilters);

  // Role buttons switching forms
  const buttons = document.querySelectorAll("#adminBtn, #managerBtn, #doctorBtn, #mrBtn");
  const forms = document.querySelectorAll(".user-form");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      forms.forEach(f => f.style.display = "none");
      document.getElementById(btn.id.replace("Btn", "Form")).style.display = "block";
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Initial Load
  fetchUsers();
});
