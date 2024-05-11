import { Hono } from "https://deno.land/x/hono@v4.3.4/mod.ts";

function createApp() {
  const app = new Hono();

  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });

  return app;
}
export default createApp;
