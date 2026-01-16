document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("forgotForm");
  const emailField = document.getElementById("email");
  const emailError = document.getElementById("emailError");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    emailError.textContent = "";

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,4}$/;

    if (!emailRegex.test(emailField.value.trim())) {
      emailError.textContent = "Enter a valid email.";
      return;
    }

    alert("Reset link sent to your email!");
    window.location.href = "login.html";
  });

});
