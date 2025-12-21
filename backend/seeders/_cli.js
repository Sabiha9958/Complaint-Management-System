function getArgValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function getInt(name, fallback) {
  const raw = getArgValue(name);
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function getString(name, fallback = "") {
  const raw = getArgValue(name);
  return raw == null ? fallback : String(raw);
}

function getCommand() {
  const arg = process.argv[2];
  if (arg === "-i" || arg === "--import" || arg === "import") return "import";
  if (arg === "-d" || arg === "--destroy" || arg === "destroy")
    return "destroy";
  if (arg === "-c" || arg === "--clear" || arg === "clear") return "clear";
  return null;
}

module.exports = { getCommand, getInt, getString, hasFlag };
