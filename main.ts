import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";
import { Job, JobBoard } from "./types.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { formatDateString } from "./utils/formatDate.ts";

type Variables = {
  message: string;
};

const app = new Hono<{ Variables: Variables }>();
app.use("/static/*", serveStatic({ root: "./" }));

const env = vento();
const db = await Deno.openKv();

app.get("/", async (c) => {
  const template = await env.load("./views/dashboard.vto");
  const result = await template();
  return c.html(result.content);
});

app.get("/stats", async (c) => {
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs: Job[] = res.map((r) => r.value);
  const appliedCount: number = jobs.length;
  const rejectedCount: number = jobs.filter(
    (job) => job.status === "rejected"
  ).length;
  const interviewCount: number = jobs.filter(
    (j) => j.status === "interviewed"
  ).length;

  const template = await env.load("./components/stats.vto");
  const result = await template({
    applied: appliedCount,
    rejected: rejectedCount,
    interviewed: interviewCount,
  });
  return c.html(result.content);
});

app.get("/new", async (c) => {
  const template = await env.load("./components/createEntry.vto");
  const result = await template();
  return c.html(result.content);
});

app.get("/jobs", async (c) => {
  const limit = c.req.query("limit");

  let sortByTimeType = -1;
  const sortByTime = c.req.query("sort");

  if (sortByTime !== undefined) {
    sortByTimeType = parseInt(sortByTime);
  }

  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  let jobs: Job[] = res.map((r) => r.value);

  if (sortByTimeType === 0) {
    jobs.sort((a: Job, b: Job) => {
      return (
        new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime()
      );
    });
  }
  if (sortByTimeType === 1) {
    jobs.sort((a: Job, b: Job) => {
      return (
        new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
      );
    });
  }

  if (limit !== undefined) {
    const limitJobs = parseInt(limit);
    jobs = jobs.slice(0, limitJobs);
  }

  const template = await env.load("./components/jobsListData.vto");
  const result = await template({
    jobs: jobs,
    formatDate: (d: string) => formatDateString(d),
  });
  return c.html(result.content);
});

app.post("/job", async (c) => {
  const { company, board } = await c.req.parseBody();

  const dateApplied = new Date();
  const id = uuidv4();
  const status = "applied";
  const newJob: Job = {
    company: company as string,
    dateApplied,
    id,
    status,
    jobBoard: board as JobBoard,
  };
  const result = await db.set(["job", id], newJob);
  if (result.ok) {
    const template = await env.load("./components/entryNotice.vto");
    const res = await template();
    c.header("HX-Trigger", "refreshData");
    return c.html(res.content);
  } else {
    return c.html(`<h1>There was an error completing your request</h1>`);
  }
});

app.delete("/job/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(["job", id]);
  c.header("HX-Trigger", "refreshData");
  return c.html("");
});

app.get("/browse", async (c) => {
  const template = await env.load("./views/jobs.vto");
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs: Job[] = res.map((r) => r.value);

  const result = await template({
    jobs,
  });
  return c.html(result.content);
});

Deno.serve(app.fetch);
