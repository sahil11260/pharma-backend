// --- PERSISTENCE SETUP ---
const STORAGE_KEY = "kavyaPharmDoctorsData";
const API_BASE = "https://pharma-backend-hxf9.onrender.com";
const DOCTORS_API_BASE = `${API_BASE}/api/doctors`;
let doctorsApiMode = true;

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
  if (res.status === 204) {
    return null;
  }
  return await res.json();
}

// MR list (API-first). Will be loaded from /api/users (role=MR) or localStorage.
let mrData = [];

const USERS_API_BASE = `${API_BASE}/api/users`;

// start empty — will be populated from API or localStorage
let doctorsData = [];

// Load/save to localStorage
function loadData() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      doctorsData = JSON.parse(storedData);
      // Ensure legacy chemist entries are removed if present in localStorage
      doctorsData = doctorsData.filter((d) => (d.type || "doctor") !== "chemist");
    } catch (e) {
      console.error("Error parsing stored data:", e);
    }
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doctorsData));
}

async function refreshDoctorsFromApiOrFallback() {
  try {
    const data = await apiJson(DOCTORS_API_BASE);
    if (Array.isArray(data)) {
      doctorsData = data.map((d) => ({
        id: Number(d.id),
        name: d.name,
        type: d.type,
        specialty: d.specialty,
        phone: d.phone,
        email: d.email,
        clinicName: d.clinicName,
        address: d.address,
        city: d.city,
        assignedMR: d.assignedMR,
        notes: d.notes,
        status: d.status
      }));
      saveData();
      doctorsApiMode = true;
      hideApiRetryBanner();
      return;
    }
    doctorsApiMode = false;
  } catch (e) {
    console.warn("Doctors API unavailable, using localStorage.", e);
    doctorsApiMode = false;
    showApiRetryBanner();
  }
}

async function refreshMrsFromApiOrFallback() {
  try {
    const users = await apiJson(USERS_API_BASE);
    if (Array.isArray(users)) {
      mrData = users.filter(u => u && String(u.role) === "MR").map(u => ({ id: Number(u.id), name: u.name }));
      localStorage.setItem("kavyaPharmMRs", JSON.stringify(mrData));
      doctorsApiMode = true;
      hideApiRetryBanner();
      return;
    }
    doctorsApiMode = false;
    showApiRetryBanner();
  } catch (e) {
    console.warn("Users API unavailable for MR list.", e);
    doctorsApiMode = false;
    showApiRetryBanner();
  }
}

function showApiRetryBanner() {
  if (document.getElementById("doctorsApiRetryBanner")) return;
  const banner = document.createElement("div");
  banner.id = "doctorsApiRetryBanner";
  banner.className = "alert alert-warning text-center";
  banner.style.margin = "10px 0";
  banner.innerHTML = '<strong>Doctors API unreachable.</strong> Some actions will use local data. ' +
    '<button id="doctorsApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
  const container = document.querySelector(".container") || document.body;
  container.insertBefore(banner, container.firstChild);
  document.getElementById("doctorsApiRetryBtn").addEventListener("click", async function () {
    hideApiRetryBanner();
    try {
      await refreshMrsFromApiOrFallback();
      populateMRDropdowns();
      await refreshDoctorsFromApiOrFallback();
      renderDoctorsTablePage(1);
    } catch (e) {
      showApiRetryBanner();
    }
  });
}

function hideApiRetryBanner() {
  const b = document.getElementById("doctorsApiRetryBanner");
  if (b && b.parentNode) b.parentNode.removeChild(b);
}

async function createDoctorApi(doctor) {
  const payload = {
    name: doctor.name,
    type: doctor.type || "doctor",
    specialty: doctor.specialty || "",
    phone: doctor.phone,
    email: doctor.email,
    clinicName: doctor.clinicName,
    address: doctor.address || "",
    city: doctor.city || "",
    assignedMR: doctor.assignedMR || "",
    notes: doctor.notes || "",
    status: doctor.status || "active"
  };
  return await apiJson(DOCTORS_API_BASE, { method: "POST", body: JSON.stringify(payload) });
}

