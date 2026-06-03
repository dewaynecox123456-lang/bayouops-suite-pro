import fs from "fs";
import path from "path";
import { COPYRIGHT_FULL } from "./demo/signature-constants.mjs";

const EXPORT_DIR = "./exports";
const GENERATED_DIR = "./demo-data/generated";
const ENTERPRISE_SCENARIO_FILE = "./demo-data/generated/enterprise-demo-pack/enterprise-demo-scenarios.json";

const INPUT_FILES = [
  "./samples/patch-inventory.sample.json",
  "./samples/patch-inventory.sample.csv",
  "./exports/patch-readiness-report.csv"
];

const OUTPUT_CSV = path.join(EXPORT_DIR, "patch-worklist.csv");
const OUTPUT_HTML = path.join(EXPORT_DIR, "patch-worklist.html");
const OUTPUT_SUMMARY = path.join(EXPORT_DIR, "patch-worklist-summary.md");

function fail(message) {
  console.error("");
  console.error("BayouOps patch worklist build failed.");
  console.error(`Error: ${message}`);
  console.error("This builder is read-only and only generates local advisory export files.");
  console.error("");
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === "\"" && inQuotes && next === "\"") {
      value += "\"";
      index += 1;
      continue;
    }

    if (character === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(value);
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
}

