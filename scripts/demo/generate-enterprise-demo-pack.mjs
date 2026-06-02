import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { COPYRIGHT_FULL, COPYRIGHT_SHORT } from "./signature-constants.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const PACK_NAME = "enterprise-demo-pack";
const GENERATED_AT = new Date("2026-06-01T14:00:00-05:00");

const paths = {
  data: path.join(REPO_ROOT, "demo-data/generated", PACK_NAME),
  screenshots: path.join(REPO_ROOT, "screenshots/demo", PACK_NAME),
  exports: path.join(REPO_ROOT, "exports/demo", PACK_NAME),
  media: path.resolve(process.env.HOME || "~", "BayouFinds/media/bayouops-demo-pack")
};

const scenarios = [
  {
    id: "01-healthy-environment",
    title: "Healthy Environment",
    riskLevel: "Low",
    score: 94,
    compliance: 97,
    patchCoverage: 96,
    staleSystems: 2,
    unsupportedOs: 0,
    rebootAgeDays: 4,
    sslRisks: 1,
    summary:
      "Corporate services are inside operating thresholds with limited exceptions isolated to non-critical endpoints.",
    adminValue:
      "Confirms normal patch cadence, validates restart hygiene, and gives administrators a clean baseline for weekly operations.",
    stakeholderValue:
      "Shows that technical controls are operating predictably and that exceptions are measurable rather than anecdotal."
  },
  {
    id: "02-medium-risk-environment",
    title: "Medium Risk Environment",
    riskLevel: "Medium",
    score: 78,
    compliance: 84,
    patchCoverage: 81,
    staleSystems: 11,
    unsupportedOs: 2,
    rebootAgeDays: 31,
    sslRisks: 4,
    summary:
      "Business systems remain serviceable, but patch deferrals, older operating systems, and certificate warnings need coordinated remediation.",
    adminValue:
      "Identifies the systems most likely to consume maintenance time before the risk becomes an outage or audit exception.",
    stakeholderValue:
      "Turns scattered operational findings into a prioritized management queue with visible ownership and impact."
  },
  {
    id: "03-critical-risk-environment",
    title: "Critical Risk Environment",
    riskLevel: "Critical",
    score: 52,
    compliance: 61,
    patchCoverage: 58,
    staleSystems: 27,
    unsupportedOs: 7,
    rebootAgeDays: 104,
    sslRisks: 11,
    summary:
      "Core service risk is concentrated in stale servers, unsupported platforms, and public-facing SSL exposure.",
    adminValue:
      "Separates urgent remediation from routine work so teams can protect critical workloads first.",
    stakeholderValue:
      "Provides a plain-language explanation of why risk acceptance, emergency change windows, or vendor escalation may be required."
  },
  {
    id: "04-executive-summary",
    title: "Executive Summary",
    riskLevel: "Elevated",
    score: 81,
    compliance: 86,
    patchCoverage: 83,
    staleSystems: 14,
    unsupportedOs: 3,
    rebootAgeDays: 42,
    sslRisks: 5,
    summary:
      "Enterprise readiness is stable overall, with risk concentrated in a small number of legacy and internet-facing systems.",
    adminValue:
      "Gives operations a concise queue for patching, reboot coordination, lifecycle review, and certificate cleanup.",
    stakeholderValue:
      "Frames operational health as score, trend, business impact, and next action for leadership review."
  },
  {
    id: "05-export-reporting-view",
    title: "Export / Reporting View",
    riskLevel: "Reporting",
    score: 88,
    compliance: 90,
    patchCoverage: 89,
    staleSystems: 8,
    unsupportedOs: 2,
    rebootAgeDays: 24,
    sslRisks: 3,
    summary:
      "Audit-ready CSV, JSON, and Markdown outputs capture the same mock operational state shown in the visual dashboard.",
    adminValue:
      "Makes it easier to hand off remediation lists, archive evidence, and compare results after maintenance windows.",
    stakeholderValue:
      "Supports repeatable reporting for compliance reviews, vendor discussions, and management updates."
  },
  {
    id: "06-before-remediation",
    title: "Before Remediation",
    riskLevel: "High",
    score: 63,
    compliance: 70,
    patchCoverage: 66,
    staleSystems: 22,
    unsupportedOs: 5,
    rebootAgeDays: 87,
    sslRisks: 9,
    summary:
      "Remediation has not started, leaving outdated servers, aged reboots, and certificate findings in the active risk queue.",
    adminValue:
      "Creates the baseline needed to prove which issues existed before corrective maintenance.",
    stakeholderValue:
      "Shows the starting risk posture and justifies planned change activity using clear operational evidence."
  },
  {
    id: "07-after-remediation",
    title: "After Remediation",
    riskLevel: "Improved",
    score: 91,
    compliance: 95,
    patchCoverage: 94,
    staleSystems: 4,
    unsupportedOs: 1,
    rebootAgeDays: 9,
    sslRisks: 2,
    summary:
      "Maintenance actions reduced stale inventory, closed most certificate issues, and returned systems to an improved operating posture.",
    adminValue:
      "Documents remediation progress and leaves a smaller exception list for follow-up ownership.",
    stakeholderValue:
      "Demonstrates measurable risk reduction after action, which is useful for leadership and compliance narratives."
  }
];

