function showSettingsTab(tabName) {
  // Hide all settings tabs
  const tabs = document.querySelectorAll(".settings-tab");
  tabs.forEach((tab) => (tab.style.display = "none"));

  // Remove active class from all menu items
  const menuItems = document.querySelectorAll(".list-group-item");
  menuItems.forEach((item) => item.classList.remove("active"));

  // Show selected tab and activate menu item
  document.getElementById(tabName + "-settings").style.display = "block";
  event.target.classList.add("active");
}
