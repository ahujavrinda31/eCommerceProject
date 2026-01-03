const profileInitialElement = document.getElementById('profile-initial');
if (profileInitialElement && typeof userInitial !== 'undefined') {
  profileInitialElement.textContent = userInitial;
  profileInitialElement.onclick = () => {
    window.location.href="/user/profile";
  };
}

const viewCartBtn = document.getElementById("view-cart");
const cartContainer = document.getElementById("cart-container");
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", function () {
    const card = btn.closest(".product-card");
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
            result.message === "Product already in cart"
              ? "warning"
              : "success",
          title: result.message,
          timer: 1500,
          showConfirmButton: false,
        });

        const qtyElem = card.querySelector(".prod-qty");
        if (result.newProductQty !== undefined) {
          qtyElem.innerText = result.newProductQty;
        }

        if (cartContainer.style.display !== "none") loadCart();
      });
  });
});

let cartOpen = false;

viewCartBtn.addEventListener("click", () => {
  if (cartOpen) {
    cartContainer.style.display = "none";
    cartOpen = false;
  } else {
    cartContainer.style.display = "block";
    loadCart();
    cartOpen = true;
  }
});

function loadCart() {
  fetch("/user/cart")
    .then((res) => res.json())
    .then((data) => {
      cartContainer.innerHTML = "";
      if (data.cart.length === 0) {
        cartContainer.innerHTML = "<p>Your cart is empty</p>";
        cartContainer.innerHTML += `<div id="total-bill"><h3>Total Bill: 0</h3></div>`;
      } else {
        data.cart.forEach((item) => {
          const div = document.createElement("div");
          div.classList.add("cart-item");

          div.innerHTML = `
          <img src="${item.image}" width="100px" height="100px" />
            <p><strong>${item.name.toUpperCase()}</strong></p>
            <p>Price: ${item.price}</p>
            <p>${item.description}</p>
            <p>Quantity: <span class="qty">${item.quantity}</span></p>
            <button class="qty-btn" data-id="${item.id}" data-change="-1">-</button>
            <button class="qty-btn" data-id="${item.id}"data-change="1">+</button>
            <button class="cart-buy-now" data-id="${item.id}" data-qty="${item.quantity}">Buy Now</button>
          `;

          div.querySelector(".cart-buy-now").addEventListener("click", () => {
            const productId = item.id;
            const quantity = item.quantity;

            fetch("/user/cart-buy-now", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId, quantity }),
            })
              .then((res) => res.json())
              .then((result) => {
                if (result.success) {
                  Swal.fire({
                    icon: "success",
                    title: "Order placed successfully",
                    timer: 1500,
                    showConfirmButton: false,
                  }).then(() => {
                    window.location.href = "/user/orders";
                  });
                } else {
                  Swal.fire("Error", result.message, "error");
                }
              });
          });

          const qtySpan = div.querySelector(".qty");
          div.querySelectorAll(".qty-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
              const change = Number(btn.dataset.change);
              const id = btn.dataset.id;

              fetch("/user/update-cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, change }),
              })
                .then((res) => res.json())
                .then((updated) => {
                  if (updated.success) {
                    if (updated.newQty <= 0) {
                      div.remove();
                    } else {
                      qtySpan.innerText = updated.newQty;
                      const productElem = document.querySelector(
                        `.product-card[data-id="${id}"]`
                      );
                      if (productElem) {
                        const stockElem =
                          productElem.querySelector(".prod-qty");
                        if (stockElem) {
                          stockElem.innerHTML = `<strong>Quantity:</strong> ${updated.newProductQty}`;
                        }
                      }
                    }
                    let billDiv = document.getElementById("total-bill");
                    if (billDiv) {
                      billDiv.innerHTML = `<h3>Total Bill: ${
                        updated.totalBill || 0
                      }</h3>`;
                    }

                    if (updated.cartEmpty) {
                      cartContainer.innerHTML = "<p>Your cart is empty</p>";
                      const billDiv = document.createElement("div");
                      billDiv.id = "total-bill";
                      billDiv.innerHTML = `<h3>Total Bill: 0</h3>`;
                      cartContainer.appendChild(billDiv);
                    }
                  } else {
                    Swal.fire({
                      icon: "error",
                      title: updated.message || "Cart Update Failed",
                      showConfirmButton: false,
                      timer: 1500,
                    });
                  }
                })
                .catch((err) => {
                  console.error("Update cart failed: ", err);
                  Swal.fire({
                    icon: "error",
                    title: "Connection error",
                    text: "Could not update cart",
                  });
                });
            });
          });
          cartContainer.appendChild(div);
        });
        const totalDiv = document.createElement("div");
        totalDiv.id = "total-bill";
        totalDiv.innerHTML = `<h3>Total Bill: ${data.totalBill || 0}</h3>`;
        cartContainer.appendChild(totalDiv);
      }
    });
}

document.querySelectorAll(".category-title").forEach((title) => {
  title.addEventListener("click", () => {
    const subcats = title.parentElement.querySelectorAll(".subcategory");

    const isOpen = Array.from(subcats).some(
      (element) => element.style.display === "block"
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

document.querySelectorAll(".buy-now").forEach((btn) => {
  btn.addEventListener("click", () => {
    const productId = btn.closest(".product-card").dataset.id;
    window.location.href = `/user/checkout/${productId}`;
  });
});

document.getElementById("view-orders").addEventListener("click", () => {
  window.location.href = "/user/orders";
});

const searchInput = document.getElementById("category-search");
const suggestions = document.getElementById("suggestions");

searchInput.addEventListener("input", async (e) => {
  e.preventDefault();
  const value = searchInput.value.trim();

  if (value.length < 3) {
    suggestions.style.display = "none";
    return;
  }

  const res = await fetch(`/user/category-suggestions?q=${value}`);
  const categories = await res.json();

  suggestions.innerHTML = "";

  if (categories.length === 0) {
    suggestions.style.display = "none";
    return;
  }

  categories.forEach((cat) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerText = cat;

    div.addEventListener("click", () => {
      window.location.href = `/user?category=${cat}`;
    });

    suggestions.appendChild(div);
  });

  suggestions.style.display = "block";
});
