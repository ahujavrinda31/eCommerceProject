document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const productId = e.target.dataset.id;

  const confirm = await Swal.fire({
    title: "Delete product?",
    text: "This cannot be undone",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete"
  });

  if (!confirm.isConfirmed) return;

  const res = await fetch(`/admin/product/${productId}`, {
    method: "DELETE",
    credentials: "include"
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById(`product-${productId}`).remove();
    Swal.fire("Deleted", data.message, "success");
  } else {
    Swal.fire("Error", data.message, "error");
  }
});
