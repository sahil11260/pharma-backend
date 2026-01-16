/**
 * target-management.js
 * Handles the logic for the Target Management page, including
 * loading, adding, deleting, EDITING targets, and client-side pagination.
 */

const TARGETS_STORAGE_KEY = "kavyaPharmTargets";
const API_BASE = "";
const TARGETS_API_BASE = `${API_BASE}/api/targets`;
const ROWS_PER_PAGE = 10;
let currentPage = 1;
let currentTargets = []; // Stores the currently loaded and filtered targets
let targetsApiMode = true;

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

// API retry banner helpers (visible when backend unreachable)
function showApiRetryBanner() {
  if (document.getElementById("apiRetryBanner")) return;
  const banner = document.createElement("div");
  banner.id = "apiRetryBanner";
  banner.style.position = "fixed";
  banner.style.bottom = "20px";
  banner.style.right = "20px";
  banner.style.background = "#fff3cd";
  banner.style.border = "1px solid #ffeeba";
  banner.style.padding = "12px 16px";
  banner.style.borderRadius = "8px";
  banner.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
  banner.style.zIndex = "2000";
  banner.innerHTML = `<div style=\"display:flex;gap:12px;align-items:center;\">` +
    `<div style=\"font-weight:600;color:#856404;\">API unreachable — using local data</div>` +
    `<button id=\"apiRetryBtn\" class=\"btn btn-sm btn-outline-primary\">Retry</button>` +
    `</div>`;
  document.body.appendChild(banner);
  document.getElementById("apiRetryBtn").addEventListener("click", async function () {
    try {
      hideApiRetryBanner();
      await refreshTargetsFromApiOrFallback();
      currentPage = 1;
      renderTargets(currentTargets, currentPage);
    } catch (e) {
      console.warn("Retry failed", e);
    }
  });
}

function hideApiRetryBanner() {
  const b = document.getElementById("apiRetryBanner");
  if (b) b.remove();
}

function isNumericId(id) {
  return /^[0-9]+$/.test(String(id));
}

