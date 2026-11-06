/* Isolated device-preference contract, no native storage required. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const mockStorage = { getItem: async () => null, setItem: async () => {} };
const mod = { exports: {} };
const filename = path.join(__dirname, "..", "src/state/ReaderTextSize.ts");
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
vm.runInNewContext(code, { module: mod, exports: mod.exports, require: id => {
  if (id === "@react-native-async-storage/async-storage") return { __esModule: true, default: mockStorage };
  throw Error("Unexpected import: " + id);
}});
const { ReaderTextSizeStore, READER_TEXT_SIZE_KEY } = mod.exports;
async function main() {
  const writes = [];
  const storage = {
    getItem: async key => { assert.equal(key, READER_TEXT_SIZE_KEY); return "22"; },
    setItem: async (key, value) => { writes.push([key, value]); },
  };
  const store = new ReaderTextSizeStore(storage);
  const changes = [];
  const unsub = store.subscribe(() => changes.push(store.getSnapshot()));
  assert.equal(store.getSnapshot(), 18);
  await store.load();
  assert.equal(store.getSnapshot(), 22);
  store.adjust(2); store.adjust(2); store.adjust(-2);
  assert.equal(store.getSnapshot(), 22, "Upper bound, lower bound and consecutive taps work");
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(writes.at(-1)?.[1], "22", "Newest setting persists last");
  assert.equal(changes.join(","), "22,24,22", "Only meaningful changes notify subscribers");
  unsub();

  let finishRead;
  const pendingRead = new Promise(resolve => { finishRead = resolve; });
  const racing = new ReaderTextSizeStore({
    getItem: () => pendingRead,
    setItem: async () => {},
  });
  const load = racing.load();
  racing.adjust(2);
  finishRead("24");
  await load;
  assert.equal(racing.getSnapshot(), 20, "Late stored values must not override user input");

  for (const invalid of ["100", "17", "\"unexpected\"", "{", "null"]) {
    const bad = new ReaderTextSizeStore({
      getItem: async () => invalid,
      setItem: async () => {},
    });
    await bad.load();
    assert.equal(bad.getSnapshot(), 18, "Invalid stored size falls back to default");
  }
  const broken = new ReaderTextSizeStore({
    getItem: async () => { throw Error("storage offline"); },
    setItem: async () => { throw Error("storage offline"); },
  });
  await broken.load();
  broken.adjust(-2);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(broken.getSnapshot(), 16, "Storage failure cannot break reading");
  console.log("Reader font preference passed: hydration, bounds, ordered writes, late reads and failures.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
