document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "";
  const USERS_API_BASE = `${API_BASE}/api/users`;
  const STORAGE_KEY_MRS = "kavyaPharmAdminMRsData";
  let mrsApiMode = true;

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

  function loadFromStorageIfAny() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MRS);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) mrs = parsed;
    } catch (e) {
      console.warn("Failed to parse stored admin MRs.", e);
    }
  }

  async function refreshMrsFromApiOrFallback() {
    try {
      const users = await apiJson(USERS_API_BASE);
      if (Array.isArray(users)) {
        mrs = users
          .filter((u) => u && String(u.role) === "MR")
          .map((u) => ({
            id: Number(u.id),
            name: u.name,
            email: u.email,
            phone: u.phone || "",
            manager: u.assignedManager || "",
            territory: u.territory || "",
            password: ""
          }));
        localStorage.setItem(STORAGE_KEY_MRS, JSON.stringify(mrs));
        mrsApiMode = true;
        hideApiRetryBanner();
        return;
      }
      mrsApiMode = false;
      showApiRetryBanner();
    } catch (e) {
      console.warn("MRs API unavailable, using localStorage.", e);
      mrsApiMode = false;
      showApiRetryBanner();
    }
  }

  async function createMrApi(m) {
    return await apiJson(USERS_API_BASE, {
      method: "POST",
      body: JSON.stringify({
        name: m.name,
        email: m.email,
        password: m.password,
        role: "MR",
        phone: m.phone,
        territory: m.territory,
        status: "ACTIVE",
        assignedManager: m.manager
      })
    });
  }

  async function updateMrApi(id, m) {
    return await apiJson(`${USERS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: m.name,
        role: "MR",
        phone: m.phone,
        territory: m.territory,
        status: "ACTIVE",
        assignedManager: m.manager,
        password: m.password ? m.password : null
      })
    });
  }

  async function deleteMrApi(id) {
    await apiJson(`${USERS_API_BASE}/${id}`, { method: "DELETE" });
  }

  const mrTable = document.getElementById("mrTableBody");
  const mrForm = document.getElementById("mrForm");
  const pagination = document.getElementById("pagination");
  const searchInput = document.getElementById("searchMR");
  const addMRBtn = document.querySelector('[data-bs-target="#mrModal"]');
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("mrPassword");

  // dynamic MR list: will be loaded from API or localStorage
  let mrs = [];

  function showApiRetryBanner() {
    if (document.getElementById("mrApiRetryBanner")) return;
    const banner = document.createElement("div");
    banner.id = "mrApiRetryBanner";
    banner.className = "alert alert-warning text-center";
    banner.style.margin = "10px 0";
    banner.innerHTML = '<strong>MRs API unreachable.</strong> Some actions will use local data. ' +
      '<button id="mrApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(banner, container.firstChild);
    document.getElementById("mrApiRetryBtn").addEventListener("click", async function () {
      hideApiRetryBanner();
      try {
        await refreshMrsFromApiOrFallback();
        renderMRs();
      } catch (e) {
        showApiRetryBanner();
      }
    });
  }

  function hideApiRetryBanner() {
    const b = document.getElementById("mrApiRetryBanner");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  const itemsPerPage = 3;
  let currentPage = 1;
  let editIndex = null;

  // ------------------------
  // VALIDATION
  // ------------------------
  function validateMRForm() {
    const name = mrForm.mrName.value.trim();
    const email = mrForm.mrEmail.value.trim();
    const phone = mrForm.mrPhone.value.trim();
    const manager = mrForm.mrManager.value.trim();
    const territory = mrForm.mrTerritory.value.trim();
    const password = mrForm.mrPassword.value.trim();

    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!name || !email || !phone || !manager || !territory || (editIndex === null && !password)) {
      alert("⚠️ Please fill all fields before saving.");
      return false;
    }
    if (!nameRegex.test(name)) {
      alert("⚠️ Name should contain only letters and spaces.");
      return false;
    }
    if (!emailRegex.test(email)) {
      alert("⚠️ Enter a valid email.");
      return false;
    }
    if (!phoneRegex.test(phone)) {
      alert("⚠️ Phone number must be 10 digits.");
      return false;
    }
    if (!nameRegex.test(territory)) {
      alert("⚠️ Territory should contain only letters and spaces.");
      return false;
    }
    if (password && password.length < 5) {
      alert("⚠️ Password must be at least 5 characters.");
      return false;
    }

    return true;
  }

  // ------------------------
  // RENDER TABLE
  // ------------------------
  function renderMRs(filtered = mrs) {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filtered.slice(start, end);

    mrTable.innerHTML = pageData
      .map(
        (m, i) => `
        <tr>
          <td>${m.name}</td>
          <td>${m.email}</td>
          <td>${m.phone}</td>
          <td>${m.manager}</td>
          <td>${m.territory}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2" onclick="editMR(${i + start})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteMR(${i + start})"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`
      )
      .join("");

    renderPagination(filtered.length, filtered);
  }

  // ------------------------
  // PAGINATION (WITH PREV/NEXT)
  // ------------------------
  function renderPagination(totalItems, filtered) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    let html = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="prev">Previous</a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="next">Next</a>
      </li>
    `;

    pagination.innerHTML = html;

    document.querySelectorAll("#pagination .page-link").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const value = btn.dataset.page;

        if (value === "prev" && currentPage > 1) {
          currentPage--;
        } else if (value === "next" && currentPage < totalPages) {
          currentPage++;
        } else if (!isNaN(value)) {
          currentPage = parseInt(value);
        }

        renderMRs(filtered);
      });
    });
  }

  // ------------------------
  // ADD MR
  // ------------------------
  const defaultSubmit = (e) => {
    e.preventDefault();
    if (!validateMRForm()) return;

    const newMR = {
      id: (mrs.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1,
      name: mrForm.mrName.value.trim(),
      email: mrForm.mrEmail.value.trim(),
      phone: mrForm.mrPhone.value.trim(),
      manager: mrForm.mrManager.value.trim(),
      territory: mrForm.mrTerritory.value.trim(),
      password: mrForm.mrPassword.value.trim(),
    };

    (async function () {
      if (mrsApiMode) {
        try {
          await createMrApi(newMR);
          await refreshMrsFromApiOrFallback();
          renderMRs();
          mrForm.reset();
          bootstrap.Modal.getInstance(document.getElementById("mrModal")).hide();
          editIndex = null;
          return;
        } catch (e) {
          console.warn("MR create API failed. Falling back to localStorage.", e);
          mrsApiMode = false;
        }
      }
      mrs.push(newMR);
      localStorage.setItem(STORAGE_KEY_MRS, JSON.stringify(mrs));
      renderMRs();
      mrForm.reset();
      bootstrap.Modal.getInstance(document.getElementById("mrModal")).hide();
      editIndex = null;
    })();
  };

  mrForm.addEventListener("submit", defaultSubmit);

  // ------------------------
  // EDIT MR
  // ------------------------
  window.editMR = (index) => {
    const m = mrs[index];

    editIndex = index;

    mrForm.mrName.value = m.name;
    mrForm.mrEmail.value = m.email;
    mrForm.mrPhone.value = m.phone;
    mrForm.mrManager.value = m.manager;
    mrForm.mrTerritory.value = m.territory;
    mrForm.mrPassword.value = "";

    mrForm.mrEmail.disabled = true;

    const modal = new bootstrap.Modal(document.getElementById("mrModal"));
    modal.show();

    mrForm.onsubmit = (e) => {
      e.preventDefault();
      if (!validateMRForm()) return;

      const updated = {
        id: m.id,
        name: mrForm.mrName.value.trim(),
        email: m.email,
        phone: mrForm.mrPhone.value.trim(),
        manager: mrForm.mrManager.value.trim(),
        territory: mrForm.mrTerritory.value.trim(),
        password: mrForm.mrPassword.value.trim(),
      };

      (async function () {
        if (mrsApiMode && updated.id) {
          try {
            await updateMrApi(updated.id, updated);
            await refreshMrsFromApiOrFallback();
            renderMRs();
            modal.hide();
            mrForm.reset();
            mrForm.mrEmail.disabled = false;
            mrForm.onsubmit = defaultSubmit;
            editIndex = null;
            return;
          } catch (e) {
            console.warn("MR update API failed. Falling back to localStorage.", e);
            mrsApiMode = false;
          }
        }

        mrs[index] = updated;
        localStorage.setItem(STORAGE_KEY_MRS, JSON.stringify(mrs));
        renderMRs();
        modal.hide();
        mrForm.reset();
        mrForm.mrEmail.disabled = false;
        mrForm.onsubmit = defaultSubmit;
        editIndex = null;
      })();
    };
  };

  // ------------------------
  // DELETE MR
  // ------------------------
  window.deleteMR = (index) => {
    if (!confirm("Delete this MR?")) return;

    (async function () {
      const existing = mrs[index];
      if (mrsApiMode && existing && existing.id) {
        try {
          await deleteMrApi(existing.id);
          await refreshMrsFromApiOrFallback();
          renderMRs();
          return;
        } catch (e) {
          console.warn("MR delete API failed. Falling back to localStorage.", e);
          mrsApiMode = false;
        }
      }

      mrs.splice(index, 1);
      localStorage.setItem(STORAGE_KEY_MRS, JSON.stringify(mrs));
      renderMRs();
    })();
  };

  // ------------------------
  // SEARCH
  // ------------------------
  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = mrs.filter(
      (m) =>
        m.name.toLowerCase().includes(keyword) ||
        m.email.toLowerCase().includes(keyword) ||
        m.manager.toLowerCase().includes(keyword)
    );
    currentPage = 1;
    renderMRs(filtered);
  });

  // ------------------------
  // RESET FORM WHEN ADDING NEW
  // ------------------------
  addMRBtn.addEventListener("click", () => {
    mrForm.reset();
    mrForm.onsubmit = defaultSubmit;
    mrForm.mrEmail.disabled = false;
    editIndex = null;
  });

  // ------------------------
  // PASSWORD SHOW/HIDE
  // ------------------------
  togglePassword?.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.classList.toggle("bi-eye");
    togglePassword.classList.toggle("bi-eye-slash");
  });

  // INITIAL RENDER
  loadFromStorageIfAny();
  (async function () {
    await refreshMrsFromApiOrFallback();
    renderMRs();
  })();
});