function numberFromDisplayValue(value) {
  const n = parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function apiStatusToUi(status) {
  const s = String(status || "").toLowerCase();
  if (s === "good" || s === "achieved" || s === "complete") return "Complete";
  if (s === "average" || s === "on track" || s === "on_track") return "On Track";
  return "Behind";
}

function uiStatusToApi(status) {
  const s = String(status || "").toLowerCase();
  if (s === "complete") return "good";
  if (s === "on track") return "average";
  return "poor";
}

function normalizeTargetFromApi(t) {
  const salesTarget = Number(t.salesTarget) || 0;
  const salesAch = Number(t.salesAchievement) || 0;
  const id = String(t.id);
  const deadline = t.endDate ? String(t.endDate) : (t.startDate ? String(t.startDate) : "");
  return {
    id: id,
    name: String(t.period || "Sales Target"),
    assignedTo: String(t.mrName || ""),
    type: "Sales",
    targetValue: `₹${salesTarget}`,
    currentProgressValue: `₹${salesAch}`,
    currentProgressPercent: Number(t.achievementPercentage) || 0,
    deadline: deadline,
    status: apiStatusToUi(t.status),
  };
}

async function refreshTargetsFromApiOrFallback() {
  try {
    const data = await apiJson(TARGETS_API_BASE);
    if (Array.isArray(data)) {
      const apiTargets = data.map(normalizeTargetFromApi);
      const localTargets = loadTargets();
      const localOnly = localTargets.filter((t) => !isNumericId(t.id));
      const merged = apiTargets.concat(localOnly);
      saveTargets(merged);
      currentTargets = merged;
      targetsApiMode = true;
      try { hideApiRetryBanner(); } catch (err) { }
      return;
    }
    targetsApiMode = false;
  } catch (e) {
    console.warn("Targets API unavailable, using localStorage.", e);
    targetsApiMode = false;
    try { showApiRetryBanner(); } catch (err) { }
  }
}

// --- Data Persistence and Initialization Functions ---

/**
 * Loads targets from localStorage or initializes with the initial table data.
 * @returns {Array} The array of target objects.
 */
function loadTargets() {
  const storedTargets = localStorage.getItem(TARGETS_STORAGE_KEY);
  if (storedTargets) {
    return JSON.parse(storedTargets);
  }

  // Initial data from the HTML table (for the first load only)
  const initialRows = document
    .getElementById("targetTableBody")
    .querySelectorAll("tr");
  const initialTargets = Array.from(initialRows).map((row) => {
    const cells = row.querySelectorAll("td");
    const progressText = cells[5].textContent.trim(); // e.g., '₹385,000 (77%)'
    const statusText = cells[7].querySelector(".badge").textContent.trim();
    const progressMatch = progressText.match(/(.+) \((.+)%\)/);

    let progressValue = progressText;
    let progressPercent = 0;

    if (progressMatch) {
      progressValue = progressMatch[1].trim();
      progressPercent = parseInt(progressMatch[2], 10);
    } else if (statusText === "On Track" || statusText === "Achieved") {
      progressPercent = 70; // Default estimate for initial on track
    } else {
      progressPercent = 40; // Default estimate for initial behind
    }

    let type = cells[3].textContent.trim() || "General";

    return {
      id: cells[0].textContent.trim(),
      name: cells[1].textContent.trim(),
      assignedTo: cells[2].textContent.trim(),
      type: type,
      targetValue: cells[4].textContent.trim(),
      currentProgressValue: progressValue,
      currentProgressPercent: progressPercent,
      deadline: cells[6].textContent.trim(),
      status: statusText,
    };
  });

  // Save initial data to localStorage and return it
  saveTargets(initialTargets);
  return initialTargets;
}

/**
 * Saves the given array of targets to localStorage.
 * @param {Array} targets - The array of target objects to save.
 */
function saveTargets(targets) {
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
}

// --- Rendering and View Logic Functions ---

/**
 * Renders the targets array into the HTML table body based on the current page.
 * @param {Array} targets - The array of target objects to display.
 * @param {number} page - The current page number to render.
 */
function renderTargets(targets, page = 1) {
  const tableBody = document.getElementById("targetTableBody");
  if (!tableBody) return;

  // Determine the slice of data to display based on ROWS_PER_PAGE and current page
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedTargets = targets.slice(startIndex, endIndex);

  // Clear existing rows
  tableBody.innerHTML = "";

  paginatedTargets.forEach((target) => {
    const statusClass =
      target.status === "On Track" || target.status === "Complete"
        ? "bg-success"
        : target.status === "Behind"
          ? "bg-warning"
          : "bg-info";

    const row = tableBody.insertRow();
    row.innerHTML = `
            <td>${target.id}</td>
            <td>${target.name}</td>
            <td>${target.assignedTo}</td>
            <td>${target.type}</td>
            <td>${target.targetValue}</td>
            <td>${target.currentProgressValue} (${target.currentProgressPercent}%)</td>
            <td>${target.deadline}</td>
            <td><span class="badge ${statusClass}">${target.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info edit-target-btn" data-bs-toggle="modal" data-bs-target="#editTargetModal" data-target-id="${target.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-target-btn" data-target-id="${target.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
  });

  // Update pagination controls and overview cards
  renderPagination(targets.length, page);
  // Initialize listeners for the newly rendered buttons
  setupDeleteTargetListeners();
  setupEditTargetListeners();
  updateOverviewCards(targets);
}

/**
 * Creates and renders the pagination controls.
 * @param {number} totalRows - The total number of targets after filtering/search.
 * @param {number} activePage - The currently active page number.
 */
function renderPagination(totalRows, activePage) {
  const paginationContainer = document.querySelector(
    ".pagination.justify-content-center"
  );
  if (!paginationContainer) return;

  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  paginationContainer.innerHTML = "";

  // Previous Button
  const prevDisabled = activePage === 1 ? "disabled" : "";
  paginationContainer.innerHTML += `
        <li class="page-item ${prevDisabled}" data-page="${activePage - 1}">
            <a class="page-link" href="#">Previous</a>
        </li>
    `;

  // Page Number Buttons
  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === activePage ? "active" : "";
    paginationContainer.innerHTML += `
            <li class="page-item ${activeClass}" data-page="${i}">
                <a class="page-link" href="#">${i}</a>
            </li>
        `;
  }

  // Next Button
  const nextDisabled =
    activePage === totalPages || totalPages === 0 ? "disabled" : "";
  paginationContainer.innerHTML += `
        <li class="page-item ${nextDisabled}" data-page="${activePage + 1}">
            <a class="page-link" href="#">Next</a>
        </li>
    `;

  // Setup listeners for the new page links
  paginationContainer.querySelectorAll(".page-item").forEach((item) => {
    if (!item.classList.contains("disabled")) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        const newPage = parseInt(item.dataset.page);
        if (newPage) {
          currentPage = newPage;
          renderTargets(currentTargets, currentPage);
        }
      });
    }
  });
}

/**
 * Calculates and updates the data in the overview cards.
 * @param {Array} targets - The current array of target objects.
 */
function updateOverviewCards(targets) {
  const totalTargetsEl = document.getElementById("totalTargets");
  const achievedTargetsEl = document.getElementById("achievedTargets");
  const inProgressTargetsEl = document.getElementById("inProgressTargets");
  const behindTargetsEl = document.getElementById("behindTargets");

  const total = targets.length;
  // Assuming Achieved targets are >= 95% complete or explicitly set to 'Complete'
  const achieved = targets.filter(
    (t) => t.currentProgressPercent >= 95 || t.status === "Complete"
  ).length;
  const inProgress = targets.filter(
    (t) =>
      t.currentProgressPercent > 50 &&
      t.currentProgressPercent < 95 &&
      t.status !== "Complete"
  ).length;
  const behind = targets.filter((t) => t.currentProgressPercent <= 50).length;

  if (totalTargetsEl) totalTargetsEl.textContent = total;
  if (achievedTargetsEl) achievedTargetsEl.textContent = achieved;
  if (inProgressTargetsEl) inProgressTargetsEl.textContent = inProgress;
  if (behindTargetsEl) behindTargetsEl.textContent = behind;
}

// --- CRUD Logic (Add/Delete/Edit) ---

/**
 * Sets up the event listener for the 'Set New Target' modal's Save button.
 */
function setupAddTarget() {
  const addTargetModal = document.getElementById("addTargetModal");
  // Using the ID for the Save button
  const saveButton = document.getElementById("saveNewTargetBtn");

  if (saveButton && addTargetModal) {
    saveButton.addEventListener("click", function (e) {
      e.preventDefault();
      const form = document.getElementById("addTargetForm");

      // --- VALIDATION CHECK ---
      if (!form.checkValidity()) {
        // If validation fails, apply Bootstrap's validation styles and stop execution
        form.classList.add("was-validated");
        return;
      }
      // --- END VALIDATION CHECK ---

      addTarget();

      // Close the modal and clear form
      const modalInstance = bootstrap.Modal.getInstance(addTargetModal);
      if (modalInstance) {
        modalInstance.hide();
      }
      form.reset();
      form.classList.remove("was-validated");
    });
  }
}

/**
 * Collects data from the 'Set New Target' form, adds it to the targets, and re-renders.
 */
function addTarget() {
  // Collect all new fields
  const targetName = document.getElementById("targetName").value;
  const targetAssignee = document.getElementById("targetAssignee").value;
  const targetValue = document.getElementById("targetValue").value;
  const currentProgressValue = document.getElementById(
    "currentProgressValue"
  ).value;
  const targetDeadline = document.getElementById("targetDeadline").value;
  const targetType = document.getElementById("targetType").value;
  const targetStatus = document.getElementById("targetStatus").value;

  let allTargets = loadTargets();

  (async function () {
    if (targetsApiMode && String(targetType).toLowerCase() === "sales") {
      try {
        const salesTarget = Math.round(numberFromDisplayValue(targetValue));
        const salesAchievement = Math.round(numberFromDisplayValue(currentProgressValue));
        const created = await apiJson(TARGETS_API_BASE, {
          method: "POST",
          body: JSON.stringify({
            mrName: targetAssignee,
            period: targetName,
            salesTarget: salesTarget,
            visitsTarget: 0,
            startDate: null,
            endDate: targetDeadline,
          }),
        });

        if (created) {
          let saved = created;
          try {
            saved = await apiJson(`${TARGETS_API_BASE}/${created.id}`, {
              method: "PUT",
              body: JSON.stringify({
                mrName: targetAssignee,
                period: targetName,
                salesTarget: salesTarget,
                salesAchievement: salesAchievement,
                visitsTarget: 0,
                visitsAchievement: 0,
                startDate: null,
                endDate: targetDeadline,
                status: uiStatusToApi(targetStatus),
              }),
            });
          } catch (e) {
            console.warn("Target post-create update failed. Falling back to localStorage for progress/status.", e);
            try { showApiRetryBanner(); } catch (err) { }
          }

          const ui = normalizeTargetFromApi(saved || created);
          ui.name = targetName;
          ui.assignedTo = targetAssignee;
          ui.type = targetType;
          ui.targetValue = `₹${salesTarget}`;
          ui.currentProgressValue = `₹${salesAchievement}`;
          ui.currentProgressPercent =
            salesTarget > 0
              ? Math.min(100, Math.round((salesAchievement / salesTarget) * 100))
              : 0;
          ui.deadline = targetDeadline;
          ui.status = targetStatus;

          allTargets.push(ui);
          saveTargets(allTargets);
        }

        currentTargets = filterTargets(
          allTargets,
          document.getElementById("targetSearchInput").value
        );
        currentPage = Math.ceil(currentTargets.length / ROWS_PER_PAGE);
        renderTargets(currentTargets, currentPage);
        return;
      } catch (e) {
        console.warn("Target create API failed. Falling back to localStorage.", e);
        targetsApiMode = false;
        try { showApiRetryBanner(); } catch (err) { }
      }
    }

    let maxIdNumber = 0;
    allTargets.forEach((t) => {
      const num = parseInt(String(t.id).substring(1));
      if (num > maxIdNumber) maxIdNumber = num;
    });
    const newIdNumber = maxIdNumber + 1;
    const newId = "T" + String(newIdNumber).padStart(3, "0");

    const targetNumber = parseFloat(targetValue);
    const progressNumber = parseFloat(currentProgressValue);

    let newProgressPercent = 0;
    if (!isNaN(targetNumber) && targetNumber > 0 && !isNaN(progressNumber)) {
      newProgressPercent = Math.round((progressNumber / targetNumber) * 100);
      if (newProgressPercent > 100) newProgressPercent = 100;
    }

    const newTarget = {
      id: newId,
      name: targetName,
      assignedTo: targetAssignee,
      type: targetType,
      targetValue: targetValue,
      currentProgressValue: currentProgressValue,
      currentProgressPercent: newProgressPercent,
      deadline: targetDeadline,
      status: targetStatus,
    };

    allTargets.push(newTarget);
    saveTargets(allTargets);

    currentTargets = filterTargets(
      allTargets,
      document.getElementById("targetSearchInput").value
    );
    currentPage = Math.ceil(currentTargets.length / ROWS_PER_PAGE);
    renderTargets(currentTargets, currentPage);
  })();
}

/**
 * Sets up event listeners for all delete buttons.
 */
function setupDeleteTargetListeners() {
  document.querySelectorAll(".delete-target-btn").forEach((button) => {
    button.removeEventListener("click", handleDeleteClick);
    button.addEventListener("click", handleDeleteClick);
  });
}

/**
 * Handles the click event for the delete button.
 */
function handleDeleteClick(event) {
  const targetId = event.currentTarget.dataset.targetId;
  if (
    confirm(`Are you sure you want to permanently delete target ${targetId}?`)
  ) {
    deleteTarget(targetId);
  }
}

/**
 * Deletes a target by ID, saves the changes, and re-renders the table.
 * @param {string} targetId - The ID of the target to delete (e.g., 'T001').
 */
function deleteTarget(targetId) {
  let allTargets = loadTargets();

  (async function () {
    if (targetsApiMode && isNumericId(targetId)) {
      try {
        await apiJson(`${TARGETS_API_BASE}/${targetId}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Target delete API failed. Falling back to localStorage.", e);
        targetsApiMode = false;
        try { showApiRetryBanner(); } catch (err) { }
      }
    }

    const initialLength = allTargets.length;
    allTargets = allTargets.filter((target) => String(target.id) !== String(targetId));

    if (allTargets.length < initialLength) {
      saveTargets(allTargets);

      currentTargets = filterTargets(
        allTargets,
        document.getElementById("targetSearchInput").value
      );

      const totalPages = Math.ceil(currentTargets.length / ROWS_PER_PAGE);
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      } else if (totalPages === 0) {
        currentPage = 1;
      }

      renderTargets(currentTargets, currentPage);
    }
  })();
}

