// index.js
console.log('index.js loaded');

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".nav-link");
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  // 🔹 Handle Active Link Highlight
  navLinks.forEach(link => {
    link.addEventListener("click", function () {
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove("active"));
      // Add active to the clicked one
      this.classList.add("active");

      // 🔹 Close menu automatically on mobile after clicking a link
      if (window.innerWidth <= 768) {
        navMenu.classList.remove("active");
        const icon = menuToggle.querySelector("i");
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-times");
      }
    });
  });

  // 🔹 Toggle Mobile Menu
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");

      // Toggle icon (bars ↔ close)
      const icon = menuToggle.querySelector("i");
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-times");
    });
  }
});
