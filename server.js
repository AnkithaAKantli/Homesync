// Import necessary modules
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

// Create Express app
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: "*", // Allow all origins for testing
  credentials: true,
  methods: ["POST", "GET"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// MySQL connection setup
const connection = mysql.createConnection({
  host: "autorack.proxy.rlwy.net",
  user: "root",
  password: "kgbQryjqbVQFojvZRoMrAPMAHvHCAQer",
  port: 49449,
  database: "railway",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to the database");
});

// Save response to file and database
app.post("/save-response", (req, res) => {
  const responseData = req.body.response;

  let jsonData;
  try {
    jsonData = JSON.parse(responseData);
  } catch (error) {
    jsonData = responseData;
  }

  const filePath = path.join(__dirname, "response.json");

  fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
    if (err) {
      console.error("Error saving response to file:", err);
      return res.status(500).send({ message: "Error saving response to file" });
    }

    // Insert into database
    jsonData.receipts.forEach((receipt) => {
      const { ReceiptID, Date, Vendor, TotalAmount, Items } = receipt;
      connection.query(
        `INSERT INTO Receipts (ReceiptID, Date, Vendor, TotalAmount) VALUES (?, ?, ?, ?)`,
        [ReceiptID, Date, Vendor, TotalAmount],
        (err) => {
          if (err) {
            console.error("Error inserting receipt:", err);
            return res.status(500).send({ message: "Error inserting receipt" });
          }

          Items.forEach((item) => {
            const { Description, Quantity, Amount } = item;
            connection.query(
              `INSERT INTO ReceiptItems (ReceiptID, Description, Quantity, Amount) VALUES (?, ?, ?, ?)`,
              [ReceiptID, Description, Quantity, Amount],
              (err) => {
                if (err) {
                  console.error("Error inserting item:", err);
                  return res
                    .status(500)
                    .send({ message: "Error inserting item" });
                }
              }
            );
          });
        }
      );
    });

    res.send({ message: "Response saved successfully" });
  });
});

// Save inventory data
app.post("/save-data", (req, res) => {
  const updatedData = req.body;

  if (!Array.isArray(updatedData)) {
    return res
      .status(400)
      .send({ message: "Invalid data format. Expected an array." });
  }

  updatedData.forEach((item) => {
    const { description, qty } = item;
    connection.query(
      `INSERT INTO Inventory (Items, Quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE Quantity = Quantity + VALUES(Quantity)`,
      [description, qty],
      (err) => {
        if (err) {
          console.error("Error inserting or updating item:", err);
          return res
            .status(500)
            .send({ message: "Error inserting or updating item" });
        }
      }
    );
  });

  res.send(updatedData);
});

// Update send-data.json
app.post("/update-send-data", (req, res) => {
  const updatedJsonData = req.body;
  const filePath = path.join(__dirname, "send-data.json");

  fs.writeFile(filePath, JSON.stringify(updatedJsonData, null, 2), (err) => {
    if (err) {
      console.error("Error updating send-data.json:", err);
      return res.status(500).send({ message: "Error updating send-data.json" });
    }

    res.send({ message: "send-data.json updated successfully" });
  });
});

// Fetch products from Inventory
app.get("/products", (req, res) => {
  connection.query("SELECT * FROM Inventory", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send({ message: "Error fetching products" });
    }
    res.send(results);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
