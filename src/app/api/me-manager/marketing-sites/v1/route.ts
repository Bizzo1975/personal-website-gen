import { marketingStore } from "@/lib/marketing-store";
import { receiverGet, receiverPost } from "@/lib/marketing/receiver";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(req: Request) { return receiverGet(req, marketingStore); }
export function POST(req: Request) { return receiverPost(req, marketingStore); }