const businessUnits = [
  "Finance Operations",
  "Revenue Systems",
  "Customer Support",
  "Field Services",
  "Manufacturing IT",
  "Corporate Security",
  "Data Platform"
];

const hostSamples = [
  ["BAY-FIN-SQL-014", "SQL Server 2019", "Windows Server 2019", "Finance Operations", 88],
  ["BAY-REV-API-022", "Revenue API", "Ubuntu 22.04 LTS", "Revenue Systems", 91],
  ["BAY-CS-WEB-007", "Support Portal", "Windows Server 2022", "Customer Support", 96],
  ["BAY-FLD-RDS-003", "Remote Desktop Gateway", "Windows Server 2016", "Field Services", 64],
  ["BAY-MFG-HMI-011", "Plant Floor Gateway", "Windows Server 2012 R2", "Manufacturing IT", 49],
  ["BAY-SEC-EDGE-005", "VPN Edge", "Ubuntu 20.04 LTS", "Corporate Security", 72],
  ["BAY-DATA-ETL-018", "ETL Worker", "Red Hat Enterprise Linux 8", "Data Platform", 84],
  ["BAY-CORP-FILE-029", "File Services", "Windows Server 2019", "Corporate Security", 79],
  ["BAY-REV-WEB-031", "Revenue Web", "Windows Server 2022", "Revenue Systems", 93],
  ["BAY-FIN-APP-044", "ERP Application", "Windows Server 2016", "Finance Operations", 68],
  ["BAY-DATA-DB-010", "Analytics Database", "Ubuntu 18.04 LTS", "Data Platform", 57],
  ["BAY-CS-MAIL-002", "Case Mail Relay", "Windows Server 2012 R2", "Customer Support", 46]
];

const palette = {
  background: "#f6f7f9",
  panel: "#ffffff",
  ink: "#172033",
  muted: "#607089",
  border: "#d9e0ea",
  blue: "#155eef",
  green: "#16833a",
  amber: "#b76100",
  red: "#b42318",
  slate: "#344054"
};

