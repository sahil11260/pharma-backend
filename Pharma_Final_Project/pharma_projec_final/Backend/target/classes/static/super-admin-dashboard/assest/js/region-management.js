// Initial Data (only used if localStorage is empty)
const initialZoneData = [
  {
    id: "Z001",
    name: "Mumbai Zone",
    description: "Mumbai metropolitan area and suburbs",
    manager: "Rajesh Kumar",
    status: "Active",
  },
  {
    id: "Z002",
    name: "Delhi Zone",
    description: "Delhi-NCR region including Gurgaon and Noida",
    manager: "Priya Sharma",
    status: "Active",
  },
  {
    id: "Z003",
    name: "Bangalore Zone",
    description: "Bangalore and surrounding districts",
    manager: "Amit Singh",
    status: "Active",
  },
  {
    id: "Z004",
    name: "Chennai Zone",
    description: "Chennai and Tamil Nadu region",
    manager: "Suresh Reddy",
    status: "Inactive",
  },
];

const API_BASE = "";
const ZONES_API_BASE = `${API_BASE}/api/zones`;
const TERRITORIES_API_BASE = `${API_BASE}/api/territories`;
let zonesApiMode = true;
let territoriesApiMode = true;

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

function normalizeZoneFromApi(z) {
  return {
    id: String(z.id),
    name: z.name,
    description: "",
    manager: "",
    status: "Active",
  };
}

function normalizeTerritoryFromApi(t) {
  return {
    id: String(t.id),
    name: t.name,
    zone: t.zone,
    manager: "",
    mrCount: 0,
    status: "Active",
    description: "",
  };
}

async function refreshZonesFromApiOrFallback() {
  try {
    const apiZones = await apiJson(ZONES_API_BASE);
    if (Array.isArray(apiZones)) {
      const apiMapped = apiZones.map(normalizeZoneFromApi);
      const localExisting = getData("zones", initialZoneData);
      const localById = new Map(localExisting.map((z) => [String(z.id), z]));
      zones = apiMapped.map((z) => Object.assign({}, z, localById.get(String(z.id)) || {}));
      const localOnly = localExisting.filter((z) => !isNumericId(z.id));
      zones = zones.concat(localOnly);
      saveData("zones", zones);
      zonesApiMode = true;
      // API reachable — ensure any retry banner is hidden
      hideApiRetryBanner();
      return;
    }
    zonesApiMode = false;
  } catch (e) {
    console.warn("Zones API unavailable, using localStorage.", e);
    zonesApiMode = false;
    showApiRetryBanner();
  }
}

async function refreshTerritoriesFromApiOrFallback() {
  try {
    const apiTerritories = await apiJson(TERRITORIES_API_BASE);
    if (Array.isArray(apiTerritories)) {
      const apiMapped = apiTerritories.map(normalizeTerritoryFromApi);
      const localExisting = getData("territories", initialTerritoryData);
      const localById = new Map(localExisting.map((t) => [String(t.id), t]));
      territories = apiMapped.map((t) => Object.assign({}, t, localById.get(String(t.id)) || {}));
      const localOnly = localExisting.filter((t) => !isNumericId(t.id));
      territories = territories.concat(localOnly);
      saveData("territories", territories);
      territoriesApiMode = true;
      // API reachable — ensure any retry banner is hidden
      hideApiRetryBanner();
      return;
    }
    territoriesApiMode = false;
  } catch (e) {
    console.warn("Territories API unavailable, using localStorage.", e);
    territoriesApiMode = false;
    showApiRetryBanner();
  }
}

