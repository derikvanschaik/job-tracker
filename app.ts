import { Hono } from "https://deno.land/x/hono@v4.3.4/mod.ts";
type JobStatus = "applied" | "selected_for_interview" | "rejected" | "accepted";
interface JobEntry {
  company: string;
  role: string;
  date: Date;
  id: `${string}-${string}-${string}-${string}-${string}`;
  status: JobEntry;
}
// TODO: put this into a seperte file once it gets big enough
class DB {
  kv;
  constructor(kv: any) {
    this.kv = kv;
  }
  async createJobEntry(jobEntry: JobEntry) {
    await this.kv.set(["job", jobEntry.id], jobEntry);
  }
}

function createApp(db: any) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const { company, role } = body;
    const date = Date.now();
    const status: JobStatus = "applied";
    const id = crypto.randomUUID();
    await db.createJobEntry({ company, role, date, status, id });
    return c.json({ company, role, date, status, id });
  });

  return app;
}
export { createApp, DB };
