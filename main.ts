import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";
import { createRandomJobs } from "./dummyData.ts";
import { Job } from "./types.ts";
import { v4 as uuidv4 } from "npm:uuid";

type Variables = {
  message: string;
};

const app = new Hono<{ Variables: Variables }>();
app.use("/static/*", serveStatic({ root: "./" }));

const env = vento();
const db = await Deno.openKv();

// todo: in future -- export a database but for now I will just create dummy data upon load
const dummyJobs = createRandomJobs();

// clear out previous ones
const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
for (const j of res) {
  await db.delete(j.key);
}

for (const job of dummyJobs) {
  await db.set(["job", job.id], job);
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

app.get("/search", async (c) => {
  const template = await env.load("./views/search.vto");
  const t = await template({ results: false });
  return c.html(t.content);
});

app.post("/search", async (c) => {
  const { search } = await c.req.parseBody();
  const template = await env.load("./views/search.vto");
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  let jobs: Job[] = res.map((r) => r.value);
  jobs = jobs.filter((job) =>
    job.company.toLowerCase().startsWith((search as string).toLowerCase())
  );

  const t = await template({ jobs, results: true });
  return c.html(t.content);
});

app.get("/browse", async (c) => {
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs: Job[] = res.map((r) => r.value);
  const template = await env.load("./views/browse.vto");
  const notice = c.req.query("notice");
  const t = await template({
    jobs: jobs,
    hasNotice: !!notice,
    notice: "Your changes were saved successfully",
  });
  return c.html(t.content);
});

app.get("/browse/:job_id", async (c) => {
  const res = await db.get(["job", c.req.param("job_id") as string]);
  const job = res.value;

  const template = await env.load("./views/job.vto");
  const t = await template({
    job,
  });
  return c.html(t.content);
});

app.post("/browse/:job_id", async (c) => {
  const job_id = c.req.param("job_id");
  const job = await db.get<Job>(["job", job_id]);
  const body = await c.req.parseBody();
  const status = body["status"];
  await db.set(["job", job.value!.id], { ...job.value, status: status });

  return c.redirect("/browse?notice=saved");
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
        d.getDate() === currentTimeAgain.getDate() &&
        d.getMonth() == currentTimeAgain.getMonth() &&
        d.getFullYear() === currentTimeAgain.getFullYear()
      ) {
        lastThirtyDaysCount[i] += 1;
      }
    }
    currentTimeAgain.setDate(currentTimeAgain.getDate() - 1);
  }

  const currentTimeSevenDays = new Date();
  const lastSevenDaysCount: any = {};
  for (let i = 7; i > 0; i--) {
    lastSevenDaysCount[i] = 0;
    for (const j of result) {
      const d = new Date(j.dateApplied);
      if (
        d.getDate() === currentTimeSevenDays.getDate() &&
        d.getMonth() == currentTimeSevenDays.getMonth() &&
        d.getFullYear() === currentTimeSevenDays.getFullYear()
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
