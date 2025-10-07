const express = require("express");
const mongoose = require("mongoose");
const { Resend } = require("resend");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// ✅ MongoDB Atlas connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing. Please set it in Render Environment Variables.");
  process.exit(1); // Stop app if DB URI is missing
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1); // Stop app if DB fails
  });

// ✅ Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  date: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/contact", async (req, res) => {
  try {
    // ✅ Save data in MongoDB
    const newContact = new Contact(req.body);
    await newContact.save();

    // ✅ Send mail via Resend API
    await resend.emails.send({
      from: "onboarding@resend.dev",  // Must be verified in your Resend account
      to: "ravirajskadam2004@gmail.com", // Your destination email
      subject: `📩 New Message: ${req.body.subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${req.body.name}</p>
        <p><strong>Email:</strong> ${req.body.email}</p>
        <p><strong>Subject:</strong> ${req.body.subject}</p>
        <p><strong>Message:</strong><br>${req.body.message}</p>
      `,
    });

    res.send("Message sent successfully!");
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).send("Failed to send message.");
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start Server
const PORT = process.env.PORT || 10000; // Render requires dynamic port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
