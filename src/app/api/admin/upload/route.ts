import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = form.get("folder");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (folder !== "menu" && folder !== "shop") {
    return NextResponse.json({ error: "folder must be 'menu' or 'shop'" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WEBP, or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageToR2(buffer, file.type, folder);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("R2 upload failed", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
