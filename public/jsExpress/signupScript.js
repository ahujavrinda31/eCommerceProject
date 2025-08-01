function signupValidation() {
  const submitBtn = document.getElementById("submitBtn");
  const otpSection = document.getElementById("otpSection");

  let otpSent = false;
  let userInfo = {};

  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (!otpSent) {
      const name = document.querySelector("#sname").value;
      const email = document.querySelector("#semail").value;
      const password = document.querySelector("#spass").value;
      const passwordConfirm = document.querySelector("#confirmpass").value;
      const check = document.querySelector("#check");
      let admin = "no";
      if (!name || !email || !password || !passwordConfirm) {
        Swal.fire("Missing Details", "Must specify all details", "warning");
        return;
      }
      let namedata = name;
      for (i = 0; i < namedata.length; i++) {
        if (
          !(
            (namedata.charAt(i) >= "a" && namedata.charAt(i) <= "z") ||
            (namedata.charAt(i) >= "A" && namedata.charAt(i) <= "Z") ||
            namedata.charAt(i) == " "
          )
        ) {
          Swal.fire("Invalid Name", "Name must have valid characters", "error");
          return;
        }
      }
      if (!validateEmail(email)) {
        Swal.fire("Invalid Email", "Please enter a valid email", "error");
        return;
      }
      if (password.length < 6) {
        Swal.fire("Weak Password", "Password must be at least 6 characters", "warning");
        return;
      }
      if (password != passwordConfirm) {
        Swal.fire("Mismatch", "Passwords do not match", "error");
        return; 
      }
      if (check.checked == true) {
        admin = "yes";
      }
      userInfo = { name, email, password, passwordConfirm, admin };
      fetch("/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire("OTP Sent", "Check your email for the OTP", "success");
            otpSection.style.display = "block";
            submitBtn.textContent = "Verify OTP";
            otpSent = true;
          } else {
            Swal.fire("Error", data.message, "error");
          }
        });
    } else {
      const otp = document.getElementById("otpInput").value.trim();

      if (!otp) {
        Swal.fire("Missing OTP", "Please enter the OTP", "warning");
        return;
      }

      fetch("/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userInfo, otp }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Signup Successful!",
              text: data.message,
              timer: 2000,
              showConfirmButton: false
            })
            window.location.href = "/login";
          } else {
            Swal.fire("Verification Failed", data.message, "error");
          }
        });
    }
  });
  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
signupValidation();
