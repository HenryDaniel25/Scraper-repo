import fs from "fs";
import PDFDocument from "pdfkit";

import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Dummy JSON data
function generateDummyData() {
  const data = {
    message: "Hello World",
    timestamp: new Date().toISOString(),
  };
  //   fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  //   console.log("JSON saved locally");
  return data;
}

// Dummy PDF generation
function generatePDF(data: object) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream("output.pdf"));
  doc.text("Dummy PDF for Practice");
  doc.text(JSON.stringify(data, null, 2));
  doc.end();
  console.log("PDF generated locally");
}

// Main process
function mainProcess() {
  const data = generateDummyData();
  generatePDF(data);
}

// Express route
app.get("/", (req, res) => {
  const data = generateDummyData();
  res.json(data);
});

// Run the main process every time script runs (GitHub Actions / Docker)
// mainProcess();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