function ensureDirs() {
  Object.values(paths).forEach(dir => fs.mkdirSync(dir, { recursive: true }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugTitle(scenario) {
  return `${scenario.id}-${scenario.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "")}`;
}

function riskColor(riskLevel) {
  if (["Critical", "High"].includes(riskLevel)) return palette.red;
  if (["Medium", "Elevated"].includes(riskLevel)) return palette.amber;
  if (["Improved", "Low"].includes(riskLevel)) return palette.green;
  return palette.blue;
}

function scenarioSystems(scenario) {
  return hostSamples.map(([hostname, service, os, businessUnit, baseScore], index) => {
    const pressure = Math.max(0, 95 - scenario.score);
    const missingPatches = Math.max(0, Math.round((pressure / 7) + (index % 4) * 2 - (scenario.score > 90 ? 2 : 0)));
    const lastPatchedDaysAgo = Math.max(3, Math.round(scenario.rebootAgeDays * 0.65 + index * 3));
    const unsupported = os.includes("2012") || os.includes("Ubuntu 18.04");
    const sslRisk =
      index < scenario.sslRisks
        ? index % 3 === 0
          ? "Expires < 14 days"
          : index % 3 === 1
            ? "Legacy TLS"
            : "Name mismatch"
        : "None";

    return {
      hostname,
      service,
      businessUnit,
      os,
      readinessScore: Math.max(35, Math.min(99, Math.round((baseScore + scenario.score) / 2 - (unsupported ? 7 : 0)))),
      missingPatches,
      complianceState: missingPatches > 10 || unsupported ? "Exception" : missingPatches > 4 ? "Watch" : "Compliant",
      stale: lastPatchedDaysAgo > 45,
      unsupportedOs: unsupported,
      rebootAgeDays: Math.max(1, Math.round(scenario.rebootAgeDays + index * 2 - scenario.score / 10)),
      lastPatchedDaysAgo,
      sslRisk,
      owner: businessUnit
    };
  });
}

function scenarioRecord(scenario) {
  return {
    ...scenario,
    generatedAt: GENERATED_AT.toISOString(),
    estateSize: 248,
    systems: scenarioSystems(scenario),
    operationalSignals: [
      `${scenario.patchCoverage}% patch coverage across in-scope systems`,
      `${scenario.compliance}% compliance score for mock control evidence`,
      `${scenario.staleSystems} stale systems past maintenance threshold`,
      `${scenario.unsupportedOs} unsupported OS instances requiring lifecycle review`,
      `${scenario.rebootAgeDays} day oldest reboot age`,
      `${scenario.sslRisks} SSL or TLS findings in active review`
    ]
  };
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function writeCsv(file, rows) {
  fs.writeFileSync(file, `${rows.map(row => row.map(csvEscape).join(",")).join("\n")}\n`);
}

function metricCard(label, value, x, y, color) {
  return `
  <rect x="${x}" y="${y}" width="176" height="92" rx="6" fill="${palette.panel}" stroke="${palette.border}"/>
  <text x="${x + 16}" y="${y + 28}" fill="${palette.muted}" font-size="13">${escapeHtml(label)}</text>
  <text x="${x + 16}" y="${y + 67}" fill="${color}" font-size="32" font-weight="700">${escapeHtml(value)}</text>`;
}

function wrappedText(value, x, y, maxChars, lineHeight, attrs = "") {
  const words = String(value).split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return `<text x="${x}" y="${y}" ${attrs}>${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`)
    .join("")}</text>`;
}

function bar(label, value, x, y, color) {
  const width = Math.round((value / 100) * 372);
  return `
  <text x="${x}" y="${y - 8}" fill="${palette.ink}" font-size="14" font-weight="600">${escapeHtml(label)}</text>
  <rect x="${x}" y="${y}" width="372" height="14" rx="7" fill="#e8edf5"/>
  <rect x="${x}" y="${y}" width="${width}" height="14" rx="7" fill="${color}"/>
  <text x="${x + 386}" y="${y + 12}" fill="${palette.ink}" font-size="13">${value}%</text>`;
}

function scenarioSvg(record) {
  const color = riskColor(record.riskLevel);
  const systems = record.systems.slice(0, 6);
  const rowSvg = systems
    .map((system, index) => {
      const y = 506 + index * 46;
      const stateColor =
        system.complianceState === "Exception"
          ? palette.red
          : system.complianceState === "Watch"
            ? palette.amber
            : palette.green;
      return `
  <text x="58" y="${y}" fill="${palette.ink}" font-size="13" font-weight="700">${escapeHtml(system.hostname)}</text>
  <text x="218" y="${y}" fill="${palette.muted}" font-size="12">${escapeHtml(system.businessUnit)}</text>
  <text x="392" y="${y}" fill="${palette.muted}" font-size="12">${escapeHtml(system.os)}</text>
  <text x="594" y="${y}" fill="${stateColor}" font-size="12" font-weight="700">${escapeHtml(system.complianceState)}</text>
  <text x="714" y="${y}" fill="${palette.ink}" font-size="12">${system.missingPatches}</text>
  <text x="806" y="${y}" fill="${palette.ink}" font-size="12">${system.rebootAgeDays}d</text>
  <text x="904" y="${y}" fill="${system.sslRisk === "None" ? palette.green : palette.red}" font-size="12">${escapeHtml(system.sslRisk)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
  <rect width="1200" height="760" fill="${palette.background}"/>
  <text x="48" y="58" fill="${palette.ink}" font-family="Arial, sans-serif" font-size="31" font-weight="700">BayouOps Suite Pro</text>
  <text x="48" y="88" fill="${palette.muted}" font-family="Arial, sans-serif" font-size="15">Enterprise Demo Scenario - ${escapeHtml(record.title)}</text>
  <rect x="936" y="42" width="154" height="34" rx="17" fill="${color}"/>
  <text x="1013" y="64" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="13" font-weight="700">${escapeHtml(record.riskLevel)} Risk</text>
  <g font-family="Arial, sans-serif">
    ${metricCard("Operational Score", `${record.score}%`, 48, 126, color)}
    ${metricCard("Compliance", `${record.compliance}%`, 244, 126, palette.blue)}
    ${metricCard("Patch Coverage", `${record.patchCoverage}%`, 440, 126, palette.green)}
    ${metricCard("Stale Systems", record.staleSystems, 636, 126, record.staleSystems > 15 ? palette.red : palette.amber)}
    ${metricCard("SSL Findings", record.sslRisks, 832, 126, record.sslRisks > 7 ? palette.red : palette.amber)}
    <rect x="48" y="250" width="512" height="152" rx="6" fill="${palette.panel}" stroke="${palette.border}"/>
    <text x="72" y="286" fill="${palette.ink}" font-size="18" font-weight="700">Executive Summary</text>
    ${wrappedText(record.summary, 72, 315, 66, 19, `fill="${palette.slate}" font-size="14"`)}
    <text x="72" y="384" fill="${palette.muted}" font-size="13">Estate size: ${record.estateSize} systems | Oldest reboot age: ${record.rebootAgeDays} days | Unsupported OS: ${record.unsupportedOs}</text>
    <rect x="596" y="250" width="464" height="152" rx="6" fill="${palette.panel}" stroke="${palette.border}"/>
    <text x="620" y="286" fill="${palette.ink}" font-size="18" font-weight="700">Operational Scoring</text>
    ${bar("Patch coverage", record.patchCoverage, 620, 322, palette.green)}
    ${bar("Compliance evidence", record.compliance, 620, 358, palette.blue)}
    ${bar("Readiness score", record.score, 620, 394, color)}
    <text x="48" y="462" fill="${palette.ink}" font-size="18" font-weight="700">Representative Systems</text>
    <rect x="48" y="480" width="1040" height="314" rx="6" fill="${palette.panel}" stroke="${palette.border}"/>
    <text x="58" y="486" fill="${palette.muted}" font-size="11"></text>
    ${rowSvg}
    <text x="48" y="742" fill="${palette.muted}" font-size="12">${COPYRIGHT_SHORT}</text>
  </g>
</svg>`;
}

function scenarioHtml(record) {
  const systems = record.systems
    .map(
      system => `<tr>
        <td>${escapeHtml(system.hostname)}</td>
        <td>${escapeHtml(system.service)}</td>
        <td>${escapeHtml(system.businessUnit)}</td>
        <td>${escapeHtml(system.os)}</td>
        <td>${system.readinessScore}%</td>
        <td>${system.missingPatches}</td>
        <td>${system.rebootAgeDays} days</td>
        <td>${escapeHtml(system.sslRisk)}</td>
      </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BayouOps Demo - ${escapeHtml(record.title)}</title>
<style>
body{margin:0;background:#f6f7f9;color:#172033;font-family:Arial,sans-serif}
main{max-width:1160px;margin:0 auto;padding:36px}
.top{display:flex;justify-content:space-between;gap:24px;align-items:start}
.pill{background:${riskColor(record.riskLevel)};color:#fff;border-radius:999px;padding:8px 16px;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin:28px 0}
.card{background:#fff;border:1px solid #d9e0ea;border-radius:6px;padding:16px}
.label{color:#607089;font-size:13px}.value{font-size:32px;font-weight:700;margin-top:8px}
.summary{background:#fff;border:1px solid #d9e0ea;border-radius:6px;padding:22px;margin-bottom:24px;line-height:1.55}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #d9e0ea;border-radius:6px;overflow:hidden}
th,td{padding:11px 12px;border-bottom:1px solid #e6ebf2;text-align:left;font-size:13px}
th{background:#edf2f7;color:#344054}
footer{color:#607089;font-size:12px;margin-top:24px}
</style>
</head>
<body>
<main>
<section class="top">
<div><h1>BayouOps Suite Pro</h1><p>Enterprise Demo Scenario - ${escapeHtml(record.title)}</p></div>
<div class="pill">${escapeHtml(record.riskLevel)} Risk</div>
</section>
<section class="grid">
<div class="card"><div class="label">Operational Score</div><div class="value">${record.score}%</div></div>
<div class="card"><div class="label">Compliance</div><div class="value">${record.compliance}%</div></div>
<div class="card"><div class="label">Patch Coverage</div><div class="value">${record.patchCoverage}%</div></div>
<div class="card"><div class="label">Stale Systems</div><div class="value">${record.staleSystems}</div></div>
<div class="card"><div class="label">SSL Findings</div><div class="value">${record.sslRisks}</div></div>
</section>
<section class="summary">
<h2>Executive Summary</h2>
<p>${escapeHtml(record.summary)}</p>
<p><strong>IT admin relevance:</strong> ${escapeHtml(record.adminValue)}</p>
<p><strong>Manager/compliance relevance:</strong> ${escapeHtml(record.stakeholderValue)}</p>
</section>
<table>
<thead><tr><th>Host</th><th>Service</th><th>Business Unit</th><th>OS</th><th>Score</th><th>Missing Patches</th><th>Reboot Age</th><th>SSL Risk</th></tr></thead>
<tbody>${systems}</tbody>
</table>
<footer>${COPYRIGHT_FULL}</footer>
</main>
</body>
</html>`;
}

function markdownReport(records) {
  const rows = records
    .map(
      record =>
        `| ${record.title} | ${record.riskLevel} | ${record.score}% | ${record.compliance}% | ${record.patchCoverage}% | ${record.staleSystems} | ${record.unsupportedOs} | ${record.rebootAgeDays} days | ${record.sslRisks} |`
    )
    .join("\n");

  return `# BayouOps Enterprise Demo Pack

Generated: ${GENERATED_AT.toISOString()}

This pack uses deterministic mock/demo data only. It is intended for recruiter, customer, and internal demo screenshots without touching production collectors or application logic.

| Scenario | Risk | Score | Compliance | Patch Coverage | Stale Systems | Unsupported OS | Oldest Reboot | SSL Findings |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${rows}

## Reproduce

\`\`\`bash
node scripts/demo/generate-enterprise-demo-pack.mjs
\`\`\`

${COPYRIGHT_FULL}
`;
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

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function main() {
  ensureDirs();

  const records = scenarios.map(scenarioRecord);
  writeJson(path.join(paths.data, "enterprise-demo-scenarios.json"), records);

  const summaryRows = [
    [
      "scenario",
      "risk_level",
      "operational_score",
      "compliance",
      "patch_coverage",
      "stale_systems",
      "unsupported_os",
      "oldest_reboot_days",
      "ssl_findings"
    ],
    ...records.map(record => [
      record.title,
      record.riskLevel,
      record.score,
      record.compliance,
      record.patchCoverage,
      record.staleSystems,
      record.unsupportedOs,
      record.rebootAgeDays,
      record.sslRisks
    ])
  ];
  writeCsv(path.join(paths.exports, "enterprise-demo-summary.csv"), summaryRows);
  fs.writeFileSync(path.join(paths.exports, "enterprise-demo-report.md"), markdownReport(records));

  for (const record of records) {
    const slug = slugTitle(record);
    const htmlFile = path.join(paths.screenshots, `${slug}.html`);
    const svgFile = path.join(paths.screenshots, `${slug}.svg`);
    const pngFile = path.join(paths.screenshots, `${slug}.png`);
    fs.writeFileSync(htmlFile, scenarioHtml(record));
    fs.writeFileSync(svgFile, scenarioSvg(record));
    convertSvgToPng(svgFile, pngFile);

    const systemRows = [
      [
        "hostname",
        "service",
        "business_unit",
        "os",
        "readiness_score",
        "missing_patches",
        "compliance_state",
        "stale",
        "unsupported_os",
        "reboot_age_days",
        "last_patched_days_ago",
        "ssl_risk",
        "owner"
      ],
      ...record.systems.map(system => [
        system.hostname,
        system.service,
        system.businessUnit,
        system.os,
        system.readinessScore,
        system.missingPatches,
        system.complianceState,
        system.stale,
        system.unsupportedOs,
        system.rebootAgeDays,
        system.lastPatchedDaysAgo,
        system.sslRisk,
        system.owner
      ])
    ];
    writeCsv(path.join(paths.exports, `${slug}-systems.csv`), systemRows);
  }

  copyDir(paths.data, path.join(paths.media, "demo-data"));
  copyDir(paths.screenshots, path.join(paths.media, "screenshots"));
  copyDir(paths.exports, path.join(paths.media, "exports"));

  console.log("");
  console.log("BayouOps enterprise demo pack generated.");
  console.log(`Data        : ${paths.data}`);
  console.log(`Screenshots : ${paths.screenshots}`);
  console.log(`Exports     : ${paths.exports}`);
  console.log(`Media pack  : ${paths.media}`);
  console.log("");
}

main();
