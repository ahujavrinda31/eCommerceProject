const addSubBtn = document.getElementById("add-subcategory-btn");

if (addSubBtn) {
  addSubBtn.addEventListener("click", () => {
    const categoryId = addSubBtn.dataset.id;

    Swal.fire({
      title: "Add Subcategory",
      input: "text",
      inputPlaceholder: "Enter subcategory name",
      showCancelButton: true,
      confirmButtonText: "Add",
      preConfirm: (value) => {
        if (!value.trim()) {
          Swal.showValidationMessage("Subcategory cannot be empty");
        }
        return value.trim();
      },
    }).then((result) => {
      if (!result.isConfirmed) return;

      fetch(`/admin/categories/${categoryId}/addSubcategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subcategoryName: result.value,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire("Success", "Subcategory added", "success").then(() =>
              location.reload(),
            );
          } else {
            Swal.fire("Error", data.message, "error");
          }
        });
    });
  });
}

document.querySelectorAll(".edit-subcategory").forEach((button) => {
  button.addEventListener("click", () => {
    const subId = button.dataset.subid;
    const categoryId = button.dataset.categoryid;
    const oldName = button.dataset.name;

    Swal.fire({
      title: "Edit Subcategory",
      input: "text",
      inputValue: oldName,
      showCancelButton: true,
      confirmButtonText: "Update",
      preConfirm: (value) => {
        if (!value.trim()) {
          Swal.showValidationMessage("Subcategory cannot be empty");
        }
        return value.trim();
      },
    }).then((result) => {
      if (!result.isConfirmed) return;

      fetch("/admin/edit-subcategory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          categoryId,
          subId,
          newSub: result.value,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire("Updated", "Subcategory updated", "success").then(() =>
              location.reload(),
            );
          } else {
            Swal.fire("Error", data.message, "error");
          }
        });
    });
  });
});
