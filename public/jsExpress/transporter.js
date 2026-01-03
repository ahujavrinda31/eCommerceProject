const profileInitialElement = document.getElementById('profile-initial');
if (profileInitialElement && typeof userInitial !== 'undefined') {
  profileInitialElement.textContent = userInitial;
  profileInitialElement.onclick = () => {
    window.location.href="/transporter/profile";
  };
}

async function updateStatus(orderId, newStatus) {
  const res = await fetch("/transporter/update-order-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ orderId, newStatus }),
  });

  const data = await res.json();

  if (!data.success) {
    Swal.fire("Error occurred", data.message, "error");
    return;
  }

  const statusEl = document.getElementById(`status-${orderId}`);
  statusEl.innerText = data.updatedStatus;

  statusEl.className = `status ${data.updatedStatus.replaceAll(" ", "-")}`;

  const actionsDiv = document.getElementById(`actions-${orderId}`);
  actionsDiv.innerHTML = "";

  if (data.updatedStatus === "Out for delivery") {
    actionsDiv.innerHTML = `
      <button class="danger-btn"
        onclick="updateStatus('${orderId}', 'Delivered')">
        Mark Delivered
      </button>
    `;
  }

  if (data.updatedStatus === "Delivered") {
    actionsDiv.innerHTML = "";

    const card = actionsDiv.closest(".order-card");

    const deliveredPara = document.createElement("p");
    deliveredPara.className = "delivered-on";
    deliveredPara.innerHTML = `
      Delivered on: ${new Date(data.deliveredOn).toLocaleString()}
    `;

    card.appendChild(deliveredPara);
  }
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    fetch("/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.replace("/");
        }
      });
  });
}