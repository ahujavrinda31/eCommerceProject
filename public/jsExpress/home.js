const viewCartBtn = document.getElementById("view-cart");
const cartContainer = document.getElementById("cart-container");
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const productId = e.target.closest(".product-slide").dataset.id;

    fetch("/add-to-cart", {
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
          showConfirmButton: false,
          timer: 1500,
        });
      });
  });
});

viewCartBtn.addEventListener("click", function () {
  fetch("/cart")
    .then((res) => res.json())
    .then((data) => {
      cartContainer.innerHTML = "";
      if (data.cart.length === 0) {
        cartContainer.innerHTML = "<p>Your cart is empty</p>";
      } else {
        data.cart.forEach((item) => {
          const div = document.createElement("div");
          div.classList.add("cart-item");

          div.innerHTML = `
          <img src="/uploads/${item.image}" width="100px" height="100px" />
            <p><strong>${item.name}</strong></p>
            <p>Price: ${item.price}</p>
            <p>${item.description}</p>
            <p>Quantity: <span class="qty">${item.quantity}</span></p>
            <button class="qty-btn" data-id="${item.id}" data-change="-1">-</button>
            <button class="qty-btn" data-id="${item.id}"data-change="1">+</button>
          `;

          const qtySpan = div.querySelector(".qty");
          div.querySelectorAll(".qty-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
              const change = Number(btn.dataset.change);
              const id = btn.dataset.id;

              fetch("/update-cart", {
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
                    }
                  }
                });
            });
          });
          cartContainer.appendChild(div);
        });
      }
    });
});

document.querySelectorAll(".category-title").forEach((title) => {
  title.addEventListener("click", () => {
    document.querySelectorAll(".subcategory").forEach((element) => {
      element.style.display = "none";
    });

    document.querySelectorAll(".products").forEach((el) => {
      el.style.display = "none";
    });

    const subcats = title.parentElement.querySelectorAll(".subcategory");
    subcats.forEach((element) => {
      element.style.display = "block";
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

document.querySelectorAll(".subcategory").forEach((subcategory) => {
  const slides = subcategory.querySelectorAll(".product-slide");
  const prevBtn = subcategory.querySelector(".prev-btn");
  const nextBtn = subcategory.querySelector(".next-btn");

  if (!slides.length || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? "block" : "none";
    });

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
  }
  
  showSlide(currentIndex);

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      showSlide(currentIndex);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) {
      currentIndex++;
      showSlide(currentIndex);
    }
  });
});
