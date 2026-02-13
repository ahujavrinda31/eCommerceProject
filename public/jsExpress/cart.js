const viewCartBtn = document.getElementById("view-cart");
const cartContainer = document.getElementById("cart-container");

function loadCart() {
  fetch("/user/cart-data")
    .then((res) => res.json())
    .then((data) => {
      cartContainer.innerHTML = "";
      if (data.cart.length === 0) {
        cartContainer.innerHTML = "<p style='text-align: center; padding: 40px;'>Your cart is empty</p>";
        const billDiv = document.getElementById("total-bill");
        billDiv.innerHTML="";
        billDiv.style.display = "none";
      } else {
        data.cart.forEach((item) => {
          const div = document.createElement("div");
          div.classList.add("cart-item");

          div.innerHTML = `
  <div class="cart-card">
    <div class="cart-product">
      <img class="cart-img" src="${item.image}" />
      <h3>${item.name.toUpperCase()}</h3>
    </div>
    <p class="price">${item.price}</p>
    <div class="qty-controls">
      <button class="qty-btn" data-id="${item.id}" data-change="-1">−</button>
      <span class="qty">${item.quantity}</span>
      <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
    </div>
    <div class="cart-actions">
      <button class="cart-buy-now" data-id="${item.id}"><i class="fa-solid fa-bolt"></i> Buy Now</button>
      <button class="remove-from-cart" data-id="${item.id}"> <i class="fa-solid fa-trash"></i> Remove</button>
    </div>
  </div>
`;
          const qtySpan = div.querySelector(".qty");
          div.querySelector(".cart-buy-now").addEventListener("click", () => {
            const productId = item.id;
            const quantity = Number(qtySpan.innerText);

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
                        `.product-card[data-id="${id}"]`,
                      );
                      if (productElem) {
                        const stockElem =
                          productElem.querySelector(".prod-qty");
                        if (stockElem) {
                          stockElem.innerHTML = `${updated.newProductQty}`;
                        }
                      }
                    }
                    let checkoutTotal =
                      document.getElementById("checkout-total");
                    let subtotal = document.getElementById("subtotal");
                    if (checkoutTotal) {
                      const total = updated.totalBill || 0;
                      checkoutTotal.innerHTML = `${total}`;
                      if (subtotal) {
                        subtotal.innerHTML = `${total}`;
                      }
                    }

                    if (updated.cartEmpty) {
                      cartContainer.innerHTML = "<p style='text-align: center; padding: 40px;'>Your cart is empty</p>";
                      const billDiv = document.getElementById("total-bill");
                      // billDiv.className = "summary-card";
                      // billDiv.innerHTML = `<h3>Order Summary</h3>
                      //   <div class="checkout-row">
                      //     <span>Shipping:</span>
                      //     <span>Free</span>
                      //   </div>
                      //   <div class="checkout-row checkout-total">
                      //     <span>Total:</span>
                      //     <span>0</span>
                      //   </div>
                      //   <button id="place-order-btn" disabled>Place Order</button>`;
                      // cartContainer.appendChild(billDiv);
                      billDiv.innerHTML="";
                      billDiv.style.display = "none";
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

          div
            .querySelector(".remove-from-cart")
            .addEventListener("click", () => {
              const productId = item.id;
              fetch("/user/remove-from-cart", {
                method: "DELETE",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({ productId }),
              })
                .then((res) => res.json())
                .then((result) => {
                  if (result.success) {
                    Swal.fire({
                      icon: "success",
                      title: result.message,
                      timer: 1500,
                      showConfirmButton: false,
                    });
                    div.remove();

                    const productElem = document.querySelector(
                      `.product-card[data-id="${productId}"]`,
                    );

                    if (productElem && result.restoredQty != null) {
                      const stockElem = productElem.querySelector(".prod-qty");
                      if (stockElem) {
                        stockElem.innerText = result.restoredQty;
                      }
                    }

                    const billDiv = document.querySelector(".summary-card");
                    if (billDiv) {
                      const checkoutTotal = billDiv.querySelector("#checkout-total");
                      const subtotal = billDiv.querySelector("#subtotal");
                      if (checkoutTotal) {
                        checkoutTotal.innerHTML = `${result.totalBill || 0}`;
                      }
                      if (subtotal) {
                        subtotal.innerHTML = `${result.totalBill || 0}`;
                      }
                    }

                    if (result.cartEmpty) {
                      cartContainer.innerHTML = "<p style='text-align: center; padding: 40px;'>Your cart is empty</p>";
                      const billDiv = document.getElementById("total-bill");
                      billDiv.className = "summary-card";
                      billDiv.innerHTML = `<h3>Order Summary</h3>
                        <div class="checkout-row">
                          <span>Shipping:</span>
                          <span>Free</span>
                        </div>
                        <div class="checkout-row checkout-total">
                          <span>Total:</span>
                          <span>0</span>
                        </div>
                        <button id="place-order-btn" disabled>Place Order</button>`;
                    }
                  } else {
                    Swal.fire("Error", result.message, "error");
                  }
                })
                .catch((err) => {
                  console.error("Error removing product: ", err);
                  Swal.fire("Error", "Could not remove product", "error");
                });
            });
        });

        const totalBillDiv = document.getElementById("total-bill");
        totalBillDiv.className = "summary-card";

        totalBillDiv.innerHTML = `<h3>Order Summary</h3>
        <div class="checkout-row">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div class="checkout-row checkout-total">
          <span>Total:</span>
          <span id="checkout-total">${data.totalBill}</span>
        </div>
        <button id="place-order-btn">Place Order</button>`;

        document
          .getElementById("place-order-btn")
          .addEventListener("click", () => {
            fetch("/user/cart-data")
              .then((res) => res.json())
              .then((data) => {
                const items = data.cart.map((item) => ({
                  productId: item.id,
                  qty: item.quantity,
                }));

                return fetch("/user/cart-place-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items }),
                });
              })
              .then((res) => res.json())
              .then((result) => {
                if (result.success) {
                  Swal.fire({
                    icon: "success",
                    title: "Order Placed Successfully",
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
      }
    });
}

document.addEventListener("DOMContentLoaded", loadCart);
document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "/user";
});
