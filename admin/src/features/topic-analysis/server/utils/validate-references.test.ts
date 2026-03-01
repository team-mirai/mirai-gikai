import { describe, expect, it } from "vitest";
import { validateAndReplaceReferences } from "./validate-references";

describe("validateAndReplaceReferences", () => {
  const validSessionIds = new Set(["session-1", "session-2", "session-3"]);

  it("replaces valid [ref:N] markers with links", () => {
    const md = "This is mentioned in [ref:1] and [ref:2].";
    const references = [
      { ref_id: 1, session_id: "session-1" },
      { ref_id: 2, session_id: "session-2" },
    ];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe(
      "This is mentioned in [インタビュー#1](/reports/session-1) and [インタビュー#2](/reports/session-2)."
    );
    expect(result.validReferences).toHaveLength(2);
  });

  it("removes references with invalid session IDs", () => {
    const md = "See [ref:1] and [ref:2].";
    const references = [
      { ref_id: 1, session_id: "session-1" },
      { ref_id: 2, session_id: "invalid-session" },
    ];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe(
      "See [インタビュー#1](/reports/session-1) and ."
    );
    expect(result.validReferences).toHaveLength(1);
    expect(result.validReferences[0].session_id).toBe("session-1");
  });

  it("removes [ref:N] markers that have no matching reference", () => {
    const md = "Mentioned in [ref:1] and [ref:99].";
    const references = [{ ref_id: 1, session_id: "session-1" }];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe(
      "Mentioned in [インタビュー#1](/reports/session-1) and ."
    );
  });

  it("handles empty references", () => {
    const md = "No references here.";
    const references: Array<{ ref_id: number; session_id: string }> = [];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe("No references here.");
    expect(result.validReferences).toHaveLength(0);
  });

  it("handles empty markdown", () => {
    const md = "";
    const references = [{ ref_id: 1, session_id: "session-1" }];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe("");
    expect(result.validReferences).toHaveLength(1);
  });

  it("handles markdown with no ref markers", () => {
    const md = "This text has no reference markers at all.";
    const references = [{ ref_id: 1, session_id: "session-1" }];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe("This text has no reference markers at all.");
    expect(result.validReferences).toHaveLength(1);
  });

  it("handles multiple references to the same ref_id", () => {
    const md = "First mention [ref:1], second mention [ref:1].";
    const references = [{ ref_id: 1, session_id: "session-1" }];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe(
      "First mention [インタビュー#1](/reports/session-1), second mention [インタビュー#1](/reports/session-1)."
    );
  });

  it("handles all references being invalid", () => {
    const md = "See [ref:1] and [ref:2].";
    const references = [
      { ref_id: 1, session_id: "invalid-1" },
      { ref_id: 2, session_id: "invalid-2" },
    ];

    const result = validateAndReplaceReferences(
      md,
      references,
      validSessionIds
    );

    expect(result.cleanedMd).toBe("See  and .");
    expect(result.validReferences).toHaveLength(0);
  });

  it("handles empty validSessionIds set", () => {
    const md = "See [ref:1].";
    const references = [{ ref_id: 1, session_id: "session-1" }];
    const emptySet = new Set<string>();

    const result = validateAndReplaceReferences(md, references, emptySet);

    expect(result.cleanedMd).toBe("See .");
    expect(result.validReferences).toHaveLength(0);
  });
});
