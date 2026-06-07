import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { COPYRIGHT_FULL } from "./demo/signature-constants.mjs";

const EXPORT_DIR = "./exports";
const SCREENSHOT_DIR = "./screenshots/demo";
const NETWORK_INPUT = path.join(EXPORT_DIR, "bayouops-network-inventory.csv");
const NETWORK_READINESS_CSV = path.join(EXPORT_DIR, "network-readiness.csv");
const NETWORK_READINESS_SUMMARY = path.join(EXPORT_DIR, "network-readiness-summary.md");
const NETWORK_READINESS_DASHBOARD = path.join(EXPORT_DIR, "network-readiness-dashboard.html");
const NETWORK_READINESS_SCREENSHOT_SVG = path.join(SCREENSHOT_DIR, "network-readiness-dashboard.svg");
const NETWORK_READINESS_SCREENSHOT_PNG = path.join(SCREENSHOT_DIR, "network-readiness-dashboard.png");

const DEMO_NETWORK_ROWS = [
  {
    ComputerName: "BAYOU-APP01",
    Online: "True",
    Status: "Collected",
    OS: "Microsoft Windows Server 2022 Standard",
    OSVersion: "10.0.20348",
    LastBoot: "2026-06-01T07:42:00",
    RebootRequired: "False",
    HotFixCount: "184",
    CollectedAt: "2026-06-06T20:15:00"
  },
  {
    ComputerName: "BAYOU-SQL01",
    Online: "True",
    Status: "Collected",
    OS: "Microsoft Windows Server 2019 Standard",
    OSVersion: "10.0.17763",
    LastBoot: "2026-05-18T02:10:00",
    RebootRequired: "True",
    HotFixCount: "216",
    CollectedAt: "2026-06-06T20:16:00"
  },
  {
    ComputerName: "BAYOU-FILE01",
    Online: "False",
    Status: "Ping failed",
    OS: "",
    OSVersion: "",
    LastBoot: "",
    RebootRequired: "",
    HotFixCount: "",
    CollectedAt: "2026-06-06T20:17:00"
  },
  {
    ComputerName: "BAYOU-WKS07",
    Online: "True",
    Status: "Collection failed: WinRM access denied",
    OS: "",
    OSVersion: "",
    LastBoot: "",
    RebootRequired: "",
    HotFixCount: "",
    CollectedAt: "2026-06-06T20:18:00"
  },
  {
    ComputerName: "BAYOU-DC01",
    Online: "True",
    Status: "Collected",
    OS: "Microsoft Windows Server 2022 Datacenter",
    OSVersion: "10.0.20348",
    LastBoot: "2026-06-04T05:30:00",
    RebootRequired: "False",
    HotFixCount: "190",
    CollectedAt: "2026-06-06T20:19:00"
  }
];

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

function systemLabel(count) {
  return count === 1 ? "system" : "systems";
}

function needsVerb(count) {
  return count === 1 ? "needs" : "need";
}

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (value === null || value === undefined) return false;
  return ["true", "yes", "1", "pending", "rebootrequired"].includes(String(value).trim().toLowerCase());
}

function normalizeNetworkRow(row, sourceName) {
  const computerName = row.ComputerName ?? row.Hostname ?? row.hostname ?? "UNKNOWN";
  const online = toBool(row.Online);
  const status = row.Status ?? "";
  const os = row.OS || "Unknown";
  const rebootRequired = toBool(row.RebootRequired);
  const collectionFailed = /failed|error|denied|unreachable/i.test(status) && online;
  const offline = !online;

  const executiveStatus = offline || collectionFailed
    ? "Red: Action Required"
    : rebootRequired || os === "Unknown"
    ? "Yellow: Attention Required"
    : "Green: Healthy";

  const reviewNotes = offline
    ? "System did not respond during collection. Validate availability and ownership before relying on readiness evidence."
    : collectionFailed
    ? "System was reachable, but collection failed. Review WinRM, permissions, or local policy."
    : rebootRequired
    ? "Pending reboot signal should be coordinated before maintenance readiness is considered clean."
    : "No elevated network inventory readiness signal from current evidence.";

  return {
    computerName,
    online,
    offline,
    status,
    os,
    osVersion: row.OSVersion ?? "",
    lastBoot: row.LastBoot ?? "",
    rebootRequired,
    hotFixCount: row.HotFixCount ?? "",
    collectedAt: row.CollectedAt ?? "",
    collectionFailed,
    executiveStatus,
    reviewNotes,
    sourceName
  };
}

