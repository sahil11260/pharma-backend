document.addEventListener("DOMContentLoaded", () => {

  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  const sidebarToggle = document.getElementById("sidebarToggle");

  /* SIDEBAR TOGGLE */
  sidebarToggle.addEventListener("click", () => {

    // MOBILE
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle("mobile-open");
      return;
    }

    // DESKTOP COLLAPSE
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
  });

  /* Auto close sidebar on resize */
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("mobile-open");
    }
  });

  /* DARK MODE TOGGLE */
  const themeToggle = document.getElementById("themeToggle");

  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  });

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

});
