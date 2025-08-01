const subcategories = {
  phone: ["Realme", "Samsung", "OnePlus", "Apple"],
  laptop: ["HP", "Dell", "Macbook", "Lenovo"],
  smartwatch: ["Boat", "Noise", "Fireboltt", "Apple"],
  earphones: ["Sony", "Noise", "OnePlus", "Apple"],
};

let selectedCategory = "";
let selectedSubCategory = "";

document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCategory = btn.dataset.category;
    const subs = subcategories[selectedCategory];

    const contain = document.getElementById("sub-category-container");
    contain.innerHTML = "";

    subs.forEach((sub) => {
      const subBtn = document.createElement("button");
      subBtn.className = "subcategory-btn";
      subBtn.textContent = sub;
      subBtn.addEventListener("click", () => {
        selectedSubCategory = sub;
        document.getElementById("container").style.display = "block";
      });
      contain.appendChild(subBtn);
    });
  });
});

document.getElementById("addBtn").addEventListener("click", function (event) {
  event.preventDefault();
  const id = Date.now();
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const description = document.getElementById("description").value.trim();
  const image = document.getElementById("image").files[0];

  if (!name || !price || !quantity || !description || !image) {
    return Swal.fire("Missing Info", "All fields are required", "warning");
  }
  const formData = new FormData();
  formData.append("id", id);
  formData.append("name", name);
  formData.append("price", price);
  formData.append("quantity", quantity);
  formData.append("description", description);
  formData.append("image", image);
  formData.append("category", selectedCategory);
  formData.append("subcategory", selectedSubCategory);
  fetch("/addProduct", {
    method: "POST",
    body: formData,
  }).then((res) => {
    if (res.ok) {
      window.location.reload();
    } else {
      alert("Error adding product");
    }
  });
});

document.querySelectorAll(".editBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const cat=card.dataset.cat;
    const sub=card.dataset.sub;
    const index=card.dataset.index;

    const nameElement=card.querySelector(".prod-name");
    const priceElement=card.querySelector(".prod-price");
    const quantityElement=card.querySelector(".prod-quantity");
    const descriptionElement=card.querySelector(".prod-description");
    const imageInput=card.querySelector(".image-input");

    if (btn.textContent === "Edit") {
      nameElement.innerHTML=`<input value="${nameElement.textContent}" class="name-field">`;
      priceElement.innerHTML=`<input value="${priceElement.textContent}"class="price-field">`;
      quantityElement.innerHTML=`<input value="${quantityElement.textContent}" class="quantity-field">`;
      descriptionElement.innerHTML=`<input value="${descriptionElement.textContent}"class="description-field">`;
      imageInput.style.display = "block";
      btn.textContent = "Update";
    } else {
      const name = card.querySelector(".name-field").value;
      const price = card.querySelector(".price-field").value;
      const quantity = card.querySelector(".quantity-field").value;
      const description = card.querySelector(".description-field").value;
      const image = imageInput.files[0];

      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("description", description);
      formData.append("category",cat);
      formData.append("subcategory",sub);
      formData.append("index",index);
      if (image) formData.append("image", image);

      fetch("/updateProduct", {
        method: "POST",
        body: formData,
      })
      .then(res=>res.json())
      .then(data => {
        if(data.success){
          nameElement.textContent=name;
          priceElement.textContent=price;
          quantityElement.textContent=quantity;
          descriptionElement.textContent=description;
          if(data.newImagePath){
            card.querySelector(".product-img").src="/uploads/"+data.newImagePath;
          }
          imageInput.value="";
          imageInput.style.display = "none";
          btn.textContent = "Edit";
        }
        else{
          return Swal.fire("Error Occured", "Update Failed", "error");
        }
      });
    }
  });
});

document.querySelectorAll(".deleteBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const cat = card.dataset.cat;
    const sub = card.dataset.sub;
    const index = card.dataset.index;
    fetch("/deleteProduct", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, subcategory: sub, index }),
    })
    .then(res=>res.json())
    .then(data => {
      if(data.success){
        card.remove();
      }
      else{
        return Swal.fire("Error Occured", "Deletion Failed", "error");
      }
    });
  });
});

document.getElementById("logout-btn").addEventListener("click",function(){
  fetch('/logout',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.success){
      window.location.href="/";
    }
  })
})