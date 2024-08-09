import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";
import { createRandomJobs } from "./dummyData.ts";
import { Job } from "./types.ts";

const app = new Hono();
app.use("/static/*", serveStatic({ root: "./" }));

const env = vento();
const db = await Deno.openKv();

// todo: in future -- export a database but for now I will just create dummy data upon load
const dummyJobs = createRandomJobs();
for (const job of dummyJobs) {
  await db.set(["job", `${job.dateApplied}`], job);
}

app.get("/", async (c) => {
  const template = await env.load("./views/dashboard.vto");
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs: Job[] = res.map((r) => r.value);

  const appliedCount: number = jobs.length;
  const rejectedCount: number = jobs.filter(
    (job) => job.status === "rejected"
  ).length;
  const interviewCount: number = jobs.filter(
    (j) => j.status === "interviewed"
  ).length;
  const acceptedCount: number = jobs.filter(
    (j) => j.status === "accepted"
  ).length;

  const indeedCount: number = jobs.filter(
    (j) => j.jobBoard === "indeed"
  ).length;
  const glassdoorCount: number = jobs.filter(
    (j) => j.jobBoard === "glassdoor"
  ).length;
  const linkedinCount: number = jobs.filter(
    (j) => j.jobBoard === "linkedin"
  ).length;
  const otherCount: number = jobs.filter((j) => j.jobBoard === "other").length;

  const result = await template({
    applied: appliedCount,
    rejected: rejectedCount,
    interviewed: interviewCount,
    accepted: acceptedCount,
    indeed: indeedCount,
    glassdoor: glassdoorCount,
    linkedin: linkedinCount,
    other: otherCount,
    percentage: function formatPercentage(cur, total) {
      return `${Math.round((cur / total) * 100)}%`;
    },
  });
  return c.html(result.content);
});

Deno.serve(app.fetch);
