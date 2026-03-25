import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import express, { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔹 S3 Config
const s3 = new S3Client({
  region: "us-east-2", // your region
});
const dynamoClient = new DynamoDBClient({
  region: "us-east-2",
});

const BUCKET_NAME = "demo-s3-amz-bucket";
const TABLE_NAME = "scrapper-table";

// Dummy data
function generateDummyData() {
  console.log("generated dummy data");
  return {
    message: "My Name is pravin",
    timestamp: new Date().toISOString(),
    check: "testing the flow",
  };
}

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Insert function
async function uploadToDynamo(data: any) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: Date.now().toString(), // Primary key
      message: data.message,
      timestamp: data.timestamp,
    },
  };
  console.log("generated params", JSON.stringify(params));
  await docClient.send(new PutCommand(params));
  console.log("Data inserted into DynamoDB");
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
    console.log("generate pdf succeeded");
    // 2. Upload to S3
    const fileUrl = await uploadToS3(filePath, fileName);
    console.log("upload to s3 succeeded");

    // 3. Delete local file (cleanup)
    fs.unlinkSync(filePath);
    console.log("after the fs unlink sync");
    await uploadToDynamo(data);
    console.log("after upload to dynamo data", JSON.stringify(data));
    res.json({
      message: "PDF uploaded successfully & data uploaded to dynamo db",
      url: fileUrl,
      data: data ?? {},
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to generate/upload PDF or upload to dynamo" });
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
