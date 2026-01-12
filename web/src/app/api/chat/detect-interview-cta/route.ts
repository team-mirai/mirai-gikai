import { z } from "zod";
import { detectInterviewCta } from "@/features/chat/server/services/detect-interview-cta";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  billId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, billId } = requestSchema.parse(body);

    const result = await detectInterviewCta({ messages, billId });

    return Response.json(result);
  } catch (error) {
    console.error("Interview CTA detection API error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return Response.json(
      { showInterviewCta: false, reason: "not_relevant" },
      { status: 200 }
    );
  }
}