/**
 * Sets up event listeners for all edit buttons.
 */
function setupEditTargetListeners() {
  document.querySelectorAll(".edit-target-btn").forEach((button) => {
    button.removeEventListener("click", handleEditClick);
    button.addEventListener("click", handleEditClick);
  });
}

/**
 * Handles the click event for the edit button, loading data into the modal.
 * @param {Event} event - The click event.
 */
function handleEditClick(event) {
  const targetId = event.currentTarget.dataset.targetId;
  const allTargets = loadTargets();
  const targetToEdit = allTargets.find((t) => t.id === targetId);

  if (targetToEdit) {
    // Pre-fill the modal fields
    document.getElementById(
      "editTargetIdDisplay"
    ).textContent = `(${targetToEdit.id})`;
    document.getElementById("editTargetOriginalId").value = targetToEdit.id;
    document.getElementById("editTargetName").value = targetToEdit.name;
    document.getElementById("editTargetAssignee").value =
      targetToEdit.assignedTo;

    // Remove currency/unit symbols before setting value in type="number" input
    // This allows numeric inputs to work correctly.
    const targetValueNumeric = targetToEdit.targetValue.replace(/[^0-9.]/g, "");
    const progressValueNumeric = targetToEdit.currentProgressValue.replace(
      /[^0-9.]/g,
      ""
    );

    document.getElementById("editTargetValue").value = targetValueNumeric;
    document.getElementById("editCurrentProgressValue").value =
      progressValueNumeric;

    // Ensure date is in YYYY-MM-DD format for input[type="date"]
    document.getElementById("editTargetDeadline").value = targetToEdit.deadline;

    // Set value for the new <select> dropdown
    document.getElementById("editTargetType").value = targetToEdit.type;
    document.getElementById("editTargetStatus").value = targetToEdit.status;
  }
}

