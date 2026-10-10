import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

test("counts hides from multiple tabs and resets the browser-session count", async () => {
  const listeners = {};
  const state = {};
  globalThis.chrome = {
    runtime: {
      onMessage: { addListener: (listener) => { listeners.message = listener; } },
      onStartup: { addListener: (listener) => { listeners.startup = listener; } }
    },
    storage: {
      local: {
        get: async (key) => ({ [key]: state[key] }),
        set: async (values) => Object.assign(state, values)
      }
    }
  };
  const output = await build({
    entryPoints: [fileURLToPath(new URL("../src/background.ts", import.meta.url))],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false
  });
  await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`);

  const hidden = () => new Promise((resolve) => listeners.message({ type: "pftwHidden" }, {}, resolve));
  await Promise.all([hidden(), hidden()]);
  assert.equal(state.pftwStats.dailyCount, 2);
  assert.equal(state.pftwStats.sessionCount, 2);

  await listeners.startup();
  assert.equal(state.pftwStats.dailyCount, 2);
  assert.equal(state.pftwStats.sessionCount, 0);
});
