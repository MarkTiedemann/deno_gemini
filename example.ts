import { fetch, parse } from "./mod.ts";

let buf = await fetch("gemini://gemini.circumlunar.space/");
let { status, meta, body } = parse(buf);
console.assert(status === 20);
console.assert(meta === "text/gemini");
await Deno.stdout.write(body);
