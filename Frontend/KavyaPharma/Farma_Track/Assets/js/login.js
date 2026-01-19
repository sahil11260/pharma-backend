document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const password = document.getElementById("password");


  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");

  const togglePassword = document.getElementById("togglePassword");


  // -----------------------
  // Email validation (@ + .com)
  // -----------------------
  function validateEmail(value) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return pattern.test(value);
  }

  email.addEventListener("input", () => {
    email.classList.remove("input-error");
    if (!validateEmail(email.value.trim())) {
      emailError.textContent = "Enter valid email (must end with .com)";
    } else {
      emailError.textContent = "";
    }
  });

  password.addEventListener("input", () => {
    password.classList.remove("input-error");
    if (!validatePassword(password.value.trim())) {
      passwordError.textContent = "Enter password";
    } else {
      passwordError.textContent = "";
    }
  });


  // -----------------------
  // Password validation
  // -----------------------
  function validatePassword(value) {
    return value.length > 0;
  }

  password.addEventListener("input", () => {
    if (!validatePassword(password.value.trim())) {
      passwordError.textContent =
        "Enter password";
    } else {
      passwordError.textContent = "";
    }
  });


  // -----------------------
  // Password Show / Hide
  // -----------------------
  togglePassword.addEventListener("click", () => {
    const type =
      password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);

    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
  });


  // -----------------------
  // Final form submit
  // -----------------------
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const emailVal = email.value.trim();
    const passVal = password.value.trim();

    if (!validateEmail(emailVal)) {
      emailError.textContent = "Enter valid email.";
      return;
    }

    if (!validatePassword(passVal)) {
      passwordError.textContent = "Enter password.";
      return;
    }


    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    const API_BASE = "https://pharma-backend-hxf9.onrender.com";

    (async function () {
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";

        const payload = { email: emailVal, password: passVal };

        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let message = `Login failed (${res.status})`;
          try {
            const obj = text ? JSON.parse(text) : null;
            if (obj && obj.message) message = String(obj.message);
          } catch (_) {
            if (text) message = text;
          }

          if (message.toLowerCase().includes("credentials") || message.toLowerCase().includes("email") || message.toLowerCase().includes("user")) {
            emailError.textContent = message;
            email.classList.add("input-error");
            email.focus();
          } else if (message.toLowerCase().includes("password")) {
            passwordError.textContent = message;
            password.classList.add("input-error");
          } else {
            alert(message);
          }
          return;
        }

        const data = await res.json();
        const token = data ? data.token : null;
        const user = data ? data.user : null;

        const serverRole = user && user.role ? String(user.role) : "";

        localStorage.setItem("kavya_auth_token", token || "");
        localStorage.setItem("kavya_user", JSON.stringify(user || {}));

        const finalRole = serverRole;
        localStorage.setItem("kavya_user_email", (user && user.email) ? user.email : emailVal);
        localStorage.setItem("kavya_user_role", finalRole);
        localStorage.setItem("signup_name", (user && user.name) ? user.name : (localStorage.getItem("signup_name") || ""));
        localStorage.setItem("signup_email", (user && user.email) ? user.email : emailVal);
        localStorage.setItem("signup_role", finalRole);

        if (finalRole === "SUPERADMIN") window.location.href = "./super-admin-dashboard/index.html";
        else if (finalRole === "ADMIN") window.location.href = "./Admin_pharma/index.html";
        else if (finalRole === "MANAGER") window.location.href = "./Manager-Dashboard/index.html";
        else if (finalRole === "MR") window.location.href = "./MR-Dashboard/index.html";
        else if (finalRole === "DOCTOR") window.location.href = "./MR-Dashboard/doctors.html";
        else if (finalRole === "HR") window.location.href = "./index.html";
        else {
          alert("Login successful, but no role-based dashboard found.");
          window.location.href = "index.html";
        }
      } catch (err) {
        console.error("Login error:", err);
        alert(err.message || "An unexpected error occurred. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    })();
  });
});
