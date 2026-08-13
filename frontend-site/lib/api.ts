import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/rbac";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Central error handler for API routes. Turns known errors into clean JSON
 * responses and never leaks internals for unexpected failures.
 */
export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", details: error.flatten() },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    console.error("[api]", error);
    const status = (error as { status?: number }).status ?? 400;
    return NextResponse.json({ error: error.message || "Request failed" }, { status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
