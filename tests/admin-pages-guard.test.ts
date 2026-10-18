// @vitest-environment node
/**
 * Guards against a subtle Next.js pitfall: layouts and pages render in
 * parallel, so the admin layout's gate cannot stop an admin page from running.
 * Every admin page (and admin Server Action file) must check the role itself.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function files(dir: string, match: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path, match);
    return match.test(name) ? [path] : [];
  });
}

describe("admin authorization", () => {
  const pages = files(join(root, "src/app/admin"), /^page\.tsx$/);

  it("finds the admin pages", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages.map((p) => [relative(root, p), p]))("%s calls requireAdmin()", (_name, path) => {
    expect(readFileSync(path, "utf8")).toMatch(/await requireAdmin\(/);
  });

  it("every admin Server Action file calls requireAdmin()", () => {
    const actionFiles = files(join(root, "src/features/admin"), /actions?\.ts$/);
    for (const path of actionFiles) {
      const source = readFileSync(path, "utf8");
      const exported = source.match(/export async function \w+/g) ?? [];
      const guarded = source.match(/await requireAdmin\(/g) ?? [];
      expect(
        guarded.length,
        `${relative(root, path)}: each exported action needs requireAdmin()`,
      ).toBeGreaterThanOrEqual(exported.length);
    }
  });
});