const initialTerritoryData = [
  {
    id: "T001",
    name: "Mumbai-North",
    zone: "Mumbai Zone",
    manager: "Vikram Patel",
    mrCount: 5,
    status: "Active",
  },
  {
    id: "T002",
    name: "Mumbai-South",
    zone: "Mumbai Zone",
    manager: "Meera Joshi",
    mrCount: 4,
    status: "Active",
  },
  {
    id: "T003",
    name: "Delhi-NCR",
    zone: "Delhi Zone",
    manager: "Rohit Verma",
    mrCount: 6,
    status: "Active",
  },
  {
    id: "T004",
    name: "Bangalore-Central",
    zone: "Bangalore Zone",
    manager: "Kavita Rao",
    mrCount: 3,
    status: "Active",
  },
  {
    id: "T005",
    name: "Chennai-Central",
    zone: "Chennai Zone",
    manager: "Arun Kumar",
    mrCount: 2,
    status: "Inactive",
  },
];

/**
 * Get data from localStorage or use initial data if not found.
 */
function getData(key, initialData) {
  const storedData = localStorage.getItem(key);
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (e) {
      console.error("Error parsing localStorage data for", key, e);
      return initialData;
    }
  }
  // Save initial data to localStorage if it's the first run
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}

// Load data from storage
// Start empty and prefer API; fall back to localStorage only if API is unavailable.
let zones = [];
let territories = [];

/**
 * Save the current data array to localStorage.
 */
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Show a small banner when the API is unavailable with a Retry button
function showApiRetryBanner() {
  if (document.getElementById("regionApiRetryBanner")) return;
  const banner = document.createElement("div");
  banner.id = "regionApiRetryBanner";
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
    `<div style=\"font-weight:600;color:#856404;\">Regions API unreachable — using local data</div>` +
    `<button id=\"regionApiRetryBtn\" class=\"btn btn-sm btn-outline-primary\">Retry</button>` +
    `</div>`;
  document.body.appendChild(banner);
  document.getElementById("regionApiRetryBtn").addEventListener("click", async function () {
    try {
      hideApiRetryBanner();
      await refreshZonesFromApiOrFallback();
      await refreshTerritoriesFromApiOrFallback();
      if (!zones || zones.length === 0) zones = getData("zones", initialZoneData);
      if (!territories || territories.length === 0) territories = getData("territories", initialTerritoryData);
      renderZoneTable(zones);
      renderTerritoryTable(territories);
    } catch (e) {
      console.warn("Retry failed", e);
      alert("Retry failed — API still unavailable");
    }
  });
}

function hideApiRetryBanner() {
  const b = document.getElementById("regionApiRetryBanner");
  if (b) b.remove();
}

/**
 * Generates a new unique ID for a zone (e.g., Z005).
 */
function generateNewZoneId() {
  const maxId = zones.reduce((max, zone) => {
    const id = String(zone.id || "");
    if (!id.startsWith("Z")) return max;
    const num = parseInt(id.substring(1));
    if (!Number.isFinite(num)) return max;
    return num > max ? num : max;
  }, 0);

  const newNum = maxId + 1;
  return "Z" + String(newNum).padStart(3, "0");
}

/**
 * Generates a new unique ID for a territory (e.g., T006).
 */
function generateNewTerritoryId() {
  const maxId = territories.reduce((max, territory) => {
    const id = String(territory.id || "");
    if (!id.startsWith("T")) return max;
    const num = parseInt(id.substring(1));
    if (!Number.isFinite(num)) return max;
    return num > max ? num : max;
  }, 0);

  const newNum = maxId + 1;
  return "T" + String(newNum).padStart(3, "0");
}

/**
 * Renders the zone table based on the provided data.
 */
function renderZoneTable(dataToRender) {
  const tbody = document.getElementById("zoneTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  dataToRender.forEach((zone) => {
    const statusBadge = `<span class="badge bg-${zone.status === "Active" ? "success" : "warning"
      }">${zone.status}</span>`;
    const row = document.createElement("tr");
    row.setAttribute("data-id", zone.id);
    row.innerHTML = `
            <td>${zone.id}</td>
            <td>${zone.name}</td>
            <td>${zone.description}</td>
            <td>${zone.manager}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-sm btn-outline-info edit-zone-btn" data-id="${zone.id}" data-bs-toggle="modal" data-bs-target="#editZoneModal">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger delete-zone-btn" data-id="${zone.id}">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          `;
    tbody.appendChild(row);
  });

  // Re-attach listeners after rendering
  attachZoneEventListeners();
}

