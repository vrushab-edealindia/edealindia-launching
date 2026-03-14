import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const configured = !!(cloudName && apiKey && apiSecret);

  if (!configured) {
    return NextResponse.json(
      { error: "Image upload not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local (project root) and restart the dev server." },
      { status: 503 }
    );
  }

  cloudinary.config({ cloud_name: cloudName!, api_key: apiKey!, api_secret: apiSecret! });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64,
        {
          folder: "edeal-participants",
          resource_type: "image",
          // Preserve large image size; avoid aggressive resize
          quality: "auto:best",
          fetch_format: "auto",
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res as { secure_url: string });
        }
      );
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
