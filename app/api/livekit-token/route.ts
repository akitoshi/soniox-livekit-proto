import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

type TokenRequest = {
  roomName?: unknown;
  displayName?: unknown;
};

function getMissingEnvironmentVariables() {
  return ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"].filter(
    (name) => !process.env[name],
  );
}

function createIdentity(displayName: string) {
  const base =
    displayName
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28) || "participant";

  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function POST(request: Request) {
  const missing = getMissingEnvironmentVariables();

  if (missing.length > 0) {
    return NextResponse.json(
      {
        code: "SETUP_REQUIRED",
        message: "LiveKitの環境変数が設定されていません。",
        missing,
      },
      { status: 503 },
    );
  }

  let body: TokenRequest;
  try {
    body = (await request.json()) as TokenRequest;
  } catch {
    return NextResponse.json({ message: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const roomName = typeof body.roomName === "string" ? body.roomName.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(roomName) || !displayName || displayName.length > 50) {
    return NextResponse.json(
      { message: "ルーム名または表示名が不正です。" },
      { status: 400 },
    );
  }

  const identity = createIdentity(displayName);
  const accessToken = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity,
      name: displayName,
      ttl: "2h",
    },
  );

  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({
    token: await accessToken.toJwt(),
    serverUrl: process.env.LIVEKIT_URL,
    identity,
  });
}
