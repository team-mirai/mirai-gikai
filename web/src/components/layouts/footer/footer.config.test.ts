import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";
import { policyLinks, primaryLinks } from "./footer.config";

describe("footer.config", () => {
  it("policyLinks に規約ページと開発者向けページへの内部リンクが含まれる", () => {
    const hrefs = policyLinks.map((link) => link.href);

    expect(hrefs).toContain(routes.terms());
    expect(hrefs).toContain(routes.privacy());
    expect(hrefs).toContain(routes.developers());
  });

  it("内部リンクには external フラグが付かない", () => {
    const internalHrefs = new Set<string>([
      routes.home(),
      routes.terms(),
      routes.privacy(),
      routes.developers(),
    ]);

    for (const link of [...primaryLinks, ...policyLinks]) {
      if (internalHrefs.has(link.href)) {
        expect(link.external).toBeUndefined();
      } else {
        expect(link.external).toBe(true);
      }
    }
  });
});
