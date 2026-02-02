const viewCartBtn = document.getElementById("view-cart");
const cartContainer = document.getElementById("cart-container");

function loadCart() {
  fetch("/user/cart-data")
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
  <div class="cart-card">
    <img class="cart-img" src="${item.image}" />

    <div class="cart-info">
      <h3>${item.name.toUpperCase()}</h3>
      <p class="price">Price: ${item.price}</p>
      

      <div class="qty-controls">
        <button class="qty-btn" data-id="${item.id}" data-change="-1">−</button>
        <span class="qty">${item.quantity}</span>
        <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
      </div>

      <button class="cart-buy-now" data-id="${item.id}">Buy Now</button>
      <button class="remove-from-cart" data-id="${item.id}">Remove</button>
    </div>
  </div>
`;
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
                    let checkoutTotal = document.getElementById("checkout-total");
                    if (checkoutTotal) {
                      checkoutTotal.innerHTML = `<h3>Total Bill: ${
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

                    const billDiv = document.getElementById("total-bill");
                    if (billDiv) {
                      billDiv.innerHTML = `<h3>Total Bill: ${result.totalBill || 0}</h3>`;
                    }

                    if (result.cartEmpty) {
                      cartContainer.innerHTML = "<p>Your cart is empty</p>";
                      cartContainer.innerHTML += `<div id="total-bill"><h3>Total Bill: 0</h3></div>`;
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

        const checkoutDiv=document.createElement("div");
        checkoutDiv.className="checkout-box";

        checkoutDiv.innerHTML=`<h3 id="checkout-total">Total Bill: ${data.totalBill}</h3>
        <button id="place-order-btn">Place Order</button>`;

        cartContainer.appendChild(checkoutDiv);

        document.getElementById("place-order-btn").addEventListener("click",()=>{
          fetch("/user/cart-place-order",{
            method:"POST",
            headers:{"Content-Type":"application/json"}
          })
          .then((res)=>res.json())
          .then((result)=>{
            if(result.success){
              Swal.fire({
                icon:"success",
                title:"Order Placed Successfully",
                timer:1500,
                showConfirmButton:false
              })
              .then(()=>{
                window.location.href="/user/orders";
              })
            }
            else{
              Swal.fire("Error",result.message,"error")
            }
          })
        })
      }
    });
}

document.addEventListener("DOMContentLoaded", loadCart);
document.getElementById("back-btn").addEventListener("click",()=>{
  window.location.href="/user";
})