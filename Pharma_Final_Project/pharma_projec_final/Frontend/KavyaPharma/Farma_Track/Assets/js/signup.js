document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("signupForm");
  const API_BASE = "";

  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const passField = document.getElementById("password");
  const confirmField = document.getElementById("confirm");
  const roleField = document.getElementById("role");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const passError = document.getElementById("passError");
  const confirmError = document.getElementById("confirmError");
  const roleError = document.getElementById("roleError");

  // Password visibility toggle
  document.getElementById("togglePassword").addEventListener("click", function () {
    passField.type = passField.type === "password" ? "text" : "password";
    this.classList.toggle("fa-eye-slash");
  });

  document.getElementById("toggleConfirm").addEventListener("click", function () {
    confirmField.type = confirmField.type === "password" ? "text" : "password";
    this.classList.toggle("fa-eye-slash");
  });

  // Validation on submit
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let valid = true;

    // Clear previous errors
    nameError.textContent = "";
    emailError.textContent = "";
    passError.textContent = "";
    confirmError.textContent = "";
    roleError.textContent = "";

    // NAME
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(nameField.value.trim())) {
      nameError.textContent = "Name must contain only alphabets.";
      valid = false;
    }

    // EMAIL
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,4}$/;
    if (!emailRegex.test(emailField.value.trim())) {
      emailError.textContent = "Enter a valid email.";
      valid = false;
    }

    // PASSWORD
    const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/;
    if (!passRegex.test(passField.value.trim())) {
      passError.textContent = "Password must be 6+ chars, include a number & special char.";
      valid = false;
    }

    // CONFIRM PASSWORD
    if (confirmField.value.trim() !== passField.value.trim()) {
      confirmError.textContent = "Passwords do not match.";
      valid = false;
    }

    // ROLE
    if (roleField.value === "") {
      roleError.textContent = "Please select a role.";
      valid = false;
    }

    if (!valid) return;

    (async function () {
      try {
        const payload = {
          name: nameField.value.trim(),
          email: emailField.value.trim(),
          password: passField.value.trim(),
          role: roleField.value
        };

        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Signup failed (${res.status})`);
        }

        const user = await res.json();

        localStorage.setItem("signup_name", user.name || nameField.value.trim());
        localStorage.setItem("signup_email", user.email || emailField.value.trim());
        localStorage.setItem("signup_role", String(user.role || roleField.value));

        alert("Signup successful! Please login.");
        window.location.href = "login.html";
      } catch (err) {
        const msg = err && err.message ? String(err.message) : "Signup failed";
        alert(msg);
      }
    })();
  });
});
