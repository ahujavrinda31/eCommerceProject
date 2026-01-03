const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

const fields = ["name", "phone", "address"];

editBtn.addEventListener("click", () => {
  fields.forEach(f => {
    document.getElementById(f).hidden = false;
    document.getElementById(f + "Text").hidden = true;
  });

  editBtn.hidden = true;
  saveBtn.hidden = false;
});

saveBtn.addEventListener("click", () => {
  const updatedData = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim()
  };

  fetch("/user/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        Swal.fire("Error", data.message || "Update failed", "error");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Profile updated",
        timer: 1500,
        showConfirmButton: false
      });

      fields.forEach(f => {
        document.getElementById(f + "Text").innerText =
          document.getElementById(f).value;

        document.getElementById(f).hidden = true;
        document.getElementById(f + "Text").hidden = false;
      });

      saveBtn.hidden = true;
      editBtn.hidden = false;
    })
    .catch(err => {
      console.error(err);
      Swal.fire("Error", "Network error", "error");
    }); 
});
