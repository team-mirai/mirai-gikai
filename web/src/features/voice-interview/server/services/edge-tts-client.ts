"server-only";

import { createHash } from "node:crypto";
import WebSocket from "ws";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11_644_473_600;
const FIVE_MIN = 300;
const NS_PER_100NS = 10_000_000;

const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const VOICE = "ja-JP-NanamiNeural";

function generateSecMsGec(): string {
  let ticks = Date.now() / 1000;
  ticks += WIN_EPOCH;
  ticks -= ticks % FIVE_MIN;
  ticks *= NS_PER_100NS;

  const toHash = `${Math.floor(ticks)}${TRUSTED_CLIENT_TOKEN}`;
  return createHash("sha256")
    .update(toHash, "ascii")
    .digest("hex")
    .toUpperCase();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function makeTimestamp(): string {
  return new Date().toISOString();
}

function makeSpeechConfig(): string {
  return [
    `X-Timestamp:${makeTimestamp()}`,
    "Content-Type:application/json; charset=utf-8",
    "Path:speech.config",
    "",
    JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: "false",
              wordBoundaryEnabled: "false",
            },
            outputFormat: OUTPUT_FORMAT,
          },
        },
      },
    }),
  ].join("\r\n");
}

const VALID_RATE_PATTERN = /^[+-]?\d{1,3}%$/;

function sanitizeRate(rate?: string): string | undefined {
  if (!rate) return undefined;
  if (VALID_RATE_PATTERN.test(rate)) return rate;
  return undefined;
}

function makeSsml(text: string, requestId: string, rate?: string): string {
  const safeRate = sanitizeRate(rate);
  const content = safeRate
    ? `<prosody rate="${safeRate}">${escapeXml(text)}</prosody>`
    : escapeXml(text);
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="ja-JP"><voice name="${VOICE}">${content}</voice></speak>`;

  return [
    `X-RequestId:${requestId}`,
    "Content-Type:application/ssml+xml",
    `X-Timestamp:${makeTimestamp()}`,
    "Path:ssml",
    "",
    ssml,
  ].join("\r\n");
}

function randomHex32(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export async function synthesizeToBuffer(
  text: string,
  rate?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const gec = generateSecMsGec();
    const connectionId = randomHex32();
    const requestId = randomHex32();

    const url =
      `${WSS_URL}` +
      `&ConnectionId=${connectionId}` +
      `&Sec-MS-GEC=${gec}` +
      `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

    const ws = new WebSocket(url, {
      headers: {
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
      },
    });

    const audioChunks: Buffer[] = [];
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.close();
        reject(new Error("Edge TTS timeout (15s)"));
      }
    }, 15000);

    ws.on("open", () => {
      ws.send(makeSpeechConfig());
      ws.send(makeSsml(text, requestId, rate));
    });

    ws.on("message", (data: Buffer | string, isBinary: boolean) => {
      if (isBinary) {
        const buf = data as Buffer;
        if (buf.length < 2) return;
        const headerLen = buf.readUInt16BE(0);
        const headerEnd = 2 + headerLen;
        if (buf.length > headerEnd) {
          audioChunks.push(buf.subarray(headerEnd));
        }
      } else {
        const str =
          typeof data === "string" ? data : (data as Buffer).toString("utf-8");
        if (str.includes("Path:turn.end")) {
          settled = true;
          clearTimeout(timeout);
          ws.close();
          resolve(Buffer.concat(audioChunks));
        }
      }
    });

    ws.on(
      "unexpected-response",
      // biome-ignore lint/complexity/noBannedTypes: IncomingMessage-like object from ws
      (_req: unknown, upRes: { statusCode?: number; on: Function }) => {
        let body = "";
        upRes.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        upRes.on("end", () => {
          console.error(`[EdgeTTS] HTTP ${upRes.statusCode}: ${body}`);
          clearTimeout(timeout);
          if (!settled) {
            settled = true;
            reject(new Error(`Edge TTS HTTP ${upRes.statusCode}: ${body}`));
          }
        });
      }
    );

    ws.on("error", (err: Error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(new Error(`Edge TTS WS error: ${err.message}`));
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(
          new Error(`Edge TTS closed: code=${code} reason=${reason.toString()}`)
        );
      }
    });
  });
}