function parseCsv(file) {
  const lines = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(header => header.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function listLatestGeneratedDemoFile() {
  if (!fs.existsSync(GENERATED_DIR)) return null;

  return fs
    .readdirSync(GENERATED_DIR)
    .filter(file => file.endsWith(".json"))
    .map(file => {
      const fullPath = path.join(GENERATED_DIR, file);
      return {
        fullPath,
        modifiedAt: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)[0]?.fullPath ?? null;
}

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (value === null || value === undefined) return false;

  return ["true", "yes", "1", "pending", "rebootrequired"].includes(String(value).trim().toLowerCase());
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from, to) {
  if (!from || !to) return null;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}

function isUnsupportedOs(record, os) {
  if (toBool(record.unsupportedOs) || toBool(record.unsupported_os)) return true;

  const normalized = String(os).toLowerCase();
  return [
    "windows server 2012",
    "windows server 2012 r2",
    "ubuntu 18.04",
    "centos 7",
    "red hat enterprise linux 7",
    "rhel 7"
  ].some(marker => normalized.includes(marker));
}

function riskScoreFromState(state) {
  const normalized = String(state ?? "").trim().toLowerCase();
  if (normalized === "critical" || normalized === "high") return 85;
  if (normalized === "warning" || normalized === "medium" || normalized === "watch") return 60;
  if (normalized === "healthy" || normalized === "low" || normalized === "compliant") return 20;
  return 0;
}

function normalizeDemoRecord(record, sourceName) {
  const os = record.os ?? record.OSCaption ?? record.os_caption ?? "";
  const readinessScore = toNumber(record.readinessScore ?? record.readiness_score, 0);
  const lastPatchedDaysAgo = toNumber(record.lastPatchedDaysAgo ?? record.last_patched_days_ago, 0);

  return {
    hostname: record.hostname ?? record.ComputerName ?? record.Hostname ?? "UNKNOWN",
    businessUnit: record.businessUnit ?? record.business_unit ?? record.owner ?? "Unassigned",
    owner: record.owner ?? record.businessUnit ?? record.business_unit ?? "Unassigned",
    service: record.service ?? record.role ?? "General",
    os,
    readinessScore,
    riskState: record.riskState ?? record.complianceState ?? record.compliance_state ?? record.exposureLevel ?? "Unknown",
    missingPatches: toNumber(record.missingPatches ?? record.missing_patches, 0),
    rebootPending: toBool(record.rebootPending ?? record.reboot_pending),
    rebootAgeDays: toNumber(record.rebootAgeDays ?? record.reboot_age_days, 0),
    lastPatchedDaysAgo,
    unsupportedOs: isUnsupportedOs(record, os),
    sourceName
  };
}

function normalizePatchInventory(records, sourceName, generatedAt) {
  const byHost = new Map();

  for (const record of records) {
    const hostname = record.ComputerName ?? record.Hostname ?? record.hostname;
    if (!hostname) continue;

    const installedOn = parseDate(record.InstalledOn);
    const collectedAt = parseDate(record.CollectedAt) ?? generatedAt;
    const existing = byHost.get(hostname) ?? {
      hostname,
      businessUnit: "Collector Output",
      owner: "Unassigned",
      service: "Patch Inventory",
      os: record.OSCaption ?? "",
      readinessScore: 0,
      riskState: "Collector",
      missingPatches: 0,
      rebootPending: false,
      rebootAgeDays: 0,
      lastPatchedDaysAgo: 0,
      unsupportedOs: false,
      installedHotfixCount: 0,
      newestPatchDate: null,
      collectedAt,
      sourceName
    };

    existing.installedHotfixCount += 1;
    existing.rebootPending = existing.rebootPending || toBool(record.PendingReboot);
    existing.os = existing.os || record.OSCaption || "";
    existing.unsupportedOs = isUnsupportedOs(record, existing.os);
    existing.collectedAt = collectedAt;

    if (!existing.newestPatchDate || (installedOn && installedOn > existing.newestPatchDate)) {
      existing.newestPatchDate = installedOn;
    }

    byHost.set(hostname, existing);
  }

  return [...byHost.values()].map(record => {
    const lastPatchedDaysAgo = daysBetween(record.newestPatchDate, generatedAt) ?? 0;
    const readinessPenalty = Math.min(55, Math.floor(lastPatchedDaysAgo / 2)) + (record.rebootPending ? 10 : 0);

    return {
      ...record,
      readinessScore: Math.max(0, 100 - readinessPenalty),
      missingPatches: 0,
      lastPatchedDaysAgo
    };
  });
}

function loadRecords(generatedAt) {
  const sourceFiles = [];
  const records = [];
  const latestGeneratedDemoFile = listLatestGeneratedDemoFile();

  if (latestGeneratedDemoFile) {
    const dataset = readJson(latestGeneratedDemoFile);
    if (Array.isArray(dataset)) {
      sourceFiles.push(latestGeneratedDemoFile);
      records.push(...dataset.map(record => normalizeDemoRecord(record, path.basename(latestGeneratedDemoFile))));
    }
  }

  if (fs.existsSync(ENTERPRISE_SCENARIO_FILE)) {
    const scenarios = readJson(ENTERPRISE_SCENARIO_FILE);
    if (Array.isArray(scenarios)) {
      sourceFiles.push(ENTERPRISE_SCENARIO_FILE);
      for (const scenario of scenarios) {
        const systems = Array.isArray(scenario.systems) ? scenario.systems : [];
        records.push(...systems.map(record => normalizeDemoRecord(record, scenario.title ?? path.basename(ENTERPRISE_SCENARIO_FILE))));
      }
    }
  }

  for (const file of INPUT_FILES) {
    if (!fs.existsSync(file)) continue;

    sourceFiles.push(file);
    if (file.endsWith(".json")) {
      const dataset = readJson(file);
      if (Array.isArray(dataset)) {
        records.push(...normalizePatchInventory(dataset, path.basename(file), generatedAt));
      }
      continue;
    }

    if (file.endsWith(".csv")) {
      const dataset = parseCsv(file);
      const isPatchInventory = dataset.some(record => record.HotFixID || record.ComputerName);
      if (isPatchInventory) {
        records.push(...normalizePatchInventory(dataset, path.basename(file), generatedAt));
      } else {
        records.push(...dataset.map(record => normalizeDemoRecord(record, path.basename(file))));
      }
    }
  }

  return { records, sourceFiles };
}

function scoreRecord(record) {
  const factors = [];
  let score = 0;

  if (record.unsupportedOs) {
    score += 35;
    factors.push("Unsupported OS review needed");
  }

  if (record.lastPatchedDaysAgo >= 90) {
    score += 30;
    factors.push(`Stale patch age ${record.lastPatchedDaysAgo}d`);
  } else if (record.lastPatchedDaysAgo >= 45) {
    score += 20;
    factors.push(`Patch age ${record.lastPatchedDaysAgo}d`);
  } else if (record.lastPatchedDaysAgo >= 30) {
    score += 10;
    factors.push(`Patch age ${record.lastPatchedDaysAgo}d`);
  }

  if (record.rebootPending) {
    score += 15;
    factors.push("Pending reboot");
  }

  if (record.missingPatches >= 10) {
    score += 20;
    factors.push(`${record.missingPatches} missing patches`);
  } else if (record.missingPatches >= 5) {
    score += 10;
    factors.push(`${record.missingPatches} missing patches`);
  }

  if (record.readinessScore > 0 && record.readinessScore < 70) {
    score += 20;
    factors.push(`Low readiness ${record.readinessScore}`);
  } else if (record.readinessScore >= 70 && record.readinessScore < 85) {
    score += 10;
    factors.push(`Readiness watch ${record.readinessScore}`);
  }

  const stateScore = riskScoreFromState(record.riskState);
  if (stateScore >= 85) {
    score += 20;
    factors.push(`Risk state ${record.riskState}`);
  } else if (stateScore >= 60) {
    score += 10;
    factors.push(`Risk state ${record.riskState}`);
  }

  const advisoryScore = Math.min(100, score);
  const priority = advisoryScore >= 80 ? "P1 - Review First"
    : advisoryScore >= 55 ? "P2 - Schedule Soon"
    : advisoryScore >= 30 ? "P3 - Track"
    : "P4 - Monitor";

  const patchGroup = record.unsupportedOs ? "Unsupported OS Review"
    : record.rebootPending && record.lastPatchedDaysAgo >= 45 ? "Reboot + Stale Patch Review"
    : record.lastPatchedDaysAgo >= 45 ? "Stale Systems"
    : record.rebootPending ? "Pending Reboot Review"
    : "Routine Patch Cadence";

  const suggestedAction = record.unsupportedOs
    ? "Confirm support status, business owner, and maintenance path before patch planning."
    : priority.startsWith("P1")
    ? "Review with owner and schedule approved maintenance window."
    : priority.startsWith("P2")
    ? "Add to upcoming approved patch window after owner review."
    : "Track in normal patch readiness review.";

  return {
    ...record,
    advisoryScore,
    priority,
    patchGroup,
    suggestedAction,
    advisoryFactors: factors.length > 0 ? factors.join("; ") : "No elevated advisory factors"
  };
}

function dedupeByHostname(records) {
  const byHost = new Map();

  for (const record of records) {
    const hostname = String(record.hostname ?? "UNKNOWN").trim().toUpperCase();
    const existing = byHost.get(hostname);

    if (!existing) {
      byHost.set(hostname, {
        ...record,
        sourceName: [record.sourceName]
      });
      continue;
    }

    existing.sourceName.push(record.sourceName);
  }

  return [...byHost.values()].map(record => ({
    ...record,
    sourceName: [...new Set(record.sourceName)].join("; ")
  }));
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function countBy(records, field) {
  return records.reduce((counts, record) => {
    counts[record[field]] = (counts[record[field]] ?? 0) + 1;
    return counts;
  }, {});
}

function renderCsv(records) {
  const columns = [
    "Priority",
    "AdvisoryScore",
    "Hostname",
    "BusinessUnit",
    "Owner",
    "Service",
    "OS",
    "RiskState",
    "ReadinessScore",
    "MissingPatches",
    "LastPatchedDaysAgo",
    "RebootPending",
    "UnsupportedOS",
    "RecommendedPatchGroup",
    "SuggestedOperatorAction",
    "AdvisoryFactors",
    "Source"
  ];

  const rows = records.map(record => [
    record.priority,
    record.advisoryScore,
    record.hostname,
    record.businessUnit,
    record.owner,
    record.service,
    record.os,
    record.riskState,
    record.readinessScore,
    record.missingPatches,
    record.lastPatchedDaysAgo,
    record.rebootPending,
    record.unsupportedOs,
    record.patchGroup,
    record.suggestedAction,
    record.advisoryFactors,
    record.sourceName
  ]);

  return [
    columns.map(escapeCsv).join(","),
    ...rows.map(row => row.map(escapeCsv).join(","))
  ].join("\n") + "\n";
}

function renderHtml(records, generatedAt, sourceFiles) {
  const priorityCounts = countBy(records, "priority");
  const topRows = records.slice(0, 50).map(record => `
        <tr>
          <td>${escapeHtml(record.priority)}</td>
          <td>${escapeHtml(record.advisoryScore)}</td>
          <td>${escapeHtml(record.hostname)}</td>
          <td>${escapeHtml(record.businessUnit)}</td>
          <td>${escapeHtml(record.os)}</td>
          <td>${escapeHtml(record.patchGroup)}</td>
          <td>${escapeHtml(record.advisoryFactors)}</td>
          <td>${escapeHtml(record.suggestedAction)}</td>
        </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BayouOps Patch Worklist</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17212f;
      --muted: #5e6a78;
      --line: #d9e0e8;
      --panel: #f7f9fb;
      --accent: #12645a;
    }
    body {
      margin: 0;
      color: var(--ink);
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 24px 40px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 30px;
      letter-spacing: 0;
    }
    h2 {
      margin-top: 28px;
      font-size: 20px;
      letter-spacing: 0;
    }
    .subtle {
      color: var(--muted);
      margin: 0;
    }
    .notice {
      margin-top: 18px;
      padding: 12px 14px;
      border-left: 4px solid var(--accent);
      background: var(--panel);
      font-weight: 700;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
      margin-top: 20px;
    }
    .metric {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      background: #ffffff;
    }
    .metric strong {
      display: block;
      font-size: 26px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th,
    td {
      border-bottom: 1px solid var(--line);
      padding: 9px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--panel);
      font-size: 12px;
      text-transform: uppercase;
    }
    footer {
      margin-top: 28px;
      color: var(--muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <main>
    <h1>BayouOps Patch Worklist</h1>
    <p class="subtle">Generated ${escapeHtml(generatedAt.toISOString())}</p>
    <div class="notice">Operational Advisory Only - Human Approval Required. This report does not patch, reboot, execute commands, or modify endpoints.</div>

    <section class="metrics" aria-label="Patch worklist metrics">
      <div class="metric"><strong>${records.length}</strong><span>Total systems reviewed</span></div>
      <div class="metric"><strong>${priorityCounts["P1 - Review First"] ?? 0}</strong><span>P1 review first</span></div>
      <div class="metric"><strong>${priorityCounts["P2 - Schedule Soon"] ?? 0}</strong><span>P2 schedule soon</span></div>
      <div class="metric"><strong>${records.filter(record => record.unsupportedOs).length}</strong><span>Unsupported OS signals</span></div>
      <div class="metric"><strong>${records.filter(record => record.rebootPending).length}</strong><span>Pending reboot signals</span></div>
    </section>

    <h2>Top Advisory Worklist Items</h2>
    <table>
      <thead>
        <tr>
          <th>Priority</th>
          <th>Score</th>
          <th>Host</th>
          <th>Business Unit</th>
          <th>OS</th>
          <th>Patch Group</th>
          <th>Why</th>
          <th>Suggested Operator Action</th>
        </tr>
      </thead>
      <tbody>${topRows}
      </tbody>
    </table>

    <h2>Source Files</h2>
    <ul>
      ${sourceFiles.map(file => `<li>${escapeHtml(file)}</li>`).join("\n      ")}
    </ul>

    <footer>${escapeHtml(COPYRIGHT_FULL)}</footer>
  </main>
</body>
</html>
`;
}

function renderSummary(records, generatedAt, sourceFiles) {
  const priorityCounts = countBy(records, "priority");
  const groupCounts = countBy(records, "patchGroup");
  const topTen = records.slice(0, 10).map(record => (
    `| ${record.priority} | ${record.advisoryScore} | ${record.hostname} | ${record.businessUnit} | ${record.patchGroup} | ${record.advisoryFactors} |`
  )).join("\n");

  const groups = Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => `- ${group}: ${count}`)
    .join("\n");

  const sources = sourceFiles.map(file => `- ${file}`).join("\n");

  return `# BayouOps Patch Worklist Summary

Generated: ${generatedAt.toISOString()}

Operational Advisory Only - Human Approval Required.

This export is read-only. It does not patch systems, reboot systems, remotely execute commands, modify endpoints, add credentials, add agents, or introduce control-plane automation.

## Summary

- Total systems reviewed: ${records.length}
- P1 - Review First: ${priorityCounts["P1 - Review First"] ?? 0}
- P2 - Schedule Soon: ${priorityCounts["P2 - Schedule Soon"] ?? 0}
- P3 - Track: ${priorityCounts["P3 - Track"] ?? 0}
- P4 - Monitor: ${priorityCounts["P4 - Monitor"] ?? 0}
- Unsupported OS signals: ${records.filter(record => record.unsupportedOs).length}
- Pending reboot signals: ${records.filter(record => record.rebootPending).length}
- Stale systems 45+ days since patch signal: ${records.filter(record => record.lastPatchedDaysAgo >= 45).length}

## Advisory Patch Groups

${groups}

## Top 10 Review Items

| Priority | Score | Hostname | Business Unit | Recommended Patch Group | Advisory Factors |
| --- | ---: | --- | --- | --- | --- |
${topTen}

## Source Files

${sources}

${COPYRIGHT_FULL}
`;
}

const generatedAt = new Date();
const { records, sourceFiles } = loadRecords(generatedAt);

if (records.length === 0) {
  fail("No demo, collector, or generated operational records were found.");
}

const worklist = records
  .map(scoreRecord)
  .sort((a, b) => b.advisoryScore - a.advisoryScore || b.lastPatchedDaysAgo - a.lastPatchedDaysAgo || a.hostname.localeCompare(b.hostname));

const dedupedWorklist = dedupeByHostname(worklist)
  .sort((a, b) => b.advisoryScore - a.advisoryScore || b.lastPatchedDaysAgo - a.lastPatchedDaysAgo || a.hostname.localeCompare(b.hostname));

fs.mkdirSync(EXPORT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_CSV, renderCsv(dedupedWorklist));
fs.writeFileSync(OUTPUT_HTML, renderHtml(dedupedWorklist, generatedAt, sourceFiles));
fs.writeFileSync(OUTPUT_SUMMARY, renderSummary(dedupedWorklist, generatedAt, sourceFiles));

console.log("");
console.log("========================================");
console.log(" BayouOps Patch Worklist Built");
console.log("========================================");
console.log(` Input Records     : ${worklist.length}`);
console.log(` Systems Reviewed : ${dedupedWorklist.length}`);
console.log(` P1 Review First  : ${dedupedWorklist.filter(record => record.priority === "P1 - Review First").length}`);
console.log(` P2 Schedule Soon : ${dedupedWorklist.filter(record => record.priority === "P2 - Schedule Soon").length}`);
console.log(` CSV Export       : ${OUTPUT_CSV}`);
console.log(` HTML Export      : ${OUTPUT_HTML}`);
console.log(` Summary Export   : ${OUTPUT_SUMMARY}`);
console.log(" Advisory Only    : Human approval required; no endpoint actions performed.");
console.log("========================================");
console.log("");
