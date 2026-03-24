import fs from "fs";
import PDFDocument from "pdfkit";

import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

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

async function runWorkflow() {
  console.log("Starting Scraper Workflow...");
  const data = generateDummyData();
  // In the future, this is where you'd call:
  // await uploadToDynamo(data);
  // await uploadToS3(pdfPath);
  // generatePDF(data);
  console.log("Workflow Complete.");
}

if (process.env.RUN_AS_CRON === "true") {
  // Run once and exit (for GitHub Actions / Scheduled Tasks)
  runWorkflow()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Start the server (for local dev / persistent Docker containers)
  app.get("/", (req, res) => {
    const data = generateDummyData();
    console.log("output of dummy json", JSON.stringify(data));
    console.log(data);
    res.json(data);
  });

  const port = Number(PORT);

  app.listen(port, "0.0.0.0", () =>
    console.log(`Server running on port ${PORT}`),
  );
}

// Express route

// app.get("/", (req, res) => {
//   const data = generateDummyData();
//   res.json(data);
// });

// Run the main process every time script runs (GitHub Actions / Docker)
// mainProcess();

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
