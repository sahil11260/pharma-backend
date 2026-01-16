document.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const NOTIFICATIONS_API_BASE = `${API_BASE}/api/notifications`;
  const STORAGE_KEY = "kavyaPharmNotifications";
  let notificationsApiMode = true;

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

  function normalizeNotificationFromApi(n) {
    return {
      id: String(n.id),
      title: n.title,
      message: n.message,
      type: n.type,
      date: n.date,
      status: n.status || "Unread",
      priority: n.priority || "Normal",
    };
  }

  async function refreshNotificationsFromApiOrFallback() {
    try {
      const data = await apiJson(NOTIFICATIONS_API_BASE);
      if (Array.isArray(data)) {
        const apiNotifs = data.map(normalizeNotificationFromApi);
        const localExisting = loadNotifications();
        const localOnly = localExisting.filter((n) => !isNumericId(n.id));
        allNotifications = apiNotifs.concat(localOnly);
        saveNotifications(allNotifications);
        notificationsApiMode = true;
        return;
      }
      notificationsApiMode = false;
    } catch (e) {
      console.warn("Notifications API unavailable, using localStorage.", e);
      notificationsApiMode = false;
    }
  }

  async function createNotificationApi(payload) {
    return await apiJson(NOTIFICATIONS_API_BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function updateNotificationApi(id, payload) {
    return await apiJson(`${NOTIFICATIONS_API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async function deleteNotificationApi(id) {
    return await apiJson(`${NOTIFICATIONS_API_BASE}/${id}`, { method: "DELETE" });
  }

  // --- Pagination Constants ---
  let ROWS_PER_PAGE = 10;
  let currentPage = 1;
  let activeFilterType = "All"; // Tracks the currently selected type filter
  let activeFilterStatus = "All"; // Tracks the currently selected status filter
  let activeFilterPriority = "All"; // Tracks the currently selected priority filter

  // DOM Elements
  const saveNotificationBtn = document.getElementById("saveNotificationBtn");
  const notificationTableBody = document.getElementById(
    "notificationTableBody"
  );
  const searchInput = document.getElementById("notificationSearchInput");
  const paginationContainer = document.getElementById("paginationContainer");
  const viewNotificationDetailsBody = document.getElementById(
    "viewNotificationDetailsBody"
  );
  // Filter & Action Bar Elements
  const typeFilterButtons = document.getElementById("typeFilterButtons");
  const statusFilterButtons = document.getElementById("statusFilterButtons");
  const priorityFilterButtons = document.getElementById(
    "priorityFilterButtons"
  );
  const notificationTableHead = document
    .getElementById("notificationTable")
    .querySelector("thead tr");
  const viewNotificationModalLabel = document.getElementById(
    "viewNotificationModalLabel"
  );

  // Statistics Elements
  const totalNotificationsEl = document.getElementById("totalNotifications");
  const unreadNotificationsEl = document.getElementById("unreadNotifications");
  const alertNotificationsEl = document.getElementById("alertNotifications");
  const systemNotificationsEl = document.getElementById("systemNotifications");
  const showingCountEl = document.getElementById("showingCount");
  const totalCountEl = document.getElementById("totalCount");
  const unreadProgressEl = document.getElementById("unreadProgress");
  const alertProgressEl = document.getElementById("alertProgress");
  const systemProgressEl = document.getElementById("systemProgress");

  // Badge Elements
  const notificationBadge = document.getElementById("notificationBadge");
  const sidebarNotificationBadge = document.getElementById(
    "sidebarNotificationBadge"
  );

  // Action Buttons & Controls
  const markAllReadBtn = document.getElementById("markAllReadBtn");
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const itemsPerPageSelect = document.getElementById("itemsPerPage");
  const selectedCountEl = document.getElementById("selectedCount");

  // Global variable to hold the full notification list
  let allNotifications = loadNotifications();
  // Hidden input to track the ID of the notification being edited
  let editingNotificationId = null;
  // Track selected notifications for bulk operations
  let selectedNotifications = new Set();

  // Set initial ROWS_PER_PAGE based on HTML selection
  if (itemsPerPageSelect) {
    ROWS_PER_PAGE = parseInt(itemsPerPageSelect.value);
  }

  // ==========================================================
  //                         DATA FUNCTIONS 💾
  // ==========================================================

  /**
   * Generates a unique Alphanumeric ID that starts with N followed by 3 digits (0-9).
   * @returns {string} A unique ID like N001, N002, etc.
   */
  function generateUniqueId() {
    let newId = "";
    let isUnique = false;

    // Loop until a unique ID is found
    while (!isUnique) {
      newId = "N" + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      // Ensure the generated ID is unique
      if (!allNotifications.some((notification) => notification.id === newId)) {
        isUnique = true;
      }
    }
    return newId;
  }

  function loadNotifications() {
    const storedNotifications = localStorage.getItem(STORAGE_KEY);

    // Define initial static data with Priority added
    const staticNotifications = [
      {
        id: "N001",
        title: "System Update",
        message: "New features have been deployed to the system.",
        type: "System",
        date: "2025-01-15",
        status: "Read",
        priority: "Normal",
      },
      {
        id: "N002",
        title: "Inventory Alert",
        message: "Low stock for Product X. Please restock immediately.",
        type: "Alert",
        date: "2025-01-14",
        status: "Unread",
        priority: "High",
      },
      {
        id: "N003",
        title: "Welcome Message",
        message: "Welcome to KavyaPharm Dashboard. Explore the new features!",
        type: "User",
        date: "2025-01-10",
        status: "Read",
        priority: "Low",
      },
      {
        id: "N004",
        title: "Target Missed",
        message: "Your monthly target for Region South was missed by 15%.",
        type: "Alert",
        date: "2025-01-15",
        status: "Unread",
        priority: "High",
      },
      {
        id: "N005",
        title: "Report Generated",
        message: "Q1 Sales Report is ready for review.",
        type: "System",
        date: "2025-01-16",
        status: "Read",
        priority: "Normal",
      },
    ];

    if (storedNotifications) {
      try {
        let parsedNotifications = JSON.parse(storedNotifications);
        // Ensure all notifications have a priority field for filtering
        parsedNotifications = parsedNotifications.map((n) => ({
          ...n,
          priority: n.priority || "Normal",
          status: n.status || "Unread",
        }));
        return parsedNotifications;
      } catch (e) {
        console.error(
          "Error parsing stored notifications, using static data.",
          e
        );
        saveNotifications(staticNotifications);
        return staticNotifications;
      }
    }

    // If no stored data, initialize storage with static data
    saveNotifications(staticNotifications);
    return staticNotifications;
  }

  function saveNotifications(notifications) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }

  // ==========================================================
  //          RENDERING & PAGINATION 🔄
  // ==========================================================

  function getFilteredNotifications() {
    let filteredData = allNotifications;
    const searchFilter = searchInput.value.toLowerCase().trim();

    // 1. Filter by Priority (if not "All")
    if (activeFilterPriority !== "All") {
      filteredData = filteredData.filter(
        (notification) => notification.priority === activeFilterPriority
      );
    }

    // 2. Filter by Type (if not "All")
    if (activeFilterType !== "All") {
      filteredData = filteredData.filter(
        (notification) => notification.type === activeFilterType
      );
    }

    // 3. Filter by Status (if not "All")
    if (activeFilterStatus !== "All") {
      filteredData = filteredData.filter(
        (notification) => notification.status === activeFilterStatus
      );
    }

    // 4. Filter by Search Input
    if (searchFilter) {
      filteredData = filteredData.filter((notification) => {
        // Concatenate relevant text fields for search
        const text = [
          notification.id,
          notification.title,
          notification.message,
          notification.type,
          notification.status,
          notification.priority,
          notification.date,
        ]
          .map((val) => String(val).toLowerCase())
          .join(" ");
        return text.includes(searchFilter);
      });
    }

    // Sort by Date (latest first) and Unread/Priority
    filteredData.sort((a, b) => {
      // Primary sort: Unread first
      if (a.status === "Unread" && b.status === "Read") return -1;
      if (a.status === "Read" && b.status === "Unread") return 1;

      // Secondary sort: High priority first
      const priorityOrder = { High: 3, Normal: 2, Low: 1 };
      if (priorityOrder[a.priority] > priorityOrder[b.priority]) return -1;
      if (priorityOrder[a.priority] < priorityOrder[b.priority]) return 1;

      // Tertiary sort: Most recent date first
      return new Date(b.date) - new Date(a.date);
    });

    return filteredData;
  }

  // Function to update statistics
  function updateStatistics() {
    const total = allNotifications.length;
    const unread = allNotifications.filter((n) => n.status === "Unread").length;
    const alerts = allNotifications.filter((n) => n.type === "Alert").length;
    const system = allNotifications.filter((n) => n.type === "System").length;

    if (totalNotificationsEl) totalNotificationsEl.textContent = total;
    if (unreadNotificationsEl) unreadNotificationsEl.textContent = unread;
    if (alertNotificationsEl) alertNotificationsEl.textContent = alerts;
    if (systemNotificationsEl) systemNotificationsEl.textContent = system;

    // Update progress bars
    const unreadPercentage = total > 0 ? (unread / total) * 100 : 0;
    const alertPercentage = total > 0 ? (alerts / total) * 100 : 0;
    const systemPercentage = total > 0 ? (system / total) * 100 : 0;

    if (unreadProgressEl) unreadProgressEl.style.width = unreadPercentage + "%";
    if (alertProgressEl) alertProgressEl.style.width = alertPercentage + "%";
    if (systemProgressEl) systemProgressEl.style.width = systemPercentage + "%";

    // Update badges
    if (notificationBadge) {
      notificationBadge.textContent = unread;
      notificationBadge.style.display = unread > 0 ? "inline" : "none";
    }
    if (sidebarNotificationBadge) {
      sidebarNotificationBadge.textContent = unread;
      sidebarNotificationBadge.style.display = unread > 0 ? "inline" : "none";
    }
  }

  // Function to dynamically update table headers
  function updateTableHeaders() {
    if (!notificationTableHead) return;
    const newHeaders = [
      "", // Checkbox column
      "ID",
      "Priority",
      "Title",
      "Message",
      "Type",
      "Date",
      "Status",
      "Actions",
    ];

    // Remove existing headers and append new ones
    notificationTableHead.innerHTML = "";
    newHeaders.forEach((text) => {
      const th = document.createElement("th");
      th.className = "border-0 fw-semibold text-uppercase small";
      if (text === "") th.className += " ps-3";
      if (text === "Actions") th.className += " text-center";
      th.textContent = text;
      notificationTableHead.appendChild(th);
    });
  }

  function renderNotifications() {
    updateTableHeaders();

    const data = getFilteredNotifications();
    if (notificationTableBody) notificationTableBody.innerHTML = ""; // Clear existing table rows

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedNotifications = data.slice(start, end);

    // Handle empty page after filtering/deletion
    if (paginatedNotifications.length === 0 && currentPage > 1) {
      currentPage--;
      renderNotifications();
      return;
    }

    // Update showing/total counts
    if (showingCountEl)
      showingCountEl.textContent = paginatedNotifications.length;
    if (totalCountEl) totalCountEl.textContent = data.length;
    updateBulkActions(); // Update count based on selection

    if (paginatedNotifications.length === 0) {
      if (notificationTableBody) {
        notificationTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-5">
            <i class="bi bi-x-octagon fs-3 d-block mb-2"></i>
            No notifications match the current filters or search query.
            </td></tr>`;
      }
      renderPagination(0);
      return;
    }

    paginatedNotifications.forEach((notification) => {
      const newRow = document.createElement("tr");
      newRow.setAttribute("data-notification-id", String(notification.id));

      // Add priority class to row
      let priorityClass = "";
      if (notification.priority === "High") priorityClass = "priority-high";
      else if (notification.priority === "Normal")
        priorityClass = "priority-normal";
      else if (notification.priority === "Low") priorityClass = "priority-low";

      newRow.className = priorityClass;

      // Determine priority badge color
      let priorityColor = "secondary";
      if (notification.priority === "High") priorityColor = "danger";
      else if (notification.priority === "Normal") priorityColor = "warning";
      else if (notification.priority === "Low") priorityColor = "success";

      // Determine type badge color
      let typeColor = "secondary";
      if (notification.type === "System") typeColor = "info";
      else if (notification.type === "Alert") typeColor = "danger";
      else if (notification.type === "User") typeColor = "primary";

      // Determine status badge color
      const statusColor = notification.status === "Read" ? "success" : "danger";

      // Check if this notification is selected
      const isSelected = selectedNotifications.has(notification.id);

      newRow.innerHTML = `
        <td class="ps-3">
          <input class="form-check-input notification-checkbox" type="checkbox" value="${notification.id
        }" ${isSelected ? "checked" : ""}>
        </td>
        <td>${notification.id}</td>
        <td>
          <span class="badge bg-${priorityColor} text-uppercase">${notification.priority || "Normal"
        }</span>
        </td>
        <td class="fw-semibold">${notification.title}</td>
        <td class="text-truncate" style="max-width: 250px;" title="${notification.message
        }">${notification.message}</td>
        <td><span class="badge bg-${typeColor} text-uppercase">${notification.type
        }</span></td>
        <td>${notification.date}</td>
        <td><span class="badge bg-${statusColor} text-uppercase">${notification.status
        }</span></td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary action-btn view-btn" data-notification-id="${notification.id
        }" data-bs-toggle="modal" data-bs-target="#viewNotificationModal" title="View Details">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-warning action-btn edit-btn" data-notification-id="${notification.id
        }" data-bs-toggle="modal" data-bs-target="#addNotificationModal" title="Edit Notification">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger action-btn delete-btn" data-notification-id="${notification.id
        }" title="Delete Notification">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      if (notificationTableBody) notificationTableBody.appendChild(newRow);
    });

    attachActionListeners();
    renderPagination(data.length);
    updateStatistics();
    updateSelectAllCheckbox(); // Re-evaluate select all state
  }

  function renderPagination(totalNotifications) {
    if (!paginationContainer) return;
    const pageCount = Math.ceil(totalNotifications / ROWS_PER_PAGE);

    if (pageCount <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let paginationHtml = "";

    // Previous button
    paginationHtml += `<li class="page-item ${currentPage === 1 ? "disabled" : ""
      }">
      <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
    </li>`;

    // Page numbers logic (simplified for professional display)
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2)
        paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `<li class="page-item ${i === currentPage ? "active" : ""
        }">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
    }

    if (endPage < pageCount) {
      if (endPage < pageCount - 1)
        paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${pageCount}">${pageCount}</a></li>`;
    }

    // Next button
    paginationHtml += `<li class="page-item ${currentPage === pageCount ? "disabled" : ""
      }">
      <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
    </li>`;

    paginationContainer.innerHTML = paginationHtml;
    attachPaginationListeners(totalNotifications);
  }

  function attachPaginationListeners(totalNotifications) {
    const pageCount = Math.ceil(totalNotifications / ROWS_PER_PAGE);
    if (!paginationContainer) return;
    paginationContainer.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const newPage = parseInt(this.getAttribute("data-page"));
        if (!isNaN(newPage) && newPage > 0 && newPage <= pageCount) {
          currentPage = newPage;
          renderNotifications();
        }
      });
    });
  }

  function attachActionListeners() {
    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener("click", function () {
        const notificationId = String(
          this.getAttribute("data-notification-id")
        );
        deleteNotification(notificationId);
      });
    });

    // Edit buttons
    document.querySelectorAll(".edit-btn").forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener("click", function () {
        const notificationId = String(
          this.getAttribute("data-notification-id")
        );
        editingNotificationId = notificationId;
        prefillEditForm(notificationId);
      });
    });

    // View buttons
    document.querySelectorAll(".view-btn").forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener("click", function () {
        const notificationId = String(
          this.getAttribute("data-notification-id")
        );
        showNotificationDetails(notificationId);
      });
    });

    // Individual checkboxes
    document.querySelectorAll(".notification-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const notificationId = this.value;
        if (this.checked) {
          selectedNotifications.add(notificationId);
        } else {
          selectedNotifications.delete(notificationId);
        }
        updateBulkActions();
        updateSelectAllCheckbox();
      });
    });
  }

  function updateBulkActions() {
    if (bulkDeleteBtn)
      bulkDeleteBtn.disabled = selectedNotifications.size === 0;
    if (selectedCountEl)
      selectedCountEl.textContent = selectedNotifications.size;
  }

  function updateSelectAllCheckbox() {
    if (!selectAllCheckbox) return;
    const checkboxes = document.querySelectorAll(".notification-checkbox");
    const checkedBoxes = document.querySelectorAll(
      ".notification-checkbox:checked"
    );

    selectAllCheckbox.checked =
      checkboxes.length > 0 && checkedBoxes.length === checkboxes.length;
    selectAllCheckbox.indeterminate =
      checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
  }

  function deleteNotification(id) {
    if (confirm(`Are you sure you want to delete notification ID ${id}?`)) {
      (async function () {
        if (notificationsApiMode && isNumericId(id)) {
          try {
            await deleteNotificationApi(id);
          } catch (e) {
            console.warn("Notification delete API failed. Falling back to localStorage.", e);
            notificationsApiMode = false;
          }
        }

        let notifications = allNotifications;
        const initialLength = notifications.length;

        notifications = notifications.filter(
          (notification) => String(notification.id) !== String(id)
        );

        if (notifications.length < initialLength) {
          allNotifications = notifications;
          saveNotifications(allNotifications);
          selectedNotifications.delete(id);
          renderNotifications();
        }
      })();
    }
  }

  // Display detailed notification information
  function showNotificationDetails(id) {
    const notification = allNotifications.find(
      (n) => String(n.id) === String(id)
    );
    if (!notification) {
      if (viewNotificationDetailsBody) {
        viewNotificationDetailsBody.innerHTML = `<p class="text-danger">Notification ID ${id} not found.</p>`;
      }
      return;
    }

    // Set the Modal Title
    if (viewNotificationModalLabel)
      viewNotificationModalLabel.textContent = notification.title;

    const typeColor =
      notification.type === "System"
        ? "info"
        : notification.type === "Alert"
          ? "danger"
          : notification.type === "User"
            ? "primary"
            : "secondary";

    const statusColor = notification.status === "Read" ? "success" : "danger";

    const priorityColor =
      notification.priority === "High"
        ? "danger"
        : notification.priority === "Normal"
          ? "warning"
          : "success";

    let detailsHtml = `
      <div class="container-fluid px-0">
        <div class="row g-0 align-items-center py-3 border-bottom border-light-subtle bg-light">
          <div class="col-md-4 col-sm-6 mb-2 mb-md-0">
            <span class="fw-bold text-dark me-2">ID:</span>
            <span>${notification.id}</span>
          </div>
          <div class="col-md-4 col-sm-6 mb-2 mb-md-0">
            <span class="fw-bold text-dark me-2">Type:</span>
            <span class="badge bg-${typeColor} text-uppercase">${notification.type
      }</span>
          </div>
          <div class="col-md-4 col-sm-12">
            <span class="fw-bold text-dark me-2">Priority:</span>
            <span class="badge bg-${priorityColor} text-uppercase">${notification.priority || "Normal"
      }</span>
          </div>
        </div>

        <div class="row g-0 align-items-center py-3 border-bottom border-light-subtle">
          <div class="col-md-6 col-sm-6">
            <span class="fw-bold text-dark me-2">Date:</span>
            <span>${notification.date}</span>
          </div>
          <div class="col-md-6 col-sm-6">
            <span class="fw-bold text-dark me-2">Status:</span>
            <span class="badge bg-${statusColor} text-uppercase">${notification.status
      }</span>
          </div>
        </div>

        <div class="row g-0 py-3 bg-light">
          <div class="col-12">
            <h6 class="fw-bold text-dark mb-2 border-bottom pb-1">Message:</h6>
            <p class="text-wrap">${notification.message}</p>
          </div>
        </div>
      </div>`;

    if (viewNotificationDetailsBody)
      viewNotificationDetailsBody.innerHTML = detailsHtml;

    // Mark as read if it was unread
    if (notification.status === "Unread") {
      (async function () {
        notification.status = "Read";
        if (notificationsApiMode && isNumericId(notification.id)) {
          try {
            await updateNotificationApi(notification.id, {
              title: notification.title,
              message: notification.message,
              type: notification.type,
              date: notification.date,
              status: notification.status,
              priority: notification.priority || "Normal",
            });
          } catch (e) {
            console.warn("Notification mark-read API failed. Falling back to localStorage.", e);
            notificationsApiMode = false;
          }
        }

        saveNotifications(allNotifications);
        renderNotifications();
      })();
    }
  }

  function prefillEditForm(id) {
    const notifications = allNotifications;
    const notification = notifications.find((n) => String(n.id) === String(id));
    if (!notification) return;

    if (document.getElementById("notificationTitle"))
      document.getElementById("notificationTitle").value = notification.title;
    if (document.getElementById("notificationType"))
      document.getElementById("notificationType").value = notification.type;
    if (document.getElementById("notificationMessage"))
      document.getElementById("notificationMessage").value =
        notification.message;
    if (document.getElementById("notificationPriority"))
      document.getElementById("notificationPriority").value =
        notification.priority || "Normal";
    if (document.getElementById("notificationStatus"))
      document.getElementById("notificationStatus").value =
        notification.status || "Unread";

    if (document.getElementById("addNotificationModalLabel"))
      document.getElementById(
        "addNotificationModalLabel"
      ).textContent = `Edit Notification (ID: ${notification.id})`;
    if (saveNotificationBtn)
      saveNotificationBtn.textContent = "Update Notification";
  }

  const addNotificationModalEl = document.getElementById(
    "addNotificationModal"
  );
  if (addNotificationModalEl) {
    addNotificationModalEl.addEventListener("hidden.bs.modal", function () {
      editingNotificationId = null;
      if (document.getElementById("addNotificationModalLabel"))
        document.getElementById("addNotificationModalLabel").textContent =
          "Create New Notification";
      if (saveNotificationBtn)
        saveNotificationBtn.textContent = "Save Notification";
      if (document.getElementById("notificationForm"))
        document.getElementById("notificationForm").reset();
    });
  }

  // Event Listeners for new elements
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", function () {
      if (
        confirm("Mark all unread notifications as read? This cannot be undone.")
      ) {
        (async function () {
          let changesMade = false;
          for (const notification of allNotifications) {
            if (notification.status === "Unread") {
              notification.status = "Read";
              changesMade = true;
              if (notificationsApiMode && isNumericId(notification.id)) {
                try {
                  await updateNotificationApi(notification.id, {
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    date: notification.date,
                    status: notification.status,
                    priority: notification.priority || "Normal",
                  });
                } catch (e) {
                  console.warn("Notification mark-all-read API failed. Falling back to localStorage.", e);
                  notificationsApiMode = false;
                }
              }
            }
          }

          if (changesMade) {
            saveNotifications(allNotifications);
            renderNotifications();
          }
        })();
      }
    });
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener("click", function () {
      if (selectedNotifications.size === 0) return;

      if (
        confirm(
          `Are you sure you want to delete ${selectedNotifications.size} selected notification(s)? This action is irreversible.`
        )
      ) {
        (async function () {
          if (notificationsApiMode) {
            for (const id of Array.from(selectedNotifications)) {
              if (isNumericId(id)) {
                try {
                  await deleteNotificationApi(id);
                } catch (e) {
                  console.warn("Bulk notification delete API failed. Falling back to localStorage.", e);
                  notificationsApiMode = false;
                }
              }
            }
          }

          allNotifications = allNotifications.filter(
            (notification) => !selectedNotifications.has(notification.id)
          );
          saveNotifications(allNotifications);
          selectedNotifications.clear();
          renderNotifications();
        })();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", function () {
      searchInput.value = "";
      currentPage = 1;
      renderNotifications();
    });
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".notification-checkbox");
      const isChecked = this.checked;
      checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
        const notificationId = checkbox.value;
        if (isChecked) {
          selectedNotifications.add(notificationId);
        } else {
          selectedNotifications.delete(notificationId);
        }
      });
      updateBulkActions();
      updateSelectAllCheckbox();
    });
  }

  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", function () {
      ROWS_PER_PAGE = parseInt(this.value);
      currentPage = 1;
      renderNotifications();
    });
  }

  // Filter button click handlers (using radio groups)
  function setupRadioFilter(containerId, updateFilterFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll("input[type='radio']").forEach((radio) => {
      radio.addEventListener("change", function () {
        const filterValue = this.getAttribute("id").replace(
          /^(filter|status|priority)/,
          ""
        ); // Extracts 'All', 'System', 'High', etc.
        updateFilterFunc(filterValue);
        currentPage = 1;
        renderNotifications();
      });
    });
  }

  setupRadioFilter("typeFilterButtons", (val) => (activeFilterType = val));
  setupRadioFilter("statusFilterButtons", (val) => (activeFilterStatus = val));
  setupRadioFilter(
    "priorityFilterButtons",
    (val) => (activeFilterPriority = val)
  );

  // ==========================================================
  //          SAVE/UPDATE HANDLER (with validations) ✍️
  // ==========================================================
  if (saveNotificationBtn) {
    saveNotificationBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const title = document.getElementById("notificationTitle").value.trim();
      const type = document.getElementById("notificationType").value;
      const message = document
        .getElementById("notificationMessage")
        .value.trim();
      const priority = document.getElementById("notificationPriority").value;
      const status = document.getElementById("notificationStatus").value;

      // Validation
      if (!title || !type || !message || !priority || !status) {
        alert("❌ All fields must be filled out and selected.");
        return;
      }

      let alertMsg = "";
      let notificationObject;

      if (editingNotificationId) {
        const notificationIndex = allNotifications.findIndex(
          (n) => String(n.id) === String(editingNotificationId)
        );
        if (notificationIndex !== -1) {
          notificationObject = allNotifications[notificationIndex];
          notificationObject.title = title;
          notificationObject.type = type;
          notificationObject.message = message;
          notificationObject.priority = priority;
          notificationObject.status = status;
        }
        alertMsg = `✅ Notification ID ${editingNotificationId} updated successfully!`;

        (async function () {
          if (notificationsApiMode && notificationObject && isNumericId(notificationObject.id)) {
            try {
              await updateNotificationApi(notificationObject.id, {
                title: notificationObject.title,
                message: notificationObject.message,
                type: notificationObject.type,
                date: notificationObject.date,
                status: notificationObject.status,
                priority: notificationObject.priority || "Normal",
              });
            } catch (e) {
              console.warn("Notification update API failed. Falling back to localStorage.", e);
              notificationsApiMode = false;
            }
          }

          saveNotifications(allNotifications);
          renderNotifications();
        })();
      } else {
        notificationObject = {
          id: generateUniqueId(),
          title: title,
          message: message,
          type: type,
          date: new Date().toISOString().split("T")[0],
          status: status,
          priority: priority,
        };

        (async function () {
          if (notificationsApiMode) {
            try {
              const created = await createNotificationApi({
                title: notificationObject.title,
                message: notificationObject.message,
                type: notificationObject.type,
                date: notificationObject.date,
                status: notificationObject.status,
                priority: notificationObject.priority || "Normal",
              });
              if (created) {
                notificationObject = normalizeNotificationFromApi(created);
              }
            } catch (e) {
              console.warn("Notification create API failed. Falling back to localStorage.", e);
              notificationsApiMode = false;
            }
          }

          allNotifications.push(notificationObject);
          alertMsg = `✅ Notification "${notificationObject.title}" created successfully (ID: ${notificationObject.id})!`;
          saveNotifications(allNotifications);

          const filteredData = getFilteredNotifications();
          const pageCount = Math.ceil(filteredData.length / ROWS_PER_PAGE);
          currentPage = pageCount;
          renderNotifications();
        })();
      }

      const modalElement = document.getElementById("addNotificationModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentPage = 1;
      renderNotifications();
    });
  }

  // Notification button click handler
  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", function () {
      // Create notification popup at bottom of button
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

      // Position popup below the notification button
      const btnRect = notificationBtn.getBoundingClientRect();
      const popupEl = popup.querySelector("div");
      popupEl.style.left = btnRect.left - 200 + "px";
      popupEl.style.top = btnRect.bottom + 5 + "px";

      // Close popup when clicking outside
      document.addEventListener("click", function closePopup(e) {
        if (!notificationBtn.contains(e.target) && !popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener("click", closePopup);
        }
      });
    });
  }

  (async function () {
    await refreshNotificationsFromApiOrFallback();
    renderNotifications();
  })();
});
