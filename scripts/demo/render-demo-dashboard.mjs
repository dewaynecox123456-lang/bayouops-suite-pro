import fs from "fs";
import path from "path";
import {
  loadLinesOfBusinessConfig,
  mapLineOfBusiness,
  printLobConfigWarnings
} from "./lob-config.mjs";

const GENERATED_DIR = "./demo-data/generated";
const OUTPUT_DIR = "./screenshots/demo";
const lobConfig = loadLinesOfBusinessConfig();

printLobConfigWarnings(lobConfig);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const latestFile = fs
  .readdirSync(GENERATED_DIR)
  .filter(f => f.endsWith(".json"))
  .map(file => ({
    file,
    modifiedAt: fs.statSync(path.join(GENERATED_DIR, file)).mtimeMs
  }))
  .sort((a, b) => b.modifiedAt - a.modifiedAt)[0]?.file;

if (!latestFile) {
  console.error("No demo JSON files found.");
  process.exit(1);
}

const dataset = JSON.parse(
  fs.readFileSync(path.join(GENERATED_DIR, latestFile), "utf8")
).map(server => ({
  ...server,
  businessUnit: mapLineOfBusiness(server.businessUnit, lobConfig)
}));

const total = dataset.length;
const healthy = dataset.filter(x => x.riskState === "Healthy").length;
const warning = dataset.filter(x => x.riskState === "Warning").length;
const critical = dataset.filter(x => x.riskState === "Critical").length;

const avgScore = Math.round(
  dataset.reduce((a, b) => a + b.readinessScore, 0) / total
);

const criticalSystems = dataset
  .filter(x => x.riskState === "Critical")
  .sort((a, b) => a.readinessScore - b.readinessScore)
  .slice(0, 15);

const severityRank = {
  Critical: 3,
  Elevated: 2,
  Informational: 1
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addFinding(findings, server, severity, signal, recommendation) {
  findings.push({
    severity,
    hostname: server.hostname,
    businessUnit: server.businessUnit,
    readinessScore: server.readinessScore,
    signal,
    recommendation
  });
}

function generateOperationalFindings(servers) {
  const findings = [];

  for (const server of servers) {
    if (server.readinessScore < 70) {
      addFinding(
        findings,
        server,
        "Critical",
        `Readiness score is ${server.readinessScore}%, below the 70% operating threshold.`,
        "Prioritize owner review, confirm business impact, and schedule corrective maintenance."
      );
    }

    if (server.missingPatches > 10) {
      addFinding(
        findings,
        server,
        server.missingPatches > 20 ? "Critical" : "Elevated",
        `${server.missingPatches} missing patches detected.`,
        "Apply missing security updates in the next approved maintenance window."
      );
    }

    if (server.rebootPending === true) {
      addFinding(
        findings,
        server,
        "Informational",
        "Reboot pending after maintenance activity.",
        "Coordinate a controlled reboot and confirm post-restart service health."
      );
    }

    if (server.lastPatchedDaysAgo > 45) {
      addFinding(
        findings,
        server,
        server.lastPatchedDaysAgo > 90 ? "Critical" : "Elevated",
        `Last patched ${server.lastPatchedDaysAgo} days ago.`,
        "Review patch deferral reason and return the system to the normal patch cadence."
      );
    }

    if (server.exposureLevel === "High") {
      addFinding(
        findings,
        server,
        "Critical",
        "Exposure level is High.",
        "Validate internet-facing paths, reduce unnecessary exposure, and verify compensating controls."
      );
    }
  }

  return findings.sort((a, b) => {
    if (severityRank[b.severity] !== severityRank[a.severity]) {
      return severityRank[b.severity] - severityRank[a.severity];
    }

    return a.readinessScore - b.readinessScore;
  });
}

function formatTimelineDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function timelineDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatTimelineDate(date);
}

function addTimelineEvent(events, daysAgo, severity, summary, impact) {
  events.push({
    date: timelineDate(daysAgo),
    severity,
    summary,
    impact
  });
}

