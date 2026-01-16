document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const TARGETS_API_BASE = `${API_BASE}/api/targets`;
  const STORAGE_KEY = "kavyaPharmAdminTargetsData";
  let targetsApiMode = true;

  const cardsContainer = document.getElementById("targetCards");
  const form = document.getElementById("targetForm");
  const searchInput = document.getElementById("searchTarget");
  const pagination = document.getElementById("pagination");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");

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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) targets = parsed;
    } catch (e) {
      console.warn("Failed to parse stored admin targets.", e);
    }
  }

  function mapApiStatusToUi(t) {
    const s = String(t.status || "").toLowerCase();
    if ((Number(t.achievementPercentage) || 0) >= 100) return "Achieved";
    if (s === "excellent" || s === "achieved" || s === "completed") return "Achieved";
    return "Pending";
  }

  function uiStatusToApiStatus(status) {
    return String(status) === "Achieved" ? "excellent" : "poor";
  }

  function normalizeTargetFromApi(t) {
    return {
      id: Number(t.id),
      person: t.mrName,
      product: t.period,
      qty: Number(t.salesTarget) || 0,
      givenDate: t.startDate || "",
      deadline: t.endDate || "",
      status: mapApiStatusToUi(t)
    };
  }

  async function refreshTargetsFromApiOrFallback() {
    try {
      const data = await apiJson(TARGETS_API_BASE);
      if (Array.isArray(data)) {
        targets = data.map(normalizeTargetFromApi);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
        targetsApiMode = true;
        hideApiRetryBanner();
        return;
      }
      targetsApiMode = false;
      showApiRetryBanner();
    } catch (e) {
      console.warn("Targets API unavailable, using localStorage.", e);
      targetsApiMode = false;
      showApiRetryBanner();
    }
  }

  function showApiRetryBanner() {
    if (document.getElementById("targetApiRetryBanner")) return;
    const banner = document.createElement("div");
    banner.id = "targetApiRetryBanner";
    banner.className = "alert alert-warning text-center";
    banner.style.margin = "10px 0";
    banner.innerHTML =
      '<strong>Targets API unreachable.</strong> Some actions will use local data. ' +
      '<button id="targetApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(banner, container.firstChild);
    document.getElementById("targetApiRetryBtn").addEventListener("click", async function () {
      hideApiRetryBanner();
      try {
        await refreshTargetsFromApiOrFallback();
        renderCards();
      } catch (e) {
        showApiRetryBanner();
      }
    });
  }

  function hideApiRetryBanner() {
    const b = document.getElementById("targetApiRetryBanner");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  async function createTargetApi(t) {
    return await apiJson(TARGETS_API_BASE, {
      method: "POST",
      body: JSON.stringify({
        mrName: t.person,
        period: t.product,
        salesTarget: Number(t.qty) || 0,
        visitsTarget: 0,
        startDate: t.givenDate || null,
        endDate: t.deadline || null
      })
    });
  }

  async function updateTargetApi(id, t) {
    const isAchieved = String(t.status) === "Achieved";
    return await apiJson(`${TARGETS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        mrName: t.person,
        period: t.product,
        salesTarget: Number(t.qty) || 0,
        salesAchievement: isAchieved ? (Number(t.qty) || 0) : 0,
        visitsTarget: 0,
        visitsAchievement: 0,
        startDate: t.givenDate || null,
        endDate: t.deadline || null,
        status: uiStatusToApiStatus(t.status)
      })
    });
  }

  async function deleteTargetApi(id) {
    await apiJson(`${TARGETS_API_BASE}/${id}`, { method: "DELETE" });
  }

  // dynamic: initially empty; load from API or localStorage
  let targets = [];

  let currentPage = 1;
  const itemsPerPage = 4;
  let editIndex = null;

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  }

  // ---------------------------------------------------------
  // 🔥 MAIN RENDER FUNCTION
  // ---------------------------------------------------------
  function renderCards() {
    const searchTerm = searchInput.value.toLowerCase();
    const from = fromDate.value ? new Date(fromDate.value) : null;
    const to = toDate.value ? new Date(toDate.value) : null;

    let filtered = targets.filter((t) => {
      const matchSearch =
        t.person.toLowerCase().includes(searchTerm) ||
        t.product.toLowerCase().includes(searchTerm);

      const given = new Date(t.givenDate);
      const matchDate = (!from || given >= from) && (!to || given <= to);

      return matchSearch && matchDate;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    cardsContainer.innerHTML =
      paginated
        .map(
          (t, i) => `
        <div class="col-md-3 col-sm-6">
          <div class="card target-card shadow-sm border-0 h-100">
            <div class="card-body">
              <h5 class="card-title text-primary">${t.product}</h5>
              <p><strong>Person:</strong> ${t.person}</p>
              <p><strong>Target:</strong> ${t.qty} units</p>
              <p><i class="bi bi-calendar2-check text-success me-1"></i><strong>Given:</strong> ${formatDate(t.givenDate)}</p>
              <p><i class="bi bi-calendar-event text-danger me-1"></i><strong>Deadline:</strong> ${formatDate(t.deadline)}</p>
              <span class="badge ${t.status === "Achieved" ? "bg-success" : "bg-warning text-dark"}">${t.status}</span>
            </div>

            <div class="card-footer bg-transparent border-0 d-flex justify-content-between">
              <div>
                ${t.status === "Pending"
              ? `
                      <button class="btn btn-sm btn-outline-success me-1" onclick="markAchieved(${t.id})"><i class="bi bi-check-lg"></i></button>
                      <button class="btn btn-sm btn-outline-warning me-1" onclick="markPending(${t.id})"><i class="bi bi-arrow-repeat"></i></button>
                  `
              : ""
            }
              </div>

              <div>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editTarget(${t.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTarget(${t.id})"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`
        )
        .join("") || `<p class="text-center text-muted">No targets found</p>`;

    renderPagination(totalPages, filtered);
  }

  // ---------------------------------------------------------
  // 🔥 PAGINATION WITH PREVIOUS / NEXT
  // ---------------------------------------------------------
  function renderPagination(totalPages, filtered) {
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
        </li>`;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="next">Next</a>
      </li>
    `;

    pagination.innerHTML = html;

    document.querySelectorAll(".page-link").forEach((btn) =>
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

        renderCards();
      })
    );
  }

  // ---------------------------------------------------------
  // 🔥 FORM VALIDATION
  // ---------------------------------------------------------
  function validateForm() {
    const name = form.targetPerson.value.trim();
    const product = form.targetProduct.value.trim();
    const qty = Number(form.targetQty.value.trim());
    const given = form.targetGivenDate.value;
    const deadline = form.targetDeadline.value;
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!name || !product || !qty || !given || !deadline) {
      alert("⚠️ Fill all fields.");
      return false;
    }

    if (!nameRegex.test(name)) {
      alert("⚠ Name must contain only letters.");
      return false;
    }

    if (qty <= 0) {
      alert("⚠ Quantity must be positive.");
      return false;
    }

    if (new Date(deadline) < new Date(given)) {
      alert("⚠ Deadline cannot be before Given Date.");
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------
  // 🔥 CRUD OPERATIONS
  // ---------------------------------------------------------
  window.markAchieved = (id) => {
    const idx = targets.findIndex((x) => Number(x.id) === Number(id));
    if (idx === -1) return;
    targets[idx].status = "Achieved";

    (async function () {
      if (targetsApiMode) {
        try {
          await updateTargetApi(id, targets[idx]);
          await refreshTargetsFromApiOrFallback();
        } catch (e) {
          console.warn("Target update API failed. Falling back to localStorage.", e);
          targetsApiMode = false;
          showApiRetryBanner();
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
      renderCards();
    })();
  };

  window.markPending = (id) => {
    const idx = targets.findIndex((x) => Number(x.id) === Number(id));
    if (idx === -1) return;
    targets[idx].status = "Pending";

    (async function () {
      if (targetsApiMode) {
        try {
          await updateTargetApi(id, targets[idx]);
          await refreshTargetsFromApiOrFallback();
        } catch (e) {
          console.warn("Target update API failed. Falling back to localStorage.", e);
          targetsApiMode = false;
          showApiRetryBanner();
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
      renderCards();
    })();
  };

  window.deleteTarget = (id) => {
    if (!confirm("Delete this target?")) return;

    (async function () {
      if (targetsApiMode) {
        try {
          await deleteTargetApi(id);
          await refreshTargetsFromApiOrFallback();
          renderCards();
          return;
        } catch (e) {
          console.warn("Target delete API failed. Falling back to localStorage.", e);
          targetsApiMode = false;
          showApiRetryBanner();
        }
      }

      const idx = targets.findIndex((x) => Number(x.id) === Number(id));
      if (idx !== -1) targets.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
      renderCards();
    })();
  };

  window.editTarget = (id) => {
    const t = targets.find((x) => Number(x.id) === Number(id));
    if (!t) return;
    editIndex = Number(id);

    form.targetPerson.value = t.person;
    form.targetProduct.value = t.product;
    form.targetQty.value = t.qty;
    form.targetGivenDate.value = t.givenDate;
    form.targetDeadline.value = t.deadline;
    form.targetStatus.value = t.status;

    new bootstrap.Modal(document.getElementById("targetModal")).show();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      id: editIndex !== null ? Number(editIndex) : ((targets.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1),
      person: form.targetPerson.value.trim(),
      product: form.targetProduct.value.trim(),
      qty: Number(form.targetQty.value),
      givenDate: form.targetGivenDate.value,
      deadline: form.targetDeadline.value,
      status: form.targetStatus.value,
    };

    (async function () {
      if (targetsApiMode) {
        try {
          if (editIndex !== null) {
            await updateTargetApi(editIndex, data);
          } else {
            const created = await createTargetApi(data);
            if (created && created.id && String(data.status) === "Achieved") {
              await updateTargetApi(created.id, Object.assign({}, data, { id: Number(created.id) }));
            }
          }

          await refreshTargetsFromApiOrFallback();
          form.reset();
          bootstrap.Modal.getInstance(document.getElementById("targetModal")).hide();
          editIndex = null;
          renderCards();
          return;
        } catch (e) {
          console.warn("Target save API failed. Falling back to localStorage.", e);
          targetsApiMode = false;
          showApiRetryBanner();
        }
      }

      if (editIndex !== null) {
        const idx = targets.findIndex((x) => Number(x.id) === Number(editIndex));
        if (idx !== -1) targets[idx] = data;
        editIndex = null;
      } else {
        targets.push(data);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
      form.reset();
      bootstrap.Modal.getInstance(document.getElementById("targetModal")).hide();
      renderCards();
    })();
  });

  // ---------------------------------------------------------
  // 🔥 FILTERS
  // ---------------------------------------------------------
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderCards();
  });

  fromDate.addEventListener("change", renderCards);
  toDate.addEventListener("change", renderCards);

  loadFromStorageIfAny();
  (async function () {
    await refreshTargetsFromApiOrFallback();
    renderCards();
  })();
});
