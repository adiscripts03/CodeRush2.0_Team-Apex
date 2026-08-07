import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("GET /health", () => {
  it("returns service and dependency status", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toMatchObject({
      service: "kerala-floods-eoc-backend",
      status: "ok",
      dependencies: {
        mongo: {
          status: "disconnected"
        }
      }
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
