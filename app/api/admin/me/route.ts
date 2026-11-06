import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-session";

// Sudah dinamis otomatis karena isAdmin() membaca cookies().
export async function GET() {
  return NextResponse.json({ admin: await isAdmin() });
}