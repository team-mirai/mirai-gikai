import { headers } from "next/headers";

export function buildOriginUrl(
  host: string | null,
  proto: string | null
): string {
  return `${proto ?? "https"}://${host}`;
}

export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return buildOriginUrl(host, proto);
}