/**
 * Renders the territory table based on the provided data.
 */
function renderTerritoryTable(dataToRender) {
  const tbody = document.getElementById("territoryTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  dataToRender.forEach((territory) => {
    const statusBadge = `<span class="badge bg-${territory.status === "Active" ? "success" : "warning"
      }">${territory.status}</span>`;
    const row = document.createElement("tr");
    row.setAttribute("data-id", territory.id);
    row.innerHTML = `
            <td>${territory.id}</td>
            <td>${territory.name}</td>
            <td>${territory.zone}</td>
            <td>${territory.manager}</td>
            <td>${territory.mrCount}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-sm btn-outline-info edit-territory-btn" data-id="${territory.id}" data-bs-toggle="modal" data-bs-target="#editTerritoryModal">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger delete-territory-btn" data-id="${territory.id}">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          `;
    tbody.appendChild(row);
  });

  // Re-attach listeners after rendering
  attachTerritoryEventListeners();
}

/**
 * Attach event listeners for delete and edit buttons for Zones.
 */
function attachZoneEventListeners() {
  // Delete Listener
  document.querySelectorAll(".delete-zone-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      deleteRow("zones", id);
    });
  });

  // Edit Listener: Populate modal with current data
  document.querySelectorAll(".edit-zone-btn").forEach((button) => {
    button.removeEventListener("click", handleEditZoneClick); // Remove old listener to prevent duplicates
    button.addEventListener("click", handleEditZoneClick);
  });
}

/**
 * Handles the click event for the Edit Zone button (prefilling the modal).
 */
function handleEditZoneClick() {
  const id = this.getAttribute("data-id");
  const zoneToEdit = zones.find((z) => z.id === id);
  if (zoneToEdit) {
    document.getElementById("editZoneId").value = zoneToEdit.id;
    document.getElementById("editZoneName").value = zoneToEdit.name;
    document.getElementById("editZoneDescription").value =
      zoneToEdit.description;
    document.getElementById("editZoneManager").value = zoneToEdit.manager;
    document.getElementById("editZoneStatus").value = zoneToEdit.status;
  }
}

/**
 * Attach event listeners for delete and edit buttons for Territories.
 */
function attachTerritoryEventListeners() {
  // Delete Listener
  document.querySelectorAll(".delete-territory-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      deleteRow("territories", id);
    });
  });

  // Edit Listener: Populate modal with current data
  document.querySelectorAll(".edit-territory-btn").forEach((button) => {
    button.removeEventListener("click", handleEditTerritoryClick); // Remove old listener to prevent duplicates
    button.addEventListener("click", handleEditTerritoryClick);
  });
}

/**
 * Handles the click event for the Edit Territory button (prefilling the modal).
 */
function handleEditTerritoryClick() {
  const id = this.getAttribute("data-id");
  const territoryToEdit = territories.find((t) => t.id === id);
  if (territoryToEdit) {
    document.getElementById("editTerritoryId").value = territoryToEdit.id;
    document.getElementById("editTerritoryName").value = territoryToEdit.name;
    document.getElementById("editTerritoryZone").value = territoryToEdit.zone;
    document.getElementById("editTerritoryManager").value =
      territoryToEdit.manager;
    document.getElementById("editTerritoryDescription").value =
      territoryToEdit.description || "";
    document.getElementById("editTerritoryMrCount").value =
      territoryToEdit.mrCount;
    document.getElementById("editTerritoryStatus").value =
      territoryToEdit.status;
  }
}

/**
 * Implements the delete functionality, updates data, localStorage, and re-renders.
 */
