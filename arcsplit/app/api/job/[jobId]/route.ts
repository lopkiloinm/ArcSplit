// GET /api/job/:jobId
// Returns full job state including AST, transitions, payouts, and execution log.

import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "missing_job_id" },
        { status: 400 }
      );
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "job_not_found", jobId },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (err) {
    console.error("[/api/job/:jobId]", err);
    return NextResponse.json(
      { error: "internal_error", message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
