import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Participant } from "@/lib/models/Participant";
import { getSession } from "@/lib/auth";
import { emitRegistration } from "@/lib/registrationChannel";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const list = await Participant.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      list.map((p) => ({
        id: (p as { _id: unknown })._id?.toString(),
        name: (p as { name: string }).name,
        phoneNumber: (p as { phoneNumber: string }).phoneNumber,
        imageUrl: (p as { imageUrl?: string }).imageUrl ?? "",
        location: (p as { location?: string }).location ?? "",
      }))
    );
  } catch (e) {
    console.error("Participants GET error:", e);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, imageUrl, location } = body as {
      name?: string;
      phoneNumber?: string;
      imageUrl?: string;
      location?: string;
    };
    const phone = typeof phoneNumber === "string" ? phoneNumber.trim().replace(/\s+/g, "") : "";
    if (!name?.trim() || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Participant.findOne({ phoneNumber: phone }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "This phone number is already registered. Only one entry per number is allowed." },
        { status: 409 }
      );
    }

    const doc = await Participant.create({
      name: name.trim(),
      phoneNumber: phone,
      imageUrl: imageUrl?.trim() ?? "",
      location: location?.trim() ?? "",
    });

    const payload = {
      id: doc._id.toString(),
      name: doc.name,
      phoneNumber: doc.phoneNumber,
      imageUrl: doc.imageUrl ?? "",
      location: doc.location ?? "",
      createdAt: doc.createdAt?.toISOString?.(),
    };
    emitRegistration(payload);

    return NextResponse.json(payload);
  } catch (e) {
    if (e instanceof Error && (e as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "This phone number is already registered." },
        { status: 409 }
      );
    }
    console.error("Participants POST error:", e);
    return NextResponse.json({ error: "Failed to save participant" }, { status: 500 });
  }
}
