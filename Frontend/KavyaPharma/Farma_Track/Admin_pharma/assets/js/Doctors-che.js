document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "";
  const DOCTORS_API_BASE = `${API_BASE}/api/doctors`;
  const USERS_API_BASE = `${API_BASE}/api/users`;
  const STORAGE_KEY_DOCTORS = "kavyaPharmAdminDoctorsData";
  const STORAGE_KEY_MRS = "kavyaPharmAdminDoctorsMRs";
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
    if (res.status === 204) return null;
    return await res.json();
  }

  // start empty: prefer API-backed lists, fall back to localStorage when API unavailable
  let mrs = [];
  let doctors = [];

  function loadFromStorageIfAny() {
    try {
      const rawMrs = localStorage.getItem(STORAGE_KEY_MRS);
      if (rawMrs) {
        const parsed = JSON.parse(rawMrs);
        if (Array.isArray(parsed)) mrs = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored MRs.", e);
    }

    try {
      const rawDocs = localStorage.getItem(STORAGE_KEY_DOCTORS);
      if (rawDocs) {
        const parsed = JSON.parse(rawDocs);
        if (Array.isArray(parsed)) doctors = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored doctors.", e);
    }
  }

  async function refreshMrsFromApiOrFallback() {
    try {
      const users = await apiJson(USERS_API_BASE);
      if (Array.isArray(users)) {
        mrs = users
          .filter((u) => u && String(u.role) === "MR")
          .map((u) => ({ id: Number(u.id), name: u.name }));
        localStorage.setItem(STORAGE_KEY_MRS, JSON.stringify(mrs));
        doctorsApiMode = true;
        hideApiRetryBanner();
        return;
      }
      doctorsApiMode = false;
      showApiRetryBanner();
    } catch (e) {
      console.warn("Users API unavailable, using localStorage for MR list.", e);
      doctorsApiMode = false;
      showApiRetryBanner();
    }
  }

  async function refreshDoctorsFromApiOrFallback() {
    try {
      const data = await apiJson(DOCTORS_API_BASE);
      if (Array.isArray(data)) {
        doctors = data.map((d) => ({
          id: Number(d.id),
          name: d.name,
          specialty: d.specialty || "",
          city: d.city || "",
          assignedMR: d.assignedMR || "",
          contact: d.email || "",
        }));
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
        doctorsApiMode = true;
        hideApiRetryBanner();
        return;
      }
      doctorsApiMode = false;
      showApiRetryBanner();
    } catch (e) {
      console.warn("Doctors API unavailable, using localStorage.", e);
      doctorsApiMode = false;
      showApiRetryBanner();
    }
  }

  function showApiRetryBanner() {
    if (document.getElementById("doctorApiRetryBanner")) return;
    const banner = document.createElement("div");
    banner.id = "doctorApiRetryBanner";
    banner.className = "alert alert-warning text-center";
    banner.style.margin = "10px 0";
    banner.innerHTML = '<strong>Doctors API unreachable.</strong> Some actions will use local data. ' +
      '<button id="doctorApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(banner, container.firstChild);
    document.getElementById("doctorApiRetryBtn").addEventListener("click", async function () {
      hideApiRetryBanner();
      try {
        await refreshMrsFromApiOrFallback();
        populateMrDropdown();
        await refreshDoctorsFromApiOrFallback();
        applyFilters();
      } catch (e) {
        showApiRetryBanner();
      }
    });
  }

  function hideApiRetryBanner() {
    const b = document.getElementById("doctorApiRetryBanner");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  async function createDoctorApi(d) {
    return await apiJson(DOCTORS_API_BASE, {
      method: "POST",
      body: JSON.stringify({
        name: d.name,
        type: "doctor",
        specialty: d.specialty || "",
        phone: "",
        email: d.contact,
        clinicName: "",
        address: "",
        city: d.city,
        assignedMR: d.assignedMR || "",
        notes: "",
        status: "active",
      })
    });
  }

  async function updateDoctorApi(id, d) {
    return await apiJson(`${DOCTORS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: d.name,
        type: "doctor",
        specialty: d.specialty || "",
        phone: "",
        email: d.contact,
        clinicName: "",
        address: "",
        city: d.city,
        assignedMR: d.assignedMR || "",
        notes: "",
        status: "active",
      })
    });
  }

  async function deleteDoctorApi(id) {
    await apiJson(`${DOCTORS_API_BASE}/${id}`, { method: "DELETE" });
  }

  const pageSize = 5;
  let currentPage = 1;
  let filteredList = [...doctors];

  const tableBody = document.getElementById("doctorsTableBody");
  const paginationEl = document.getElementById("pagination");
  const searchInput = document.getElementById("searchInput");
  const doctorModal = new bootstrap.Modal(document.getElementById("doctorModal"));
  const doctorForm = document.getElementById("doctorForm");
  const doctorName = document.getElementById("doctorName");
  const doctorSpecialty = document.getElementById("doctorSpecialty");
  const doctorCity = document.getElementById("doctorCity");
  const assignMR = document.getElementById("assignMR");
  const doctorContact = document.getElementById("doctorContact");
  const doctorIndexInput = document.getElementById("doctorIndex");

  // ✅ Populate MR Dropdown
  function populateMrDropdown() {
    assignMR.innerHTML = `<option value="">-- Unassigned --</option>` +
      mrs.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
  }
  populateMrDropdown();

  // ✅ Get MR Name
  function getMrName(name) {
    return name ? name : "-";
  }

  // ✅ Validation Function
  function validateDoctorForm() {
    const name = doctorName.value.trim();
    const city = doctorCity.value.trim();
    const contact = doctorContact.value.trim();
    const nameRegex = /^[A-Za-z\s.]+$/;
    const cityRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !city || !contact) {
      alert("⚠️ Please fill all required fields (Name, City, Email).");
      return false;
    }

    if (!nameRegex.test(name)) {
      alert("⚠️ Doctor name must contain only letters.");
      return false;
    }

    if (!cityRegex.test(city)) {
      alert("⚠️ City must contain only letters.");
      return false;
    }

    if (!emailRegex.test(contact)) {
      alert("⚠️ Please enter a valid email address.");
      return false;
    }

    return true;
  }

  // ✅ Render Table
  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredList.slice(start, start + pageSize);

    tableBody.innerHTML = pageItems.map((d, idx) => `
      <tr>
        <td>${d.name}</td>
        <td>${d.specialty || "-"}</td>
        <td>${d.city}</td>
        <td>${getMrName(d.assignedMR)}</td>
        <td>${d.contact}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${d.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${d.id}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join("");

    tableBody.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", handleAction);
    });

    renderPagination();
  }

  // ✅ Pagination
  function renderPagination() {
    const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
    let html = `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? "active" : ""}">
      <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a></li>`;
    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll("a[data-page]").forEach(a => {
      a.addEventListener("click", e => {
        e.preventDefault();
        const p = parseInt(a.dataset.page);
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          renderTable();
        }
      });
    });
  }

  // ✅ Actions (Edit/Delete)
  function handleAction(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const action = e.currentTarget.dataset.action;
    if (action === "delete") {
      if (confirm("🗑️ Delete this doctor?")) {
        (async function () {
          if (doctorsApiMode && id) {
            try {
              await deleteDoctorApi(id);
              await refreshDoctorsFromApiOrFallback();
              applyFilters();
              return;
            } catch (err) {
              console.warn("Doctor delete API failed. Falling back to localStorage.", err);
              doctorsApiMode = false;
            }
          }

          const idx = doctors.findIndex((d) => Number(d.id) === Number(id));
          if (idx !== -1) doctors.splice(idx, 1);
          localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
          applyFilters();
        })();
      }
    } else if (action === "edit") {
      const d = doctors.find((x) => Number(x.id) === Number(id));
      if (!d) return;
      doctorIndexInput.value = String(d.id);
      doctorName.value = d.name;
      doctorSpecialty.value = d.specialty;
      doctorCity.value = d.city;
      assignMR.value = d.assignedMR || "";
      doctorContact.value = d.contact;
      doctorModal.show();
    }
  }

  // ✅ Filters
  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    filteredList = doctors.filter(d =>
      d.name.toLowerCase().includes(term) ||
      d.city.toLowerCase().includes(term) ||
      (getMrName(d.assignedMR) || "").toLowerCase().includes(term)
    );
    currentPage = 1;
    renderTable();
  }

  // ✅ Add/Edit Form Submit
  doctorForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!validateDoctorForm()) return;

    const docId = parseInt(doctorIndexInput.value);
    const payload = {
      id: isNaN(docId) || docId < 0 ? ((doctors.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1) : docId,
      name: doctorName.value.trim(),
      specialty: doctorSpecialty.value.trim(),
      city: doctorCity.value.trim(),
      assignedMR: assignMR.value ? String(assignMR.value) : "",
      contact: doctorContact.value.trim(),
    };

    (async function () {
      if (doctorsApiMode) {
        try {
          if (!isNaN(docId) && docId >= 0) {
            await updateDoctorApi(docId, payload);
          } else {
            await createDoctorApi(payload);
          }
          await refreshDoctorsFromApiOrFallback();
          await refreshMrsFromApiOrFallback();
          populateMrDropdown();
          doctorForm.reset();
          doctorModal.hide();
          applyFilters();
          return;
        } catch (err) {
          console.warn("Doctor save API failed. Falling back to localStorage.", err);
          doctorsApiMode = false;
        }
      }

      const idx = doctors.findIndex((d) => Number(d.id) === Number(payload.id));
      if (idx >= 0) doctors[idx] = payload;
      else doctors.unshift(payload);
      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));

      doctorForm.reset();
      doctorModal.hide();
      applyFilters();
    })();
  });

  // ✅ Reset Modal on Add Button
  document.querySelector('[data-bs-target="#doctorModal"]').addEventListener("click", () => {
    doctorForm.reset();
    doctorIndexInput.value = -1;
  });

  // ✅ Modal Scroll Fix
  const modalBody = document.querySelector("#doctorModal .modal-body");
  if (modalBody) {
    modalBody.style.maxHeight = "65vh";
    modalBody.style.overflowY = "auto";
  }

  // ✅ Search
  searchInput.addEventListener("input", applyFilters);

  loadFromStorageIfAny();
  (async function () {
    await refreshMrsFromApiOrFallback();
    populateMrDropdown();
    await refreshDoctorsFromApiOrFallback();
    applyFilters();
  })();
});
