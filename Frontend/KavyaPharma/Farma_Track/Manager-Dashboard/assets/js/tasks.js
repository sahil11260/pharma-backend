/* ---------------------------
   Top-level Mock Data (accessible to global functions)
   --------------------------- */
// MR list will be loaded from the backend when available. Start empty as fallback.
let mrData = [];

// Initial mock data used if nothing is found in localStorage
const initialTasksData = [
  {
    id: 1,
    title: "Visit Dr. Sharma at Apollo Hospital",
    type: "doctor-visit",
    assignedTo: "Rajesh Kumar",
    priority: "high",
    status: "pending",
    dueDate: "2025-11-15",
    location: "Apollo Hospital, Delhi",
    description:
      "Discuss new medication promotion and gather feedback on current products.",
    createdDate: "2025-11-08",
  },
  {
    id: 2,
    title: "Promote new diabetes medication",
    type: "promotion",
    assignedTo: "Priya Sharma",
    priority: "medium",
    status: "in-progress",
    dueDate: "2025-11-20",
    location: "South Delhi Clinics",
    description:
      "Promote the new diabetes medication to 10 doctors in South Delhi region.",
    createdDate: "2025-11-07",
  },
  {
    id: 3,
    title: "Team meeting for Q4 targets",
    type: "meeting",
    assignedTo: "Amit Singh",
    priority: "high",
    status: "completed",
    dueDate: "2025-11-10",
    location: "Head Office Conference Room",
    description:
      "Quarterly review meeting with all MRs to discuss Q4 targets and strategies.",
    createdDate: "2025-11-05",
  },
  {
    id: 4,
    title: "Product training session",
    type: "training",
    assignedTo: "Sneha Patel",
    priority: "medium",
    status: "pending",
    dueDate: "2025-11-18",
    location: "Training Center, Gurgaon",
    description:
      "Training session on new product features and usage guidelines.",
    createdDate: "2025-11-08",
  },
  {
    id: 5,
    title: "Follow-up with Dr. Gupta",
    type: "doctor-visit",
    assignedTo: "Manish Patel",
    priority: "low",
    status: "overdue",
    dueDate: "2025-11-05",
    location: "City Hospital, Delhi",
    description:
      "Follow-up visit to check on patient feedback and restock requirements.",
    createdDate: "2025-11-01",
  },
  {
    id: 6,
    title: "Cardiology promotion campaign",
    type: "promotion",
    assignedTo: "Kavita Jain",
    priority: "high",
    status: "in-progress",
    dueDate: "2025-11-25",
    location: "North Delhi Hospitals",
    description:
      "Launch promotion campaign for new cardiology medications across North Delhi.",
    createdDate: "2025-11-06",
  },
];

let tasksData = []; // This will be populated from localStorage
let filteredTasks = []; // current filtered dataset shown in table

/* ---------------------------
   Pagination configuration
   --------------------------- */
let currentPage = 1;
const pageSize = 5; // change to 10 or make selectable if you want

const API_BASE = "https://pharma-backend-hxf9.onrender.com";
const TASKS_API_BASE = `${API_BASE}/api/tasks`;
const USERS_API_BASE = `${API_BASE}/api/users`;
let tasksApiMode = true;

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

function toUpdatePayload(task) {
  return {
    title: task.title,
    type: task.type,
    assignedTo: task.assignedTo,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate || null,
    location: task.location || "",
    description: task.description || ""
  };
}

async function refreshTasksFromApiOrFallback() {
  try {
    const data = await apiJson(TASKS_API_BASE);
    if (Array.isArray(data)) {
      tasksData = data.map((t) => ({
        id: Number(t.id),
        title: t.title,
        type: t.type,
        assignedTo: t.assignedTo,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate || null,
        location: t.location,
        description: t.description,
        createdDate: t.createdDate
      }));
      saveTasksData();
      filteredTasks = tasksData.slice();
      tasksApiMode = true;
      // Hide any retry banner if previously shown
      try { hideTasksApiRetryBanner(); } catch (e) { }
      return;
    }
    tasksApiMode = false;
  } catch (e) {
    console.warn("Tasks API unavailable, using localStorage.", e);
    tasksApiMode = false;
    try { showTasksApiRetryBanner(); } catch (err) { }
  }
}

