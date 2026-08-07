import { describe, expect, it } from "vitest";
import { parseEnvironment } from "../config/env.js";

describe("parseEnvironment", () => {
  it("applies safe local defaults", () => {
    const env = parseEnvironment({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(4000);
    expect(env.MONGODB_DB_NAME).toBe("kerala_floods_eoc");
  });

  it("rejects invalid node environments", () => {
    expect(() => parseEnvironment({ NODE_ENV: "staging" })).toThrow();
  });
});
