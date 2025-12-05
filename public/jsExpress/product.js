setInterval(() => {
  fetch("/session-status")
    .then((res) => res.json())
    .then((data) => {
      if (data.email !== window.currentEmail) {
        window.location.href = "/login";
      }
    })
    .catch(() => {
      
    });
}, 3000);

let selectedCategoryId = "";
let selectedCategoryName = "";
let selectedSubCategoryId = "";
let selectedSubCategoryName = "";

document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCategoryName = btn.dataset.category;
    selectedCategoryId = btn.dataset.catId || ""; 
    selectedSubCategoryId = "";
    selectedSubCategoryName = "";

    const contain = document.getElementById("sub-category-container");
    contain.innerHTML = "";

    const fetchId = selectedCategoryId ? selectedCategoryId : selectedCategoryName;
    fetch(`/get-subcategories/${encodeURIComponent(fetchId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const subcategories = data.subcategories; 
          subcategories.forEach((sub) => {
            const subBtn = document.createElement("button");
            subBtn.className = "subcategory-btn";

            if (typeof sub === "object") {
              subBtn.textContent = sub.name;
              subBtn.dataset.subId = sub._id;
              subBtn.dataset.subName = sub.name;
            } else {
              subBtn.textContent = sub;
              subBtn.dataset.subId = sub; 
              subBtn.dataset.subName = sub;
            }

            subBtn.addEventListener("click", () => {
              selectedSubCategoryId = subBtn.dataset.subId;
              selectedSubCategoryName = subBtn.dataset.subName;
              document.getElementById("container").style.display = "block";
            });
            contain.appendChild(subBtn);
          });
        } else {
          Swal.fire(
            "No Subcategories",
            data.message || "No subcategories found.",
            "info"
          );
        }
      })
      .catch((err) => {
        console.error("Error fetching subcategories:", err);
        Swal.fire("Error", "Unable to fetch subcategories", "error");
      });
  });
});

document.getElementById("addBtn").addEventListener("click", function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const description = document.getElementById("description").value.trim();
  const image = document.getElementById("image").files[0];

  if (!selectedCategoryId && !selectedCategoryName) {
    return Swal.fire("Missing Info", "Select a category first", "warning");
  }
  if (!selectedSubCategoryId && !selectedSubCategoryName) {
    return Swal.fire("Missing Info", "Select a subcategory first", "warning");
  }

  if (!name || !price || !quantity || !description || !image) {
    return Swal.fire("Missing Info", "All fields are required", "warning");
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", price);
  formData.append("quantity", quantity);
  formData.append("description", description);
  formData.append("image", image);

  if (selectedCategoryId) {
    formData.append("categoryId", selectedCategoryId);
  } else {
    formData.append("category", selectedCategoryName);
  }
  if (selectedSubCategoryId) {
    formData.append("subcategoryId", selectedSubCategoryId);
  } else {
    formData.append("subcategory", selectedSubCategoryName);
  }

  fetch("/addProduct", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json ? res.json() : Promise.resolve({ ok: res.ok }))
    .then((data) => {
      if ((data && data.success) || data.ok) {
        window.location.reload();
      } else {
        Swal.fire("Error occured", (data && data.message) || "Product addition failed", "error");
      }
    })
    .catch((err) => {
      console.error("Add product error:", err);
      Swal.fire("Error", "Product addition failed", "error");
    });
});

document.querySelectorAll(".editBtn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const card = btn.closest(".product-card");
    const prodId = card.dataset.id;
    const nameElement = card.querySelector(".prod-name");
    const priceElement = card.querySelector(".prod-price");
    const quantityElement = card.querySelector(".prod-quantity");
    const descriptionElement = card.querySelector(".prod-description");
    const imageInput = card.querySelector(".image-input");

    if (btn.textContent === "Edit") {
      nameElement.innerHTML = `<input value="${escapeHtml(nameElement.textContent)}" class="name-field">`;
      priceElement.innerHTML = `<input value="${escapeHtml(priceElement.textContent)}" class="price-field">`;
      quantityElement.innerHTML = `<input value="${escapeHtml(quantityElement.textContent)}" class="quantity-field">`;
      descriptionElement.innerHTML = `<input value="${escapeHtml(descriptionElement.textContent)}" class="description-field">`;
      imageInput.style.display = "block";
      btn.textContent = "Update";
    } else {
      const name = card.querySelector(".name-field").value.trim();
      const price = card.querySelector(".price-field").value.trim();
      const quantity = card.querySelector(".quantity-field").value.trim();
      const description = card.querySelector(".description-field").value.trim();
      const image = imageInput.files[0];

      if (!name || !price || !quantity || !description) {
        return Swal.fire("Missing Info", "All fields are required", "warning");
      }

      const formData = new FormData();
      formData.append("id", prodId);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("description", description);
      if (image) formData.append("image", image);

      fetch("/updateProduct", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            nameElement.textContent = name;
            priceElement.textContent = price;
            quantityElement.textContent = quantity;
            descriptionElement.textContent = description;
            if (data.newImagePath) {
              card.querySelector(".product-img").src = "/uploads/" + data.newImagePath;
            }
            imageInput.value = "";
            imageInput.style.display = "none";
            btn.textContent = "Edit";
          } else {
            Swal.fire("Error Occured", data.message || "Update Failed", "error");
          }
        })
        .catch((err) => {
          console.error("Update error:", err);
          Swal.fire("Error Occured", "Update Failed", "error");
        });
    }
  });
});

document.querySelectorAll(".deleteBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const prodId = card.dataset.id;

    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the product.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    }).then((result) => {
      if (!result.isConfirmed) return;

      fetch("/deleteProduct", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prodId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            card.remove();
            Swal.fire("Deleted", "Product removed", "success");
          } else {
            Swal.fire("Error Occured", data.message || "Deletion Failed", "error");
          }
        })
        .catch((err) => {
          console.error("Delete error:", err);
          Swal.fire("Error Occured", "Deletion Failed", "error");
        });
    });
  });
});

document.getElementById("logout-btn").addEventListener("click", function () {
  fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/";
      }
    });
});

const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryInputDiv = document.getElementById("categoryInputDiv");
addCategoryBtn.addEventListener("click", () => {
  categoryInputDiv.style.display = "block";
});
document.getElementById("submitCategory").addEventListener("click", () => {
  const newCategory = document.getElementById("newCategoryInput").value.trim();
  if (!newCategory) {
    Swal.fire("Missing Info", "Category name required", "warning");
    return;
  }
  fetch("/add-category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: newCategory }),
  })
    .then((res) => res.json())
    .then((data) => {
      Swal.fire(
        data.message || "",
        "",
        data.success ? "success" : "error"
      ).then(() => {
        if (data.success) location.reload();
      });
    });
});

document.getElementById("submitSubcategory").addEventListener("click", () => {
  const category = document.getElementById("categorySelect").value;
  const subcategory = document.getElementById("newSubcategoryInput").value.trim();
  if (!subcategory) return Swal.fire("Missing Info", "Please enter subcategory name", "warning");

  fetch("/add-subcategory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, subcategory }),
  })
    .then((res) => res.json())
    .then((data) => {
      Swal.fire(data.message || "", "", data.success ? "success" : "error").then(() => {
        if (data.success) location.reload();
      });
    });
});

const users = document.getElementById("users");
document.getElementById("users-btn").addEventListener("click", () => {
  fetch("/get-users")
    .then((res) => res.json())
    .then((data) => {
      users.innerHTML = "";
      if (!data.user || data.user.length === 0) {
        users.innerHTML = "<p>No registered users</p>";
      } else {
        data.user.forEach((u) => {
          const div = document.createElement("div");
          div.classList.add("registered-user");
          div.innerHTML = `<p><strong>Name: ${escapeHtml(u.name)}</strong></p>
            <p><strong>Email: ${escapeHtml(u.email)}</strong></p>`;
          users.appendChild(div);
        });
      }
    })
    .catch((err) => {
      console.error("Get users error:", err);
      users.innerHTML = "<p>Unable to fetch users</p>";
    });
});

function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") return unsafe;
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
