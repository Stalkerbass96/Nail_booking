import { getAdminFromRequest } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: admin.id.toString(),
    email: admin.email,
    displayName: admin.displayName
  });
}