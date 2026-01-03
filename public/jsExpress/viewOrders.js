document.querySelectorAll(".cancel-btn").forEach((btn) => {
  btn.addEventListener("click", () => {

    if (btn.disabled) return;

    const orderId = btn.dataset.id;

    Swal.fire({
      title: "Cancel Order?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel it",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`/user/cancel-order/${orderId}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Order cancelled",
                timer: 1500,
                showConfirmButton: false,
              });
              btn.closest(".order-card").remove();
            } else {
              Swal.fire("Error", data.message, "error");
            }
          });
      }
    });
  });
});
