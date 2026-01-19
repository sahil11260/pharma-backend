document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const DOCTORS_API = `${API_BASE}/api/doctors`;
  const USERS_API = `${API_BASE}/api/users`;

  const tableBody = document.getElementById("doctorsTableBody");
  const paginationEl = document.getElementById("pagination");
  const searchInput = document.getElementById("searchInput");
  const doctorForm = document.getElementById("doctorForm");
  const modalTitle = document.querySelector("#doctorModal .modal-title");
  const submitBtn = doctorForm.querySelector('button[type="submit"]');
  const assignMR = document.getElementById("assignMR");
  const doctorModal = new bootstrap.Modal(document.getElementById("doctorModal"));

  let doctors = [];
  let mrs = [];
  let filteredDoctors = [];
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
        throw new Error(errorText || `Error ${response.status}`);
      }
      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      console.error("API Request Failed:", error);
      throw error;
    }
  }

  // --- Initializers ---
  async function fetchMrs() {
    try {
      const data = await apiRequest(USERS_API);
      mrs = data.filter(u => u.role === "MR");
      assignMR.innerHTML = '<option value="">-- Unassigned --</option>' +
        mrs.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    } catch (e) {
      console.error("Failed to fetch MRs:", e);
    }
  }

  async function fetchDoctors() {
    try {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
      const data = await apiRequest(DOCTORS_API);
      doctors = data.map(d => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty || "—",
        city: d.city || "—",
        assignedMR: d.assignedMR || "",
        contact: d.email || d.phone || "—"
      }));
      applyFilter();
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load doctors: ${error.message}</td></tr>`;
    }
  }

  function applyFilter() {
    const term = searchInput.value.toLowerCase();
    filteredDoctors = doctors.filter(d =>
      d.name.toLowerCase().includes(term) ||
      d.specialty.toLowerCase().includes(term) ||
      d.city.toLowerCase().includes(term) ||
      d.assignedMR.toLowerCase().includes(term)
    );
    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredDoctors.slice(start, end);

    if (pageData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No doctors found.</td></tr>';
      renderPagination();
      return;
    }

    pageData.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.specialty}</td>
        <td>${d.city}</td>
        <td>${d.assignedMR || '<span class="text-muted">Unassigned</span>'}</td>
        <td>${d.contact}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${d.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${d.id}"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    tableBody.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteDoctor(btn.dataset.id));
    });

    renderPagination();
  }

  function renderPagination() {
    paginationEl.innerHTML = "";
    const totalPages = Math.ceil(filteredDoctors.length / rowsPerPage);
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
    modalTitle.textContent = "Add Doctor";
    doctorForm.reset();
    doctorModal.show();
  };

  async function openEditModal(id) {
    const doc = doctors.find(d => String(d.id) === String(id));
    if (!doc) return;
    editMode = true;
    currentEditId = id;
    modalTitle.textContent = "Edit Doctor";
    document.getElementById("doctorName").value = doc.name;
    document.getElementById("doctorSpecialty").value = doc.specialty === "—" ? "" : doc.specialty;
    document.getElementById("doctorCity").value = doc.city === "—" ? "" : doc.city;
    document.getElementById("doctorContact").value = doc.contact === "—" ? "" : doc.contact;
    assignMR.value = doc.assignedMR;
    doctorModal.show();
  }

  async function deleteDoctor(id) {
    if (!confirm("Delete this doctor?")) return;
    try {
      await apiRequest(`${DOCTORS_API}/${id}`, { method: "DELETE" });
      fetchDoctors();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  doctorForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById("doctorName").value,
      specialty: document.getElementById("doctorSpecialty").value,
      city: document.getElementById("doctorCity").value,
      email: document.getElementById("doctorContact").value,
      assignedMR: assignMR.value,
      type: "Doctor",
      clinicName: "Default Clinic",
      status: "ACTIVE"
    };

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Saving...';
      if (editMode) {
        await apiRequest(`${DOCTORS_API}/${currentEditId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiRequest(DOCTORS_API, { method: "POST", body: JSON.stringify(payload) });
      }
      doctorModal.hide();
      fetchDoctors();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  });

  searchInput.addEventListener("input", applyFilter);

  // Initial load
  fetchMrs();
  fetchDoctors();
});
