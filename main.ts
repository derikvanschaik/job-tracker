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

app.get("/timecount", async (c) => {
  const r = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs = r.map((res) => res.value);
  const now = new Date();
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const result: Job[] = [];
  for (const job of jobs) {
    if (new Date(job.dateApplied) >= oneYearAgo) {
      result.push(job);
    }
  }
  // group by month, group by day of current month, and group by current week for views
  const currentTime = new Date();
  const JobCountByMonth: any = {};
  const d = oneYearAgo;
  while (d <= currentTime) {
    const key = `${d.getFullYear()}:${d.getMonth()}`;
    JobCountByMonth[key] = 0;

    for (const j of result) {
      const dateApplied = new Date(j.dateApplied);
      if (
        dateApplied.getMonth() === d.getMonth() &&
        dateApplied.getFullYear() === d.getFullYear()
      ) {
        JobCountByMonth[key] += 1;
      }
    }
    d.setMonth(d.getMonth() + 1);
  }

  const currentTimeAgain = new Date();
  const lastThirtyDaysCount: any = {};
  for (let i = 30; i > 0; i--) {
    lastThirtyDaysCount[i] = 0;
    for (const j of result) {
      const d = new Date(j.dateApplied);
      if (
        d.getDate() === currentTime.getDate() &&
        d.getMonth() == currentTime.getMonth() &&
        d.getFullYear() === currentTime.getFullYear()
      ) {
        lastThirtyDaysCount[i] += 1;
      }
    }
    currentTimeAgain.setDate(currentTime.getDate() - 1);
  }

  const currentTimeSevenDays = new Date();
  const lastSevenDaysCount: any = {};
  for (let i = 7; i > 0; i--) {
    lastSevenDaysCount[i] = 0;
    for (const j of result) {
      const d = new Date(j.dateApplied);
      if (
        d.getDate() === currentTime.getDate() &&
        d.getMonth() == currentTime.getMonth() &&
        d.getFullYear() === currentTime.getFullYear()
      ) {
        lastSevenDaysCount[i] += 1;
      }
    }
    currentTimeSevenDays.setDate(currentTimeSevenDays.getDate() - 1);
  }

  return c.json({
    year: JobCountByMonth,
    month: lastThirtyDaysCount,
    week: lastSevenDaysCount,
  });
});

Deno.serve(app.fetch);
