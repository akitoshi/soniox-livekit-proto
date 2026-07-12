import { NextResponse } from "next/server";

type SonioxTemporaryKeyResponse = {
  api_key?: string;
  expires_at?: string;
  message?: string;
  error_message?: string;
};

export async function POST() {
  const apiKey = process.env.SONIOX_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        code: "SETUP_REQUIRED",
        message: "SONIOX_API_KEYが設定されていません。",
        missing: ["SONIOX_API_KEY"],
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.soniox.com/v1/auth/temporary-api-key", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usage_type: "transcribe_websocket",
        expires_in_seconds: 60,
        single_use: true,
        max_session_duration_seconds: 7200,
      }),
      cache: "no-store",
    });

    const data = (await response.json()) as SonioxTemporaryKeyResponse;

    if (!response.ok || !data.api_key) {
      return NextResponse.json(
        {
          code: "SONIOX_TOKEN_ERROR",
          message:
            data.message ?? data.error_message ?? "Sonioxの一時キーを発行できませんでした。",
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }

    return NextResponse.json({
      apiKey: data.api_key,
      expiresAt: data.expires_at ?? null,
    });
  } catch {
    return NextResponse.json(
      {
        code: "SONIOX_UNAVAILABLE",
        message: "Sonioxに接続できませんでした。しばらくしてから再試行してください。",
      },
      { status: 502 },
    );
  }
}
