// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrentDietSession } from "./current-diet-session";

describe("CurrentDietSession", () => {
  it("shows active session overview while the session is closed by date", () => {
    render(
      <CurrentDietSession
        session={null}
        activeSession={{
          id: "active-session",
          name: "令和8年9月定例会",
          slug: null,
          shugiin_url: null,
          overview: "今回の議会の説明です。",
          start_date: "2026-09-01",
          end_date: "2026-09-30",
          is_active: true,
          created_at: "2026-09-01T00:00:00Z",
          updated_at: "2026-09-01T00:00:00Z",
        }}
        closedSession={null}
        now={new Date("2026-11-22T00:00:00+09:00")}
      />
    );

    expect(screen.getByText("国会閉会中")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "今回の議会について" })
    ).toBeInTheDocument();
    expect(screen.getByText("今回の議会の説明です。")).toBeInTheDocument();
  });
});