async function createTaskApi(newData) {
  const payload = {
    title: newData.title,
    type: newData.type,
    assignedTo: newData.assignedTo,
    priority: newData.priority,
    dueDate: newData.dueDate || null,
    location: newData.location || "",
    description: newData.description || ""
  };
  return await apiJson(TASKS_API_BASE, { method: "POST", body: JSON.stringify(payload) });
}

async function updateTaskApi(id, task) {
  return await apiJson(`${TASKS_API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(toUpdatePayload(task)) });
}

async function deleteTaskApi(id) {
  await apiJson(`${TASKS_API_BASE}/${id}`, { method: "DELETE" });
}

/* ---------------------------
   LocalStorage Persistence
   --------------------------- */
function loadTasksData() {
  const storedData = localStorage.getItem("kavyaPharmTasks");
  if (storedData) {
    try {
      tasksData = JSON.parse(storedData);
      // Ensure all task IDs are numbers
      tasksData = tasksData.map((task) => ({
        ...task,
        id: Number(task.id),
      }));
    } catch (e) {
      console.error("Error parsing tasks from localStorage:", e);
      tasksData = [];
    }
  } else {
    // start empty; we'll prefer API-loaded data and use localStorage only as fallback
    tasksData = [];
  }
  // initialize filteredTasks to full dataset
  filteredTasks = tasksData.slice();
}

function saveTasksData() {
  localStorage.setItem("kavyaPharmTasks", JSON.stringify(tasksData));
}

// Tasks API retry banner (shows when backend is unreachable)
function showTasksApiRetryBanner() {
  if (document.getElementById("tasksApiRetryBanner")) return;
  const banner = document.createElement("div");
  banner.id = "tasksApiRetryBanner";
  banner.className = "alert alert-warning text-center";
  banner.style.margin = "10px 0";
  banner.innerHTML = '<strong>Tasks API unreachable.</strong> Some actions will use local data. ' +
    '<button id="tasksApiRetryBtn" class="btn btn-sm btn-outline-primary ms-2">Retry</button>';
  const container = document.querySelector(".container") || document.body;
  container.insertBefore(banner, container.firstChild);
  document.getElementById("tasksApiRetryBtn").addEventListener("click", async function () {
    hideTasksApiRetryBanner();
    try {
      await refreshTasksFromApiOrFallback();
      applyFilters();
    } catch (e) {
      showTasksApiRetryBanner();
    }
  });
}

function hideTasksApiRetryBanner() {
  const b = document.getElementById("tasksApiRetryBanner");
  if (b && b.parentNode) b.parentNode.removeChild(b);
}

/* ---------------------------
   Utilities
   --------------------------- */
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString.replace(/-/g, "/")); // Use replace for better cross-browser date parsing
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function uid() {
  return "id_" + Math.random().toString(36).slice(2, 10);
}
function showToast(title, message, delay = 2500) {
  // simple toast implementation using Bootstrap toasts
  const containerId = "__task_toast_container";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(container);
  }
  const tId = uid();
  const el = document.createElement("div");
  el.className = "toast";
  el.id = tId;
  el.role = "alert";
  el.ariaLive = "assertive";
  el.ariaAtomic = "true";
  el.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${escapeHtml(title)}</strong>
        <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${escapeHtml(message)}</div>
    `;
  container.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

/* ---------------------------
   Modal fallback creators (edit modal and status modal)
   --------------------------- */
function ensureEditTaskModalExists() {
  // We'll reuse #createTaskModal if exists. Otherwise create a small edit modal.
  if (document.getElementById("createTaskModal")) return; // assume create modal already exists
  if (document.getElementById("editTaskModal")) return;

  const html = `
    <div class="modal fade" id="editTaskModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Task</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="editTaskForm">
              <input type="hidden" id="editTask_id" />
              <div class="mb-2">
                <label class="form-label">Title</label>
                <input id="editTask_title" class="form-control" required />
              </div>
              <div class="row g-2">
                <div class="col-md-6">
                  <label class="form-label">Type</label>
                  <select id="editTask_type" class="form-select">
                    <option value="doctor-visit">Doctor Visit</option>
                    <option value="promotion">Promotion</option>
                    <option value="meeting">Meeting</option>
                    <option value="training">Training</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Assigned To</label>
                  <select id="editTask_assignedTo" class="form-select"></select>
                </div>
              </div>
              <div class="row g-2 mt-2">
                <div class="col-md-4">
                  <label class="form-label">Priority</label>
                  <select id="editTask_priority" class="form-select">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Status</label>
                  <select id="editTask_status" class="form-select">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Due Date</label>
                  <input id="editTask_dueDate" type="date" class="form-control" />
                </div>
              </div>
              <div class="mb-2 mt-2">
                <label class="form-label">Location</label>
                <input id="editTask_location" class="form-control" />
              </div>
              <div class="mb-2">
                <label class="form-label">Description</label>
                <textarea id="editTask_description" rows="3" class="form-control"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button id="editTaskSaveBtn" class="btn btn-primary">Save Changes</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);

  // populate assignedTo select on modal open and wire save handler
  document.getElementById("editTaskSaveBtn").addEventListener("click", () => {
    const form = document.getElementById("editTaskForm");
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const id = Number(document.getElementById("editTask_id").value);
    const task = tasksData.find((t) => t.id === id);
    if (!task) {
      showToast("Error", "Task not found.");
      bootstrap.Modal.getInstance(
        document.getElementById("editTaskModal")
      ).hide();
      return;
    }
    // update fields
    task.title = document.getElementById("editTask_title").value;
    task.type = document.getElementById("editTask_type").value;
    task.assignedTo = document.getElementById("editTask_assignedTo").value;
    task.priority = document.getElementById("editTask_priority").value;
    task.status = document.getElementById("editTask_status").value;
    task.dueDate = document.getElementById("editTask_dueDate").value || null;
    task.location = document.getElementById("editTask_location").value;
    task.description = document.getElementById("editTask_description").value;

    (async function () {
      if (tasksApiMode) {
        try {
          await updateTaskApi(id, task);
          await refreshTasksFromApiOrFallback();
        } catch (e) {
          console.warn("Task update API failed. Falling back to localStorage.", e);
          tasksApiMode = false;
        }
      }

      // *** PERSISTENCE CHANGE: Save to localStorage ***
      saveTasksData();
      // re-render UI (apply filters if active)
      applyFilters();
      showToast("Saved", "Task updated successfully.");
      bootstrap.Modal.getInstance(
        document.getElementById("editTaskModal")
      ).hide();
    })();
  });
}

function ensureStatusModalExists() {
  if (document.getElementById("updateStatusModal")) return;
  const html = `
    <div class="modal fade" id="updateStatusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Update Task Status</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="updateStatus_taskId" />
            <div class="mb-2">
              <label class="form-label">New Status</label>
              <select id="updateStatus_select" class="form-select">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button id="updateStatusSaveBtn" class="btn btn-primary">Update</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);

  document
    .getElementById("updateStatusSaveBtn")
    .addEventListener("click", () => {
      const id = Number(document.getElementById("updateStatus_taskId").value);
      const newStatus = document.getElementById("updateStatus_select").value;
      const task = tasksData.find((t) => t.id === id);
      if (!task) {
        showToast("Error", "Task not found.");
        bootstrap.Modal.getInstance(
          document.getElementById("updateStatusModal")
        ).hide();
        return;
      }
      task.status = newStatus;

      (async function () {
        if (tasksApiMode) {
          try {
            await updateTaskApi(id, task);
            await refreshTasksFromApiOrFallback();
          } catch (e) {
            console.warn("Task status update API failed. Falling back to localStorage.", e);
            tasksApiMode = false;
          }
        }

        // *** PERSISTENCE Change: Save to localStorage ***
        saveTasksData();

        // re-render UI (apply filters if active)
        applyFilters();
        showToast("Updated", `Status updated to "${newStatus}".`);
        bootstrap.Modal.getInstance(
          document.getElementById("updateStatusModal")
        ).hide();
      })();
    });
}

/* ---------------------------
   Rendering & Helpers
   --------------------------- */
function populateMRDropdown(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Select MR";
  selectEl.appendChild(defaultOpt);
  mrData.forEach((mr) => {
    const opt = document.createElement("option");
    opt.value = mr.name;
    opt.textContent = mr.name;
    selectEl.appendChild(opt);
  });
}

// Fetch MR list from backend users API (role == 'MR') and populate mrData
async function refreshMrList() {
  try {
    const users = await apiJson(USERS_API_BASE);
    if (Array.isArray(users)) {
      mrData = users
        .filter((u) => u && String(u.role) === "MR")
        .map((u) => ({ id: Number(u.id), name: u.name }));
      // hide any retry banner if present
      try { hideTasksApiRetryBanner(); } catch (e) { }
      return;
    }
    // no change to mrData if API returns unexpected data
  } catch (e) {
    console.warn("Could not load MR list from API, using local fallback.", e);
    try { showTasksApiRetryBanner(); } catch (err) { }
  }
}

function getTaskTypeIcon(type) {
  const icons = {
    "doctor-visit": "bi bi-hospital",
    promotion: "bi bi-megaphone",
    meeting: "bi bi-people",
    training: "bi bi-book",
  };
  return icons[type] || "bi bi-clipboard";
}
function getStatusBadge(status) {
  const badges = {
    pending: '<span class="badge bg-warning">Pending</span>',
    "in-progress": '<span class="badge bg-primary">In Progress</span>',
    completed: '<span class="badge bg-success">Completed</span>',
    overdue: '<span class="badge bg-danger">Overdue</span>',
  };
  return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}
function getPriorityBadge(priority) {
  const badges = {
    high: '<span class="badge bg-danger">High</span>',
    medium: '<span class="badge bg-warning">Medium</span>',
    low: '<span class="badge bg-success">Low</span>',
  };
  return badges[priority] || '<span class="badge bg-secondary">Normal</span>';
}

/* ---------------------------
   Pagination: render table in pages
   --------------------------- */
function renderTaskTable(data, page = 1) {
  const tasksList = document.getElementById("tasksList");
  if (!tasksList) return;
  tasksList.innerHTML = "";

  // pagination logic
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;
  currentPage = page;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = data.slice(start, end);

  pageItems.forEach((task) => {
    const typeIcon = getTaskTypeIcon(task.type);
    const statusBadge = getStatusBadge(task.status);
    const priorityBadge = getPriorityBadge(task.priority);

    const row = document.createElement("tr");
    // Removed the Type <td> here (Type column removed from table)
    row.innerHTML = `
        <td><i class="${typeIcon} me-2"></i>${escapeHtml(task.title)}</td>
        <td>${escapeHtml(task.assignedTo)}</td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td>${formatDate(task.dueDate)}</td>
        <td>${task.location ? escapeHtml(task.location) : "-"}</td>
        <td>
          <div class="d-flex flex-row flex-nowrap align-items-center justify-content-center">
            <button aria-label="Edit task" class="btn btn-outline-primary btn-sm btn-edit me-1" data-id="${task.id}">
              <i class="bi bi-pencil"></i>
            </button>
            <button aria-label="Update status" class="btn btn-outline-success btn-sm btn-update me-1" data-id="${task.id}">
              <i class="bi bi-check-circle"></i>
            </button>
            <button aria-label="Delete task" class="btn btn-outline-danger btn-sm btn-delete" data-id="${task.id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
    tasksList.appendChild(row);
  });

  // Attach handlers
  tasksList.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.removeEventListener("click", onEditClick);
    btn.addEventListener("click", onEditClick);
  });
  tasksList.querySelectorAll(".btn-update").forEach((btn) => {
    btn.removeEventListener("click", onUpdateClick);
    btn.addEventListener("click", onUpdateClick);
  });
  tasksList.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.removeEventListener("click", onDeleteClick);
    btn.addEventListener("click", onDeleteClick);
  });

  renderPagination(total, page, pageSize);
}

/* ---------------------------
   Summary cards
   --------------------------- */
function renderSummaryCards(data) {
  const summaryCards = document.getElementById("summaryCards");
  if (!summaryCards) return;
  const pending = data.filter((t) => t.status === "pending").length;
  const inProgress = data.filter((t) => t.status === "in-progress").length;
  const completed = data.filter((t) => t.status === "completed").length;
  const overdue = data.filter((t) => t.status === "overdue").length;

  summaryCards.innerHTML = `
      <div class="col-md-3 mb-2">
        <div class="card summary-card summary-pending">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-0">${pending}</h3>
              <h6 class="mb-0">Pending</h6>
            </div>
            <div class="card-icon fs-2 text-muted">
              <i class="bi bi-clock"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-2">
        <div class="card summary-card summary-progress">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-0">${inProgress}</h3>
              <h6 class="mb-0">In Progress</h6>
            </div>
            <div class="card-icon fs-2 text-muted">
              <i class="bi bi-play-circle"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-2">
        <div class="card summary-card summary-completed">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-0">${completed}</h3>
              <h6 class="mb-0">Completed</h6>
            </div>
            <div class="card-icon fs-2 text-muted">
              <i class="bi bi-check-circle"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-2">
        <div class="card summary-card summary-overdue">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-0">${overdue}</h3>
              <h6 class="mb-0">Overdue</h6>
            </div>
            <div class="card-icon fs-2 text-muted">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
          </div>
        </div>
      </div>
    `;
}

/* ---------------------------
   Pagination rendering
   --------------------------- */
function renderPagination(totalItems, page, perPage) {
  const nav = document.getElementById("paginationNav");
  if (!nav) return;
  nav.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const makePageItem = (label, targetPage, disabled = false, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (disabled) return;
      applyPagination(targetPage);
    });
    li.appendChild(a);
    return li;
  };

  // Prev
  ul.appendChild(makePageItem("Prev", Math.max(1, page - 1), page === 1));

  // show up to 5 pages
  const maxPagesToShow = 5;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    ul.appendChild(makePageItem(String(p), p, false, p === page));
  }

  // Next
  ul.appendChild(makePageItem("Next", Math.min(totalPages, page + 1), page === totalPages));

  nav.appendChild(ul);
}

function applyPagination(page) {
  currentPage = page;
  renderTaskTable(filteredTasks, page);
}

/* ---------------------------
   Button handlers (edit/update/delete)
   --------------------------- */
function onEditClick(e) {
  const id = Number(e.currentTarget.dataset.id);
  editTask(id);
}
function onUpdateClick(e) {
  const id = Number(e.currentTarget.dataset.id);
  // Get current status to pre-select in modal
  const currentStatus = tasksData.find((t) => t.id === id)?.status;
  updateTaskStatus(id, currentStatus);
}
function onDeleteClick(e) {
  const id = Number(e.currentTarget.dataset.id);
  deleteTask(id);
}

/* ---------------------------
   Global functions (exposed)
   --------------------------- */
function editTask(taskId) {
  // Open edit modal (reuse createTaskModal if present)
  const task = tasksData.find((t) => t.id === Number(taskId));
  if (!task) {
    showToast("Error", "Task not found.");
    return;
  }

  // If createTaskModal exists in DOM, reuse it for editing (safer for your existing HTML)
  const createModalEl = document.getElementById("createTaskModal");
  if (createModalEl) {
    const form = document.getElementById("createTaskForm");
    if (!form) {
      showToast("Error", "Create form missing.");
      return;
    }
    // mark form as edit mode by using data attribute
    form.dataset.editId = String(task.id);

    // populate fields (IDs assumed from your original markup)
    const titleEl = document.getElementById("taskTitle");
    const typeEl = document.getElementById("taskType");
    const assignedEl = document.getElementById("assignedTo");
    const priorityEl = document.getElementById("taskPriority");
    const dueDateEl = document.getElementById("dueDate");
    const locationEl = document.getElementById("taskLocation");
    const descEl = document.getElementById("taskDescription");

    if (assignedEl) {
      // ensure assigned dropdown is populated
      if (!assignedEl.options.length) populateMRDropdown(assignedEl);
    }

    if (titleEl) titleEl.value = task.title || "";
    if (typeEl) typeEl.value = task.type || "";
    if (assignedEl) assignedEl.value = task.assignedTo || "";
    if (priorityEl) priorityEl.value = task.priority || "medium";
    if (dueDateEl) dueDateEl.value = task.dueDate || "";
    if (locationEl) locationEl.value = task.location || "";
    if (descEl) descEl.value = task.description || "";

    // update modal title & save button text
    const modalTitle = createModalEl.querySelector(".modal-title");
    if (modalTitle)
      modalTitle.innerHTML = '<i class="bi bi-pencil"></i> Edit Task';
    const saveBtn = document.getElementById("saveTaskBtn");
    if (saveBtn) saveBtn.textContent = "Save Changes";

    const modal = new bootstrap.Modal(createModalEl);
    modal.show();
    return;
  }

  // If no create modal to reuse, ensure separate edit modal exists and use it
  ensureEditTaskModalExists();
  // populate assignedTo select
  populateMRDropdown(document.getElementById("editTask_assignedTo"));

  document.getElementById("editTask_id").value = String(task.id);
  document.getElementById("editTask_title").value = task.title || "";
  document.getElementById("editTask_type").value = task.type || "doctor-visit";
  document.getElementById("editTask_assignedTo").value = task.assignedTo || "";
  document.getElementById("editTask_priority").value =
    task.priority || "medium";
  document.getElementById("editTask_status").value = task.status || "pending";
  document.getElementById("editTask_dueDate").value = task.dueDate || "";
  document.getElementById("editTask_location").value = task.location || "";
  document.getElementById("editTask_description").value =
    task.description || "";

  const modal = new bootstrap.Modal(document.getElementById("editTaskModal"));
  modal.show();
}

function updateTaskStatus(taskId, currentStatus) {
  // open small status modal
  ensureStatusModalExists();
  document.getElementById("updateStatus_taskId").value = String(taskId);
  if (currentStatus) {
    const sel = document.getElementById("updateStatus_select");
    if (sel) sel.value = currentStatus;
  }
  const modal = new bootstrap.Modal(
    document.getElementById("updateStatusModal")
  );
  modal.show();
}

function deleteTask(taskId) {
  const idx = tasksData.findIndex((t) => t.id === Number(taskId));
  if (idx === -1) {
    showToast("Error", "Task not found.");
    return;
  }
  if (
    !confirm(`Are you sure you want to delete task "${tasksData[idx].title}"?`)
  )
    return;

  (async function () {
    const id = Number(taskId);
    if (tasksApiMode) {
      try {
        await deleteTaskApi(id);
        await refreshTasksFromApiOrFallback();
        applyFilters();
        showToast("Deleted", "Task removed successfully.");
        return;
      } catch (e) {
        console.warn("Task delete API failed. Falling back to localStorage.", e);
        tasksApiMode = false;
      }
    }

    // remove from array
    tasksData.splice(idx, 1);

    // *** PERSISTENCE CHANGE: Save to localStorage ***
    saveTasksData();

    // re-render UI
    applyFilters();
    showToast("Deleted", "Task removed successfully.");
  })();
}

/* ---------------------------
   Add / Save (Create modal reuse) - handle both create & edit
   --------------------------- */
function initCreateTaskHandler() {
  const modalEl = document.getElementById("createTaskModal");
  if (!modalEl) return;
  const saveTaskBtn = document.getElementById("saveTaskBtn");
  if (!saveTaskBtn) return;

  // Reset modal state when it's closed
  modalEl.addEventListener("hidden.bs.modal", () => {
    const form = document.getElementById("createTaskForm");
    if (form) {
      delete form.dataset.editId;
      form.reset();
    }
    const modalTitle = modalEl.querySelector(".modal-title");
    if (modalTitle)
      modalTitle.innerHTML =
        '<i class="bi bi-plus-circle"></i> Create New Task';
    if (saveTaskBtn) saveTaskBtn.textContent = "Create Task";
  });

  // Event listener for the "Create Task" button
  saveTaskBtn.addEventListener("click", () => {
    const form = document.getElementById("createTaskForm");
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // detect edit mode
    const editId = form.dataset.editId ? Number(form.dataset.editId) : null;

    const newData = {
      title: document.getElementById("taskTitle").value,
      type: document.getElementById("taskType").value,
      assignedTo: document.getElementById("assignedTo").value,
      priority: document.getElementById("taskPriority").value,
      dueDate: document.getElementById("dueDate").value || null,
      location: document.getElementById("taskLocation").value,
      description: document.getElementById("taskDescription").value,
    };

    (async function () {
      if (tasksApiMode) {
        try {
          if (editId) {
            const task = tasksData.find((t) => t.id === editId);
            if (!task) {
              showToast("Error", "Task not found.");
              return;
            }
            task.title = newData.title;
            task.type = newData.type;
            task.assignedTo = newData.assignedTo;
            task.priority = newData.priority;
            task.dueDate = newData.dueDate;
            task.location = newData.location;
            task.description = newData.description;
            await updateTaskApi(editId, task);
            showToast("Saved", "Task updated successfully.");
          } else {
            await createTaskApi(newData);
            showToast("Created", "New task created.");
          }
          await refreshTasksFromApiOrFallback();
          applyFilters();

          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          return;
        } catch (e) {
          console.warn("Task save API failed. Falling back to localStorage.", e);
          tasksApiMode = false;
        }
      }

      if (editId) {
        // update existing
        const task = tasksData.find((t) => t.id === editId);
        if (!task) {
          showToast("Error", "Task not found.");
          return;
        }
        task.title = newData.title;
        task.type = newData.type;
        task.assignedTo = newData.assignedTo;
        task.priority = newData.priority;
        // task.status is preserved unless status is exposed in create/edit form
        task.dueDate = newData.dueDate;
        task.location = newData.location;
        task.description = newData.description;

        showToast("Saved", "Task updated successfully.");
      } else {
        // create new
        const id = tasksData.length
          ? Math.max(...tasksData.map((t) => t.id)) + 1
          : 1;
        const createdDate = new Date().toISOString().split("T")[0];
        const newTask = {
          id,
          ...newData,
          status: "pending", // New tasks start as pending
          createdDate,
        };
        tasksData.push(newTask);
        showToast("Created", "New task created.");
      }

      // *** PERSISTENCE CHANGE: Save to localStorage (both create & edit) ***
      saveTasksData();

      // re-render UI
      applyFilters();

      // hide modal
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    })();

    // The 'hidden.bs.modal' listener will handle form reset and title change
  });
}

/* ---------------------------
   Filters & Search + helper applyFilters
   --------------------------- */
function applyFilters() {
  const filterStatus = document.getElementById("filterStatus");
  const filterPriority = document.getElementById("filterPriority");
  const filterType = document.getElementById("filterType");
  const searchInput = document.getElementById("searchTask");

  let filteredData = tasksData.slice();
  if (filterStatus && filterStatus.value) {
    filteredData = filteredData.filter((task) => task.status === filterStatus.value);
  }
  if (filterPriority && filterPriority.value) {
    filteredData = filteredData.filter((task) => task.priority === filterPriority.value);
  }
  if (filterType && filterType.value) {
    filteredData = filteredData.filter((task) => task.type === filterType.value);
  }
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    filteredData = filteredData.filter(
      (task) =>
        (task.title && task.title.toLowerCase().includes(searchTerm)) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(searchTerm)) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
    );
  }

  filteredTasks = filteredData;
  // reset to first page on filter change
  currentPage = 1;
  renderTaskTable(filteredTasks, currentPage);
  renderSummaryCards(tasksData);
}

/* ---------------------------
   Init: wire up everything & initial render
   --------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  // load persisted data
  loadTasksData();

  // sidebar & theme toggles (safe-guard if elements exist)
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  if (sidebarToggle && sidebar && mainContent) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      mainContent.classList.toggle("expanded");
      // small responsive behavior: hide/show sidebar
      if (sidebar.classList.contains("collapsed")) {
        sidebar.style.display = "none";
        document.querySelector(".main-content").style.marginLeft = "0";
      } else {
        sidebar.style.display = "";
        document.querySelector(".main-content").style.marginLeft = "240px";
      }
    });
  }
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    // Load theme
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
      // adjust icon
      themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
    }
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      themeToggle.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
    });
  }

  // populate MR dropdown in create form (if present) - prefer API
  const assignedToSelect = document.getElementById("assignedTo");
  if (assignedToSelect) {
    try {
      await refreshMrList();
    } catch (e) {
      console.warn("refreshMrList failed", e);
    }
    populateMRDropdown(assignedToSelect);
  }

  (async function () {
    await refreshTasksFromApiOrFallback();
    // initial render (use filteredTasks so pagination works)
    filteredTasks = tasksData.slice();
    renderTaskTable(filteredTasks, currentPage);
    renderSummaryCards(tasksData);
  })();

  // search
  const searchInput = document.getElementById("searchTask");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilters();
    });
  }

  // filters
  const filterStatus = document.getElementById("filterStatus");
  const filterPriority = document.getElementById("filterPriority");
  const filterType = document.getElementById("filterType");
  if (filterStatus) filterStatus.addEventListener("change", applyFilters);
  if (filterPriority) filterPriority.addEventListener("change", applyFilters);
  if (filterType) filterType.addEventListener("change", applyFilters);

  // init create/add task handler (handles both create & edit)
  initCreateTaskHandler();

  // ensure edit/status modals exist (creates if needed)
  ensureEditTaskModalExists();
  ensureStatusModalExists();

  // profile & notifications (kept from your original)
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  if (profileName && profileEmail) {
    profileName.textContent = localStorage.getItem("signup_name") || "Admin User";
    profileEmail.textContent = localStorage.getItem("signup_email") || "admin@kavyapharm.com";
  }

  // notifications sample (unchanged)
  const notificationsList = document.getElementById("notificationsList");
  if (notificationsList) {
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
      .slice(0, 10) // Show latest 10 notifications
      .map(
        (notification) => `
      <div class="notification-item d-flex align-items-start">
        <div class="me-3">
          <div class="notification-icon ${notification.iconClass} text-white rounded-2 d-flex align-items-center justify-content-center" style="width:44px;height:44px">
            <i class="bi ${notification.icon}"></i>
          </div>
        </div>
        <div class="flex-grow-1">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-desc">${notification.description}</div>
          <div class="notification-time small-muted">${notification.time || "Just now"}</div>
        </div>
      </div>
    `
      )
      .join("");
  }
});

/* Expose functions globally (optional) */
window.editTask = editTask;
window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;



