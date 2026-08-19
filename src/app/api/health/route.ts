import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "care-rx",
      clinicalUseAllowed: false,
      patientPersistence: false,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
