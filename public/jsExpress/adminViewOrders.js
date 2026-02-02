document.addEventListener("DOMContentLoaded", async () => {
  const forms = document.querySelectorAll(".assign-form");

  const res = await fetch("/admin/available-transporters", {
    credentials: "include",
  });
  const data = await res.json();

  forms.forEach((form) => {
    const orderId = form.dataset.orderId;
    const select = form.querySelector(".select-transporter");

    if (!select) return;
    select.innerHTML = `<option value="">Select Transporter</option>`;

    data.transporters.forEach((t) => {
      const option = document.createElement("option");
      option.value = t._id;
      option.textContent = `${t.name} (${t.remainingCapacity} left)`;
      select.appendChild(option);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const transporterId = select.value;
      if (!transporterId) {
        Swal.fire("Info", "Select transporter", "info");
        return;
      }

      const res = await fetch("/admin/assign-transporter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, transporterId }),
      });

      const result = await res.json();

      if (result.success) {
        Swal.fire("Success", "Transporter assigned", "success")
          .then(() => window.location.href = "/admin");
      }
    });
  });
});
