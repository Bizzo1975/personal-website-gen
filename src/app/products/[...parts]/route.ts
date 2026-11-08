import { marketingStore } from "@/lib/marketing-store";
import { publicResponse, receiverError } from "@/lib/marketing/receiver";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ parts: string[] }> }) { try { return await publicResponse(req, marketingStore, (await params).parts); } catch (e) { return receiverError(e); } }
export const HEAD = GET;
