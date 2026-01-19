document.addEventListener("DOMContentLoaded", () => {
  const viewUsersBtn = document.getElementById("view-users");
  if (viewUsersBtn) {
    viewUsersBtn.addEventListener("click", () => {
      window.location.href = "/admin/users";
    });
  }

  document.getElementById("view-products").addEventListener("click", () => {
    window.location.href = "/admin/products";
  });

  document.getElementById("orders-button").addEventListener("click", () => {
    window.location.href = "/admin/view-orders";
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            window.location.replace("/");
          }
        });
    });
  }
});

document.getElementById("add-category-btn").addEventListener("click", () => {
  Swal.fire({
    title: "Add Category",
    input: "text",
    inputPlaceholder: "Add Category Name",
    showCancelButton: true,
    confirmButtonText: "Submit Category",
    preConfirm: (value) => {
      if (!value.trim()) {
        Swal.showValidationMessage("Category name cannot be empty");
      }
      return value.trim();
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    fetch("/admin/addCategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: result.value }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.exists) {
          Swal.fire("Category Exists", "You can use this category", "info");
        } else if (data.success) {
          Swal.fire("Success", "Category created successfully", "success");
        } else {
          Swal.fire("Error", data.message || "Error adding category", "error");
        }
      });
  });
});

document.getElementById("add-subcategory").addEventListener("click", () => {
  Swal.fire({
    title: "Add Subcategory",
    html: `
        <input id="categoryName" class="swal2-input" placeholder="Category Name">
        <input id="subcategoryname" class="swal2-input" placeholder="Subcategory Name">`,
    confirmButtonText: "Add Subcategory",
    showCancelButton: true,
    preConfirm: () => {
      const categoryName = document.getElementById("categoryName").value.trim();
      const subcategoryName = document
        .getElementById("subcategoryname")
        .value.trim();

      if (!categoryName || !subcategoryName) {
        Swal.showValidationMessage("Both fields are required");
        return false;
      }

      return { categoryName, subcategoryName };
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    fetch("/admin/addsubcategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(result.value),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          Swal.fire("Success", data.message, "success");
        } else if (data.type == "not_exists") {
          Swal.fire("Category Missing", data.message, "error");
        } else if (data.type == "exists") {
          Swal.fire("Info", data.message, "info");
        }
      });
  });
});

document.getElementById("edit-category-btn").addEventListener("click", () => {
  Swal.fire({
    title: "Edit Category",
    html: `
      <input id="oldCat" class="swal2-input" placeholder="Old Category Name">
      <input id="newCat" class="swal2-input" placeholder="New Category Name">
    `,
    confirmButtonText: "Update",
    preConfirm: () => {
      return {
        oldName: document.getElementById("oldCat").value.trim(),
        newName: document.getElementById("newCat").value.trim()
      };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch("/admin/edit-category", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(result.value)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire("Updated", data.message, "success")
          .then(() => window.location.reload());
      } else {
        Swal.fire("Error", data.message, "error");
      }
    });
  });
});

document.getElementById("edit-subcategory-btn").addEventListener("click", () => {
  Swal.fire({
    title: "Edit Subcategory",
    html: `
      <input id="catName" class="swal2-input" placeholder="Category Name">
      <input id="oldSub" class="swal2-input" placeholder="Old Subcategory">
      <input id="newSub" class="swal2-input" placeholder="New Subcategory">
    `,
    confirmButtonText: "Update",
    preConfirm: () => {
      return {
        categoryName: document.getElementById("catName").value.trim(),
        oldSub: document.getElementById("oldSub").value.trim(),
        newSub: document.getElementById("newSub").value.trim()
      };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch("/admin/edit-subcategory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(result.value)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire("Updated", data.message, "success")
          .then(() => window.location.reload());
      } else {
        Swal.fire("Error", data.message, "error");
      }
    });
  });
});

document.addEventListener("click", function (e) {
  if (!e.target.classList.contains("delete-btn")) return;

  const userId = e.target.dataset.id;

  Swal.fire({
    title: "Are you sure?",
    text: "This user will be permanently deleted",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
  }).then((result) => {
    if (!result.isConfirmed) return;

    fetch(`/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          document.getElementById(`user-${userId}`)?.remove();
          Swal.fire("Deleted!", "User removed", "success");
        } else {
          Swal.fire("Error", data.message || "Failed", "error");
        }
      });
  });
});

document.addEventListener("click", (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("approve-btn")) {
    updateRequest(id, "approve");
  }

  if (e.target.classList.contains("reject-btn")) {
    updateRequest(id, "reject");
  }
});

function updateRequest(id, action) {
  fetch(`/admin/requests/${id}/${action}`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const card = document.getElementById(`user-${id}`);
        if (card) card.remove();
        Swal.fire("Done", data.message, "success");
      }
      if (document.querySelectorAll(".user-card").length === 0) {

        const heading = document.querySelector(".requests-heading");
        if (heading) heading.remove();

        const container = document.querySelector(".card-container");
        const noRequests = document.createElement("h4");
        noRequests.className = "no-requests";
        noRequests.innerText = "No Pending Users Requests";
        container.appendChild(noRequests);
      }
    });
}
