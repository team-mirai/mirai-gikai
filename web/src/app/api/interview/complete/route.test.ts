import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeInterviewSession } from "@/features/interview-session/server/services/complete-interview-session";
import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import { POST } from "./route";

vi.mock(
  "@/features/interview-session/server/services/complete-interview-session",
  () => ({
    completeInterviewSession: vi.fn(),
  })
);

vi.mock(
  "@/features/interview-session/server/utils/verify-session-ownership",
  () => ({
    verifySessionOwnership: vi.fn(),
  })
);

const completeInterviewSessionMock = vi.mocked(completeInterviewSession);
const verifySessionOwnershipMock = vi.mocked(verifySessionOwnership);

function createRequest(body: unknown) {
  return new Request("http://localhost/api/interview/complete", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/interview/complete", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    verifySessionOwnershipMock.mockResolvedValue({
      authorized: true,
      userId: "user-1",
    });
    completeInterviewSessionMock.mockResolvedValue({
      id: "report-1",
    } as Awaited<ReturnType<typeof completeInterviewSession>>);
  });

  it("公開許可フラグを完了サービスへ渡す", async () => {
    const response = await POST(
      createRequest({ sessionId: "session-1", isPublic: true })
    );

    await expect(response.json()).resolves.toEqual({
      report: { id: "report-1" },
    });
    expect(completeInterviewSessionMock).toHaveBeenCalledWith({
      sessionId: "session-1",
      isPublicByUser: true,
    });
  });

  it("公開許可フラグが boolean でなければ undefined として扱う", async () => {
    await POST(createRequest({ sessionId: "session-1", isPublic: "true" }));

    expect(completeInterviewSessionMock).toHaveBeenCalledWith({
      sessionId: "session-1",
      isPublicByUser: undefined,
    });
  });
});