/**
 * Updates the target data with the values from the edit modal.
 */
function updateTarget() {
  const targetId = document.getElementById("editTargetOriginalId").value;

  // Collect updated data
  const updatedName = document.getElementById("editTargetName").value;
  const updatedAssignee = document.getElementById("editTargetAssignee").value;
  // Get raw numeric values from the number inputs
  const updatedValueRaw = document.getElementById("editTargetValue").value;
  const updatedProgressValueRaw = document.getElementById(
    "editCurrentProgressValue"
  ).value;
  const updatedDeadline = document.getElementById("editTargetDeadline").value;
  const updatedType = document.getElementById("editTargetType").value;
  const updatedStatus = document.getElementById("editTargetStatus").value;

  let allTargets = loadTargets();
  const targetIndex = allTargets.findIndex((t) => t.id === targetId);

  if (targetIndex !== -1) {
    const originalTarget = allTargets[targetIndex];
    let displayTargetValue = updatedValueRaw;
    let displayProgressValue = updatedProgressValueRaw;

    // --- Logic to preserve original formatting ---
    // If the original target had currency or units, prepend/append them back.
    if (
      originalTarget.targetValue.startsWith("₹") &&
      !updatedValueRaw.startsWith("₹")
    ) {
      displayTargetValue = `₹${updatedValueRaw}`;
    } else if (
      originalTarget.targetValue.endsWith(" visits") &&
      !updatedValueRaw.endsWith(" visits")
    ) {
      displayTargetValue = `${updatedValueRaw} visits`;
    } else if (
      originalTarget.targetValue.endsWith(" units") &&
      !updatedValueRaw.endsWith(" units")
    ) {
      displayTargetValue = `${updatedValueRaw} units`;
    } else if (
      originalTarget.targetValue.endsWith(" sessions") &&
      !updatedValueRaw.endsWith(" sessions")
    ) {
      displayTargetValue = `${updatedValueRaw} sessions`;
    } else if (
      originalTarget.targetValue.endsWith(" areas") &&
      !updatedValueRaw.endsWith(" areas")
    ) {
      displayTargetValue = `${updatedValueRaw} areas`;
    }

    // Check progress value formatting
    if (
      originalTarget.currentProgressValue.startsWith("₹") &&
      !updatedProgressValueRaw.startsWith("₹")
    ) {
      displayProgressValue = `₹${updatedProgressValueRaw}`;
    } else if (
      originalTarget.currentProgressValue.endsWith(" visits") &&
      !updatedProgressValueRaw.endsWith(" visits")
    ) {
      displayProgressValue = `${updatedProgressValueRaw} visits`;
    } else if (
      originalTarget.currentProgressValue.endsWith(" units") &&
      !updatedProgressValueRaw.endsWith(" units")
    ) {
      displayProgressValue = `${updatedProgressValueRaw} units`;
    } else if (
      originalTarget.currentProgressValue.endsWith(" sessions") &&
      !updatedProgressValueRaw.endsWith(" sessions")
    ) {
      displayProgressValue = `${updatedProgressValueRaw} sessions`;
    } else if (
      originalTarget.currentProgressValue.endsWith(" areas") &&
      !updatedProgressValueRaw.endsWith(" areas")
    ) {
      displayProgressValue = `${updatedProgressValueRaw} areas`;
    }

    // Convert to actual numbers for calculation
    const targetNumber = parseFloat(updatedValueRaw);
    const progressNumber = parseFloat(updatedProgressValueRaw);

    let newProgressPercent = 0;
    if (!isNaN(targetNumber) && targetNumber > 0 && !isNaN(progressNumber)) {
      newProgressPercent = Math.round((progressNumber / targetNumber) * 100);
      if (newProgressPercent > 100) newProgressPercent = 100;
    }

    // Apply updates to the target object
    allTargets[targetIndex].name = updatedName;
    allTargets[targetIndex].assignedTo = updatedAssignee;
    allTargets[targetIndex].type = updatedType;
    // Store the formatted values back for display
    allTargets[targetIndex].targetValue = displayTargetValue;
    allTargets[targetIndex].currentProgressValue = displayProgressValue;
    allTargets[targetIndex].currentProgressPercent = newProgressPercent;
    allTargets[targetIndex].deadline = updatedDeadline;
    allTargets[targetIndex].status = updatedStatus;

    (async function () {
      if (targetsApiMode && isNumericId(targetId) && String(updatedType).toLowerCase() === "sales") {
        try {
          const salesTarget = Math.round(numberFromDisplayValue(displayTargetValue));
          const salesAchievement = Math.round(numberFromDisplayValue(displayProgressValue));
          const updated = await apiJson(`${TARGETS_API_BASE}/${targetId}`, {
            method: "PUT",
            body: JSON.stringify({
              mrName: updatedAssignee,
              period: updatedName,
              salesTarget: salesTarget,
              salesAchievement: salesAchievement,
              visitsTarget: 0,
              visitsAchievement: 0,
              startDate: null,
              endDate: updatedDeadline,
              status: uiStatusToApi(updatedStatus),
            }),
          });

          if (updated) {
            const ui = normalizeTargetFromApi(updated);
            ui.name = updatedName;
            ui.assignedTo = updatedAssignee;
            ui.type = updatedType;
            ui.targetValue = displayTargetValue.startsWith("₹") ? displayTargetValue : `₹${salesTarget}`;
            ui.currentProgressValue = displayProgressValue.startsWith("₹") ? displayProgressValue : `₹${salesAchievement}`;
            ui.currentProgressPercent = newProgressPercent;
            ui.deadline = updatedDeadline;
            ui.status = updatedStatus;
            allTargets[targetIndex] = ui;
          }
        } catch (e) {
          console.warn("Target update API failed. Falling back to localStorage.", e);
          targetsApiMode = false;
          try { showApiRetryBanner(); } catch (err) { }
        }
      }

      saveTargets(allTargets);
      currentTargets = filterTargets(
        allTargets,
        document.getElementById("targetSearchInput").value
      );
      renderTargets(currentTargets, currentPage);
    })();
  }
}

