import type { AppBskyFeedPost } from "@atproto/api";
import { verifyAsync } from "@noble/ed25519";

// You should set this from the Bluehook response.
const PUBLIC_KEY = process.env.BLUESKY_PUBLIC_KEY!;

// Defines how the shape of the request body should be.
type RequestBody = {
    uri: string;
    post: AppBskyFeedPost.Record;
};

async function handlePost(body: RequestBody) {
    // Do whatever you want here.
    const j = JSON.stringify(body, null, 2);
    console.log(j);
}

function fromHex(hex: string) {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    return bytes;
}

// Function to verify Ed25519 signature
async function verifySignature(publicKey: string, message: string, signature: string) {
    const publicKeyBytes = fromHex(publicKey);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = fromHex(signature);
    try {
        return await verifyAsync(signatureBytes, messageBytes, publicKeyBytes);
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    // Verify the signature.
    const signature = req.headers.get("X-Signature-Ed25519");
    const timestamp = req.headers.get("X-Signature-Timestamp");
    if (!signature || !timestamp) {
        return new Response("Bad Request - no signature or timestamp", { status: 401 });
    }
    console.log("request signature and timestamp", signature, timestamp);
    const body = await req.text();
    const message = timestamp + body;

    // Validate the timestamp
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    const timeDifference = currentTime - requestTime;
    const MAX_TIME_DIFF = 300; // 5 minutes

    // Return here if the request is too old.
    if (timeDifference > MAX_TIME_DIFF) {
        return new Response("Bad Request - too old", { status: 401 });
    }

    // Verify the signature
    const isValid = await verifySignature(PUBLIC_KEY, message, signature);
    if (!isValid) {
        return new Response("Bad Request - invalid signature", { status: 401 });
    }

    // Send to our own handler.
    await handlePost(JSON.parse(body) as RequestBody);

    // Return a 204.
    return new Response(null, { status: 204 });
}
