require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.use("/api/contact", contactRoutes);

connectDB();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});