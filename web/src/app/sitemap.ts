import type { MetadataRoute } from "next";
import { getBills } from "@/features/bills/server/loaders/get-bills";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const bills = await getBills();

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}/bills/${bill.id}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...billUrls,
  ];
}
