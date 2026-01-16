document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const USERS_API_BASE = `${API_BASE}/api/users`;
  const STORAGE_KEY = "kavyaPharmUsers";
  let usersApiMode = true;

  function getAuthHeader() {
    const token = localStorage.getItem("kavya_auth_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function apiJson(url, options) {
    const res = await fetch(
      url,
      Object.assign(
        {
          headers: Object.assign(
            { "Content-Type": "application/json" },
            getAuthHeader()
          ),
        },
        options || {}
      )
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  }

  function isNumericId(id) {
    return /^[0-9]+$/.test(String(id));
  }

  function apiRoleToUiRole(role) {
    const r = String(role || "").toUpperCase();
    if (r === "ADMIN") return "Admin";
    if (r === "HR") return "HR";
    if (r === "MANAGER") return "Area Manager";
    if (r === "MR") return "Medical Rep";
    if (r === "DOCTOR") return "Doctor";
    if (r === "SUPERADMIN") return "SuperAdmin";
    return String(role || "");
  }

  function uiRoleToApiRole(role) {
    const r = String(role || "").toLowerCase();
    if (r === "admin") return "ADMIN";
    if (r === "hr") return "HR";
    if (r === "area manager") return "MANAGER";
    if (r === "medical rep") return "MR";
    if (r === "doctor") return "DOCTOR";
    if (r === "superadmin") return "SUPERADMIN";
    return "MR";
  }

  function apiStatusToUiStatus(status) {
    const s = String(status || "").toUpperCase();
    return s === "INACTIVE" ? "Inactive" : "Active";
  }

  function uiStatusToApiStatus(status) {
    return String(status || "").toLowerCase() === "inactive"
      ? "INACTIVE"
      : "ACTIVE";
  }

  function normalizeUserFromApi(u) {
    return {
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: apiRoleToUiRole(u.role),
      territory: u.territory || "—",
      status: apiStatusToUiStatus(u.status),
      lastLogin: u.lastLogin ? String(u.lastLogin) : "—",
      phone: u.phone || "",
      assignedManager: u.assignedManager || undefined,
    };
  }

  async function refreshUsersFromApiOrFallback() {
    try {
      const data = await apiJson(USERS_API_BASE);
      if (Array.isArray(data)) {
        const apiUsers = data.map(normalizeUserFromApi);
        const localExisting = loadUsers();
        const localOnly = localExisting.filter((u) => !isNumericId(u.id));
        allUsers = apiUsers.concat(localOnly);
        saveUsers(allUsers);
        usersApiMode = true;
        return;
      }
      usersApiMode = false;
    } catch (e) {
      console.warn("Users API unavailable, using localStorage.", e);
      usersApiMode = false;
    }
  }

  async function createUserApi(payload) {
    return await apiJson(USERS_API_BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function updateUserApi(id, payload) {
    return await apiJson(`${USERS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async function deleteUserApi(id) {
    return await apiJson(`${USERS_API_BASE}/${id}`, { method: "DELETE" });
  }

  // --- Pagination Constants ---
  const ROWS_PER_PAGE = 10;
  let currentPage = 1;
  let activeFilterRole = "All"; // Tracks the currently selected role filter

  // DOM Elements
  const buttons = document.querySelectorAll(
    "#adminBtn, #managerBtn, #doctorBtn, #mrBtn"
  );
  const forms = document.querySelectorAll(".user-form");
  const saveUserBtn = document.getElementById("saveUserBtn");
  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("userSearchInput");
  const statusRows = document.querySelectorAll(".status-row");
  const paginationNav = document.querySelector(".pagination");
  const viewUserDetailsBody = document.getElementById("viewUserDetailsBody");
  const roleFilterButtons = document.getElementById("roleFilterButtons");
  const userTableHead = document
    .getElementById("userTable")
    .querySelector("thead tr");
  const viewUserModalLabel = document.getElementById("viewUserModalLabel");

  // Global variable to hold the full user list
  let allUsers = loadUsers();
  // Hidden input to track the ID of the user being edited
  let editingUserId = null;

  // ==========================================================
  //                         DATA FUNCTIONS 💾
  // ==========================================================

  /**
   * Generates a unique Alphanumeric ID that starts with an alphabet (A-Z)
   * followed by 1 to 2 digits (0-9). (e.g., A1, Z99, B5)
   * @returns {string} A unique 2- or 3-character ID.
   */
  function generateUniqueId() {
    const alphaChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numChars = "0123456789";
    let newId = "";
    let isUnique = false;

    // Loop until a unique ID is found
    while (!isUnique) {
      newId = "";

      // 1. Generate the first character (Must be Alphabet)
      newId += alphaChars.charAt(Math.floor(Math.random() * alphaChars.length));

      // 2. Determine length: 1 or 2 subsequent numbers
      const numLength = Math.floor(Math.random() * 2) + 1; // 1 or 2

      // 3. Generate the numbers
      for (let i = 0; i < numLength; i++) {
        newId += numChars.charAt(Math.floor(Math.random() * numChars.length));
      }

      // Ensure the generated ID is unique (case-sensitive here)
      if (!allUsers.some((user) => user.id === newId)) {
        isUnique = true;
      }
    }
    return newId;
  }

  function loadUsers() {
    const storedUsers = localStorage.getItem(STORAGE_KEY);

    // Define initial static data (IDs conform to the new format: Alpha + 1 or 2 digits)
    const staticUsers = [
      // Existing data from the table in HTML
      {
        id: "R15",
        name: "Mr. Rajesh Kumar",
        email: "rajesh.k@kavyapharm.com",
        role: "Admin",
        territory: "Head Office",
        status: "Active",
        lastLogin: "2025-10-29",
        phone: "9000000001",
      },
      {
        id: "T9",
        name: "Rahul Mehta",
        email: "rahul.m@sales.com",
        role: "Medical Rep",
        territory: "Mumbai-North",
        status: "Active",
        lastLogin: "2025-10-28",
        phone: "9000000002",
        assignedManager: "Pooja Sharma",
      },
      {
        id: "P88",
        name: "Pooja Sharma",
        email: "pooja.s@sales.com",
        role: "Area Manager",
        territory: "Delhi-NCR",
        status: "Active",
        lastLogin: "2025-10-29",
        phone: "9000000003",
      },
      {
        id: "H21",
        name: "Anita Verma",
        email: "anita.v@kavyapharm.com",
        role: "HR",
        territory: "Head Office",
        status: "Inactive",
        lastLogin: "2025-10-15",
        phone: "9000000004",
      },
      // Example Doctor
      {
        id: "D4",
        name: "Dr. Sameer Patel",
        email: "sameer.p@doc.com",
        role: "Doctor",
        territory: "Cardiology|Ahmedabad|Rahul Mehta|Consultant",
        status: "Active",
        lastLogin: "2025-10-30",
        phone: "9000000005",
      },
      // Added more users to test pagination/filtering
      {
        id: "A1",
        name: "Alpha Admin",
        email: "a1@mail.com",
        role: "Admin",
        territory: "East Zone HQ",
        status: "Active",
        lastLogin: "2025-11-01",
        phone: "9000000006",
      },
      {
        id: "M7",
        name: "Mona Manager",
        email: "m7@mail.com",
        role: "Area Manager",
        territory: "West Territory",
        status: "Active",
        lastLogin: "2025-11-01",
        phone: "9000000007",
      },
      {
        id: "B55",
        name: "Bharat MR",
        email: "b55@mail.com",
        role: "Medical Rep",
        territory: "Chennai",
        assignedManager: "Pooja Sharma",
        status: "Active",
        lastLogin: "2025-11-01",
        phone: "9000000008",
      },
      {
        id: "C99",
        name: "Chitra Doctor",
        email: "c99@mail.com",
        role: "Doctor",
        territory: "General|Bangalore|Bharat MR|Resident",
        status: "Inactive",
        lastLogin: "2025-11-01",
        phone: "9000000009",
      },
      {
        id: "G33",
        name: "Gita HR",
        email: "g33@mail.com",
        role: "HR",
        territory: "Head Office",
        status: "Active",
        lastLogin: "2025-11-01",
        phone: "9000000010",
      },
    ];

    if (storedUsers) {
      let parsedUsers = JSON.parse(storedUsers);
      return parsedUsers;
    }

    // If no stored data, initialize storage with static data
    saveUsers(staticUsers);
    return staticUsers;
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Populates the dynamic dropdowns (Assigned MR, Assigned Manager)
   * based on the current user list.
   */
  function populateDynamicDropdowns() {
    const mrSelect = document.getElementById("doctorAssignedMr");
    const managerSelect = document.getElementById("mrAssignedManager");

    // Clear previous options (keeping the default "Select..." option)
    mrSelect.innerHTML = '<option value="">Select MR</option>';
    managerSelect.innerHTML = '<option value="">Select Manager</option>';

    const medicalReps = allUsers.filter((u) => u.role === "Medical Rep");
    const managers = allUsers.filter((u) => u.role === "Area Manager");

    medicalReps.forEach((mr) => {
      const option = document.createElement("option");
      option.value = mr.name;
      option.textContent = `${mr.name} (${mr.territory})`;
      mrSelect.appendChild(option);
    });

    managers.forEach((manager) => {
      const option = document.createElement("option");
      option.value = manager.name;
      option.textContent = `${manager.name} (${manager.territory})`;
      managerSelect.appendChild(option);
    });
  }

  // ==========================================================
  //             RENDERING & PAGINATION 🔄
  // ==========================================================

  function getFilteredUsers() {
    let filteredData = allUsers;
    const searchFilter = searchInput.value.toLowerCase().trim();

    // 1. Filter by Role (if not "All")
    if (activeFilterRole !== "All") {
      const rolesToFilter = activeFilterRole.split(",");
      filteredData = filteredData.filter((user) =>
        rolesToFilter.includes(user.role)
      );
    }

    // 2. Filter by Search Input
    if (searchFilter) {
      filteredData = filteredData.filter((user) => {
        const text = Object.values(user)
          .map((val) => String(val).toLowerCase())
          .join(" ");
        return text.includes(searchFilter);
      });
    }

    return filteredData;
  }

  // Function to dynamically update table headers based on the requirement
  function updateTableHeaders() {
    // Find existing header cells
    const existingHeaders = Array.from(userTableHead.querySelectorAll("th"));
    const newHeaders = [
      "ID",
      "Name",
      "Email",
      "Role",
      "Territory",
      "Status",
      "Actions",
    ];

    // Remove existing headers
    userTableHead.innerHTML = "";

    // Append new headers
    newHeaders.forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      userTableHead.appendChild(th);
    });
  }

  function renderUsers() {
    // Ensure headers are correct before rendering rows
    updateTableHeaders();

    const data = getFilteredUsers();
    userTableBody.innerHTML = ""; // Clear existing table rows

    const tableColumnSpan = 7; // ID, Name, Email, Role, Territory, Status, Actions

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedUsers = data.slice(start, end);

    if (paginatedUsers.length === 0 && currentPage > 1) {
      currentPage--;
      renderUsers();
      return;
    }
    if (paginatedUsers.length === 0 && data.length > 0) {
      userTableBody.innerHTML = `<tr><td colspan="${tableColumnSpan}" class="text-center text-muted">No results found on this page.</td></tr>`;
    } else if (data.length === 0) {
      userTableBody.innerHTML = `<tr><td colspan="${tableColumnSpan}" class="text-center text-muted">No users match the current filter and search criteria.</td></tr>`;
    }

    paginatedUsers.forEach((user) => {
      const newRow = document.createElement("tr");
      newRow.setAttribute("data-user-id", String(user.id));

      let roleDisplay;
      let territoryDisplay = user.territory || "—";

      if (
        user.role === "Doctor" &&
        user.territory &&
        user.territory.includes("|")
      ) {
        // Doctor: Speciality|City|AssignedMR|DoctorType
        const parts = user.territory.split("|");
        const city = parts[1] || "—";
        roleDisplay = `<strong>${user.role}</strong>`;
        territoryDisplay = city;
      } else if (user.role === "Medical Rep") {
        // Only show the territory in the main table for MR (Assigned Manager moved to modal)
        territoryDisplay = user.territory;
        roleDisplay = user.role;
      } else if (
        user.role === "Admin" ||
        user.role === "Area Manager" ||
        user.role === "HR"
      ) {
        roleDisplay = `<strong>${user.role}</strong>`;
      } else {
        roleDisplay = user.role;
      }

      const statusClass =
        user.status === "Active" ? "bg-success" : "bg-warning";

      newRow.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${roleDisplay}</td>
                <td>${territoryDisplay}</td>
                <td><span class="badge ${statusClass}">${user.status}</span></td>
                <td class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-success view-btn" data-user-id="${user.id}" data-bs-toggle="modal" data-bs-target="#viewUserModal">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info edit-btn" data-user-id="${user.id}" data-bs-toggle="modal" data-bs-target="#addUserModal">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-user-id="${user.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
      userTableBody.appendChild(newRow);
    });

    attachActionListeners();
    renderPagination(data.length);
  }

  function renderPagination(totalUsers) {
    if (!paginationNav) return;
    const pageCount = Math.ceil(totalUsers / ROWS_PER_PAGE);
    let paginationHtml = "";

    paginationHtml += `<li class="page-item ${currentPage === 1 ? "disabled" : ""
      }"><a class="page-link" href="#" data-page="${currentPage - 1
      }">Previous</a></li>`;

    for (let i = 1; i <= pageCount; i++) {
      paginationHtml += `<li class="page-item ${i === currentPage ? "active" : ""
        }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    paginationHtml += `<li class="page-item ${currentPage === pageCount ? "disabled" : ""
      }"><a class="page-link" href="#" data-page="${currentPage + 1
      }">Next</a></li>`;

    paginationNav.innerHTML = paginationHtml;
    attachPaginationListeners(totalUsers);
  }

  function attachPaginationListeners(totalUsers) {
    const pageCount = Math.ceil(totalUsers / ROWS_PER_PAGE);
    paginationNav.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const newPage = parseInt(this.getAttribute("data-page"));
        if (newPage > 0 && newPage <= pageCount) {
          currentPage = newPage;
          renderUsers(); // Re-render based on current search/filter state
        }
      });
    });
  }

  function attachActionListeners() {
    document.querySelectorAll(".delete-btn").forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener("click", function () {
        const userId = String(this.getAttribute("data-user-id"));
        deleteUser(userId);
      });
    });

    document.querySelectorAll(".edit-btn").forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener("click", function () {
        const userId = String(this.getAttribute("data-user-id"));
        editingUserId = userId;
        prefillEditForm(userId);
      });
    });

    // View Button Listener
    document.querySelectorAll(".view-btn").forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener("click", function () {
        const userId = String(this.getAttribute("data-user-id"));
        showUserDetails(userId);
      });
    });
  }

  function deleteUser(id) {
    if (confirm(`Are you sure you want to delete user ID ${id}?`)) {
      (async function () {
        if (usersApiMode && isNumericId(id)) {
          try {
            await deleteUserApi(id);
          } catch (e) {
            console.warn("User delete API failed. Falling back to localStorage.", e);
            usersApiMode = false;
          }
        }

        let users = allUsers;
        const initialLength = users.length;
        users = users.filter((user) => String(user.id) !== String(id));

        if (users.length < initialLength) {
          allUsers = users;
          saveUsers(allUsers);
          renderUsers();
          alert(`User ID ${id} deleted successfully.`);
        }
      })();
    }
  }

  // Display detailed user information - FINAL PROFESSIONAL UI
  function showUserDetails(id) {
    const user = allUsers.find((u) => String(u.id) === String(id));
    if (!user) {
      viewUserDetailsBody.innerHTML = `<p class="text-danger">User ID ${id} not found.</p>`;
      return;
    }

    // 1. Set the Modal Title to the Role + "Details"
    viewUserModalLabel.textContent = `${user.role} Details`;

    const statusClass = user.status === "Active" ? "bg-success" : "bg-warning";

    // Helper function to create a two-column item (for "1 row, 2 fields" style)
    const createTwoColumnItem = (
      label1,
      value1,
      label2,
      value2,
      isLight = false
    ) => `
            <div class="row g-0 align-items-center py-2 border-bottom ${isLight ? "bg-light" : ""
      }">
                <div class="col-6">
                    <span class="fw-bold text-dark me-2">${label1}:</span>
                    <span>${value1}</span>
                </div>
                <div class="col-6">
                    <span class="fw-bold text-dark me-2">${label2}:</span>
                    <span>${value2}</span>
                </div>
            </div>
        `;

    let detailsHtml = `
            <div class="container-fluid px-0">
                
                ${createTwoColumnItem("ID", user.id, "Name", user.name, true)}
                
                <div class="row g-0 align-items-center py-2 border-bottom">
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Role:</span>
                        <span class="text-primary">${user.role}</span>
                    </div>
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Status:</span>
                        <span class="badge ${statusClass} rounded-pill">${user.status
      }</span>
                    </div>
                </div>

                ${user.role === "Doctor"
        ? `
                    <div class="row g-0 align-items-center py-2 border-bottom bg-light">
                        <div class="col-12">
                            <span class="fw-bold text-dark me-2">Doctor Type:</span>
                            <span>${user.territory.split("|")[3] || "—"}</span>
                        </div>
                    </div>
                `
        : ""
      }
                
                <div class="row g-0 align-items-center py-2 border-bottom ${user.role !== "Doctor" ? "bg-light" : ""
      }">
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Email:</span>
                        <span>${user.email}</span>
                    </div>
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Phone:</span>
                        <span>${user.phone || "—"}</span>
                    </div>
                </div>
                
                <div class="row g-0 align-items-center py-2 border-bottom ${user.role === "Doctor"
        ? ""
        : user.role === "Medical Rep"
          ? "bg-light"
          : ""
      }">
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Last Login:</span>
                        <span>${user.lastLogin || "—"}</span>
                    </div>
                    <div class="col-6">
        `;

    // --- Role-Specific Territory/Department Details ---

    if (
      user.role === "Doctor" &&
      user.territory &&
      user.territory.includes("|")
    ) {
      // Doctor: Speciality|City|AssignedMR|DoctorType
      const parts = user.territory.split("|");

      // Finish the Last Login row (Primary Territory/City)
      detailsHtml += `
                        <span class="fw-bold text-dark me-2">City:</span>
                        <span>${parts[1] || "—"}</span>
                    </div>
                </div>

                <div class="row g-0 align-items-center py-2 border-bottom bg-light">
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Speciality:</span>
                        <span>${parts[0] || "—"}</span>
                    </div>
                    <div class="col-6">
                        <span class="fw-bold text-dark me-2">Assigned MR:</span>
                        <span>${parts[2] || "—"}</span>
                    </div>
                </div>
            `;
    } else if (user.role === "Medical Rep") {
      // Finish the Last Login row (Primary Territory)
      detailsHtml += `
                        <span class="fw-bold text-dark me-2">Territory:</span>
                        <span>${user.territory || "—"}</span>
                    </div>
                </div>
                
                <div class="row g-0 align-items-center py-2 border-bottom">
                    <div class="col-12">
                        <span class="fw-bold text-dark me-2">Assigned Manager:</span>
                        <span>${user.assignedManager || "—"}</span>
                    </div>
                </div>
            `;
    } else {
      // Admin, HR, Area Manager (Territory/Dept)
      detailsHtml += `
                        <span class="fw-bold text-dark me-2">Territory/Dept:</span>
                        <span>${user.territory || "—"}</span>
                    </div>
                </div>
            `;
    }

    detailsHtml += `</div>`; // Close container-fluid
    viewUserDetailsBody.innerHTML = detailsHtml;

    // Ensure the modal title background color looks professional (using primary/default style)
    document
      .querySelector("#viewUserModal .modal-header")
      .classList.remove("bg-success");
    document
      .querySelector("#viewUserModal .modal-header")
      .classList.add("bg-primary");
  }
  // ... rest of the JS code ...

  function prefillEditForm(id) {
    const users = allUsers;
    // Find user using string comparison
    const user = users.find((u) => String(u.id) === String(id));
    if (!user) return;

    // Ensure dropdowns are populated before filling
    populateDynamicDropdowns();

    if (statusRows.length) {
      statusRows.forEach((row) => (row.style.display = "flex"));
    }

    let formId, btnId;
    if (user.role === "Admin" || user.role === "HR") {
      formId = "adminForm";
      btnId = "adminBtn";
    } else if (user.role === "Area Manager") {
      formId = "managerForm";
      btnId = "managerBtn";
    } else if (user.role === "Doctor") {
      formId = "doctorForm";
      btnId = "doctorBtn";
    } else {
      formId = "mrForm";
      btnId = "mrBtn";
    }

    forms.forEach((form) => (form.style.display = "none"));
    buttons.forEach((b) =>
      b.classList.remove(
        "active",
        "btn-primary",
        "btn-success",
        "btn-info",
        "btn-warning"
      )
    );

    const targetForm = document.getElementById(formId);
    if (targetForm) targetForm.style.display = "block";

    const targetBtn = document.getElementById(btnId);
    if (targetBtn) {
      if (btnId === "adminBtn")
        targetBtn.classList.add("active", "btn-primary");
      else if (btnId === "managerBtn")
        targetBtn.classList.add("active", "btn-success");
      else if (btnId === "doctorBtn")
        targetBtn.classList.add("active", "btn-info");
      else if (btnId === "mrBtn")
        targetBtn.classList.add("active", "btn-warning");
    }

    document.getElementById(
      "addUserModalLabel"
    ).textContent = `Edit User (ID: ${user.id})`;
    saveUserBtn.textContent = "Update User";

    const activeForm = targetForm;

    const nameInput = activeForm.querySelector('input[id$="Name"]');
    const emailInput = activeForm.querySelector('input[type="email"]');
    const phoneInput = activeForm.querySelector('input[type="tel"]');

    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;
    if (phoneInput) phoneInput.value = user.phone || "";

    if (emailInput) {
      if (isNumericId(user.id)) {
        emailInput.setAttribute("disabled", true);
      } else {
        emailInput.removeAttribute("disabled");
      }
    }

    const statusSelect = activeForm.querySelector(`select[id$="Status"]`);
    if (statusSelect) {
      statusSelect.value = user.status;
    }

    // --- UPDATED LOGIC FOR NEW FIELDS ---

    if (formId === "managerForm") {
      // Manager Territory field
      const managerTerritory = activeForm.querySelector("#managerTerritory");
      if (managerTerritory) managerTerritory.value = user.territory || "";
    } else if (formId === "doctorForm") {
      // Data format: Speciality|City|AssignedMR|DoctorType
      const parts =
        user.territory && user.territory.includes("|")
          ? user.territory.split("|")
          : [user.territory || "—", "—", "—", "—"];
      const spec = activeForm.querySelector("#doctorSpeciality");
      const city = activeForm.querySelector("#doctorCity");
      const assignedMr = activeForm.querySelector("#doctorAssignedMr");
      const doctorType = activeForm.querySelector("#doctorType");

      if (spec) spec.value = parts[0] || "";
      if (city) city.value = parts[1] || "";
      if (assignedMr) assignedMr.value = parts[2] || "";
      if (doctorType) doctorType.value = parts[3] || "";
    } else if (formId === "mrForm") {
      const mrTerr = activeForm.querySelector("#mrTerritory");
      if (mrTerr) mrTerr.value = user.territory || "";
      // New field: Assigned Manager
      const assignedManager = activeForm.querySelector("#mrAssignedManager");
      if (assignedManager) assignedManager.value = user.assignedManager || "";
    }

    // Always ensure password inputs are handled correctly during edit (remove required attribute)
    activeForm.querySelectorAll('input[type="password"]').forEach((input) => {
      input.removeAttribute("required");
      input.value = "";
    });
  }

  const addUserModalEl = document.getElementById("addUserModal");
  if (addUserModalEl) {
    // Populate dropdowns every time the modal is shown
    addUserModalEl.addEventListener("show.bs.modal", populateDynamicDropdowns);

    addUserModalEl.addEventListener("hidden.bs.modal", function () {
      editingUserId = null;
      document.getElementById("addUserModalLabel").textContent =
        "Create New User";
      saveUserBtn.textContent = "Save User";
      forms.forEach((form) => form.querySelector("form").reset());
      forms.forEach((form) => (form.style.display = "none"));
      if (statusRows.length) {
        statusRows.forEach((row) => (row.style.display = "none"));
      }
      buttons.forEach((b) =>
        b.classList.remove(
          "active",
          "btn-primary",
          "btn-success",
          "btn-info",
          "btn-warning"
        )
      );
    });
  }

  // Filter button click handler
  if (roleFilterButtons) {
    roleFilterButtons.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", function () {
        // Update active filter state
        roleFilterButtons.querySelectorAll("button").forEach((btn) => {
          btn.classList.remove("btn-dark", "active");
          btn.classList.add("btn-outline-dark");
        });
        this.classList.remove("btn-outline-dark");
        this.classList.add("btn-dark", "active");

        // Set new filter role
        activeFilterRole = this.getAttribute("data-role-filter");

        // Reset pagination and search input when changing role filters
        currentPage = 1;
        searchInput.value = "";

        renderUsers();
      });
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      editingUserId = null;
      document.getElementById("addUserModalLabel").textContent =
        "Create New User";
      saveUserBtn.textContent = "Save User";
      if (statusRows.length) {
        statusRows.forEach((row) => (row.style.display = "none"));
      }
      forms.forEach((form) => (form.style.display = "none"));
      buttons.forEach((b) =>
        b.classList.remove(
          "active",
          "btn-primary",
          "btn-success",
          "btn-info",
          "btn-warning"
        )
      );
      const formId = btn.id.replace("Btn", "Form");
      const targetForm = document.getElementById(formId);
      if (targetForm) targetForm.style.display = "block";

      if (btn.id === "adminBtn") btn.classList.add("active", "btn-primary");
      else if (btn.id === "managerBtn")
        btn.classList.add("active", "btn-success");
      else if (btn.id === "doctorBtn") btn.classList.add("active", "btn-info");
      else if (btn.id === "mrBtn") btn.classList.add("active", "btn-warning");
    });
  });

  // ==========================================================
  //          SAVE/UPDATE HANDLER (with validations) ✍️
  // ==========================================================
  if (saveUserBtn) {
    saveUserBtn.addEventListener("click", function () {
      const activeForm = Array.from(forms).find(
        (f) => f.style.display === "block"
      );

      if (!activeForm) {
        alert("Please select a user role before saving.");
        return;
      }

      const form = activeForm.querySelector("form");
      const fullName = form.querySelector('input[id$="Name"]');
      const email = form.querySelector('input[type="email"]');
      const password = form.querySelector('input[type="password"]');
      const phone = form.querySelector('input[type="tel"]');

      // --- Determine Role for conditional validation ---
      let role = "Unknown";
      if (activeForm.id === "adminForm") role = "Admin";
      else if (activeForm.id === "managerForm") role = "Area Manager";
      else if (activeForm.id === "doctorForm") role = "Doctor";
      else if (activeForm.id === "mrForm") role = "Medical Rep";

      // --- VALIDATION CHECKS ---
      const nameRegex = /^[A-Za-z ]+$/;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

      if (!fullName.value.trim() || !nameRegex.test(fullName.value.trim())) {
        alert("❌ Full name can contain only letters and spaces (no numbers).");
        fullName.focus();
        return;
      }

      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        alert("❌ Please enter a valid email address.");
        email.focus();
        return;
      }

      // *** PASSWORD VALIDATION ***
      if (!editingUserId && usersApiMode) {
        if (
          !password ||
          !password.value.trim() ||
          !passwordRegex.test(password.value.trim())
        ) {
          alert(
            "❌ Password must be at least 8 characters, include one letter, one number, and one special character."
          );
          if (password) password.focus();
          return;
        }
      }

      if (!editingUserId && !usersApiMode) {
        if (role !== "Doctor" && role !== "Area Manager") {
          if (
            !password ||
            !password.value.trim() ||
            !passwordRegex.test(password.value.trim())
          ) {
            alert(
              "❌ Password must be at least 8 characters, include one letter, one number, and one special character."
            );
            if (password) password.focus();
            return;
          }
        }
      }
      // *** END PASSWORD VALIDATION ***

      if (!phone.value.trim() || !/^[0-9]{10}$/.test(phone.value.trim())) {
        alert("❌ Phone number must be exactly 10 digits.");
        phone.focus();
        return;
      }

      // --- COLLECT DATA ---
      let territoryValue = "—";
      let assignedManagerValue = null;
      let statusValue;

      if (editingUserId) {
        // If editing, try to find the status select element (it's hidden during creation)
        const statusSelect = form.querySelector(`select[id$="Status"]`);
        statusValue = statusSelect ? statusSelect.value : "Active";
      } else {
        statusValue = "Active";
      }

      if (activeForm.id === "managerForm") {
        // Manager Territory field
        territoryValue =
          form.querySelector("#managerTerritory").value.trim() || "—";
      } else if (activeForm.id === "doctorForm") {
        // Data format: Speciality|City|AssignedMR|DoctorType
        const speciality = form.querySelector("#doctorSpeciality").value.trim();
        const city = form.querySelector("#doctorCity").value.trim();
        const assignedMr = form.querySelector("#doctorAssignedMr").value.trim();
        const doctorType = form.querySelector("#doctorType").value.trim();

        territoryValue = `${speciality || "—"}|${city || "—"}|${assignedMr || "—"
          }|${doctorType || "—"}`;
      } else if (activeForm.id === "mrForm") {
        territoryValue = form.querySelector("#mrTerritory").value.trim() || "—";
        assignedManagerValue =
          form.querySelector("#mrAssignedManager").value.trim() || null;
      } else if (activeForm.id === "adminForm") {
        territoryValue = "Head Office";
      }

      let alertMsg = "";
      let userObject;

      if (editingUserId) {
        // Use String() for finding the user
        const userIndex = allUsers.findIndex(
          (u) => String(u.id) === String(editingUserId)
        );
        if (userIndex !== -1) {
          userObject = allUsers[userIndex];
          userObject.name = fullName.value.trim();
          if (!isNumericId(userObject.id)) {
            userObject.email = email.value.trim();
          }
          userObject.role = role;
          userObject.territory = territoryValue;
          userObject.status = statusValue;
          userObject.phone = phone.value.trim();
          // Update last login date on edit
          userObject.lastLogin = new Date().toISOString().split("T")[0];

          if (role === "Medical Rep") {
            userObject.assignedManager = assignedManagerValue;
          } else {
            delete userObject.assignedManager;
          }
        }
        alertMsg = `✅ User ID ${editingUserId} updated successfully!`;

        (async function () {
          if (usersApiMode && isNumericId(editingUserId)) {
            try {
              await updateUserApi(editingUserId, {
                name: userObject.name,
                role: uiRoleToApiRole(role),
                phone: userObject.phone,
                territory: userObject.territory,
                status: uiStatusToApiStatus(statusValue),
                assignedManager:
                  role === "Medical Rep" ? assignedManagerValue : null,
                password: password && password.value.trim() ? password.value.trim() : null,
              });
            } catch (e) {
              console.warn("User update API failed. Falling back to localStorage.", e);
              usersApiMode = false;
            }
          }

          saveUsers(allUsers);
          renderUsers();
        })();
      } else {
        userObject = {
          // *** Call generateUniqueId for the new format ***
          id: generateUniqueId(),
          name: fullName.value.trim(),
          email: email.value.trim(),
          role: role,
          territory: territoryValue,
          status: "Active",
          lastLogin: new Date().toISOString().split("T")[0],
          phone: phone.value.trim(),
        };

        if (role === "Medical Rep") {
          userObject.assignedManager = assignedManagerValue;
        }

        (async function () {
          if (usersApiMode) {
            try {
              const created = await createUserApi({
                name: userObject.name,
                email: userObject.email,
                password: password ? password.value.trim() : "",
                role: uiRoleToApiRole(role),
                phone: userObject.phone,
                territory: userObject.territory,
                status: uiStatusToApiStatus("Active"),
                assignedManager:
                  role === "Medical Rep" ? assignedManagerValue : null,
              });
              if (created) {
                userObject = normalizeUserFromApi(created);
              }
            } catch (e) {
              console.warn("User create API failed. Falling back to localStorage.", e);
              usersApiMode = false;
            }
          }

          allUsers.push(userObject);
          alertMsg = `✅ ${role} User "${userObject.name}" added successfully (ID: ${userObject.id})!`;
          saveUsers(allUsers);

          const filteredData = getFilteredUsers();
          const pageCount = Math.ceil(filteredData.length / ROWS_PER_PAGE);
          currentPage = pageCount;
          renderUsers();
        })();
      }

      alert(alertMsg);
      const modalElement = document.getElementById("addUserModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    });
  }

  function filterUsers(users, filter) {
    // This function is still used by the search input change event
    return users.filter((user) => {
      const text = Object.values(user)
        .map((val) => String(val).toLowerCase())
        .join(" ");
      return text.includes(filter);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      // When searching, reset to the first page, but maintain the current role filter
      currentPage = 1;
      renderUsers();
    });
  }

  // Call renderUsers() initially to display the table and update headers
  (async function () {
    await refreshUsersFromApiOrFallback();
    renderUsers();
  })();
});

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
            </div>
        `;

    document.body.appendChild(popup);

    const btnRect = notificationBtn.getBoundingClientRect();
    const popupEl = popup.querySelector("div");
    popupEl.style.left = btnRect.left - 200 + "px";
    popupEl.style.top = btnRect.bottom + 5 + "px";

    document.addEventListener("click", function closePopup(e) {
      if (!notificationBtn.contains(e.target) && !popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener("click", closePopup);
      }
    });
  });
}
