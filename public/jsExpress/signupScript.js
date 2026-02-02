function signupValidation() {
  const submitBtn = document.getElementById("submitBtn");

  const spass = document.getElementById("spass");

  const roleButtons = document.querySelectorAll(".role");

  const gstNoField = document.getElementById("gstNo");
  const vehicleNoField = document.getElementById("vehicleNo");

  let otpSent = false;
  let userInfo = {};
  let selectedRole = "";

  roleButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      roleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      selectedRole = btn.textContent.toLowerCase();

      const gstGroup = document.getElementById("gstGroup");
      const vehicleGroup = document.getElementById("vehicleGroup");

      gstGroup.style.display = "none";
      vehicleGroup.style.display = "none";


      if (selectedRole === "seller") {
        gstGroup.style.display = "flex";
      }

      if (selectedRole === "transporter") {
        vehicleGroup.style.display = "flex";
      }
    });
  });

  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const name = document.getElementById("sname").value.trim();
    const email = document.getElementById("semail").value.trim();
    const password = spass.value;
    const phone = document.getElementById("sphone").value.trim();
    const address=document.getElementById("saddress").value.trim();

    const gstNo = gstNoField.value.trim();
    const vehicleNo = vehicleNoField.value.trim();

    if (!otpSent) {
      if (!name || !email || !password || !phone || !address) {
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

      if (!/^[6789]\d{9}$/.test(phone)) {
        Swal.fire(
          "Invalid Phone",
          "Phone must be 10 digits and start with 6, 7, 8, or 9",
          "error"
        );
        return;
      }

      if (selectedRole === "seller" && (!gstNo || !gstNo.length==15)) {
        Swal.fire("Missing Details", "GST required and should be of 15 characters", "warning");
        return;
      }

      if (selectedRole === "transporter" && (!vehicleNo)) {
        Swal.fire(
          "Missing Details",
          "Vehicle No required",
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
                    if(userInfo.role=="seller" || userInfo.role=="transporter"){
                      setTimeout(() => (window.location.href = "/wait-approval"), 1500);
                    }
                    else{
                      setTimeout(() => (window.location.href = "/"), 1500);
                    }
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