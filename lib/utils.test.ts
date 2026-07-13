import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combines class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("includes only truthy conditional classes", () => {
    expect(cn("block", false && "hidden", true && "rounded")).toBe(
      "block rounded",
    );
  });

  it("resolves conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
