// AI Insights specific scripts
const ctx1 = document.getElementById("salesPredictionChart").getContext("2d");
new Chart(ctx1, {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Predicted Sales",
        data: [120, 135, 148, 162, 175, 190],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  },
});

const ctx2 = document.getElementById("expenseAnomalyChart").getContext("2d");
new Chart(ctx2, {
  type: "bar",
  data: {
    labels: ["Travel", "Meals", "Medical", "Accommodation", "Transport"],
    datasets: [
      {
        label: "Expense Categories",
        data: [15000, 2500, 8000, 12000, 3500],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
});

const ctx3 = document.getElementById("visitOptimizationChart").getContext("2d");
new Chart(ctx3, {
  type: "doughnut",
  data: {
    labels: ["Optimized", "Sub-optimal", "Needs Review"],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          "rgba(75, 192, 192, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(255, 99, 132, 0.2)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
      },
    ],
  },
});

document.addEventListener("DOMContentLoaded", function () {
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
      popupEl.style.left = btnRect.left - 200 + "px"; // Adjust to align with button
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
});
