const dropArea = document.querySelector(".drop-section");
const listSection = document.querySelector(".list-section");
const listContainer = document.querySelector(".list");
const fileSelector = document.querySelector(".file-selector");
const fileSelectorInput = document.querySelector(".file-selector-input");

// upload files with browse button
fileSelector.onclick = () => fileSelectorInput.click();
fileSelectorInput.onchange = () => {
  [...fileSelectorInput.files].forEach((file) => {
    if (typeValidation(file.type)) {
      uploadFile(file);
    }
  });
};

// check the file type
function typeValidation(type) {
  var splitType = type.split("/")[0];
  if (
    type == "application/pdf" ||
    splitType == "image" ||
    splitType == "video"
  ) {
    return true;
  }
}

// when file is over the drag area
dropArea.ondragover = (e) => {
  e.preventDefault();
  [...e.dataTransfer.items].forEach((item) => {
    if (typeValidation(item.type)) {
      dropArea.classList.add("drag-over-effect");
    }
  });
};
// when file leave the drag area
dropArea.ondragleave = () => {
  dropArea.classList.remove("drag-over-effect");
};
// when file drop on the drag area
dropArea.ondrop = (e) => {
  e.preventDefault();
  dropArea.classList.remove("drag-over-effect");
  if (e.dataTransfer.items) {
    [...e.dataTransfer.items].forEach((item) => {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (typeValidation(file.type)) {
          uploadFile(file);
        }
      }
    });
  } else {
    [...e.dataTransfer.files].forEach((file) => {
      if (typeValidation(file.type)) {
        uploadFile(file);
      }
    });
  }
};

// icons/${iconSelector(file.type)}
function uploadFile(file) {
  listSection.style.display = "block";
  var li = document.createElement("li");
  li.classList.add("in-prog");
  li.innerHTML = `
        <div class="col">
            <img src="/frontend/images/image.png" alt="">
        </div>
        <div class="col">
            <div class="file-name">
                <div class="name">${file.name}</div>
                <span>0%</span>
            </div>
            <div class="file-progress">
                <span></span>
            </div>
            <div class="file-size">${(file.size / (1024 * 1024)).toFixed(
              2
            )} MB</div>
        </div>
        <div class="col">
            <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="20" width="20"><path d="m5.979 14.917-.854-.896 4-4.021-4-4.062.854-.896 4.042 4.062 4-4.062.854.896-4 4.062 4 4.021-.854.896-4-4.063Z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="tick" height="20" width="20"><path d="m8.229 14.438-3.896-3.917 1.438-1.438 2.458 2.459 6-6L15.667 7Z"/></svg>
        </div>
    `;
  listContainer.prepend(li);

  var data = new FormData();
  data.append("api_key", "TEST");
  data.append("recognizer", "auto");
  data.append("ref_no", "oct_python_123");
  data.append("file", file);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://ocr.asprise.com/api/v1/receipt", true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      var percentComplete = (e.loaded / e.total) * 100;
      li.querySelector("span").textContent = percentComplete.toFixed(2) + "%";
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      li.classList.add("complete");
      li.classList.remove("in-prog");

      const responseText = xhr.responseText;
      console.log(responseText); // Log the response to the console

      // Send the responseText to the server to save it as a JSON file
      fetch("http://localhost:3000/save-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response: responseText }),
      })
        .then((response) => response.json())
        .then((data) => console.log(data.message))
        .catch((error) => console.error("Error:", error));
    } else {
      console.error("Request failed with status " + xhr.status);
      li.remove();
    }
  };

  xhr.onerror = function () {
    console.error("Request failed");
    li.remove();
  };

  xhr.send(data);

  li.querySelector(".cross").onclick = () => {
    xhr.abort();
    li.remove();
  };
}

// find icon for file
function iconSelector(type) {
  var splitType =
    type.split("/")[0] == "application"
      ? type.split("/")[1]
      : type.split("/")[0];
  return splitType + ".png";
}
// Functionality to add items to the table
let receiptsData;