async function updateDoctorApi(id, doctor) {
  const payload = {
    name: doctor.name,
    type: doctor.type || "doctor",
    specialty: doctor.specialty || "",
    phone: doctor.phone,
    email: doctor.email,
    clinicName: doctor.clinicName,
    address: doctor.address || "",
    city: doctor.city || "",
    assignedMR: doctor.assignedMR || "",
    notes: doctor.notes || "",
    status: doctor.status || "active"
  };
  return await apiJson(`${DOCTORS_API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

async function deleteDoctorApi(id) {
  await apiJson(`${DOCTORS_API_BASE}/${id}`, { method: "DELETE" });
}

// Pagination state
let currentPage = 1;
const rowsPerPage = 8; // change as needed

// Utility: returns filtered data based on search + filters
function getFilteredData() {
  const searchTerm = (document.getElementById("searchDoctor")?.value || "")
    .toLowerCase()
    .trim();
  const filterSpecialty = document.getElementById("filterSpecialty")?.value || "";

  let filtered = doctorsData.slice();

  if (searchTerm) {
    filtered = filtered.filter((d) => {
      return (
        (d.name || "").toLowerCase().includes(searchTerm) ||
        (d.clinicName || "").toLowerCase().includes(searchTerm) ||
        (d.assignedMR || "").toLowerCase().includes(searchTerm)
      );
    });
  }

  if (filterSpecialty) {
    filtered = filtered.filter((d) => d.specialty === filterSpecialty);
  }

  return filtered;
}

// Render table with pagination
function renderDoctorsTablePage(page = 1) {
  const doctorsList = document.getElementById("doctorsList");
  const paginationContainer = document.getElementById("paginationContainer");
  doctorsList.innerHTML = "";
  if (paginationContainer) paginationContainer.innerHTML = "";

  const filtered = getFilteredData();

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  currentPage = page;

  const startIdx = (page - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
  const pageItems = filtered.slice(startIdx, endIdx);

  pageItems.forEach((doctor) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><i class="bi ${doctor.type === "doctor" ? "bi-hospital" : "bi-shop"} me-2"></i>${doctor.name}</td>
      <td>${(doctor.type === "doctor" && doctor.specialty) ? (doctor.specialty.charAt(0).toUpperCase() + doctor.specialty.slice(1)) : "-"}</td>
      <td>${doctor.clinicName || "-"}</td>
      <td>${doctor.city || "-"}</td>
      <td>${doctor.assignedMR || "Not Assigned"}</td>
      <td>
        <button class="btn btn-outline-info btn-sm me-1" onclick="viewDoctorDetails(${doctor.id})"><i class="bi bi-eye"></i></button>
        <button class="btn btn-outline-primary btn-sm me-1" onclick="editDoctor(${doctor.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteDoctor(${doctor.id})"><i class="bi bi-trash"></i></button>
      </td>
    `;
    doctorsList.appendChild(row);
  });

  // Build pagination UI (if container exists)
  if (!paginationContainer) return;

  const createPageItem = (label, pageNum, active = false, disabled = false) => {
    const li = document.createElement("li");
    li.className = "page-item" + (active ? " active" : "") + (disabled ? " disabled" : "");
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (!disabled) renderDoctorsTablePage(pageNum);
    });
    li.appendChild(a);
    return li;
  };

  // Prev
  paginationContainer.appendChild(createPageItem("Prev", page - 1, false, page <= 1));

  // Show up to 7 page numbers (smart window)
  const maxButtons = 7;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    paginationContainer.appendChild(createPageItem(p.toString(), p, p === page, false));
  }

  // Next
  paginationContainer.appendChild(createPageItem("Next", page + 1, false, page >= totalPages));
}

// Populate MR dropdowns (only the Assign in modal)
function populateMRDropdowns() {
  const assignToMR = document.getElementById("assignToMR");

  // Clear existing options (in case of re-call)
  if (assignToMR) {
    assignToMR.innerHTML = '<option value="">Select MR</option>';
  }

  mrData.forEach((mr) => {
    const option1 = document.createElement("option");
    option1.value = mr.name;
    option1.textContent = mr.name;
    assignToMR.appendChild(option1);
  });
}