/**
 * Sets up the event listener for the 'Update Target' button in the edit modal.
 */
function setupSaveEditListener() {
  const saveButton = document.getElementById("saveEditTargetBtn");
  const editTargetModal = document.getElementById("editTargetModal");

  if (saveButton) {
    saveButton.addEventListener("click", function (e) {
      e.preventDefault();
      const form = document.getElementById("editTargetForm");

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      updateTarget();

      // Close the modal
      const modalInstance = bootstrap.Modal.getInstance(editTargetModal);
      if (modalInstance) {
        modalInstance.hide();
      }
      form.classList.remove("was-validated");
    });
  }
}

// --- Search and Filter Logic ---

/**
 * Filters the list of targets based on the search input value.
 * @param {Array} targets - The full array of targets.
 * @param {string} filterText - The text to filter by.
 * @returns {Array} The filtered array.
 */
function filterTargets(targets, filterText) {
  const filter = filterText.toUpperCase();
  if (!filter) return targets;

  return targets.filter((target) => {
    // Check all relevant fields (excluding the 'Actions' column which is not in the object)
    const searchableFields = [
      target.id,
      target.name,
      target.assignedTo,
      target.type,
      target.targetValue,
      target.currentProgressValue,
      `${target.currentProgressPercent}%`,
      target.deadline,
      target.status,
    ];

    return searchableFields.some((field) =>
      String(field).toUpperCase().includes(filter)
    );
  });
}

