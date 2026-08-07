import { describe, expect, it } from "vitest";
import { formatMongoStatus } from "../services/health.service";

describe("formatMongoStatus", () => {
  it("formats Mongo status for display", () => {
    expect(formatMongoStatus("connected")).toBe("connected");
    expect(formatMongoStatus("disconnecting")).toBe("disconnecting");
  });
});
