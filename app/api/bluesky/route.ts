import type { AppBskyFeedPost } from "@atproto/api";
import { isValidRequest } from "discord-verify";

// Defines how the shape of the request body should be.
type RequestBody = {
    uri: string;
    post: AppBskyFeedPost.Record;
};

// This can run on the edge :)
export const runtime = "edge";

async function handlePost(body: RequestBody) {
    // Do whatever you want here.
    const j = JSON.stringify(body, null, 2);
    console.log(j);
}

// You should set this from the Bluehook response.
const PUBLIC_KEY = process.env.BLUESKY_PUBLIC_KEY!;

export async function POST(req: Request) {
    // Verify the signature.
    const signature = req.headers.get("X-Signature-Ed25519");
    const timestamp = req.headers.get("X-Signature-Timestamp");
    if (!signature || !timestamp) {
        return new Response("Bad Request - no signature or timestamp", { status: 401 });
    }
    console.log("request signature and timestamp", signature, timestamp);

    // Verify the signature
    const isValid = await isValidRequest(req, PUBLIC_KEY);
    if (!isValid) {
        console.log("invalid signature!");
        return new Response("Bad Request - invalid signature", { status: 401 });
    }

    // Send to our own handler.
    await handlePost(await req.json() as RequestBody);

    // Return a 204.
    return new Response(null, { status: 204 });
}
