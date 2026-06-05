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
const MAINTENANCE_READINESS_CSV = path.join(EXPORT_DIR, "maintenance-readiness.csv");
const MAINTENANCE_READINESS_SUMMARY = path.join(EXPORT_DIR, "maintenance-readiness-summary.md");
const AUDIT_EVIDENCE_MANIFEST = path.join(EXPORT_DIR, "audit-evidence-manifest.json");

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

function buildReportContext(records) {
  const priorityCounts = countBy(records, "priority");
  const groupCounts = countBy(records, "patchGroup");
  const p1Count = priorityCounts["P1 - Review First"] ?? 0;
  const p2Count = priorityCounts["P2 - Schedule Soon"] ?? 0;
  const unsupportedCount = records.filter(record => record.unsupportedOs).length;
  const pendingRebootCount = records.filter(record => record.rebootPending).length;
  const staleCount = records.filter(record => record.lastPatchedDaysAgo >= 45).length;
  const criticalRiskCount = records.filter(record => String(record.riskState).toLowerCase() === "critical").length;
  const lowReadinessCount = records.filter(record => record.readinessScore > 0 && record.readinessScore < 70).length;
  const immediateReview = records.filter(record => record.priority === "P1 - Review First");
  const nearTermReview = records.filter(record => record.priority === "P2 - Schedule Soon");

  const overallRisk = p1Count > 0 || unsupportedCount > 0 ? "Elevated"
    : p2Count > 0 || staleCount > 0 || pendingRebootCount > 0 ? "Moderate"
    : "Managed";

  const coordinationNotes = [
    `${p1Count} systems should be reviewed first with business owners before any patch window is approved.`,
    `${pendingRebootCount} systems show pending reboot signals and may need restart coordination before patch status is trusted.`,
    `${unsupportedCount} systems show unsupported OS signals and should be handled as lifecycle or exception-management items.`,
    `${staleCount} systems are 45+ days from last patch evidence and should be checked against current maintenance cadence.`
  ];

  const nextActions = [
    "Review P1 systems with service owners and confirm business impact before scheduling maintenance.",
    "Validate pending reboot systems before using patch compliance status for executive reporting.",
    "Separate unsupported OS items from normal patch work and track them through exception or lifecycle planning.",
    "Use the CSV worklist for operator triage, assignment, and maintenance-window discussion."
  ];

  return {
    priorityCounts,
    groupCounts,
    p1Count,
    p2Count,
    unsupportedCount,
    pendingRebootCount,
    staleCount,
    criticalRiskCount,
    lowReadinessCount,
    immediateReview,
    nearTermReview,
    overallRisk,
    coordinationNotes,
    nextActions
  };
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

function maintenanceReadinessStatus(record) {
  if (record.unsupportedOs) return "Exception Review Required";
  if (record.priority === "P1 - Review First") return "Owner Review Required";
  if (record.rebootPending) return "Reboot Coordination Required";
  if (record.lastPatchedDaysAgo >= 45) return "Stale Evidence Review";
  if (record.priority === "P2 - Schedule Soon") return "Schedule Candidate";
  return "Monitor";
}

function maintenanceControlArea(record) {
  if (record.unsupportedOs) return "Unsupported OS Exception";
  if (record.rebootPending) return "Pending Reboot Review";
  if (record.lastPatchedDaysAgo >= 45) return "Patch Evidence Freshness";
  if (record.missingPatches > 0) return "Patch Readiness";
  if (record.readinessScore > 0 && record.readinessScore < 85) return "Readiness Review";
  return "Routine Patch Cadence";
}

function maintenanceExceptionStatus(record) {
  if (record.unsupportedOs) return "Exception review needed";
  if (record.lastPatchedDaysAgo >= 90) return "Potential exception candidate";
  if (record.priority === "P1 - Review First") return "Owner review needed";
  return "No exception signal";
}

function maintenanceApprovalState(record) {
  if (record.unsupportedOs) return "Not ready - lifecycle or exception review";
  if (record.rebootPending) return "Not ready - reboot coordination needed";
  if (record.priority === "P1 - Review First") return "Not ready - owner review needed";
  if (record.priority === "P2 - Schedule Soon") return "Ready for approved scheduling discussion";
  return "Monitor through normal cadence";
}

function maintenanceReviewNotes(record) {
  const notes = [];

  if (record.unsupportedOs) {
    notes.push("Confirm lifecycle support, exception owner, and maintenance path.");
  }

  if (record.rebootPending) {
    notes.push("Validate reboot state before relying on patch evidence.");
  }

  if (record.lastPatchedDaysAgo >= 45) {
    notes.push("Review stale patch evidence against current maintenance cadence.");
  }

  if (record.missingPatches > 0) {
    notes.push(`Review ${record.missingPatches} missing patch signal${record.missingPatches === 1 ? "" : "s"}.`);
  }

  if (record.readinessScore > 0 && record.readinessScore < 85) {
    notes.push(`Readiness score ${record.readinessScore} should be reviewed before approval.`);
  }

  if (notes.length === 0) {
    notes.push("No elevated audit readiness signal from existing evidence.");
  }

  return notes.join(" ");
}

function maintenanceRows(records) {
  return records.map(record => ({
    evidenceStatus: maintenanceReadinessStatus(record),
    controlArea: maintenanceControlArea(record),
    exceptionStatus: maintenanceExceptionStatus(record),
    approvalState: maintenanceApprovalState(record),
    hostname: record.hostname,
    businessUnit: record.businessUnit,
    owner: record.owner,
    service: record.service,
    os: record.os,
    priority: record.priority,
    advisoryScore: record.advisoryScore,
    readinessScore: record.readinessScore,
    riskState: record.riskState,
    missingPatches: record.missingPatches,
    lastPatchedDaysAgo: record.lastPatchedDaysAgo,
    rebootPending: record.rebootPending,
    unsupportedOs: record.unsupportedOs,
    recommendedPatchGroup: record.patchGroup,
    suggestedOperatorAction: record.suggestedAction,
    advisoryFactors: record.advisoryFactors,
    reviewNotes: maintenanceReviewNotes(record),
    source: record.sourceName
  }));
}

function renderMaintenanceReadinessCsv(records) {
  const columns = [
    "EvidenceStatus",
    "ControlArea",
    "ExceptionStatus",
    "ApprovalState",
    "Hostname",
    "BusinessUnit",
    "Owner",
    "Service",
    "OS",
    "Priority",
    "AdvisoryScore",
    "ReadinessScore",
    "RiskState",
    "MissingPatches",
    "LastPatchedDaysAgo",
    "RebootPending",
    "UnsupportedOS",
    "RecommendedPatchGroup",
    "SuggestedOperatorAction",
    "AdvisoryFactors",
    "ReviewNotes",
    "Source"
  ];

  const rows = maintenanceRows(records).map(record => [
    record.evidenceStatus,
    record.controlArea,
    record.exceptionStatus,
    record.approvalState,
    record.hostname,
    record.businessUnit,
    record.owner,
    record.service,
    record.os,
    record.priority,
    record.advisoryScore,
    record.readinessScore,
    record.riskState,
    record.missingPatches,
    record.lastPatchedDaysAgo,
    record.rebootPending,
    record.unsupportedOs,
    record.recommendedPatchGroup,
    record.suggestedOperatorAction,
    record.advisoryFactors,
    record.reviewNotes,
    record.source
  ]);

  return [
    columns.map(escapeCsv).join(","),
    ...rows.map(row => row.map(escapeCsv).join(","))
  ].join("\n") + "\n";
}

function renderMaintenanceReadinessSummary(records, generatedAt, sourceFiles) {
  const context = buildReportContext(records);
  const rows = maintenanceRows(records);
  const evidenceCounts = countBy(rows, "evidenceStatus");
  const controlCounts = countBy(rows, "controlArea");
  const approvalCounts = countBy(rows, "approvalState");
  const exceptionReviewCount = rows.filter(row => row.exceptionStatus !== "No exception signal").length;

  const topItems = rows.slice(0, 12).map(row => (
    `| ${row.evidenceStatus} | ${row.hostname} | ${row.businessUnit} | ${row.controlArea} | ${row.approvalState} | ${row.reviewNotes} |`
  )).join("\n");

  const evidenceLines = Object.entries(evidenceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n");

  const controlLines = Object.entries(controlCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => `- ${area}: ${count}`)
    .join("\n");

  const approvalLines = Object.entries(approvalCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([state, count]) => `- ${state}: ${count}`)
    .join("\n");

  const sources = sourceFiles.map(file => `- ${file}`).join("\n");

  return `# BayouOps Maintenance Readiness Summary

Generated: ${generatedAt.toISOString()}

Operational Advisory Only - Human Approval Required.

This export is read-only. It uses the existing BayouOps patch worklist evidence to organize maintenance readiness, audit review, and exception signals. It does not patch systems, reboot systems, remotely execute commands, modify endpoints, add credentials, add agents, or approve maintenance.

## Readiness Snapshot

- Total systems reviewed: ${records.length}
- Overall advisory posture: ${context.overallRisk} patch coordination risk
- Immediate owner review required: ${context.p1Count}
- Schedule candidates: ${context.p2Count}
- Exception or owner review signals: ${exceptionReviewCount}
- Pending reboot signals: ${context.pendingRebootCount}
- Unsupported OS signals: ${context.unsupportedCount}
- Stale systems 45+ days since patch signal: ${context.staleCount}

## Evidence Status Counts

${evidenceLines}

## Control Area Counts

${controlLines}

## Approval State Counts

${approvalLines}

## Top Maintenance Readiness Items

| Evidence Status | Hostname | Business Unit | Control Area | Approval State | Review Notes |
| --- | --- | --- | --- | --- | --- |
${topItems}

## Suggested Audit Review Actions

- Review systems marked Exception Review Required with the service owner before normal patch planning.
- Validate pending reboot systems before using patch evidence in leadership, CAB, SOX, or audit reporting.
- Separate unsupported OS items from routine maintenance and track them through lifecycle or exception review.
- Use the CSV export as the working evidence register for operator triage and human approval discussions.

## Source Files

${sources}

${COPYRIGHT_FULL}
`;
}

function buildAuditEvidenceManifest(records, generatedAt, sourceFiles) {
  const context = buildReportContext(records);
  const rows = maintenanceRows(records);

  return {
    reportName: "BayouOps Audit Evidence Manifest",
    generatedAt: generatedAt.toISOString(),
    advisoryOnly: true,
    positioning: "Read-only maintenance readiness and audit evidence generated from existing BayouOps worklist data. Human approval is required for all maintenance decisions.",
    safetyBoundaries: [
      "No patch deployment",
      "No reboot",
      "No remote execution",
      "No endpoint modification",
      "No credential collection",
      "No agent installation",
      "No maintenance approval automation"
    ],
    sourceFiles,
    generatedFiles: [
      OUTPUT_CSV,
      OUTPUT_HTML,
      OUTPUT_SUMMARY,
      MAINTENANCE_READINESS_CSV,
      MAINTENANCE_READINESS_SUMMARY,
      AUDIT_EVIDENCE_MANIFEST
    ],
    summary: {
      systemsReviewed: records.length,
      overallRisk: context.overallRisk,
      p1ReviewFirst: context.p1Count,
      p2ScheduleSoon: context.p2Count,
      staleSystems45Days: context.staleCount,
      pendingRebootSignals: context.pendingRebootCount,
      unsupportedOsSignals: context.unsupportedCount,
      criticalRiskStateSignals: context.criticalRiskCount,
      lowReadinessSignals: context.lowReadinessCount,
      exceptionOrOwnerReviewSignals: rows.filter(row => row.exceptionStatus !== "No exception signal").length
    },
    evidenceStatusCounts: countBy(rows, "evidenceStatus"),
    controlAreaCounts: countBy(rows, "controlArea"),
    approvalStateCounts: countBy(rows, "approvalState"),
    sourceRecordCounts: countBy(records, "sourceName")
  };
}

function renderHtml(records, generatedAt, sourceFiles) {
  const context = buildReportContext(records);
  const groupRows = Object.entries(context.groupCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => `
          <tr>
            <td>${escapeHtml(group)}</td>
            <td>${escapeHtml(count)}</td>
          </tr>`)
    .join("");

  const immediateRows = context.immediateReview.slice(0, 12).map(record => `
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

  const topRows = records.slice(0, 40).map(record => `
        <tr>
          <td>${escapeHtml(record.priority)}</td>
          <td>${escapeHtml(record.advisoryScore)}</td>
          <td>${escapeHtml(record.hostname)}</td>
          <td>${escapeHtml(record.businessUnit)}</td>
          <td>${escapeHtml(record.os)}</td>
          <td>${escapeHtml(record.patchGroup)}</td>
          <td>${escapeHtml(record.advisoryFactors)}</td>
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
      --panel-strong: #eef4f3;
      --accent: #12645a;
      --risk: #9f2f24;
      --warn: #85620d;
    }
    body {
      margin: 0;
      color: var(--ink);
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    main {
      max-width: 1220px;
      margin: 0 auto;
      padding: 34px 24px 42px;
    }
    header {
      border-bottom: 3px solid var(--accent);
      padding-bottom: 18px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 32px;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 20px;
      letter-spacing: 0;
    }
    h3 {
      margin: 0 0 8px;
      font-size: 16px;
      letter-spacing: 0;
    }
    section {
      margin-top: 26px;
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
    .snapshot {
      display: grid;
      grid-template-columns: minmax(220px, 0.9fr) minmax(280px, 1.5fr);
      gap: 14px;
      margin-top: 22px;
    }
    .summary-panel {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 16px;
      background: var(--panel-strong);
    }
    .risk-label {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 9px;
      border-radius: 4px;
      background: #ffffff;
      color: var(--risk);
      font-weight: 700;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
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
    .two-column {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr);
      gap: 16px;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 14px 16px;
      background: #ffffff;
    }
    .panel ul {
      margin: 8px 0 0;
      padding-left: 20px;
    }
    .panel li {
      margin: 7px 0;
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
    .compact-table td:first-child {
      font-weight: 700;
    }
    footer {
      margin-top: 28px;
      color: var(--muted);
      font-size: 12px;
    }
    @media (max-width: 760px) {
      .snapshot,
      .two-column {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>BayouOps Patch Worklist</h1>
      <p class="subtle">Generated ${escapeHtml(generatedAt.toISOString())}</p>
      <div class="notice">Operational Advisory Only — Human Approval Required. This report is read-only and does not patch systems, reboot systems, remotely execute commands, or modify endpoints.</div>
    </header>

    <section class="snapshot" aria-label="Environment risk snapshot">
      <div class="summary-panel">
        <h2>Environment Risk Snapshot</h2>
        <p class="subtle">Current advisory posture based on local demo and collector evidence.</p>
        <span class="risk-label">${escapeHtml(context.overallRisk)} patch coordination risk</span>
      </div>
      <div class="metrics">
        <div class="metric"><strong>${records.length}</strong><span>Total systems reviewed</span></div>
        <div class="metric"><strong>${context.p1Count}</strong><span>Immediate review required</span></div>
        <div class="metric"><strong>${context.p2Count}</strong><span>Schedule soon</span></div>
        <div class="metric"><strong>${context.staleCount}</strong><span>Stale patch signals</span></div>
        <div class="metric"><strong>${context.pendingRebootCount}</strong><span>Pending reboot signals</span></div>
        <div class="metric"><strong>${context.unsupportedCount}</strong><span>Unsupported OS signals</span></div>
      </div>
    </section>

    <section class="two-column" aria-label="Operator coordination notes">
      <div class="panel">
        <h2>Recommended Coordination Notes</h2>
        <ul>
          ${context.coordinationNotes.map(note => `<li>${escapeHtml(note)}</li>`).join("\n          ")}
        </ul>
      </div>
      <div class="panel">
        <h2>Operational Risk Indicators</h2>
        <table class="compact-table">
          <tbody>
            <tr><td>Critical risk state</td><td>${escapeHtml(context.criticalRiskCount)}</td></tr>
            <tr><td>Readiness below 70</td><td>${escapeHtml(context.lowReadinessCount)}</td></tr>
            <tr><td>Stale 45+ days</td><td>${escapeHtml(context.staleCount)}</td></tr>
            <tr><td>Pending reboot</td><td>${escapeHtml(context.pendingRebootCount)}</td></tr>
            <tr><td>Unsupported OS</td><td>${escapeHtml(context.unsupportedCount)}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Immediate Review Required</h2>
      <p class="subtle">Highest advisory priority systems for owner review and maintenance coordination. These are not automated actions.</p>
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
        <tbody>${immediateRows}
        </tbody>
      </table>
    </section>

    <section class="two-column" aria-label="Patch groups and next actions">
      <div class="panel">
        <h2>Advisory Patch Groups</h2>
        <table class="compact-table">
          <tbody>${groupRows}
          </tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Suggested Next Actions</h2>
        <ul>
          ${context.nextActions.map(action => `<li>${escapeHtml(action)}</li>`).join("\n          ")}
        </ul>
      </div>
    </section>

    <section>
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
        </tr>
      </thead>
      <tbody>${topRows}
      </tbody>
    </table>
    </section>

    <section class="panel">
      <h2>Source Files</h2>
      <ul>
        ${sourceFiles.map(file => `<li>${escapeHtml(file)}</li>`).join("\n        ")}
      </ul>
    </section>

    <footer>${escapeHtml(COPYRIGHT_FULL)}</footer>
  </main>
</body>
</html>
`;
}

function renderSummary(records, generatedAt, sourceFiles) {
  const context = buildReportContext(records);
  const immediateReview = context.immediateReview.slice(0, 10).map(record => (
    `| ${record.priority} | ${record.advisoryScore} | ${record.hostname} | ${record.businessUnit} | ${record.patchGroup} | ${record.suggestedAction} |`
  )).join("\n");

  const groups = Object.entries(context.groupCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => `- ${group}: ${count}`)
    .join("\n");

  const coordinationNotes = context.coordinationNotes.map(note => `- ${note}`).join("\n");
  const nextActions = context.nextActions.map(action => `- ${action}`).join("\n");
  const sources = sourceFiles.map(file => `- ${file}`).join("\n");

  return `# BayouOps Patch Worklist Summary

Generated: ${generatedAt.toISOString()}

Operational Advisory Only — Human Approval Required.

This export is read-only. It does not patch systems, reboot systems, remotely execute commands, modify endpoints, add credentials, add agents, or introduce control-plane automation.

## Environment Risk Snapshot

- Total systems reviewed: ${records.length}
- Overall advisory posture: ${context.overallRisk} patch coordination risk
- Immediate review required: ${context.p1Count}
- Schedule soon: ${context.p2Count}
- Track: ${context.priorityCounts["P3 - Track"] ?? 0}
- Monitor: ${context.priorityCounts["P4 - Monitor"] ?? 0}

## Immediate Review Required

These systems should be reviewed with service owners before maintenance is approved. This is an advisory worklist only.

| Priority | Score | Hostname | Business Unit | Recommended Patch Group | Suggested Operator Action |
| --- | ---: | --- | --- | --- | --- |
${immediateReview}

## Recommended Coordination Notes

${coordinationNotes}

## Operational Risk Indicators

- Critical risk state signals: ${context.criticalRiskCount}
- Readiness below 70: ${context.lowReadinessCount}
- Unsupported OS signals: ${context.unsupportedCount}
- Pending reboot signals: ${context.pendingRebootCount}
- Stale systems 45+ days since patch signal: ${context.staleCount}

## Advisory Patch Groups

${groups}

## Suggested Next Actions

${nextActions}

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
fs.writeFileSync(MAINTENANCE_READINESS_CSV, renderMaintenanceReadinessCsv(dedupedWorklist));
fs.writeFileSync(MAINTENANCE_READINESS_SUMMARY, renderMaintenanceReadinessSummary(dedupedWorklist, generatedAt, sourceFiles));
fs.writeFileSync(AUDIT_EVIDENCE_MANIFEST, JSON.stringify(buildAuditEvidenceManifest(dedupedWorklist, generatedAt, sourceFiles), null, 2) + "\n");

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
console.log(` Readiness CSV    : ${MAINTENANCE_READINESS_CSV}`);
console.log(` Readiness Summary: ${MAINTENANCE_READINESS_SUMMARY}`);
console.log(` Audit Manifest   : ${AUDIT_EVIDENCE_MANIFEST}`);
console.log(" Advisory Only    : Human approval required; no endpoint actions performed.");
console.log("========================================");
console.log("");
