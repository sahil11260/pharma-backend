document.addEventListener("DOMContentLoaded", function () {

  let attendanceHistory = JSON.parse(localStorage.getItem("attendanceHistory")) || [];

  function formatTime(ts) {
    if (!ts) return "--:--";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // DELETE RECORD
  window.deleteRecord = function (index) {
    if (confirm("Are you sure you want to delete this record?")) {
      attendanceHistory.splice(index, 1);
      localStorage.setItem("attendanceHistory", JSON.stringify(attendanceHistory));
      renderTable();
    }
  };

  // RENDER TABLE
  function renderTable() {
    const tbody = document.getElementById("attendanceTableBody");
    tbody.innerHTML = "";

    attendanceHistory.forEach((record, index) => {
      const hrs = Math.floor(record.totalMinutes / 60);
      const mins = record.totalMinutes % 60;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${record.date}</td>
        <td>${formatTime(record.checkIn)}</td>
        <td>${formatTime(record.checkOut)}</td>
        <td>${hrs}h ${mins}m</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord(${index})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  renderTable();

});
