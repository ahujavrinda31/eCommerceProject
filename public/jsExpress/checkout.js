let qty = 1;

const productId = productData.id;
const price = Number(productData.price);
const availableQty = Number(productData.availableQty);

const qtySpan = document.getElementById("qty");
const totalSpan = document.getElementById("total");

document.getElementById("inc").onclick = () => {
  if (qty < availableQty) {
    qty++;
    update();
  }
};

document.getElementById("dec").onclick = () => {
  if (qty > 1) {
    qty--;
    update();
  }
};

function update() {
  qtySpan.innerText = qty;
  totalSpan.innerText = qty * price;
}

document.getElementById("place-order").onclick = () => {
  fetch("/user/place-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, qty }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({icon:"success",title:"Order Placed",timer:1500,showConfirmButton:false})
        setTimeout(()=>{
          window.location.href = "/user";
        },2000)
      } else {
        Swal.fire({
          icon: "error",
          title: data.message || "Failed to place order"
        });
      }
    })
    .catch(() => {
      Swal.fire({
          icon: "error",
          title: "Failed to place order"
        });
    });
};

document.getElementById("back").onclick=()=>{
  window.location.href="/user"
}