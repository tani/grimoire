import app from "../src/app.ts";
import { serve } from "@hono/node-server";

serve(app);

console.log("http://localhost:3000");
