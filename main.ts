import { createApp, DB } from "./app.ts";
// backend
const db = new DB(await Deno.openKv());
const app = createApp(db);

Deno.serve(app.fetch);
