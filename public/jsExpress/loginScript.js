function loginValidation() {
  const loginForm = document.querySelector("#loginForm");
  const forgotLink = document.getElementById("forgotLink");
  const forgotForm = document.getElementById("forgotForm");
  const forgotSubmitBtn = document.getElementById("forgotSubmitBtn");

  let otpSent = false;

  forgotLink.addEventListener("click", () => {
    loginForm.style.display = "none";
    forgotForm.style.display = "flex";
  });

  forgotSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const email = document.getElementById("forgotEmail").value.trim();
    const newPass = document.getElementById("newPass").value;
    const confirmPass = document.getElementById("confirmNewPass").value;

    if (!email || !newPass || !confirmPass) {
      return Swal.fire("Missing Info", "All fields are required", "warning");
    }
    if (!validateEmail(email)){
      return Swal.fire("Invalid Email", "Enter a valid email", "error");
    } 
    if (newPass.length < 6) return Swal.fire("Weak Password", "Password must be at least 6 characters", "warning");
    if (newPass !== confirmPass) return Swal.fire("Mismatch", "Passwords do not match", "error");

    if (!otpSent) {
      fetch("/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire("OTP Sent!", "Check your email", "success");
            document.getElementById("otpInputBox").style.display = "block";
            forgotSubmitBtn.textContent = "Verify OTP";
            otpSent = true;
          } else {
            Swal.fire("Error", data.message, "error");
          }
        });
    } else {
      const otp = document.getElementById("forgotOtp").value.trim();
      if (!otp) return Swal.fire("Missing OTP", "Enter the OTP", "warning");

      fetch("/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: newPass }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire("Success", data.message, "success");
            forgotForm.style.display = "none";
            loginForm.style.display = "flex";
            otpSent = false;
            forgotSubmitBtn.textContent = "Send OTP";
            document.getElementById("otpInputBox").style.display = "none";
          } else {
            Swal.fire("Error", data.message, "error");
          }
        });
    }
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.querySelector("#lemail").value;
    const password = document.querySelector("#lpass").value;
    if (!email || !password) return Swal.fire("Missing Fields", "All fields are required", "warning");
    if (!validateEmail(email)) return Swal.fire("Invalid Email", "Enter a valid email", "error");

    fetch("http://localhost:4000/loginScript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailLogin: email, passwordLogin: password })
    })
      .then((res) => res.text())
      .then((data) => {
        if (data === "yes") window.location.href = "/admin";
        else if (data === "no") window.location.href = "/home";
        else Swal.fire("Login Failed", data, "error");
      });
  });

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}

loginValidation();