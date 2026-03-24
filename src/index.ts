import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import express, { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔹 S3 Config
const s3 = new S3Client({
  region: "us-east-2", // your region
});

const BUCKET_NAME = "demo-s3-amz-bucket";

// Dummy data
function generateDummyData() {
  return {
    message: "Hello World",
    timestamp: new Date().toISOString(),
  };
}

// Generate PDF and return file path
function generatePDF(data: object, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.text("Dummy PDF for Practice\n\n");
    doc.text(JSON.stringify(data, null, 2));
    doc.end();

    stream.on("finish", () => {
      console.log("PDF generated");
      resolve();
    });

    stream.on("error", reject);
  });
}

// Upload to S3
async function uploadToS3(filePath: string, key: string) {
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: "application/pdf",
  });

  await s3.send(command);

  return `https://${BUCKET_NAME}.s3.us-east-2.amazonaws.com/${key}`;
}

// 🔥 POST API
app.post("/generate-pdf", async (req: Request, res: Response) => {
  try {
    const data = generateDummyData();

    const fileName = `scrapper-PDF/output-${Date.now()}.pdf`;
    const filePath = path.join("/tmp", `output-${Date.now()}.pdf`);

    // 1. Generate PDF
    await generatePDF(data, filePath);

    // 2. Upload to S3
    const fileUrl = await uploadToS3(filePath, fileName);

    // 3. Delete local file (cleanup)
    fs.unlinkSync(filePath);

    res.json({
      message: "PDF uploaded successfully",
      url: fileUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate/upload PDF" });
  }
});

// Test route
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