// Fetch the JSON file and create the table
fetch("response.json")
  .then((response) => response.json()) // Parse the JSON from the response
  .then((data) => {
    console.log("Fetched data:", data); // Log the fetched data for debugging

    // Validate the data structure and access the items array
    if (data.receipts && Array.isArray(data.receipts) && data.receipts.length > 0 && Array.isArray(data.receipts[0].items)) {
      const itemsArray = data.receipts[0].items;
      receiptsData = { receipts: [{ items: itemsArray }] }; // Correctly access the items array
      renderTable(receiptsData);
    } else {
      console.error("Data format is incorrect:", data);
    }
  })
  .catch((error) => console.error("Error fetching the JSON file:", error));

function renderTable(data) {
  const itemsTableBody = document.querySelector("#itemsTable tbody");
  itemsTableBody.innerHTML = ""; // Clear the table body

  data.receipts.forEach((receipt) => {
    receipt.items.forEach((item) => {
      const { description, qty} = item;
      const row = document.createElement("tr");

      const descriptionCell = document.createElement("td");
      const qtyCell = document.createElement("td");
      // const amountCell = document.createElement("td");
      const actionsCell = document.createElement("td");

      const descriptionInput = document.createElement("input");
      descriptionInput.type = "text";
      descriptionInput.value = description;
      descriptionInput.disabled = true;

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.value = qty !== null ? qty : "";
      qtyInput.disabled = true;

      // const amountInput = document.createElement("input");
      // amountInput.type = "number";
      // amountInput.value = amount;
      // amountInput.step = "0.01";
      // amountInput.disabled = true;

      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.classList.add("edit-button");
      editButton.addEventListener("click", () => {
        descriptionInput.disabled = false;
        qtyInput.disabled = false;
        // amountInput.disabled = false;
        editButton.style.display = "none";
        saveButton.style.display = "inline";
      });

      const saveButton = document.createElement("button");
      saveButton.textContent = "Save";
      saveButton.classList.add("save-button");
      saveButton.style.display = "none"; // Initially hide the save button
      saveButton.addEventListener("click", () => {
        descriptionInput.disabled = true;
        qtyInput.disabled = true;
        // amountInput.disabled = true;
        editButton.style.display = "inline";
        saveButton.style.display = "none";

        // Update the item in the global receiptsData
        item.description = descriptionInput.value;
        item.qty = qtyInput.value;
        // item.amount = amountInput.value;

        // Re-render the table with updated data
        renderTable(receiptsData);
      });

      descriptionCell.appendChild(descriptionInput);
      qtyCell.appendChild(qtyInput);
      // amountCell.appendChild(amountInput);
      actionsCell.appendChild(editButton);
      actionsCell.appendChild(saveButton);

      row.appendChild(descriptionCell);
      row.appendChild(qtyCell);
      // row.appendChild(amountCell);
      row.appendChild(actionsCell);
      itemsTableBody.appendChild(row);
    });
  });
}



document.getElementById("submitButton").addEventListener("click", () => {
  const updatedItems = Array.from(
    document.querySelectorAll("#itemsTable tbody tr")
  ).map((row) => {
    const cells = row.querySelectorAll("td");
    return {
      description: cells[0].querySelector("input").value,
      qty: parseInt(cells[1].querySelector("input").value) || 0,
    };
  });

  // Convert the JSON object to string
  const jsonData = JSON.stringify(updatedItems);

  // Log the JSON data
  console.log("JSON data to send:", jsonData);

  // Send the JSON data to the server
  fetch("http://localhost:3000/save-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: jsonData,
  })
    .then((response) => {
      if (response.ok) {
        alert("Submitted successfully");
        // Fetch the updated data and update the send-data.json file
        fetch("send-data.json")
          .then((response) => response.json())
          .then((updatedData) => {
            console.log("Fetched updated data:", updatedData); // Log updated data for debugging

            // Update the send-data.json file with the latest values
            const updatedJsonData = JSON.stringify(updatedItems);
            return fetch("http://localhost:3000/update-send-data", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: updatedJsonData,
            });
          })
          .then((updateResponse) => {
            if (updateResponse.ok) {
              console.log("send-data.json updated successfully");
            } else {
              console.error("Failed to update send-data.json");
            }
          })
          .catch((error) =>
            console.error("Error updating send-data.json:", error)
          );
      } else {
        console.error("Failed to send data to the server.");
      }
    })
    .catch((error) =>
      console.error("Error sending data to the server:", error)
    );
});
