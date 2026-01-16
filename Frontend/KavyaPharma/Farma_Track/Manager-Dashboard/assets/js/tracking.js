
(() => {
  // --- Safe DOM helpers ---
  const $ = (id) => document.getElementById(id);
  const exists = (id) => !!$(id);

  // --- Mock MR Data with GPS coordinates around Nagpur (window-scoped for debug) ---
  window.mrData = [
    {
      id: 1,
      name: "Rajesh Kumar",
      status: "online",
      lastLocation: { lat: 21.1458, lng: 79.0882 },
      currentSpeed: 25,
      distanceToday: 45,
      visitsToday: 8,
      lastUpdate: "2025-11-08T06:30:00Z",
      route: [
        { lat: 21.1458, lng: 79.0882, timestamp: "2025-11-08T05:00:00Z" },
        { lat: 21.15, lng: 79.09, timestamp: "2025-11-08T05:30:00Z" },
        { lat: 21.155, lng: 79.095, timestamp: "2025-11-08T06:00:00Z" },
        { lat: 21.16, lng: 79.1, timestamp: "2025-11-08T06:30:00Z" },
      ],
    },
    {
      id: 2,
      name: "Priya Sharma",
      status: "moving",
      lastLocation: { lat: 21.125, lng: 79.05 },
      currentSpeed: 35,
      distanceToday: 52,
      visitsToday: 6,
      lastUpdate: "2025-11-08T06:29:00Z",
      route: [
        { lat: 21.125, lng: 79.05, timestamp: "2025-11-08T05:00:00Z" },
        { lat: 21.13, lng: 79.055, timestamp: "2025-11-08T05:30:00Z" },
        { lat: 21.135, lng: 79.06, timestamp: "2025-11-08T06:00:00Z" },
        { lat: 21.14, lng: 79.065, timestamp: "2025-11-08T06:29:00Z" },
      ],
    },
    {
      id: 3,
      name: "Amit Singh",
      status: "stopped",
      lastLocation: { lat: 21.165, lng: 79.12 },
      currentSpeed: 0,
      distanceToday: 38,
      visitsToday: 7,
      lastUpdate: "2025-11-08T06:25:00Z",
      route: [
        { lat: 21.165, lng: 79.12, timestamp: "2025-11-08T05:00:00Z" },
        { lat: 21.17, lng: 79.125, timestamp: "2025-11-08T05:30:00Z" },
        { lat: 21.175, lng: 79.13, timestamp: "2025-11-08T06:00:00Z" },
        { lat: 21.18, lng: 79.135, timestamp: "2025-11-08T06:25:00Z" },
      ],
    },
    {
      id: 4,
      name: "Sneha Patel",
      status: "online",
      lastLocation: { lat: 21.135, lng: 79.07 },
      currentSpeed: 15,
      distanceToday: 41,
      visitsToday: 9,
      lastUpdate: "2025-11-08T06:28:00Z",
      route: [
        { lat: 21.135, lng: 79.07, timestamp: "2025-11-08T05:00:00Z" },
        { lat: 21.14, lng: 79.075, timestamp: "2025-11-08T05:30:00Z" },
        { lat: 21.145, lng: 79.08, timestamp: "2025-11-08T06:00:00Z" },
        { lat: 21.15, lng: 79.085, timestamp: "2025-11-08T06:28:00Z" },
      ],
    },
    {
      id: 5,
      name: "Manish Patel",
      status: "moving",
      lastLocation: { lat: 21.155, lng: 79.1 },
      currentSpeed: 28,
      distanceToday: 35,
      visitsToday: 5,
      lastUpdate: "2025-11-08T06:27:00Z",
      route: [
        { lat: 21.155, lng: 79.1, timestamp: "2025-11-08T05:00:00Z" },
        { lat: 21.16, lng: 79.105, timestamp: "2025-11-08T05:30:00Z" },
        { lat: 21.165, lng: 79.11, timestamp: "2025-11-08T06:00:00Z" },
        { lat: 21.17, lng: 79.115, timestamp: "2025-11-08T06:27:00Z" },
      ],
    },
    {
      id: 6,
      name: "Kavita Jain",
      status: "offline",
      lastLocation: { lat: 21.115, lng: 79.03 },
      currentSpeed: 0,
      distanceToday: 29,
      visitsToday: 7,
      lastUpdate: "2025-11-08T05:45:00Z",
      route: [
        { lat: 21.115, lng: 79.03, timestamp: "2025-11-08T05:00:00Z" },
        { lat: 21.12, lng: 79.035, timestamp: "2025-11-08T05:30:00Z" },
        { lat: 21.125, lng: 79.04, timestamp: "2025-11-08T05:45:00Z" },
      ],
    },
  ];

  window.recentActivities = [
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
  ];

  window.alertsData = [
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

  // --- Map state ---
  let map = null;
  let markers = [];
  let routes = [];

  // --- Utilities ---
  function safeFn(fn) {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  }

  function getRouteColor(status) {
    return (
      {
        online: "#28a745",
        moving: "#0d6efd",
        stopped: "#ffc107",
        offline: "#6c757d",
      }[status] || "#6c757d"
    );
  }

  function formatTime(timestamp) {
    if (!timestamp) return "-";
    const d = new Date(timestamp);
    if (isNaN(d)) return timestamp;
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return "-";
    const d = new Date(timestamp);
    if (isNaN(d)) return timestamp;
    return d.toLocaleString("en-IN");
  }

  // --- Map init ---
  function initMapIfNeeded() {
    if (!exists("map")) return;
    if (typeof L === "undefined") {
      console.warn("Leaflet (L) not available. Map will not initialize.");
      return;
    }
    if (map) return; // already initialized

    // center Nagpur
    map = L.map("map", { preferCanvas: true }).setView([21.1458, 79.0882], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    updateMapMarkers();
    updateMapRoutes();
  }

  // --- Markers & Routes ---
  function clearMapLayers(layerArray) {
    if (!map) return;
    layerArray.forEach((l) => {
      try {
        map.removeLayer(l);
      } catch (e) {}
    });
    layerArray.length = 0;
  }

  function updateMapMarkers() {
    if (!map) return;
    clearMapLayers(markers);

    (window.mrData || []).forEach((mr) => {
      if (!mr || !mr.lastLocation) return;
      const elHtml = `<div style="width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);background:${getRouteColor(
        mr.status
      )}"></div>`;
      const marker = L.marker([mr.lastLocation.lat, mr.lastLocation.lng], {
        icon: L.divIcon({
          className: "mr-marker",
          html: elHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });

      const popupHtml = `
        <div style="min-width:160px">
          <h6 style="margin:0 0 6px 0">${escapeHtml(mr.name)}</h6>
          <div style="font-size:13px"><strong>Status:</strong> ${escapeHtml(
            capitalize(mr.status)
          )}</div>
          <div style="font-size:13px"><strong>Speed:</strong> ${escapeHtml(
            String(mr.currentSpeed)
          )} km/h</div>
          <div style="font-size:13px"><strong>Visits:</strong> ${escapeHtml(
            String(mr.visitsToday)
          )}</div>
          <div style="font-size:13px"><strong>Distance:</strong> ${escapeHtml(
            String(Math.round(mr.distanceToday))
          )} km</div>
          <div style="font-size:12px;color:#666;margin-top:6px">${escapeHtml(
            formatDateTime(mr.lastUpdate)
          )}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.addTo(map);
      markers.push(marker);
    });
  }

  function updateMapRoutes() {
    if (!map) return;
    clearMapLayers(routes);

    const mrFilterVal = exists("mrFilter") ? $("mrFilter").value : "all";
    (window.mrData || []).forEach((mr) => {
      if (!mr || !Array.isArray(mr.route) || mr.route.length < 2) return;
      if (mrFilterVal && mrFilterVal !== "all" && mr.name !== mrFilterVal)
        return;

      const latLngs = mr.route.map((p) => [p.lat, p.lng]).filter(Boolean);
      if (latLngs.length < 2) return;

      const poly = L.polyline(latLngs, {
        color: getRouteColor(mr.status),
        weight: 3,
        opacity: 0.8,
        interactive: false,
      });
      poly.addTo(map);
      routes.push(poly);
    });
  }

  // --- DOM rendering (notifications & helpers) ---
  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function populateMRDropdowns() {
    if (!exists("mrFilter")) return;
    const mrFilterEl = $("mrFilter");
    const options = (window.mrData || [])
      .map(
        (m) =>
          `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`
      )
      .join("");
    // keep All MRs option at top
    mrFilterEl.innerHTML = '<option value="all">All MRs</option>' + options;
  }

  function buildNotificationHtml(notification) {
    return `
      <div class="notification-item p-3 border-bottom">
        <div class="d-flex align-items-start">
          <div class="notification-icon ${escapeHtml(notification.iconClass || "bg-primary")} text-white me-3" style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <i class="bi ${escapeHtml(notification.icon || "bi-bell")}"></i>
          </div>
          <div class="flex-grow-1">
            <h6 class="mb-1">${escapeHtml(notification.title)}</h6>
            <p class="mb-1 text-muted small">${escapeHtml(notification.description || "")}</p>
            <small class="text-muted">${escapeHtml(notification.time || "")}</small>
          </div>
        </div>
      </div>
    `;
  }

  function renderNotifications() {
    if (!exists("notificationsList")) return;
    const container = $("notificationsList");
    const allNotifications = (window.alertsData || []).concat(window.recentActivities || []);
    if (!allNotifications.length) {
      container.innerHTML = `<div class="p-3 text-muted small">No notifications</div>`;
      return;
    }
    container.innerHTML = allNotifications.slice(0, 10).map(buildNotificationHtml).join("");
  }

  // --- Event wiring (safe) ---
  function wireControls() {
    // sidebar toggle safe
    if (exists("sidebarToggle") && exists("sidebar") && exists("mainContent")) {
      $("sidebarToggle").addEventListener("click", () => {
        $("sidebar").classList.toggle("collapsed");
        $("mainContent").classList.toggle("expanded");
      });
    }

    if (exists("themeToggle")) {
      if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
      }
      $("themeToggle").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    }

    // MR filter: redraw routes on change
    if (exists("mrFilter"))
      $("mrFilter").addEventListener("change", () => {
        updateMapRoutes();
      });

    // map controls (guarded by map existence)
    if (exists("zoomInBtn"))
      $("zoomInBtn").addEventListener("click", () => { if (map) map.zoomIn(); });
    if (exists("zoomOutBtn"))
      $("zoomOutBtn").addEventListener("click", () => { if (map) map.zoomOut(); });
    if (exists("centerMapBtn"))
      $("centerMapBtn").addEventListener("click", () => { if (map) map.setView([21.1458, 79.0882], 12); });

    // tracking settings save (safe)
    if (exists("saveTrackingSettingsBtn")) {
      $("saveTrackingSettingsBtn").addEventListener("click", () => {
        const updateFrequency = exists("updateFrequency") ? $("updateFrequency").value : "60";
        const routeHistory = exists("routeHistory") ? $("routeHistory").value : "24";
        const geofenceAlerts = exists("geofenceAlerts") ? $("geofenceAlerts").checked : false;
        const speedAlerts = exists("speedAlerts") ? $("speedAlerts").checked : false;
        const emailAlerts = exists("emailAlerts") ? $("emailAlerts").checked : false;
        const smsAlerts = exists("smsAlerts") ? $("smsAlerts").checked : false;

        alert(
          `Settings saved!\n\nUpdate Frequency: Every ${escapeHtml(updateFrequency)} seconds\nRoute History: ${escapeHtml(routeHistory)} hours\nGeofence Alerts: ${geofenceAlerts}\nSpeed Alerts: ${speedAlerts}\nEmail Alerts: ${emailAlerts}\nSMS Alerts: ${smsAlerts}`
        );
        if (exists("trackingSettingsModal")) {
          try { bootstrap.Modal.getInstance($("trackingSettingsModal")).hide(); } catch(e) {}
        }
      });
    }

    // notifications/modal wiring
    if (exists("notificationsModal")) {
      try {
        const modalEl = $("notificationsModal");
        modalEl.addEventListener("show.bs.modal", () => renderNotifications());
      } catch (e) {}
      renderNotifications();
    } else {
      renderNotifications();
    }
  }

  // --- Initialization ---
  function initialize() {
    safeFn(initMapIfNeeded);
    safeFn(populateMRDropdowns);
    safeFn(wireControls);

    // expose a refresh function for debugging
    window.refreshTrackingUI = () => {
      safeFn(updateMapMarkers);
      safeFn(updateMapRoutes);
      safeFn(renderNotifications);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  // helper: center map on MR by name
  window.viewMROnMap = function (mrName) {
    if (!map) return alert("Map not initialized.");
    const mr = (window.mrData || []).find((m) => m.name === mrName);
    if (!mr) return alert("MR not found.");
    map.setView([mr.lastLocation.lat, mr.lastLocation.lng], 14);
  };

})();
