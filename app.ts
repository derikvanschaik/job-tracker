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
  async getJobEntry(id: any) {
    const res = await this.kv.get(["job", id]);
    return res.value;
  }
  async getAllJobEntries() {
    const allEntries = await Array.fromAsync(this.kv.list({ prefix: ["job"] }));
    return allEntries.map((entry: any) => entry.value);
  }
}

function createApp(db: any) {
  const app = new Hono();

  app.get("/", async (c) => {
    const entries = await db.getAllJobEntries();
    return c.json(entries);
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

  app.get("/:job_id", async (c) => {
    const jobId = c.req.param("job_id");
    const entry = await db.getJobEntry(jobId);
    return c.json(entry);
  });

  return app;
}
export { createApp, DB };