/**
 * Sets up the functionality for searching and filtering the target table.
 */
function setupTargetSearch() {
  const searchInput = document.getElementById("targetSearchInput");

  if (!searchInput) {
    console.error("Search input element not found.");
    return;
  }

  searchInput.addEventListener("keyup", function () {
    const allTargets = loadTargets();
    currentTargets = filterTargets(allTargets, searchInput.value);

    // Reset to the first page after applying a new search filter
    currentPage = 1;
    renderTargets(currentTargets, currentPage);
  });
}

// Prevent selecting past dates in Deadline field in Add Target modal
const deadlineInput = document.getElementById("targetDeadline");
if (deadlineInput) {
  const today = new Date().toISOString().split("T")[0];
  deadlineInput.setAttribute("min", today);
}

// --- Main Initialization ---
document.addEventListener("DOMContentLoaded", function () {
  // 1. Load targets from storage and set as the initial current list
  const allTargets = loadTargets();
  currentTargets = allTargets;

  // 2. Render the first page of targets and pagination controls
  renderTargets(currentTargets, currentPage);

  (async function () {
    await refreshTargetsFromApiOrFallback();
    currentPage = 1;
    renderTargets(currentTargets, currentPage);
  })();

  // 3. Initialize search, add, and EDIT target functionality
  setupTargetSearch();
  setupAddTarget();
  setupSaveEditListener();
});

// --- Notification Popup Logic ---
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