function generateOperationalTimeline(servers) {
  const events = [];
  const highPatchSystems = servers.filter(server => server.missingPatches > 20);
  const staleCriticalSystems = servers.filter(
    server => server.riskState === "Critical" && server.lastPatchedDaysAgo > 90
  );
  const rebootSystems = servers.filter(server => server.rebootPending === true);
  const highExposureSystems = servers.filter(server => server.exposureLevel === "High");
  const healthySystems = servers.filter(server => server.riskState === "Healthy");
  const recoveredCandidates = servers.filter(
    server =>
      server.riskState === "Healthy" &&
      server.readinessScore >= 90 &&
      server.missingPatches <= 2 &&
      server.exposureLevel === "Low"
  );
  const averageScore = Math.round(
    servers.reduce((totalScore, server) => totalScore + server.readinessScore, 0) /
      servers.length
  );

  if (staleCriticalSystems.length > 0) {
    addTimelineEvent(
      events,
      6,
      "Critical",
      `${staleCriticalSystems.length} critical systems exceeded stale patch thresholds.`,
      "Maintenance deferral increased operational exposure and prioritized owner review."
    );
  }

  if (highPatchSystems.length > 0) {
    addTimelineEvent(
      events,
      5,
      "Critical",
      `${highPatchSystems.length} systems exceeded the 20 missing patch threshold.`,
      "Security update backlog created a concentrated remediation queue for operations."
    );
  }

  if (highExposureSystems.length > 0) {
    addTimelineEvent(
      events,
      4,
      "Elevated",
      `${highExposureSystems.length} high exposure systems were identified for reduction.`,
      "Network-facing risk was isolated into a smaller set of targeted follow-up actions."
    );
  }

  if (rebootSystems.length > 0) {
    addTimelineEvent(
      events,
      3,
      "Informational",
      `${rebootSystems.length} systems entered reboot remediation tracking.`,
      "Pending maintenance completions were converted into a controlled restart checklist."
    );
  }

  addTimelineEvent(
    events,
    2,
    averageScore >= 80 ? "Informational" : "Elevated",
    `Readiness trend recalculated at ${averageScore}% across ${servers.length} systems.`,
    averageScore >= 80
      ? "Executive reporting shows stable readiness with remaining risk concentrated in known systems."
      : "Executive reporting shows readiness pressure requiring focused remediation sequencing."
  );

  if (recoveredCandidates.length > 0) {
    addTimelineEvent(
      events,
      1,
      "Informational",
      `${recoveredCandidates.length} systems reached low-exposure recovery posture.`,
      "Operational recovery milestones improved confidence in patch and exposure controls."
    );
  }

  if (healthySystems.length > 0) {
    addTimelineEvent(
      events,
      0,
      "Informational",
      `${healthySystems.length} systems are currently reporting healthy readiness state.`,
      "Healthy inventory provides a baseline for tracking week-over-week exposure reduction."
    );
  }

  return events.slice(0, 7);
}

