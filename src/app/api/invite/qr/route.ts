import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/join/${code}`;

  const svg = await QRCode.toString(url, {
    type: "svg",
    color: { dark: "#1C2433", light: "#FFFFFF" },
    margin: 2,
    width: 256,
  });

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
