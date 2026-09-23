import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import User, { UserRole } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CITIZEN", "DMC_OFFICER", "DISTRICT_OFFICER", "RESCUE_TEAM"] as const).default("CITIZEN"),
  district: z.string().optional(),
  contactNo: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = signupSchema.parse(body);

    // Prevent privilege escalation: only authenticated DMC officers can register officer roles
    if (validated.role !== "CITIZEN") {
      const session = await getServerSession(authOptions);
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== "DMC_OFFICER") {
        return NextResponse.json(
          { error: "Forbidden: Only authorized DMC Officers can register officer or rescue team accounts." },
          { status: 403 }
        );
      }
    }

    await connectMongo();

    const existingUser = await User.findOne({ email: validated.email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // Hash password with 12 salt rounds for enhanced security
    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await User.create({
      name: validated.name.trim(),
      email: validated.email.toLowerCase().trim(),
      passwordHash,
      role: validated.role,
      district: validated.district || "Colombo",
      contactNo: validated.contactNo || "",
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          district: user.district,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
