const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

// Create Express app
const app = express();
const port = 3000; // Primary server port

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: "http://127.0.0.1:5501", // Allow requests from this origin
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ["POST", "GET"], // Allow POST and GET requests
  optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));

// MySQL database connection
const connection = mysql.createConnection({
  host: "roundhouse.proxy.rlwy.net",
  user: "root",
  password: "JAkddSCgGWdcFVGuRAiOxdmBTHkGOcwQ",
  port: 56022,
  database: "railway",
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to the database");
});

// Route to save response to a file and database
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

    // Insert data into MySQL database
    const insertReceiptQuery = `
      INSERT INTO Receipts (ReceiptID, Date, Vendor, TotalAmount)
      VALUES (?, ?, ?, ?)
    `;
    const insertItemQuery = `
      INSERT INTO ReceiptItems (ReceiptID, Description, Quantity, Amount)
      VALUES (?, ?, ?, ?)
    `;

    jsonData.receipts.forEach((receipt) => {
      const { ReceiptID, Date, Vendor, TotalAmount, Items } = receipt;
      connection.query(insertReceiptQuery, [ReceiptID, Date, Vendor, TotalAmount], (err) => {
        if (err) {
          console.error("Error inserting receipt:", err);
          return res.status(500).send({ message: "Error inserting receipt" });
        }

        Items.forEach((item) => {
          const { Description, Quantity, Amount } = item;
          connection.query(insertItemQuery, [ReceiptID, Description, Quantity, Amount], (err) => {
            if (err) {
              console.error("Error inserting item:", err);
              return res.status(500).send({ message: "Error inserting item" });
            }
          });
        });
      });
    });

    res.send({ message: "Response saved successfully" });
  });
});

// New route to handle saving data and sending updated data back
// New route to handle saving data and sending updated data back
// New route to handle saving data and sending updated data back
app.post("/save-data", (req, res) => {
  const updatedData = req.body;

  if (!Array.isArray(updatedData)) {
    return res.status(400).send({ message: "Invalid data format. Expected an array." });
  }

  // Construct the INSERT query with ON DUPLICATE KEY UPDATE
  const insertItemQuery = `
    INSERT INTO HomeInventory (Item, Quantity)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE Quantity = VALUES(Quantity)
  `;

  updatedData.forEach((item) => {
    const { description, qty } = item;
    connection.query(insertItemQuery, [description, qty], (err) => {
      if (err) {
        console.error("Error inserting or updating item:", err);
        return res.status(500).send({ message: "Error inserting or updating item" });
      }
    });
  });

  // Send the updated data back to the client
  res.send(updatedData);
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
