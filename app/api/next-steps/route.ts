import { NextResponse } from "next/server";

// AI next-steps endpoint temporarily disabled. Returning 503 prevents calls to
// OpenAI while we add rate limiting, input caps, and updated privacy language.

export async function GET() {
  return NextResponse.json(
    { error: "AI next steps is temporarily disabled while we harden the endpoint." },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "AI next steps is temporarily disabled while we harden the endpoint." },
    { status: 503 }
  );
}
