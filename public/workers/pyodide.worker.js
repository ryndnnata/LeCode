
const PYODIDE_VERSION = "0.26.4";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide = null;
let loading = null;

const HARNESS = `
import json, io, contextlib, traceback

def __lecode_exec():
    ns = {}
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(__lecode_code, "<lecode>", "exec"), ns)
            fn = ns.get(__lecode_fn)
            if not callable(fn):
                return json.dumps({
                    "ok": False,
                    "stdout": buf.getvalue(),
                    "error": "Fungsi '" + str(__lecode_fn) + "' tidak ditemukan. Pastikan nama fungsinya sama dengan instruksi."
                })
            args = json.loads(__lecode_args)
            value = fn(*args)
        return json.dumps({"ok": True, "stdout": buf.getvalue(), "value": value}, ensure_ascii=False, default=str)
    except Exception:
        return json.dumps({"ok": False, "stdout": buf.getvalue(), "error": traceback.format_exc(limit=3)})

__lecode_exec()
`;

async function init() {
  if (pyodide) return pyodide;
  if (!loading) {
    loading = (async () => {
      importScripts(`${CDN}pyodide.js`);
      const instance = await loadPyodide({ indexURL: CDN });
      pyodide = instance;
      return instance;
    })();
  }
  return loading;
}

self.onmessage = async (event) => {
  const data = event.data || {};
  const { id, type } = data;

  if (type === "init") {
    try {
      await init();
      self.postMessage({ id, type: "ready", error: null });
    } catch (error) {
      self.postMessage({ id, type: "fatal", error: String((error && error.message) || error) });
    }
    return;
  }

  if (type !== "run") return;

  const payload = data.payload || {};
  try {
    const py = await init();
    const results = [];

    for (const testCase of payload.testCases || []) {
      py.globals.set("__lecode_code", payload.code || "");
      py.globals.set("__lecode_fn", payload.functionName || "solve");
      py.globals.set("__lecode_args", testCase.args || "[]");
      const raw = py.runPython(HARNESS);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { ok: false, error: "Gagal membaca hasil eksekusi.", stdout: String(raw) };
      }
      results.push({
        index: testCase.index,
        ok: Boolean(parsed.ok),
        value: parsed.ok ? JSON.stringify(parsed.value) : null,
        expected: testCase.expected,
        stdout: parsed.stdout || "",
        error: parsed.error || null,
      });
    }

    self.postMessage({ id, type: "result", results, error: null });
  } catch (error) {
    self.postMessage({ id, type: "fatal", error: String((error && error.message) || error) });
  }
};