function loadNetworkRecords() {
  if (fs.existsSync(NETWORK_INPUT)) {
    const records = parseCsv(NETWORK_INPUT).map(row => normalizeNetworkRow(row, NETWORK_INPUT));
    return {
      records,
      sourceFiles: [NETWORK_INPUT],
      usedDemoData: false
    };
  }

  return {
    records: DEMO_NETWORK_ROWS.map(row => normalizeNetworkRow(row, "Built-in network readiness demo data")),
    sourceFiles: ["Built-in network readiness demo data"],
    usedDemoData: true
  };
}

function countBy(records, field) {
  return records.reduce((counts, record) => {
    const key = record[field] || "Unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function buildNetworkContext(records, usedDemoData) {
  const totalSystems = records.length;
  const onlineSystems = records.filter(record => record.online).length;
  const offlineSystems = records.filter(record => record.offline).length;
  const rebootRequiredCount = records.filter(record => record.rebootRequired).length;
  const collectionFailures = records.filter(record => record.collectionFailed).length;
  const osBreakdown = countBy(records, "os");
  const statusCounts = countBy(records, "executiveStatus");
  const redCount = statusCounts["Red: Action Required"] ?? 0;
  const yellowCount = statusCounts["Yellow: Attention Required"] ?? 0;
  const greenCount = statusCounts["Green: Healthy"] ?? 0;
  const overallStatus = redCount > 0 ? "Red: Action Required" : yellowCount > 0 ? "Yellow: Attention Required" : "Green: Healthy";
  const readinessPercent = totalSystems > 0 ? Math.round((greenCount / totalSystems) * 100) : 0;

  return {
    totalSystems,
    onlineSystems,
    offlineSystems,
    rebootRequiredCount,
    collectionFailures,
    osBreakdown,
    statusCounts,
    greenCount,
    yellowCount,
    redCount,
    overallStatus,
    readinessPercent,
    usedDemoData,
    attentionRows: records.filter(record => record.executiveStatus !== "Green: Healthy")
  };
}

function renderNetworkReadinessCsv(records) {
  const columns = [
    "ExecutiveStatus",
    "ComputerName",
    "Online",
    "Offline",
    "CollectionFailed",
    "Status",
    "OS",
    "OSVersion",
    "LastBoot",
    "RebootRequired",
    "HotFixCount",
    "CollectedAt",
    "ReviewNotes",
    "Source"
  ];

  const rows = records.map(record => [
    record.executiveStatus,
    record.computerName,
    record.online,
    record.offline,
    record.collectionFailed,
    record.status,
    record.os,
    record.osVersion,
    record.lastBoot,
    record.rebootRequired,
    record.hotFixCount,
    record.collectedAt,
    record.reviewNotes,
    record.sourceName
  ]);

  return [
    columns.map(escapeCsv).join(","),
    ...rows.map(row => row.map(escapeCsv).join(","))
  ].join("\n") + "\n";
}

function renderNetworkReadinessSummary(records, generatedAt, sourceFiles, usedDemoData) {
  const context = buildNetworkContext(records, usedDemoData);
  const osLines = Object.entries(context.osBreakdown)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([os, count]) => `- ${os}: ${count}`)
    .join("\n");
  const sourceLines = sourceFiles.map(file => `- ${file}`).join("\n");
  const attentionRows = context.attentionRows.slice(0, 12).map(record => (
    `| ${record.executiveStatus} | ${record.computerName} | ${record.status || "Unknown"} | ${record.os} | ${record.reviewNotes} |`
  )).join("\n");

  return `# BayouOps Network Readiness Summary

Generated: ${generatedAt.toISOString()}

Operational Advisory Only - Human Approval Required.

This export is read-only and intended for systems you own or are authorized to manage. It summarizes CSV-driven network inventory evidence. It does not scan networks, brute-force discovery, collect credentials, exploit systems, remediate systems, reboot systems, or modify endpoints.

## Executive Summary

- Overall status: ${context.overallStatus}
- Green: Healthy: ${context.greenCount}
- Yellow: Attention Required: ${context.yellowCount}
- Red: Action Required: ${context.redCount}
- Demo data used: ${context.usedDemoData ? "Yes - collector output was missing" : "No"}

## Network Readiness Counts

- Total systems: ${context.totalSystems}
- Online systems: ${context.onlineSystems}
- Offline systems: ${context.offlineSystems}
- Reboot required count: ${context.rebootRequiredCount}
- Collection failures: ${context.collectionFailures}
- Healthy readiness percentage: ${context.readinessPercent}%

## OS Breakdown

${osLines}

## Attention Items

| Status | Computer | Collection Status | OS | Review Notes |
| --- | --- | --- | --- | --- |
${attentionRows || "| Green: Healthy | None | Collected | Current evidence has no elevated network readiness items. | No action required beyond normal review. |"}

## Workflow

Collector -> Import -> Dashboard -> Executive Summary

## Source Files

${sourceLines}

${COPYRIGHT_FULL}
`;
}

function renderNetworkReadinessDashboard(records, generatedAt, sourceFiles, usedDemoData) {
  const context = buildNetworkContext(records, usedDemoData);
  const osRows = Object.entries(context.osBreakdown)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([os, count]) => `<tr><td>${escapeHtml(os)}</td><td>${count}</td></tr>`)
    .join("");
  const attentionRows = context.attentionRows.slice(0, 12).map(record => `
              <tr>
                <td>${escapeHtml(record.executiveStatus)}</td>
                <td>${escapeHtml(record.computerName)}</td>
                <td>${escapeHtml(record.status || "Unknown")}</td>
                <td>${escapeHtml(record.os)}</td>
                <td>${escapeHtml(record.reviewNotes)}</td>
              </tr>`).join("");
  const sourceRows = sourceFiles.map(file => `<li>${escapeHtml(file)}</li>`).join("\n            ");
  const statusTone = context.redCount > 0 ? "risk" : context.yellowCount > 0 ? "warn" : "ready";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BayouOps Network Readiness Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17212f;
      --muted: #64748b;
      --line: #d9e0e8;
      --panel: #ffffff;
      --soft: #f5f7fa;
      --teal: #12645a;
      --cyan: #256f91;
      --amber: #9a650f;
      --red: #9f2f24;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--soft);
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    main {
      max-width: 1240px;
      margin: 0 auto;
      padding: 34px 24px 44px;
    }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 24px;
      align-items: start;
      border-bottom: 3px solid var(--teal);
      padding-bottom: 20px;
    }
    .brand-line {
      margin-bottom: 8px;
      color: var(--teal);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h1, h2, p { margin-top: 0; }
    h1 {
      margin-bottom: 8px;
      font-size: 34px;
      letter-spacing: 0;
    }
    h2 {
      margin-bottom: 10px;
      font-size: 20px;
      letter-spacing: 0;
    }
    .subtle { color: var(--muted); }
    .status-badge {
      min-width: 210px;
      border-radius: 6px;
      padding: 14px 16px;
      background: ${statusTone === "ready" ? "var(--teal)" : statusTone === "warn" ? "var(--amber)" : "var(--red)"};
      color: #ffffff;
      font-weight: 800;
      text-align: center;
    }
    .status-badge span {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.9;
      text-transform: uppercase;
    }
    .notice {
      margin: 18px 0 0;
      border-left: 4px solid var(--teal);
      padding: 12px 14px;
      background: #edf6f4;
      font-weight: 700;
    }
    .export-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }
    .export-actions a {
      display: inline-flex;
      min-height: 38px;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0 12px;
      background: #ffffff;
      color: var(--ink);
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 24px;
    }
    .card {
      min-width: 0;
      min-height: 116px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 15px;
      background: var(--panel);
    }
    .card strong {
      display: block;
      margin-bottom: 8px;
      color: var(--ink);
      font-size: 30px;
      line-height: 1;
      overflow-wrap: anywhere;
    }
    .card span {
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }
    .card.ready strong { color: var(--teal); }
    .card.warn strong { color: var(--amber); }
    .card.risk strong { color: var(--red); }
    .card.status-card strong {
      font-size: 22px;
      line-height: 1.08;
    }
    .panel {
      margin-top: 22px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 18px;
      background: var(--panel);
    }
    .two-column {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
      gap: 16px;
      margin-top: 22px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 10px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f0f4f8;
      color: #405064;
      font-size: 12px;
      text-transform: uppercase;
    }
    .summary-band {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 22px;
    }
    .summary-band .panel {
      margin-top: 0;
    }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 8px 0; }
    footer {
      margin-top: 24px;
      color: var(--muted);
      font-size: 12px;
    }
    @media (max-width: 980px) {
      header, .two-column, .summary-band { grid-template-columns: 1fr; }
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 620px) {
      main { padding: 22px 14px 34px; }
      h1 { font-size: 28px; }
      .status-badge { width: 100%; min-width: 0; }
      .export-actions a { flex: 1 1 150px; }
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .card { min-height: 104px; padding: 13px; }
      .card strong { font-size: 27px; }
      .card span { font-size: 12px; }
      .card.status-card strong { font-size: 19px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand-line">BayouOps Suite Pro</div>
        <h1>Network Readiness Dashboard</h1>
        <p class="subtle">Generated ${escapeHtml(generatedAt.toISOString())}. CSV-driven Windows network inventory evidence for operator review and executive reporting.</p>
        <p class="notice">Operational Advisory Only - Human Approval Required. This dashboard is read-only and does not scan networks, collect credentials, exploit systems, remediate systems, reboot systems, or modify endpoints.</p>
        <nav class="export-actions" aria-label="Read-only network report exports">
          <a href="network-readiness.csv" download>Export CSV</a>
          <a href="network-readiness-summary.md" download>Export Summary</a>
        </nav>
      </div>
      <div class="status-badge">${escapeHtml(context.overallStatus)}<span>Executive Summary</span></div>
    </header>

    <section class="cards" aria-label="Network readiness counts">
      <div class="card"><strong>${context.totalSystems}</strong><span>Total Systems</span></div>
      <div class="card ready"><strong>${context.onlineSystems}</strong><span>Online Systems</span></div>
      <div class="card risk"><strong>${context.offlineSystems}</strong><span>Offline Systems</span></div>
      <div class="card warn"><strong>${context.rebootRequiredCount}</strong><span>Reboot Required</span></div>
      <div class="card risk"><strong>${context.collectionFailures}</strong><span>Collection Failures</span></div>
      <div class="card ready"><strong>${context.readinessPercent}%</strong><span>Healthy Readiness</span></div>
      <div class="card warn"><strong>${context.yellowCount}</strong><span>Attention Required</span></div>
      <div class="card status-card ${statusTone === "ready" ? "ready" : statusTone === "warn" ? "warn" : "risk"}"><strong>${escapeHtml(context.overallStatus)}</strong><span>Overall Status</span></div>
    </section>

    <section class="summary-band" aria-label="Executive color summary">
      <div class="panel"><h2>Green: Healthy</h2><p class="subtle">${context.greenCount} ${systemLabel(context.greenCount)} online with collected evidence and no reboot signal.</p></div>
      <div class="panel"><h2>Yellow: Attention Required</h2><p class="subtle">${context.yellowCount} ${systemLabel(context.yellowCount)} ${needsVerb(context.yellowCount)} review for reboot state or incomplete OS evidence.</p></div>
      <div class="panel"><h2>Red: Action Required</h2><p class="subtle">${context.redCount} ${systemLabel(context.redCount)} offline or had collection failures requiring operator follow-up.</p></div>
    </section>

    <section class="two-column">
      <div class="panel">
        <h2>Attention Items</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Computer</th>
              <th>Collection Status</th>
              <th>OS</th>
              <th>Review Notes</th>
            </tr>
          </thead>
          <tbody>${attentionRows || `
              <tr>
                <td>Green: Healthy</td>
                <td>None</td>
                <td>Collected</td>
                <td>Current evidence</td>
                <td>No elevated network readiness items.</td>
              </tr>`}
          </tbody>
        </table>
      </div>
      <aside class="panel">
        <h2>OS Breakdown</h2>
        <table>
          <thead><tr><th>OS</th><th>Systems</th></tr></thead>
          <tbody>${osRows}</tbody>
        </table>
      </aside>
    </section>

    <section class="panel">
      <h2>Workflow</h2>
      <p class="subtle">Collector -> Import -> Dashboard -> Executive Summary</p>
      <ul>
        <li>Run the CSV-driven Windows collector against approved systems.</li>
        <li>Place the collector output at <code>exports/bayouops-network-inventory.csv</code>.</li>
        <li>Run the reporting pipeline to generate dashboard, summary, and CSV outputs.</li>
        <li>Use the executive color summary for manager, CAB, or readiness review.</li>
      </ul>
    </section>

    <section class="panel">
      <h2>Evidence Sources</h2>
      <ul>
            ${sourceRows}
      </ul>
    </section>

    <footer>${escapeHtml(COPYRIGHT_FULL)}</footer>
  </main>
</body>
</html>
`;
}

function renderNetworkReadinessScreenshotSvg(records, generatedAt, usedDemoData) {
  const context = buildNetworkContext(records, usedDemoData);
  const statusColor = context.redCount > 0 ? "#9f2f24" : context.yellowCount > 0 ? "#9a650f" : "#12645a";
  const cardData = [
    ["Total Systems", context.totalSystems, "#17212f"],
    ["Online Systems", context.onlineSystems, "#12645a"],
    ["Offline Systems", context.offlineSystems, "#9f2f24"],
    ["Reboot Required", context.rebootRequiredCount, "#9a650f"],
    ["Collection Failures", context.collectionFailures, "#9f2f24"],
    ["Healthy Readiness", `${context.readinessPercent}%`, "#12645a"],
    ["Attention Required", context.yellowCount, "#9a650f"],
    ["Overall Status", context.overallStatus, statusColor]
  ];

  const cards = cardData.map(([label, value, color], index) => {
    const x = 48 + (index % 4) * 282;
    const y = 164 + Math.floor(index / 4) * 122;
    const valueText = String(value);
    const valueSize = valueText.length > 10 ? 22 : valueText.length > 8 ? 28 : 44;
    return `
      <rect x="${x}" y="${y}" width="250" height="96" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
      <text x="${x + 22}" y="${y + 46}" fill="${color}" font-size="${valueSize}" font-weight="700">${escapeHtml(valueText)}</text>
      <text x="${x + 22}" y="${y + 78}" fill="#64748b" font-size="15" font-weight="700">${escapeHtml(label)}</text>`;
  }).join("");

  const rows = context.attentionRows.slice(0, 4).map((row, index) => {
    const y = 708 + index * 40;
    return `
      <text x="72" y="${y}" fill="#17212f" font-size="14" font-weight="700">${escapeHtml(row.computerName)}</text>
      <text x="230" y="${y}" fill="#475569" font-size="13">${escapeHtml(row.executiveStatus)}</text>
      <text x="448" y="${y}" fill="#475569" font-size="13">${escapeHtml(row.status || "Unknown")}</text>
      <text x="720" y="${y}" fill="#64748b" font-size="13">${escapeHtml(row.os)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="#f5f7fa"/>
  <rect x="0" y="0" width="1200" height="126" fill="#17212f"/>
  <text x="48" y="38" fill="#1fb6a6" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">BAYOUOPS SUITE PRO</text>
  <text x="48" y="72" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">Network Readiness Dashboard</text>
  <text x="48" y="100" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="15">CSV-driven Windows network inventory evidence - generated ${escapeHtml(generatedAt.toISOString())}</text>
  <rect x="908" y="34" width="244" height="48" rx="8" fill="${statusColor}"/>
  <text x="1030" y="64" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="700">${escapeHtml(context.overallStatus)}</text>
  <g font-family="Arial, sans-serif">
    ${cards}
    <rect x="48" y="420" width="342" height="170" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="72" y="456" fill="#17212f" font-size="20" font-weight="700">Green: Healthy</text>
    <text x="72" y="506" fill="#12645a" font-size="54" font-weight="800">${context.greenCount}</text>
    <text x="72" y="544" fill="#64748b" font-size="15">Online and collected without reboot signal.</text>
    <rect x="428" y="420" width="342" height="170" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="452" y="456" fill="#17212f" font-size="20" font-weight="700">Yellow: Attention Required</text>
    <text x="452" y="506" fill="#9a650f" font-size="54" font-weight="800">${context.yellowCount}</text>
    <text x="452" y="544" fill="#64748b" font-size="15">Reboot or evidence completeness review.</text>
    <rect x="810" y="420" width="342" height="170" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="834" y="456" fill="#17212f" font-size="20" font-weight="700">Red: Action Required</text>
    <text x="834" y="506" fill="#9f2f24" font-size="54" font-weight="800">${context.redCount}</text>
    <text x="834" y="544" fill="#64748b" font-size="15">Offline or collection failure follow-up.</text>
    <rect x="48" y="626" width="1104" height="238" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="72" y="660" fill="#17212f" font-size="21" font-weight="700">Network Attention Items</text>
    ${rows || `<text x="72" y="708" fill="#12645a" font-size="15" font-weight="700">No elevated network readiness items.</text>`}
    <text x="72" y="836" fill="#64748b" font-size="13">Operational Advisory Only - Human Approval Required. No scanning, credential collection, remediation, or endpoint modification.</text>
    <text x="48" y="892" fill="#64748b" font-size="12">${escapeHtml(COPYRIGHT_FULL)}</text>
  </g>
</svg>`;
}

function convertSvgToPng(svgFile, pngFile) {
  const binaries = ["magick", "convert"];
  for (const binary of binaries) {
    try {
      execFileSync(binary, [svgFile, pngFile], { stdio: "ignore" });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

export function buildNetworkReadinessPipeline(generatedAt = new Date()) {
  const { records, sourceFiles, usedDemoData } = loadNetworkRecords();

  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.writeFileSync(NETWORK_READINESS_CSV, renderNetworkReadinessCsv(records));
  fs.writeFileSync(NETWORK_READINESS_SUMMARY, renderNetworkReadinessSummary(records, generatedAt, sourceFiles, usedDemoData));
  fs.writeFileSync(NETWORK_READINESS_DASHBOARD, renderNetworkReadinessDashboard(records, generatedAt, sourceFiles, usedDemoData));
  fs.writeFileSync(NETWORK_READINESS_SCREENSHOT_SVG, renderNetworkReadinessScreenshotSvg(records, generatedAt, usedDemoData));
  const screenshotPngCreated = convertSvgToPng(NETWORK_READINESS_SCREENSHOT_SVG, NETWORK_READINESS_SCREENSHOT_PNG);
  const context = buildNetworkContext(records, usedDemoData);

  return {
    ...context,
    records: records.length,
    input: fs.existsSync(NETWORK_INPUT) ? NETWORK_INPUT : "Built-in network readiness demo data",
    csv: NETWORK_READINESS_CSV,
    summary: NETWORK_READINESS_SUMMARY,
    dashboard: NETWORK_READINESS_DASHBOARD,
    screenshotSvg: NETWORK_READINESS_SCREENSHOT_SVG,
    screenshotPng: screenshotPngCreated ? NETWORK_READINESS_SCREENSHOT_PNG : null
  };
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const result = buildNetworkReadinessPipeline();
  console.log("");
  console.log("========================================");
  console.log(" BayouOps Network Readiness Built");
  console.log("========================================");
  console.log(` Input Source       : ${result.input}`);
  console.log(` Total Systems      : ${result.totalSystems}`);
  console.log(` Online Systems     : ${result.onlineSystems}`);
  console.log(` Offline Systems    : ${result.offlineSystems}`);
  console.log(` Reboot Required    : ${result.rebootRequiredCount}`);
  console.log(` Collection Failures: ${result.collectionFailures}`);
  console.log(` Overall Status     : ${result.overallStatus}`);
  console.log(` CSV Export         : ${result.csv}`);
  console.log(` Summary Export     : ${result.summary}`);
  console.log(` Dashboard Export   : ${result.dashboard}`);
  console.log(` Screenshot SVG     : ${result.screenshotSvg}`);
  console.log(` Screenshot PNG     : ${result.screenshotPng ?? "PNG conversion unavailable"}`);
  console.log(" Advisory Only      : Human approval required; no endpoint actions performed.");
  console.log("========================================");
  console.log("");
}
