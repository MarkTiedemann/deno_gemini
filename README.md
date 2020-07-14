# deno_gemini

**[Project Gemini](https://gemini.circumlunar.space/) library, written in [Deno](https://deno.land/).**

## Example

```typescript
import { fetch, parse } from "./mod.ts";

let buf = await fetch("gemini://gemini.circumlunar.space/");
let { status, meta, body } = parse(buf);
console.assert(status === 20);
console.assert(meta === "text/gemini");
await Deno.stdout.write(body);
```

## Todos

- Create `serve` function
- Parse `text/gemini`

## License

[Blue Oak](https://blueoakcouncil.org/license/1.0.0)
