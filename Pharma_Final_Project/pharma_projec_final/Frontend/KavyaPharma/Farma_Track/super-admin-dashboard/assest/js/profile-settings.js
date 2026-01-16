// Toggle password visibility
const togglePassword = document.querySelector("#togglePassword");
const toggleConfirmPassword = document.querySelector("#toggleConfirmPassword");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirmPassword");

togglePassword.addEventListener("click", function () {
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);
  this.querySelector("i").classList.toggle("bi-eye");
  this.querySelector("i").classList.toggle("bi-eye-slash");
});

toggleConfirmPassword.addEventListener("click", function () {
  const type =
    confirmPassword.getAttribute("type") === "password" ? "text" : "password";
  confirmPassword.setAttribute("type", type);
  this.querySelector("i").classList.toggle("bi-eye");
  this.querySelector("i").classList.toggle("bi-eye-slash");
});

// Form validation
document.getElementById("profileForm").addEventListener("submit", function (e) {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const mobile = document.getElementById("mobileNumber").value.trim();
  const pass = password.value;
  const confirmPass = confirmPassword.value;

  const namePattern = /^[A-Za-z\s]{1,250}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobilePattern = /^\d{10}$/;
  const passPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!namePattern.test(fullName)) {
    alert(
      "Profile Name must contain only letters and spaces (max 250 characters)."
    );
    e.preventDefault();
    return;
  }

  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address.");
    e.preventDefault();
    return;
  }

  if (!mobilePattern.test(mobile)) {
    alert("Please enter exactly 10 digits for your mobile number.");
    e.preventDefault();
    return;
  }

  if (!passPattern.test(pass)) {
    alert(
      "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character."
    );
    e.preventDefault();
    return;
  }

  if (pass !== confirmPass) {
    alert("Passwords do not match.");
    e.preventDefault();
  }
});
