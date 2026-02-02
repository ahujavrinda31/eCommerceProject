const toggleBtn = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("closed");
});

const profile = document.getElementById("view-profile");
profile.addEventListener("click", () => {
  window.location.href = "/user/profile";
});

const viewCartBtn = document.getElementById("view-cart");
viewCartBtn.addEventListener("click", () => {
  window.location.href = "/user/cart";
});

document.querySelector(".product-grid").addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart")) {
    const card = e.target.closest(".product-card");
    const productId = card.dataset.id;

    fetch("/user/add-to-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId }),
    })
      .then((res) => res.json())
      .then((result) => {
        Swal.fire({
          icon:
            result.message === "Product quantity increased in cart"
              ? "success"
              : "success",
          title: result.message,
          timer: 1500,
          showConfirmButton: false,
        });

        if (result.newProductQty !== undefined) {
          card.querySelector(".prod-qty").innerText = result.newProductQty;
        }
      });
  }

  if (e.target.classList.contains("buy-now")) {
    const productId = e.target.closest(".product-card").dataset.id;
    window.location.href = `/user/checkout/${productId}`;
  }
});

document.querySelectorAll(".category-title").forEach((title) => {
  title.addEventListener("click", () => {
    const subcats = title.parentElement.querySelectorAll(".subcategory");

    const isOpen = Array.from(subcats).some(
      (element) => element.style.display === "block",
    );

    document.querySelectorAll(".subcategory").forEach((element) => {
      element.style.display = "none";
    });

    if (!isOpen) {
      subcats.forEach((element) => {
        element.style.display = "block";
      });
    }
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
        window.location.replace("/");
      }
    });
});

document.getElementById("view-orders").addEventListener("click", () => {
  window.location.href = "/user/orders";
});

const searchInput = document.getElementById("category-search");
const suggestions = document.getElementById("suggestions");

searchInput.addEventListener("input", async () => {
  const value = searchInput.value.trim();

  if (value.length < 3) {
    suggestions.style.display = "none";
    return;
  }

  const res = await fetch(`/user/search-products?q=${value}`);
  const { suggestions: list } = await res.json();

  suggestions.innerHTML = "";

  if (list.length === 0) {
    suggestions.style.display = "none";
    return;
  }

  list.forEach((text) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerText = text;

    div.addEventListener("click", () => {
      searchInput.value = text;
      suggestions.style.display = "none";
      searchProducts(text);
    });

    suggestions.appendChild(div);
  });

  suggestions.style.display = "block";
});

document.getElementById("search-btn").addEventListener("click", () => {
  const value = searchInput.value.trim();
  if (!value) return;
  searchProducts(value);
});

async function searchProducts(query) {
  const res = await fetch(`/user/search-products?q=${query}`);
  const { products } = await res.json();

  const grid = document.querySelector(".product-grid");
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach((product) => {
    grid.innerHTML += `
      <div class="product-card" data-id="${product._id}">
        <img src="${product.imagePath}" />
        <h3>${product.name.toUpperCase()}</h3>
        <p><strong>Category:</strong> ${product.categoryId.name.toUpperCase()}</p>
        <p><strong>Price:</strong> ${product.price}</p>
        <p><strong>Qty:</strong> <span class="prod-qty">${product.quantity}</span></p>
        <p class="description">${product.description}</p>
        <button class="add-to-cart">Add to Cart</button>
        <button class="buy-now">Buy Now</button>
      </div>
    `;
  });
}

document.querySelectorAll(".product-card").forEach((card) => {
  card.addEventListener("click", async (e) => {
    if (e.target.closest("button")) return;

    const productId = card.dataset.id;

    const res = await fetch(`/user/product/${productId}`);
    const product = await res.json();

    Swal.fire({
      width: 700,
      html: `
    <div class="product-popup">
      
      <div class="popup-image">
        <img src="${product.imagePath}" alt="${product.name}" />
      </div>

      <div class="popup-info">
        <h2>${product.name.toUpperCase()}</h2>
        <p class="popup-price">Price: ${product.price}</p>

        <p class="popup-category">
          ${product.categoryId?.name} · ${product.subcategory}
        </p>

        <p class="popup-desc">${product.description}</p>

        <p class="popup-stock">
          Stock: <strong>${product.quantity}</strong>
        </p>
      </div>

    </div>
  `,
      showConfirmButton: false,
    });
  });
});
