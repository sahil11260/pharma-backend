document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://pharma-backend-hxf9.onrender.com";
  const NOTIFICATIONS_API_BASE = `${API_BASE}/api/notifications`;
  let notificationsApiMode = true;

  const tableBody = document.getElementById("notificationTableBody");
  const form = document.getElementById("notificationForm");
  const searchInput = document.getElementById("searchNotification");
  const pagination = document.getElementById("pagination");

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

  // Dummy Data
  let notifications = JSON.parse(localStorage.getItem("notifications")) || [
    { id: "L1", recipient: "Managers", message: "Monthly report due by Friday.", date: "2025-11-02" },
    { id: "L2", recipient: "MRs", message: "Doctor visit summary upload reminder.", date: "2025-11-03" },
    { id: "L3", recipient: "All", message: "Team meeting scheduled on Monday 10 AM.", date: "2025-11-04" },
    { id: "L4", recipient: "Managers", message: "Submit last month’s sales data.", date: "2025-11-05" },
    { id: "L5", recipient: "MRs", message: "Don’t forget doctor visit feedback form.", date: "2025-11-06" },
    { id: "L6", recipient: "All", message: "New products launch next week!", date: "2025-11-07" },
    { id: "L7", recipient: "Managers", message: "Expense report deadline tomorrow.", date: "2025-11-08" },
    { id: "L8", recipient: "MRs", message: "Doctor approval form updated.", date: "2025-11-09" },
    { id: "L9", recipient: "All", message: "Server maintenance tonight 11 PM.", date: "2025-11-10" },
    { id: "L10", recipient: "Managers", message: "Submit November plan ASAP.", date: "2025-11-11" },
  ];

  async function refreshNotificationsFromApiOrFallback() {
    try {
      const data = await apiJson(NOTIFICATIONS_API_BASE);
      if (Array.isArray(data)) {
        notifications = data.map((n) => ({
          id: String(n.id),
          recipient: n.type,
          message: n.message,
          date: n.date ? String(n.date) : "",
        }));
        localStorage.setItem("notifications", JSON.stringify(notifications));
        notificationsApiMode = true;
        return;
      }
      notificationsApiMode = false;
    } catch (e) {
      console.warn("Notifications API unavailable, using localStorage.", e);
      notificationsApiMode = false;
    }
  }

  const perPage = 5;
  let currentPage = 1;

  // ✅ Render Notifications Table
  const renderTable = () => {
    const filtered = notifications.filter(n =>
      n.message.toLowerCase().includes(searchInput.value.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / perPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const start = (currentPage - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    tableBody.innerHTML = paginated
      .map(
        (n, i) => `
        <tr>
          <td>${n.recipient}</td>
          <td>${n.message}</td>
          <td>${n.date}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteNotification(${JSON.stringify(n.id)})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
      )
      .join("");

    // ✅ Pagination Controls
    pagination.innerHTML = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" id="prevPage">Previous</a>
      </li>
      ${Array.from({ length: totalPages }, (_, i) => `
        <li class="page-item ${i + 1 === currentPage ? "active" : ""}">
          <a class="page-link" href="#">${i + 1}</a>
        </li>`).join("")}
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" id="nextPage">Next</a>
      </li>
    `;

    // ✅ Page Number Click
    document.querySelectorAll(".page-link").forEach((btn, index) => {
      if (btn.id === "prevPage") {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (currentPage > 1) currentPage--;
          renderTable();
        });
      } else if (btn.id === "nextPage") {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (currentPage < totalPages) currentPage++;
          renderTable();
        });
      } else {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          currentPage = parseInt(btn.textContent);
          renderTable();
        });
      }
    });
  };

  renderTable();

  // ✅ Add Notification
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newNotif = {
      id: `L${Date.now()}`,
      recipient: form.recipientType.value,
      message: form.notificationMessage.value.trim(),
      date: new Date().toISOString().split("T")[0],
    };

    (async function () {
      if (notificationsApiMode) {
        try {
          await apiJson(NOTIFICATIONS_API_BASE, {
            method: "POST",
            body: JSON.stringify({
              title: newNotif.recipient,
              message: newNotif.message,
              type: newNotif.recipient,
              date: newNotif.date,
              status: "Unread",
              priority: "Normal",
            }),
          });
          await refreshNotificationsFromApiOrFallback();
          renderTable();
          form.reset();
          bootstrap.Modal.getInstance(document.getElementById("notificationModal")).hide();
          return;
        } catch (e) {
          console.warn("Notification create API failed. Falling back to localStorage.", e);
          notificationsApiMode = false;
        }
      }

      notifications.unshift(newNotif);
      localStorage.setItem("notifications", JSON.stringify(notifications));
      renderTable();
      form.reset();
      bootstrap.Modal.getInstance(document.getElementById("notificationModal")).hide();
    })();
  });

  // ✅ Search Filter
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

  // ✅ Delete Notification
  window.deleteNotification = (id) => {
    if (!confirm("Delete this notification?")) return;

    (async function () {
      if (notificationsApiMode && id && !String(id).startsWith("L")) {
        try {
          await apiJson(`${NOTIFICATIONS_API_BASE}/${id}`, { method: "DELETE" });
          await refreshNotificationsFromApiOrFallback();
          renderTable();
          return;
        } catch (e) {
          console.warn("Notification delete API failed. Falling back to localStorage.", e);
          notificationsApiMode = false;
        }
      }

      const idx = notifications.findIndex((n) => String(n.id) === String(id));
      if (idx !== -1) {
        notifications.splice(idx, 1);
        localStorage.setItem("notifications", JSON.stringify(notifications));
      }
      renderTable();
    })();
  };

  (async function () {
    await refreshNotificationsFromApiOrFallback();
    renderTable();
  })();
});
