// https://docs.deno.com/runtime/manual/basics/testing/
import { createApp } from "./app.ts";
import { assertEquals } from "https://deno.land/std/assert/mod.ts";

const mockDb = {
  createJobEntry: function (params: any) {
    return params;
  },
};

const app = createApp(mockDb);

const API_URL = Deno.env.get("API_URL") || "";

Deno.test("Hello World", async () => {
  const res = await app.request(API_URL);
  assertEquals(res.status, 200);
});

Deno.test("posts job entry", async () => {
  const res = await app.request(API_URL, {
    method: "POST",
    body: JSON.stringify({
      company: "coding_inc",
      role: "code monkey",
    }),
  });

  const entry = await res.json();
  assertEquals(entry.company, "coding_inc");
  assertEquals(entry.role, "code monkey");
});