// Render notifications (kept same behavior)
function renderNotifications() {
  const notificationsList = document.getElementById("notificationsList");
  if (!notificationsList) return;

  const recentActivities = [
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
  const alertsData = [
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
  const allNotifications = [
    ...alertsData.map((alert) => ({ ...alert, type: "alert" })),
    ...recentActivities.map((activity) => ({ ...activity, type: "activity" })),
  ];

  notificationsList.innerHTML = allNotifications
    .slice(0, 10)
    .map(
      (notification) => `
    <div class="notification-item p-3 border-bottom">
      <div class="d-flex align-items-start">
        <div class="notification-icon ${notification.iconClass || "bg-primary"} text-white me-3">
          <i class="bi ${notification.icon}"></i>
        </div>
        <div class="flex-grow-1">
          <h6 class="mb-1">${notification.title}</h6>
          <p class="mb-1 text-muted small">${notification.description}</p>
          <small class="text-muted">${notification.time || "Just now"}</small>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// View details modal (ADDRESS & NOTES removed)
function viewDoctorDetails(doctorId) {
  const doctor = doctorsData.find((d) => d.id === doctorId);
  if (!doctor) return;

  const detailsHtml = `
      <div class="row small text-dark">
          <div class="col-12 mb-3"><h5 class="fw-bold text-dark">${doctor.name}</h5></div>

          <div class="col-6 mb-2"><strong class="text-dark">Specialty:</strong></div>
          <div class="col-6 mb-2 text-dark">${doctor.specialty ? (doctor.specialty.charAt(0).toUpperCase() + doctor.specialty.slice(1)) : "N/A"}</div>

          <div class="col-6 mb-2"><strong class="text-dark">Phone:</strong></div>
          <div class="col-6 mb-2 text-dark">${doctor.phone}</div>

          <div class="col-6 mb-2"><strong class="text-dark">Email:</strong></div>
          <div class="col-6 mb-2 text-dark">${doctor.email || "N/A"}</div>

          <div class="col-6 mb-2"><strong class="text-dark">Clinic/Hospital:</strong></div>
          <div class="col-6 mb-2 text-dark">${doctor.clinicName}</div>

          <div class="col-6 mb-2"><strong class="text-dark">City:</strong></div>
          <div class="col-6 mb-2 text-dark">${doctor.city || "N/A"}</div>

          <div class="col-6 mb-2"><strong class="text-dark">Assigned MR:</strong></div>
          <div class="col-6 mb-2 text-dark">${doctor.assignedMR || "Not Assigned"}</div>
      </div>
  `;

  document.getElementById("viewDoctorTitle").innerHTML = `<i class="bi bi-eye"></i> Details for ${doctor.name}`;
  document.getElementById("viewDoctorBody").innerHTML = detailsHtml;

  const viewModal = new bootstrap.Modal(document.getElementById("viewDoctorModal"));
  viewModal.show();
}

// Edit doctor
function editDoctor(doctorId) {
  const doctor = doctorsData.find((d) => d.id === doctorId);
  if (!doctor) return;

  const saveBtn = document.getElementById("saveDoctorBtn");
  const form = document.getElementById("addDoctorForm");
  const modalElement = document.getElementById("addDoctorModal");
  const modalTitle = modalElement.querySelector(".modal-title");

  // Remove Add handler for now
  if (saveBtn.currentAddHandler) {
    saveBtn.removeEventListener("click", saveBtn.currentAddHandler);
  }

  // Prefill form (only fields present in modal)
  document.getElementById("doctorName").value = doctor.name;
  const doctorTypeEl = document.getElementById("doctorType");
  if (doctorTypeEl) doctorTypeEl.value = doctor.type || "doctor";

  document.getElementById("doctorSpecialty").value = doctor.specialty || "";
  document.getElementById("doctorPhone").value = doctor.phone;
  document.getElementById("doctorEmail").value = doctor.email;
  document.getElementById("clinicName").value = doctor.clinicName;
  // NOTE: Address and Notes fields were removed from modal — do not attempt to set them
  document.getElementById("assignToMR").value = doctor.assignedMR || "";

  modalTitle.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Doctor';
  saveBtn.textContent = "Update Doctor";

  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  const handleUpdate = (e) => {
    e.preventDefault();
    if (form.checkValidity()) {
      doctor.name = document.getElementById("doctorName").value;
      const typeValue = (document.getElementById("doctorType")?.value) || "doctor";
      doctor.type = typeValue;
      doctor.specialty = document.getElementById("doctorSpecialty").value || "";
      doctor.phone = document.getElementById("doctorPhone").value;
      doctor.email = document.getElementById("doctorEmail").value;
      doctor.clinicName = document.getElementById("clinicName").value;
      // Do NOT overwrite address/notes (modal no longer has those fields)
      doctor.city = doctor.city || ""; // preserve existing city if present
      doctor.assignedMR = document.getElementById("assignToMR").value;
      // keep doctor.notes unchanged

      (async function () {
        if (doctorsApiMode) {
          try {
            await updateDoctorApi(doctor.id, doctor);
            await refreshDoctorsFromApiOrFallback();
          } catch (e) {
            console.warn("Doctor update API failed. Falling back to localStorage.", e);
            doctorsApiMode = false;
          }
        }

        saveData();
        renderDoctorsTablePage(currentPage);
        modal.hide();
      })();
    } else {
      form.reportValidity();
    }
  };

  // cleanup any previous update handler
  if (saveBtn.currentUpdateHandler) {
    saveBtn.removeEventListener("click", saveBtn.currentUpdateHandler);
  }
  saveBtn.currentUpdateHandler = handleUpdate;
  saveBtn.addEventListener("click", handleUpdate);
}

// DELETE doctor (newly added)
function deleteDoctor(doctorId) {
  const idx = doctorsData.findIndex((d) => d.id === doctorId);
  if (idx === -1) return; // not found

  if (!confirm("Are you sure you want to delete this doctor?")) return;

  (async function () {
    if (doctorsApiMode) {
      try {
        await deleteDoctorApi(doctorId);
        await refreshDoctorsFromApiOrFallback();
        renderDoctorsTablePage(currentPage);
        return;
      } catch (e) {
        console.warn("Doctor delete API failed. Falling back to localStorage.", e);
        doctorsApiMode = false;
      }
    }

    // remove
    doctorsData.splice(idx, 1);
    saveData();

    // adjust current page if necessary (if last page became empty)
    const filtered = getFilteredData();
    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    renderDoctorsTablePage(currentPage);
  })();
}

// Initialize DOM
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
  });

  const themeToggle = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // Populate MR dropdowns
  populateMRDropdowns();

  // Search
  const searchDoctor = document.getElementById("searchDoctor");
  if (searchDoctor) {
    searchDoctor.addEventListener("input", () => {
      currentPage = 1;
      renderDoctorsTablePage(1);
    });
  }

  // Filters
  const filterSpecialty = document.getElementById("filterSpecialty");
  if (filterSpecialty) filterSpecialty.addEventListener("change", () => { currentPage = 1; renderDoctorsTablePage(1); });

  // Add doctor functionality
  const saveDoctorBtn = document.getElementById("saveDoctorBtn");
  const addDoctorHandler = (e) => {
    // Only run add logic if in Add mode
    if (saveDoctorBtn.textContent.toLowerCase().includes("add")) {
      const form = document.getElementById("addDoctorForm");
      if (form.checkValidity()) {
        const nextId = doctorsData.length > 0 ? Math.max(...doctorsData.map((d) => d.id)) + 1 : 1;
        const typeValue = (document.getElementById("doctorType")?.value) || "doctor";
        const newDoctor = {
          id: nextId,
          name: document.getElementById("doctorName").value,
          type: typeValue, // dropdown value: doctor / other
          specialty: document.getElementById("doctorSpecialty").value || "",
          phone: document.getElementById("doctorPhone").value,
          email: document.getElementById("doctorEmail").value,
          clinicName: document.getElementById("clinicName").value,
          // Address & Notes removed from add modal — set to empty strings
          address: "",
          city: "",
          assignedMR: document.getElementById("assignToMR").value,
          notes: "",
          status: "active",
        };

        (async function () {
          if (doctorsApiMode) {
            try {
              await createDoctorApi(newDoctor);
              await refreshDoctorsFromApiOrFallback();
              currentPage = 1;
              renderDoctorsTablePage(currentPage);

              const modal = bootstrap.Modal.getInstance(document.getElementById("addDoctorModal"));
              if (modal) modal.hide();
              form.reset();
              return;
            } catch (e) {
              console.warn("Doctor create API failed. Falling back to localStorage.", e);
              doctorsApiMode = false;
            }
          }

          doctorsData.push(newDoctor);
          saveData();

          // re-render on first page (or current) — reset to page 1 to show new record
          currentPage = 1;
          renderDoctorsTablePage(currentPage);

          // Close modal and reset form
          const modal = bootstrap.Modal.getInstance(document.getElementById("addDoctorModal"));
          if (modal) modal.hide();
          form.reset();
        })();
      } else {
        form.reportValidity();
      }
    }
  };

  // Attach initial add listener
  saveDoctorBtn.currentAddHandler = addDoctorHandler;
  saveDoctorBtn.addEventListener("click", saveDoctorBtn.currentAddHandler);

  // Reset modal state when closed (ensure Add is restored)
  document.getElementById("addDoctorModal").addEventListener("hidden.bs.modal", function () {
    const form = document.getElementById("addDoctorForm");
    const modalTitle = document.querySelector("#addDoctorModal .modal-title");

    // Remove update listener if it exists
    if (saveDoctorBtn.currentUpdateHandler) {
      saveDoctorBtn.removeEventListener("click", saveDoctorBtn.currentUpdateHandler);
      saveDoctorBtn.currentUpdateHandler = null;
    }

    // Reset form + button text back to Add
    form.reset();
    saveDoctorBtn.textContent = "Add Doctor";

    modalTitle.innerHTML = '<i class="bi bi-plus-circle"></i> Add New Doctor';

    // Re-attach Add handler (remove and add to avoid duplicates)
    saveDoctorBtn.removeEventListener("click", saveDoctorBtn.currentAddHandler);
    saveDoctorBtn.addEventListener("click", saveDoctorBtn.currentAddHandler);
  });

  // Profile modal data
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const savedName = localStorage.getItem("signup_name") || "Admin User";
  const savedEmail = localStorage.getItem("signup_email") || "admin@kavyapharm.com";
  if (profileName) profileName.textContent = savedName;
  if (profileEmail) profileEmail.textContent = savedEmail;

  (async function () {
    await refreshDoctorsFromApiOrFallback();
    renderNotifications();
    renderDoctorsTablePage(1);
  })();
});