function deleteRow(type, id) {
  let data = type === "zones" ? zones : territories;

  if (confirm(`Are you sure you want to permanently delete ${id}?`)) {
    (async function () {
      if (type === "zones" && zonesApiMode && isNumericId(id)) {
        try {
          await apiJson(`${ZONES_API_BASE}/${id}`, { method: "DELETE" });
          // API delete succeeded — hide retry banner if visible
          hideApiRetryBanner();
        } catch (e) {
          console.warn("Zone delete API failed. Falling back to localStorage.", e);
          showApiRetryBanner();
        }
      }
      if (type === "territories" && territoriesApiMode && isNumericId(id)) {
        try {
          await apiJson(`${TERRITORIES_API_BASE}/${id}`, { method: "DELETE" });
          // API delete succeeded — hide retry banner if visible
          hideApiRetryBanner();
        } catch (e) {
          console.warn("Territory delete API failed. Falling back to localStorage.", e);
          showApiRetryBanner();
        }
      }

      // Visually mark row for deletion (optional, good UX)
      const row = document.querySelector(
        `#${type.replace("s", "")}TableBody tr[data-id="${id}"]`
      );
      if (row) {
        row.classList.add("deleted-row");
      }

      // Filter the data array (permanent deletion)
      const initialLength = data.length;
      data = data.filter((item) => item.id !== id);

      if (data.length < initialLength) {
        // Update the global variable and localStorage
        if (type === "zones") {
          zones = data;
          saveData("zones", zones);
          renderZoneTable(zones);
        } else {
          territories = data;
          saveData("territories", territories);
          renderTerritoryTable(territories);
        }
      } else {
        alert(`Could not find item with ID: ${id}`);
      }
    })();
  }
}

/**
 * Handles search input for the respective table.
 */
function handleSearch(type, query) {
  const data = type === "zones" ? zones : territories;
  const lowerCaseQuery = query.toLowerCase();

  const filteredData = data.filter((item) => {
    // Search across all string values in the object
    return Object.values(item).some((value) =>
      String(value).toLowerCase().includes(lowerCaseQuery)
    );
  });

  if (type === "zones") {
    renderZoneTable(filteredData);
  } else {
    renderTerritoryTable(filteredData);
  }
}

// --- Add Zone Logic ---
function handleAddZone(event) {
  event.preventDefault(); // Stop default form submission

  const zoneNameInput = document.getElementById("zoneName");
  const zoneDescriptionInput = document.getElementById("zoneDescription");
  const zoneManagerInput = document.getElementById("zoneManager");

  // Simple validation
  if (!zoneNameInput.value || !zoneManagerInput.value) {
    alert("Please fill in Zone Name and Zone Manager.");
    return;
  }

  (async function () {
    if (zonesApiMode) {
      try {
        const created = await apiJson(ZONES_API_BASE, {
          method: "POST",
          body: JSON.stringify({ name: zoneNameInput.value }),
        });
        if (created) {
          const newZone = {
            id: String(created.id),
            name: created.name,
            description: zoneDescriptionInput.value,
            manager: zoneManagerInput.value,
            status: "Active",
          };
          zones.push(newZone);
          saveData("zones", zones);
          renderZoneTable(zones);
          // API create succeeded — hide retry banner if visible
          hideApiRetryBanner();
        }
      } catch (e) {
        console.warn("Zone create API failed. Falling back to localStorage.", e);
        showApiRetryBanner();
      }
    }

    if (!zonesApiMode) {
      const newZone = {
        id: generateNewZoneId(),
        name: zoneNameInput.value,
        description: zoneDescriptionInput.value,
        manager: zoneManagerInput.value,
        status: "Active", // Default new zones to Active
      };

      zones.push(newZone);
      saveData("zones", zones);
      renderZoneTable(zones);
    }
  })();

  // Close the modal and reset form
  const addZoneModalEl = document.getElementById("addZoneModal");
  const modal =
    bootstrap.Modal.getInstance(addZoneModalEl) ||
    new bootstrap.Modal(addZoneModalEl);
  modal.hide();
  document.querySelector("#addZoneModal form").reset();
}

