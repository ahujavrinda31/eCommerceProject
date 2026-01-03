function signupValidation() {
  const submitBtn = document.getElementById("submitBtn");
  const showPass = document.getElementById("showPass");

  const spass = document.getElementById("spass");
  const confirmpass = document.getElementById("confirmpass");

  const roleButtons = document.querySelectorAll(".role");

  const addressField = document.getElementById("saddress");
  const gstNoField = document.getElementById("gstNo");
  const vehicleNoField = document.getElementById("vehicleNo");

  let otpSent = false;
  let userInfo = {};
  let selectedRole = "";

  showPass.addEventListener("change", () => {
    spass.type = showPass.checked ? "text" : "password";
    confirmpass.type = showPass.checked ? "text" : "password";
  });

  roleButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      roleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      selectedRole = btn.textContent.toLowerCase();

      const addressGroup = document.getElementById("addressGroup");
      const gstGroup = document.getElementById("gstGroup");
      const vehicleGroup = document.getElementById("vehicleGroup");

      addressGroup.style.display = "none";
      gstGroup.style.display = "none";
      vehicleGroup.style.display = "none";

      if (selectedRole === "user") {
        addressGroup.style.display = "flex";
      }

      if (selectedRole === "seller") {
        addressGroup.style.display = "flex";
        gstGroup.style.display = "flex";
      }

      if (selectedRole === "transporter") {
        addressGroup.style.display = "flex";
        vehicleGroup.style.display = "flex";
      }

      if (selectedRole === "user") {
        addressGroup.hidden = false;
      }

      if (selectedRole === "seller") {
        addressGroup.hidden = false;
        gstGroup.hidden = false;
      }

      if (selectedRole === "transporter") {
        addressGroup.hidden = false;
        vehicleGroup.hidden = false;
      }
    });
  });

  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const name = document.getElementById("sname").value.trim();
    const email = document.getElementById("semail").value.trim();
    const password = spass.value;
    const passwordConfirm = confirmpass.value;
    const phone = document.getElementById("sphone").value.trim();

    const address = addressField.value.trim();
    const gstNo = gstNoField.value.trim();
    const vehicleNo = vehicleNoField.value.trim();

    if (!otpSent) {
      if (!name || !email || !password || !passwordConfirm || !phone) {
        Swal.fire("Missing Details", "Must specify all details", "warning");
        return;
      }

      if (!selectedRole) {
        Swal.fire("Role Required", "Please select a role", "warning");
        return;
      }

      if (!validateEmail(email)) {
        Swal.fire("Invalid Email", "Enter valid email", "error");
        return;
      }

      if (password.length < 6) {
        Swal.fire("Weak Password", "Minimum 6 characters", "warning");
        return;
      }

      if (password !== passwordConfirm) {
        Swal.fire("Mismatch", "Passwords do not match", "error");
        return;
      }

      if (!/^[789]\d{9}$/.test(phone)) {
        Swal.fire(
          "Invalid Phone",
          "Phone must be 10 digits and start with 7, 8, or 9",
          "error"
        );
        return;
      }

      if (selectedRole === "user" && !address) {
        Swal.fire("Address Required", "Enter address", "warning");
        return;
      }

      if (selectedRole === "seller" && (!address || !gstNo)) {
        Swal.fire("Missing Details", "Address & GST required", "warning");
        return;
      }

      if (selectedRole === "transporter" && (!address || !vehicleNo)) {
        Swal.fire(
          "Missing Details",
          "Address & Vehicle No required",
          "warning"
        );
        return;
      }

      userInfo = {
        name,
        email,
        password,
        phone,
        role: selectedRole,
        address,
      };

      if (selectedRole == "seller") {
        userInfo.gstNo = gstNo;
      }

      if (selectedRole == "transporter") {
        userInfo.vehicleNo = vehicleNo;
      }

      fetch("/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire("OTP Sent", "Check your email", "success");
            Swal.fire({
              title: "Enter OTP",
              input: "text",
              inputPlaceholder: "Enter OTP",
              showCancelButton: false,
              confirmButtonText: "Verify OTP",
            }).then((result) => {
              if (!result.value) return;

              fetch("/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...userInfo, otp: result.value }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    Swal.fire("Signup Successful", "", "success");
                    setTimeout(() => (window.location.href = "/"), 1500);
                  } else {
                    Swal.fire("Invalid OTP", "Try again", "error");
                  }
                });
            });
          }
        });
    } 
  });

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

signupValidation();
