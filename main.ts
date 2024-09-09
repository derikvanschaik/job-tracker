import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";
import { createRandomJobs } from "./dummyData.ts";
import { Job, JobBoard, Status } from "./types.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { formatDateString } from "./utils/formatDate.ts";

type Variables = {
  message: string;
};

const app = new Hono<{ Variables: Variables }>();
app.use("/static/*", serveStatic({ root: "./" }));

const env = vento();
const db = await Deno.openKv();

// todo: in future -- export a database but for now I will just create dummy data upon load
// const dummyJobs = createRandomJobs();

// // clear out previous ones
// const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
// for (const j of res) {
//   await db.delete(j.key);
// }

// for (const job of dummyJobs) {
//   await db.set(["job", job.id], job);
// }

app.get("/", async (c) => {
  const template = await env.load("./views/dashboard.vto");
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs: Job[] = res.map((r) => r.value);

  jobs.sort(
    (a: Job, b: Job) =>
      new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
  );

  const recentlyApplied = jobs.slice(0, 5);

  const appliedCount: number = jobs.length;
  const rejectedCount: number = jobs.filter(
    (job) => job.status === "rejected"
  ).length;
  const interviewCount: number = jobs.filter(
    (j) => j.status === "interviewed"
  ).length;

  const result = await template({
    applied: appliedCount,
    rejected: rejectedCount,
    interviewed: interviewCount,
    recentlyApplied,
    formatDate: function (dateString: string) {
      return formatDateString(dateString);
    },
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
    return c.html(res.content);
  } else {
    return c.html(`<h1>There was an error completing your request</h1>`);
  }
});

app.delete("/job/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(["job", id]);
  return c.html("");
});

app.get("/browse", async (c) => {
  const template = await env.load("./views/jobs.vto");
  const res = await Array.fromAsync(db.list<Job>({ prefix: ["job"] }));
  const jobs: Job[] = res.map((r) => r.value);

  const result = await template({
    formatDate: function (dateString: string) {
      return formatDateString(dateString);
    },
    jobs,
  });
  return c.html(result.content);
});

Deno.serve(app.fetch);
