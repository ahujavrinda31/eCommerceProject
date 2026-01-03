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
