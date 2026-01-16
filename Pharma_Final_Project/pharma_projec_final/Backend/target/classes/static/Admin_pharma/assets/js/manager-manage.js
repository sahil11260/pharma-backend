document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "";
  const USERS_API_BASE = `${API_BASE}/api/users`;
  const STORAGE_KEY_MANAGERS = "kavyaPharmAdminManagersData";
  let managersApiMode = true;

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
      const raw = localStorage.getItem(STORAGE_KEY_MANAGERS);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) managers = parsed;
    } catch (e) {
      console.warn("Failed to parse stored admin managers.", e);
    }
  }

  async function refreshManagersFromApiOrFallback() {
    try {
      const users = await apiJson(USERS_API_BASE);
      if (Array.isArray(users)) {
        managers = users
          .filter((u) => u && String(u.role) === "MANAGER")
          .map((u) => ({
            id: Number(u.id),
            name: u.name,
            email: u.email,
            phone: u.phone || "",
            territory: u.territory || "",
            password: ""
          }));
        localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
        managersApiMode = true;
        hideApiRetryBanner();
        return;
      }
      managersApiMode = false;
      showApiRetryBanner();
    } catch (e) {
      console.warn("Managers API unavailable, using localStorage.", e);
      managersApiMode = false;
      showApiRetryBanner();
    }
  }

  async function createManagerApi(m) {
    return await apiJson(USERS_API_BASE, {
      method: "POST",
      body: JSON.stringify({
        name: m.name,
        email: m.email,
        password: m.password,
        role: "MANAGER",
        phone: m.phone,
        territory: m.territory,
        status: "ACTIVE",
        assignedManager: null
      })
    });
  }

  async function updateManagerApi(id, m) {
    return await apiJson(`${USERS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: m.name,
        role: "MANAGER",
        phone: m.phone,
        territory: m.territory,
        status: "ACTIVE",
        assignedManager: null,
        password: m.password ? m.password : null
      })
    });
  }

  async function deleteManagerApi(id) {
    await apiJson(`${USERS_API_BASE}/${id}`, { method: "DELETE" });
  }

  const tableBody = document.getElementById("managerTableBody");
  const pagination = document.getElementById("pagination");
  const searchInput = document.getElementById("searchManager");
  const managerForm = document.getElementById("managerForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("managerPassword");

  let editManagerId = null;

  let managers = [
    // start empty — will load from API/localStorage
  ];

  function showApiRetryBanner() {
    if (document.getElementById("managerApiRetryBanner")) return;
    const banner = document.createElement("div");
    banner.id = "managerApiRetryBanner";
    banner.className = "alert alert-warning text-center";
    banner.style.margin = "10px 0";
    banner.innerHTML = '<strong>Managers API unreachable.</strong> Some actions will use local data. ' +
      '<button id="managerApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(banner, container.firstChild);
    document.getElementById("managerApiRetryBtn").addEventListener("click", async function () {
      hideApiRetryBanner();
      try {
        await refreshManagersFromApiOrFallback();
        displayTable(currentPage, searchInput.value);
      } catch (e) {
        showApiRetryBanner();
      }
    });
  }

  function hideApiRetryBanner() {
    const b = document.getElementById("managerApiRetryBanner");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  let currentPage = 1;
  const rowsPerPage = 4;

  // ✅ Validation Function
  function validateManagerForm() {
    const name = managerForm.managerName.value.trim();
    const email = managerForm.managerEmail.value.trim();
    const phone = managerForm.managerPhone.value.trim();
    const territory = managerForm.managerTerritory.value.trim();
    const password = managerForm.managerPassword.value.trim();

    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const passwordRegex = /^.{5,}$/; // at least 5 chars

    if (!name || !email || !phone || !territory || (editManagerId === null && !password)) {
      alert("⚠️ Please fill all fields before saving.");
      return false;
    }
    if (!nameRegex.test(name)) {
      alert("⚠️ Name should contain only letters and spaces.");
      return false;
    }
    if (!emailRegex.test(email)) {
      alert("⚠️ Enter a valid email address.");
      return false;
    }
    if (!phoneRegex.test(phone)) {
      alert("⚠️ Phone number must be exactly 10 digits.");
      return false;
    }
    if (!nameRegex.test(territory)) {
      alert("⚠️ Territory should contain only letters and spaces.");
      return false;
    }
    if (password && !passwordRegex.test(password)) {
      alert("⚠️ Password must be at least 5 characters long.");
      return false;
    }
    return true;
  }

  // ✅ Display Table
  function displayTable(page = 1, filter = "") {
    tableBody.innerHTML = "";
    const filtered = managers.filter(
      (m) =>
        m.name.toLowerCase().includes(filter.toLowerCase()) ||
        m.email.toLowerCase().includes(filter.toLowerCase()) ||
        m.territory.toLowerCase().includes(filter.toLowerCase())
    );

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filtered.slice(start, end);

    if (pageData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No results found</td></tr>`;
    } else {
      pageData.forEach((m, i) => {
        tableBody.innerHTML += `
          <tr>
            <td>${m.name}</td>
            <td>${m.email}</td>
            <td>${m.phone}</td>
            <td>${m.territory}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-2" onclick="editManager(${m.id})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteManager(${m.id})"><i class="bi bi-trash"></i></button>
            </td>
          </tr>`;
      });
    }
    renderPagination(filtered.length, page);
  }

  // ✅ Pagination
  function renderPagination(totalItems, page) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    let html = `
      <li class="page-item ${page === 1 ? "disabled" : ""}">
        <a class="page-link" href="#">Previous</a>
      </li>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === page ? "active" : ""}">
        <a class="page-link" href="#">${i}</a>
      </li>`;
    }

    html += `
      <li class="page-item ${page === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#">Next</a>
      </li>`;

    pagination.innerHTML = html;

    document.querySelectorAll(".page-link").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const text = e.target.innerText;
        if (text === "Previous" && currentPage > 1) currentPage--;
        else if (text === "Next" && currentPage < totalPages) currentPage++;
        else if (!isNaN(text)) currentPage = parseInt(text);
        displayTable(currentPage, searchInput.value);
      })
    );
  }

  // ✅ Search
  searchInput.addEventListener("keyup", () => {
    currentPage = 1;
    displayTable(currentPage, searchInput.value);
  });

  // ✅ Add Manager
  managerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateManagerForm()) return;

    const newManager = {
      id: editManagerId === null ? ((managers.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1) : Number(editManagerId),
      name: managerForm.managerName.value.trim(),
      email: managerForm.managerEmail.value.trim(),
      phone: managerForm.managerPhone.value.trim(),
      territory: managerForm.managerTerritory.value.trim(),
      password: managerForm.managerPassword.value.trim(),
    };

    (async function () {
      if (managersApiMode) {
        try {
          if (editManagerId !== null) {
            await updateManagerApi(editManagerId, newManager);
          } else {
            await createManagerApi(newManager);
          }
          await refreshManagersFromApiOrFallback();
          displayTable();
          managerForm.reset();
          managerForm.managerEmail.disabled = false;
          editManagerId = null;
          bootstrap.Modal.getInstance(document.getElementById("managerModal")).hide();
          return;
        } catch (e) {
          console.warn("Manager save API failed. Falling back to localStorage.", e);
          managersApiMode = false;
        }
      }

      if (editManagerId !== null) {
        const idx = managers.findIndex((x) => Number(x.id) === Number(editManagerId));
        if (idx !== -1) managers[idx] = newManager;
      } else {
        managers.push(newManager);
      }
      localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
      displayTable();
      managerForm.reset();
      managerForm.managerEmail.disabled = false;
      editManagerId = null;
      bootstrap.Modal.getInstance(document.getElementById("managerModal")).hide();
    })();
  });

  // ✅ Open Add Manager (Empty Form)
  const addBtn = document.querySelector('[data-bs-target="#managerModal"]');
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      managerForm.reset(); // clear previous data
      managerForm.managerEmail.disabled = false;
      editManagerId = null;
      managerForm.onsubmit = null; // reset submit listener
      managerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateManagerForm()) return;

        const newManager = {
          id: (managers.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1,
          name: managerForm.managerName.value.trim(),
          email: managerForm.managerEmail.value.trim(),
          phone: managerForm.managerPhone.value.trim(),
          territory: managerForm.managerTerritory.value.trim(),
          password: managerForm.managerPassword.value.trim(),
        };

        (async function () {
          if (managersApiMode) {
            try {
              await createManagerApi(newManager);
              await refreshManagersFromApiOrFallback();
              displayTable();
              managerForm.reset();
              bootstrap.Modal.getInstance(document.getElementById("managerModal")).hide();
              return;
            } catch (e) {
              console.warn("Manager create API failed. Falling back to localStorage.", e);
              managersApiMode = false;
            }
          }

          managers.push(newManager);
          localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
          displayTable();
          managerForm.reset();
          bootstrap.Modal.getInstance(document.getElementById("managerModal")).hide();
        })();
      }, { once: true });
    });
  }

  // ✅ Edit Manager
  window.editManager = (id) => {
    const m = managers.find((x) => Number(x.id) === Number(id));
    if (!m) return;
    editManagerId = Number(m.id);
    managerForm.managerName.value = m.name;
    managerForm.managerEmail.value = m.email;
    managerForm.managerPhone.value = m.phone;
    managerForm.managerTerritory.value = m.territory;
    managerForm.managerPassword.value = "";

    managerForm.managerEmail.disabled = true;

    const modal = new bootstrap.Modal(document.getElementById("managerModal"));
    modal.show();

    managerForm.onsubmit = (e) => {
      e.preventDefault();
      if (!validateManagerForm()) return;

      const updated = {
        id: Number(m.id),
        name: managerForm.managerName.value.trim(),
        email: m.email,
        phone: managerForm.managerPhone.value.trim(),
        territory: managerForm.managerTerritory.value.trim(),
        password: managerForm.managerPassword.value.trim(),
      };

      (async function () {
        if (managersApiMode) {
          try {
            await updateManagerApi(updated.id, updated);
            await refreshManagersFromApiOrFallback();
            displayTable();
            modal.hide();
            managerForm.reset();
            managerForm.managerEmail.disabled = false;
            editManagerId = null;
            return;
          } catch (e) {
            console.warn("Manager update API failed. Falling back to localStorage.", e);
            managersApiMode = false;
          }
        }

        const idx = managers.findIndex((x) => Number(x.id) === Number(updated.id));
        if (idx !== -1) managers[idx] = updated;
        localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
        displayTable();
        modal.hide();
        managerForm.reset();
        managerForm.managerEmail.disabled = false;
        editManagerId = null;
      })();
    };
  };

  // ✅ Delete Manager
  window.deleteManager = (id) => {
    if (!confirm("Delete this manager?")) return;

    (async function () {
      if (managersApiMode && id) {
        try {
          await deleteManagerApi(id);
          await refreshManagersFromApiOrFallback();
          displayTable(currentPage, searchInput.value);
          return;
        } catch (e) {
          console.warn("Manager delete API failed. Falling back to localStorage.", e);
          managersApiMode = false;
        }
      }

      const idx = managers.findIndex((x) => Number(x.id) === Number(id));
      if (idx !== -1) managers.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
      displayTable(currentPage, searchInput.value);
    })();
  };

  // ✅ Password Show/Hide
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.classList.toggle("bi-eye");
    togglePassword.classList.toggle("bi-eye-slash");
  });

  // ✅ Initial Render
  loadFromStorageIfAny();
  (async function () {
    await refreshManagersFromApiOrFallback();
    displayTable();
  })();
});
