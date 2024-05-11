// https://docs.deno.com/runtime/manual/basics/testing/
import createApp from "./app.ts";
import { assertEquals } from "https://deno.land/std/assert/mod.ts";

const app = createApp();

const API_URL = Deno.env.get("API_URL") || "";

Deno.test("Hello World", async () => {
  app.get("/", (c) => c.text("Please test me"));

  const res = await app.request(API_URL);
  assertEquals(res.status, 200);
});
