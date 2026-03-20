const addCategoryBtn=document.getElementById("add-category-btn");

if(addCategoryBtn){
    addCategoryBtn.addEventListener("click",()=>{
        Swal.fire({
            title:"Add Category",
            input:"text",
            inputPlaceholder:"Enter category name",
            showCancelButton:true,
            confirmButtonText:"Add",
            preConfirm:(value)=>{
                if(!value.trim()){
                    Swal.showValidationMessage("Category name cannot be empty")
                }
                return value.trim();
            }
        })
        .then(result=>{
            if(!result.isConfirmed) return;
            fetch("/admin/addCategory",{
                method:"POST",
                headers:{"Content-type":"application/json"},
                credentials:"include",
                body:JSON.stringify({name:result.value})
            })
            .then(res=>res.json())
            .then(data=>{
                if(data.exists){
                    Swal.fire("Exists","Category already exists","info")
                }
                else if(data.success){
                    Swal.fire("Success","Category added successfully","success").then(()=>location.reload())
                }
                else{
                    Swal.fire("Error",data.message || "Error","error")
                }
            })
        })
    })
}

document.querySelectorAll(".edit-category").forEach(button=>{
    button.addEventListener("click",()=>{
        const id=button.dataset.id;
        const oldName=button.dataset.name;

        Swal.fire({
            title:"Edit Category",
            input:"text",
            inputValue:oldName.charAt(0).toUpperCase()+oldName.slice(1),
            showCancelButton:true,
            confirmButtonText:"Update",
            preConfirm:(value)=>{
                if(!value.trim()){
                    Swal.showValidationMessage("Category name cannot be empty")
                }
                return value.trim();
            }
        })
        .then(result=>{
            if(!result.isConfirmed) return;

            fetch("/admin/edit-category",{
                method:"PUT",
                headers:{"Content-type":"application/json"},
                credentials:"include",
                body:JSON.stringify({
                    id,
                    newName:result.value
                })
            })
            .then(res=>res.json())
            .then(data=>{
                if(data.success){
                    Swal.fire("Updated","Category updated","success")
                    .then(()=>window.location.reload())
                }
                else{
                    Swal.fire("Error",data.message,"error")
                }
            })
        })
    })
})