const operationalFindings = generateOperationalFindings(dataset);
const findingCounts = {
  Critical: operationalFindings.filter(x => x.severity === "Critical").length,
  Elevated: operationalFindings.filter(x => x.severity === "Elevated").length,
  Informational: operationalFindings.filter(x => x.severity === "Informational").length
};
const topFindings = operationalFindings.slice(0, 12);
const operationalTimeline = generateOperationalTimeline(dataset);

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BayouOps Executive Dashboard</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
body {
    background:
radial-gradient(circle at top left,
#0f1f3d,
#071226 45%,
#030712 100%);
    color: #e2e8f0;
    font-family: Arial, sans-serif;
    padding: 40px;
}

h1 {
    color: #38bdf8;
    margin-bottom: 30px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    margin-bottom: 30px;
}

.card {
    background: #1e293b;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 0 25px rgba(0,0,0,0.35);
}

.metric {
    font-size: 42px;
    font-weight: bold;
    margin-top: 10px;
}

.good { color: #22c55e; }
.warn { color: #f59e0b; }
.bad  { color: #ef4444; }
.info { color: #38bdf8; }

.chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
}

.chart-card {
    background: #1e293b;
    border-radius: 16px;
    padding: 20px;
    min-height: 420px;
}

.chart-card canvas {
    max-height: 320px;
}

.executive-summary {
    background: linear-gradient(
        135deg,
        #0f172a,
        #172554
    );

    border-left: 6px solid #38bdf8;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 40px;
    line-height: 1.7;
}

table {
    width: 100%;
    border-collapse: collapse;
    background: #1e293b;
    border-radius: 16px;
    overflow: hidden;
}

th, td {
    padding: 14px;
    border-bottom: 1px solid #334155;
    text-align: left;
}

th {
    background: #0f172a;
}

.findings-section {
    margin-bottom: 40px;
}

.findings-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-end;
    margin-bottom: 16px;
}

.findings-header p {
    color: #94a3b8;
    line-height: 1.5;
    margin: 8px 0 0;
    max-width: 760px;
}

.findings-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.finding-count {
    background: #1e293b;
    border-radius: 16px;
    border: 1px solid #334155;
    padding: 18px;
}

.finding-count-label {
    color: #94a3b8;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.finding-count-value {
    font-size: 34px;
    font-weight: bold;
    margin-top: 8px;
}

.severity-badge {
    border-radius: 999px;
    display: inline-block;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.04em;
    padding: 6px 10px;
    text-transform: uppercase;
}

.severity-critical {
    background: rgba(239, 68, 68, 0.16);
    border: 1px solid rgba(239, 68, 68, 0.55);
    color: #fca5a5;
}

.severity-elevated {
    background: rgba(245, 158, 11, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.55);
    color: #fcd34d;
}

.severity-informational {
    background: rgba(56, 189, 248, 0.14);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #7dd3fc;
}

.finding-signal {
    color: #e2e8f0;
    font-weight: bold;
}

.finding-remediation {
    color: #cbd5e1;
    line-height: 1.45;
}

.timeline-section {
    margin-bottom: 40px;
}

.timeline-grid {
    display: grid;
    gap: 14px;
}

.timeline-entry {
    align-items: center;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    display: grid;
    gap: 16px;
    grid-template-columns: 130px 140px 1fr 1.25fr;
    padding: 16px 18px;
}

.timeline-date {
    color: #94a3b8;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.timeline-summary {
    color: #e2e8f0;
    font-weight: bold;
    line-height: 1.4;
}

.timeline-impact {
    color: #cbd5e1;
    line-height: 1.45;
}

.footer {
    margin-top: 40px;
    opacity: 0.5;
    font-size: 12px;
}
</style>
</head>

<body>

<h1>BayouOps Executive Readiness Dashboard</h1>

<div class="grid">

<div class="card">
<div>Total Systems</div>
<div class="metric">${total}</div>
</div>

<div class="card">
<div>Healthy</div>
<div class="metric good">${healthy}</div>
</div>

<div class="card">
<div>Warning</div>
<div class="metric warn">${warning}</div>
</div>

<div class="card">
<div>Critical</div>
<div class="metric bad">${critical}</div>
</div>

<div class="card">
<div>Operational Exposure</div>
<div class="metric bad">HIGH</div>
</div>

</div>

<div class="executive-summary">
<h2>Executive Summary</h2>

<p>
BayouOps identified <strong>${critical}</strong> systems operating in a
critical readiness state and requiring operational review.
</p>

<p>
The environment currently maintains an average readiness score of
<strong>${avgScore}%</strong> across ${total} monitored systems.
</p>

<p>
Primary operational exposure drivers include:
stale patch cycles, pending reboot states,
and elevated missing security update counts.
</p>
</div>

<div class="chart-grid">

<div class="chart-card">
<h3>Risk Distribution</h3>
<canvas id="riskChart"></canvas>
</div>

<div class="chart-card">
<h3>Readiness Trend</h3>
<canvas id="trendChart"></canvas>
</div>

</div>

<div class="timeline-section">
<div class="findings-header">
<div>
<h2>Operational Timeline</h2>
<p>
Simulated operational history generated from the latest readiness, patch,
reboot, and exposure signals to show how risk posture is changing over time.
</p>
</div>
</div>

<div class="timeline-grid">
${operationalTimeline.map(event => `
<div class="timeline-entry">
<div class="timeline-date">${escapeHtml(event.date)}</div>
<div><span class="severity-badge severity-${event.severity.toLowerCase()}">${event.severity}</span></div>
<div class="timeline-summary">${escapeHtml(event.summary)}</div>
<div class="timeline-impact">${escapeHtml(event.impact)}</div>
</div>
`).join("")}
</div>
</div>

<div class="findings-section">
<div class="findings-header">
<div>
<h2>Operational Findings</h2>
<p>
Findings are generated from readiness, patch, reboot, stale maintenance,
and exposure signals in the latest demo dataset.
</p>
</div>
</div>

<div class="findings-summary">
<div class="finding-count">
<div class="finding-count-label">Critical Findings</div>
<div class="finding-count-value bad">${findingCounts.Critical}</div>
</div>

<div class="finding-count">
<div class="finding-count-label">Elevated Findings</div>
<div class="finding-count-value warn">${findingCounts.Elevated}</div>
</div>

<div class="finding-count">
<div class="finding-count-label">Informational Findings</div>
<div class="finding-count-value info">${findingCounts.Informational}</div>
</div>
</div>

<table>
<thead>
<tr>
<th>Severity</th>
<th>Hostname</th>
<th>Business Unit</th>
<th>Finding</th>
<th>Recommended Remediation</th>
</tr>
</thead>

<tbody>
${topFindings.map(finding => `
<tr>
<td><span class="severity-badge severity-${finding.severity.toLowerCase()}">${finding.severity}</span></td>
<td>${escapeHtml(finding.hostname)}</td>
<td>${escapeHtml(finding.businessUnit)}</td>
<td class="finding-signal">${escapeHtml(finding.signal)}</td>
<td class="finding-remediation">${escapeHtml(finding.recommendation)}</td>
</tr>
`).join("")}
</tbody>
</table>
</div>

<h2>Highest Risk Operational Systems</h2>

<table>
<thead>
<tr>
<th>Hostname</th>
<th>Business Unit</th>
<th>Score</th>
<th>Missing Patches</th>
<th>Last Patched</th>
<th>Exposure</th>
</tr>
</thead>

<tbody>
${criticalSystems.map(server => `
<tr>
<td>${server.hostname}</td>
<td>${server.businessUnit}</td>
<td class="bad">${server.readinessScore}%</td>
<td>${server.missingPatches}</td>
<td>${server.lastPatchedDaysAgo} days ago</td>
<td class="bad">${server.exposureLevel}</td>
</tr>
`).join("")}
</tbody>
</table>

<div class="footer">
© 2026 BayouFinds.com — BayouOps Suite Pro<br>
Last Generated: ${new Date().toLocaleString()}
</div>

<script>
new Chart(document.getElementById('riskChart'), {
    type: 'doughnut',
    data: {
        labels: ['Healthy', 'Warning', 'Critical'],
        datasets: [{
            data: [${healthy}, ${warning}, ${critical}],
            backgroundColor: [
                '#22c55e',
                '#f59e0b',
                '#ef4444'
            ]
        }]
    }
});

new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
        labels: [
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun'
        ],
        datasets: [{
            label: 'Readiness Score',
            data: [92, 90, 88, 84, 82, 78, ${avgScore}],
            borderColor: '#38bdf8',
            tension: 0.3
        }]
    }
});
</script>

</body>
</html>
`;

const outFile = path.join(
  OUTPUT_DIR,
  "executive-dashboard.html"
);

fs.writeFileSync(outFile, html);

console.log("");
console.log("========================================");
console.log(" BayouOps Dashboard Rendered");
console.log("========================================");
console.log(` HTML Output : ${outFile}`);
console.log("========================================");
console.log("");
