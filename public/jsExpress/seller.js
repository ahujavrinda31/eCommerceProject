const profileInitialElement = document.getElementById('profile-initial');
if (profileInitialElement && typeof userInitial !== 'undefined') {
  profileInitialElement.textContent = userInitial;
  profileInitialElement.onclick = () => {
    window.location.href="/seller/profile";
  };
}

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

    fetch("/seller/addCategory", {
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

    fetch("/seller/addsubcategory", {
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

document.getElementById("add-product").addEventListener("click", () => {
  Swal.fire({
    title: "Add Product",
    html: `<input id="categoryName" class="swal2-input" placeholder="Category Name">
        <input id="subcategoryname" class="swal2-input" placeholder="Subcategory Name">
        <input id="productName" class="swal2-input" placeholder="Product Name">
        <input id="price" class="swal2-input" placeholder="Product Price">
        <input id="quantity" class="swal2-input" placeholder="Product Quantity">
        <textarea id="description" class="swal2-input" placeholder="Product Description"></textarea>
        <input id="image" name="image" type="file" class="swal2-file">`,
    confirmButtonText: "Add Product",
    showCancelButton: true,
    preConfirm: () => {
      const data = {
        categoryName: document.getElementById("categoryName").value.trim(),
        subcategoryName: document
          .getElementById("subcategoryname")
          .value.trim(),
        name: document.getElementById("productName").value.trim(),
        price: document.getElementById("price").value,
        quantity: document.getElementById("quantity").value,
        description: document.getElementById("description").value.trim(),
        image: document.getElementById("image").files[0],
      };

      if (
        !data.categoryName ||
        !data.subcategoryName ||
        !data.name ||
        !data.price ||
        !data.quantity ||
        !data.description ||
        !data.image
      ) {
        Swal.showValidationMessage("All fields are mandatory");
        return false;
      }
      return data;
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    const formData = new FormData();
    Object.entries(result.value).forEach(([key, value]) => {
      formData.append(key, value);
    });

    fetch("/seller/add-product", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          Swal.fire({
            title: "Success",
            text: data.message,
            icon: "success",
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "/seller";
            }
          });
        } else {
          Swal.fire("Error", data.message, "error");
        }
      });
  });
});

document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const productId = btn.dataset.id;

    const res = await fetch(`/seller/product/${productId}`);
    const product = await res.json();

    Swal.fire({
      title: "Edit Product",
      html: `
        <input id="name" class="swal2-input" placeholder="Product Name" value="${product.name}">
        <input id="price" class="swal2-input" placeholder="Price" value="${product.price}">
        <input id="quantity" class="swal2-input" placeholder="Quantity" value="${product.quantity}">
        <textarea id="description" class="swal2-input" placeholder="Description">${product.description}</textarea>
        <input id="image" name="image" type="file" class="swal2-file">
      `,
      confirmButtonText: "Update Product",
      showCancelButton: true,
      preConfirm: () => {
        return {
          name: document.getElementById("name").value.trim(),
          price: document.getElementById("price").value,
          quantity: document.getElementById("quantity").value,
          description: document.getElementById("description").value.trim(),
          image: document.getElementById("image").files[0],
        };
      },
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const formData = new FormData();
      Object.entries(result.value).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const response = await fetch(`/seller/edit-product/${productId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire("Updated", data.message, "success");
        const card = document.getElementById(`product-${productId}`);
        card.querySelector("h3").textContent = data.updated.name;
        card.querySelector("p:nth-of-type(1)").textContent =
          "Price: " + data.updated.price;
        card.querySelector("p:nth-of-type(2)").textContent =
          "Qty: " + data.updated.quantity;
        card.querySelector("p:nth-of-type(3)").textContent =
          data.updated.description;
        if (data.updated.imagePath)
          card.querySelector("img").src = data.updated.imagePath;
      } else {
        Swal.fire("Error", data.message, "error");
      }
    });
  });
});

document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const productId = btn.dataset.id;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This product will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch(`/seller/delete-product/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();
    if (data.success) {
      Swal.fire("Deleted", data.message, "success");
      document.getElementById(`product-${productId}`).remove();
    } else {
      Swal.fire("Error", data.message, "error");
    }
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

    fetch("/seller/edit-category", {
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

    fetch("/seller/edit-subcategory", {
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

document.getElementById("sold-products-btn").addEventListener("click", () => {
  window.location.href = "/seller/sellerViewOrders";
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
