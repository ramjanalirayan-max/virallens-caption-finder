// Compatibility alias: some cached clients may call /api/analyze-image.
// This re-exports the canonical, hardened /api/analyze handlers.
export { POST, GET } from "../analyze/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