// --- Edit Zone Logic ---
function handleEditZone(event) {
  event.preventDefault();

  const id = document.getElementById("editZoneId").value;
  const name = document.getElementById("editZoneName").value;
  const description = document.getElementById("editZoneDescription").value;
  const manager = document.getElementById("editZoneManager").value;
  const status = document.getElementById("editZoneStatus").value;

  if (!id || !name || !manager || !status) {
    alert("Zone ID, Name, Manager, and Status are required.");
    return;
  }

  // Find and update the object in the global array
  const zoneIndex = zones.findIndex((z) => z.id === id);

  if (zoneIndex !== -1) {
    zones[zoneIndex] = {
      ...zones[zoneIndex],
      name: name,
      description: description,
      manager: manager,
      status: status,
    };

    (async function () {
      if (isNumericId(id) && zonesApiMode) {
        try {
          await apiJson(`${ZONES_API_BASE}/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name: name }),
          });
          // API update succeeded — hide retry banner if visible
          hideApiRetryBanner();
        } catch (e) {
          console.warn("Zone update API failed. Falling back to localStorage.", e);
          showApiRetryBanner();
        }
      }

      saveData("zones", zones);
      renderZoneTable(zones);
    })();

    // Close the modal
    const editZoneModalEl = document.getElementById("editZoneModal");
    const modal =
      bootstrap.Modal.getInstance(editZoneModalEl) ||
      new bootstrap.Modal(editZoneModalEl);
    modal.hide();
  } else {
    alert("Error: Zone not found.");
  }
}

// --- Add Territory Logic ---
function handleAddTerritory(event) {
  event.preventDefault(); // Stop default form submission

  const territoryNameInput = document.getElementById("territoryName");
  const territoryZoneInput = document.getElementById("territoryZone");
  const territoryManagerInput = document.getElementById("territoryManager");
  const territoryDescriptionInput = document.getElementById(
    "territoryDescription"
  );

  // Simple validation
  if (
    !territoryNameInput.value ||
    !territoryZoneInput.value ||
    !territoryManagerInput.value
  ) {
    alert("Please fill in Territory Name, Zone, and Territory Manager.");
    return;
  }

  (async function () {
    if (territoriesApiMode) {
      try {
        const created = await apiJson(TERRITORIES_API_BASE, {
          method: "POST",
          body: JSON.stringify({
            name: territoryNameInput.value,
            zone: territoryZoneInput.value,
          }),
        });

        if (created) {
          const newTerritory = {
            id: String(created.id),
            name: created.name,
            zone: created.zone,
            manager: territoryManagerInput.value,
            mrCount: 0,
            status: "Active",
            description: territoryDescriptionInput.value,
          };
          territories.push(newTerritory);
          saveData("territories", territories);
          renderTerritoryTable(territories);
          // API create succeeded — hide retry banner
          hideApiRetryBanner();
        }
      } catch (e) {
        console.warn("Territory create API failed. Falling back to localStorage.", e);
        showApiRetryBanner();
      }
    }

    if (!territoriesApiMode) {
      const newTerritory = {
        id: generateNewTerritoryId(),
        name: territoryNameInput.value,
        zone: territoryZoneInput.value,
        manager: territoryManagerInput.value,
        mrCount: 0, // Default MR Count for a new territory
        status: "Active", // Default new territories to Active
        description: territoryDescriptionInput.value,
      };

      territories.push(newTerritory);
      saveData("territories", territories);
      renderTerritoryTable(territories);
    }
  })();

  // Close the modal and reset form
  const addTerritoryModalEl = document.getElementById("addTerritoryModal");
  const modal =
    bootstrap.Modal.getInstance(addTerritoryModalEl) ||
    new bootstrap.Modal(addTerritoryModalEl);
  modal.hide();
  document.querySelector("#addTerritoryModal form").reset();
}

// --- Edit Territory Logic ---
function handleEditTerritory(event) {
  event.preventDefault();

  const id = document.getElementById("editTerritoryId").value;
  const name = document.getElementById("editTerritoryName").value;
  const zone = document.getElementById("editTerritoryZone").value;
  const manager = document.getElementById("editTerritoryManager").value;
  const description = document.getElementById("editTerritoryDescription").value;
  const mrCount =
    parseInt(document.getElementById("editTerritoryMrCount").value) || 0;
  const status = document.getElementById("editTerritoryStatus").value;

  if (!id || !name || !zone || !manager || !status) {
    alert("Territory ID, Name, Zone, Manager, and Status are required.");
    return;
  }

  // Find and update the object in the global array
  const territoryIndex = territories.findIndex((t) => t.id === id);

  if (territoryIndex !== -1) {
    territories[territoryIndex] = {
      ...territories[territoryIndex],
      name: name,
      zone: zone,
      manager: manager,
      description: description,
      mrCount: mrCount,
      status: status,
    };

    (async function () {
      if (isNumericId(id) && territoriesApiMode) {
        try {
          await apiJson(`${TERRITORIES_API_BASE}/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name: name, zone: zone }),
          });
          // API update succeeded — hide retry banner if visible
          hideApiRetryBanner();
        } catch (e) {
          console.warn("Territory update API failed. Falling back to localStorage.", e);
          showApiRetryBanner();
        }
      }

      saveData("territories", territories);
      renderTerritoryTable(territories);
    })();

    // Close the modal
    const editTerritoryModalEl = document.getElementById("editTerritoryModal");
    const modal =
      bootstrap.Modal.getInstance(editTerritoryModalEl) ||
      new bootstrap.Modal(editTerritoryModalEl);
    modal.hide();
  } else {
    alert("Error: Territory not found.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  (async function () {
    await refreshZonesFromApiOrFallback();
    await refreshTerritoriesFromApiOrFallback();

    // If API didn't populate arrays, load from localStorage / initial data
    if (!zones || zones.length === 0) {
      zones = getData("zones", initialZoneData);
    }
    if (!territories || territories.length === 0) {
      territories = getData("territories", initialTerritoryData);
    }

    renderZoneTable(zones);
    renderTerritoryTable(territories);
  })();

  // --- Attach Add Listeners ---
  const saveZoneButton = document.querySelector(
    '#addZoneModal .btn-primary[type="submit"]'
  );
  if (saveZoneButton) {
    // Ensure the event listener targets the form or prevents default
    saveZoneButton.addEventListener("click", handleAddZone);
  }

  const saveTerritoryButton = document.querySelector(
    '#addTerritoryModal .btn-primary[type="submit"]'
  );
  if (saveTerritoryButton) {
    saveTerritoryButton.addEventListener("click", handleAddTerritory);
  }

  // --- Attach Edit Listeners (New) ---
  const updateZoneButton = document.querySelector(
    '#editZoneModal .btn-primary[type="submit"]'
  );
  if (updateZoneButton) {
    // This button belongs to a form with id="editZoneForm"
    updateZoneButton.addEventListener("click", handleEditZone);
  }

  const updateTerritoryButton = document.querySelector(
    '#editTerritoryModal .btn-primary[type="submit"]'
  );
  if (updateTerritoryButton) {
    // This button belongs to a form with id="editTerritoryForm"
    updateTerritoryButton.addEventListener("click", handleEditTerritory);
  }

  // --- Search Functionality Listeners ---

  const zoneSearchInput = document.getElementById("zoneSearchInput");
  if (zoneSearchInput) {
    zoneSearchInput.addEventListener("keyup", function () {
      handleSearch("zones", this.value);
    });
  }

  const territorySearchInput = document.getElementById("territorySearchInput");
  if (territorySearchInput) {
    territorySearchInput.addEventListener("keyup", function () {
      handleSearch("territories", this.value);
    });
  }

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
});
