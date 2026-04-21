const categoryContainer = document.getElementById("category-container");
const subcategoriesContainer = document.getElementById("subcategory-container");
const formContainer = document.getElementById("form-container");
const backBtn = document.getElementById("back-btn");

backBtn.addEventListener("click", () => {
  window.location.href = "/seller";
});

let selectedCategoryId = null;
let selectedSubcategories=[];

categoryContainer.addEventListener("click", async (e) => {
  const catDiv = e.target.closest(".category");
  if (!catDiv) return;

  selectedCategoryId = catDiv.dataset.id;

  const categoryId = catDiv.dataset.id;

  document.querySelectorAll(".category").forEach((c) => {
    if (c != catDiv) c.style.display = "none";
    document.getElementById("category-section").classList.remove("hidden");
    document.getElementById("subcategory-section").classList.remove("hidden");
  });

  const res = await fetch(`/seller/category/${categoryId}/subcategories`);
  const subcategories = await res.json();

  selectedSubcategories=subcategories;

  renderSubcategories(subcategories);
});

function renderSubcategories(subcategories){
  subcategoriesContainer.innerHTML = subcategories
    .map(
      (sub) =>
        `<div class="subcategory" data-name="${sub.name}" style="cursor:pointer;">${sub.name}</div>`,
    )
    .join("");
}

subcategoriesContainer.addEventListener("click", (e) => {
  const subDiv = e.target.closest(".subcategory");
  if (!subDiv) return;

  const subName = subDiv.dataset.name;

  document.querySelectorAll(".subcategory").forEach((s) => {
    if (s != subDiv) s.style.display = "none";
    document.getElementById("form-section").classList.remove("hidden");
  });

  formContainer.innerHTML = `
    <form id="product-form" enctype="multipart/form-data">
    <input name="name" placeholder="Enter product name" required>
    <input name="price" placeholder="Enter product price" required>
    <input name="qty" placeholder="Enter product quantity in stock" required>
    <textarea name="description" placeholder="Enter product description"></textarea>
    <input type="file" name="image">
    <button>Add Product</button>`;

  handleForm(subName);
});

function handleForm(subcategory) {
  const form = document.getElementById("product-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("subcategory", subcategory);
    formData.append("categoryId", selectedCategoryId);

    const res = await fetch("/seller/add-product", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
  });
}

document.getElementById("back-to-categories").onclick = () => {
  document.querySelectorAll(".category").forEach(c=>{
    c.style.display="block";
  })
  document.getElementById("subcategory-section").classList.add("hidden");
  document.getElementById("form-section").classList.add("hidden");
};

document.getElementById("back-to-subcategories").onclick = () => {
  renderSubcategories(selectedSubcategories);
  document.getElementById("form-section").classList.add("hidden");
};