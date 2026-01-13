document.querySelectorAll(".assign-form").forEach(async (form) => {
  const orderId = form.dataset.orderId;
  const select = form.querySelector(".select-transporter");

  const res = await fetch("/admin/available-transporters", {
    credentials: "include",
  });
  const data = await res.json();

  data.transporters.forEach((t) => {
    const option = document.createElement("option");
    option.value = t._id;
    option.textContent = t.name;
    select.appendChild(option);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const transporterId = select.value;
    if (!transporterId){
      Swal.fire("Info","Select transporter","info");
    } 

    const res = await fetch("/admin/assign-transporter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId, transporterId }),
    });

    const result = await res.json();
    if (result.success) {
      Swal.fire({
        title:"Success",
        text:"Transporter assigned",
        icon:"success",
        confirmButtonText:"OK"
      }).then((result)=>{
        if(result.isConfirmed){
          window.location.href="/admin";
        }
      })
      ;
    }
  });
});
