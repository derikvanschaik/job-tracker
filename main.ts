import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";

const app = new Hono();
app.use("/static/*", serveStatic({ root: "./" }));

const env = vento();

app.get("/", async (c) => {
  const template = await env.load("./views/dashboard.vto");
  const result = await template();
  return c.html(result.content);
});

Deno.serve(app.fetch);
