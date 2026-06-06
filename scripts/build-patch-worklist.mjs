import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
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
const MAINTENANCE_READINESS_DASHBOARD = path.join(EXPORT_DIR, "maintenance-readiness-dashboard.html");
const AUDIT_EVIDENCE_MANIFEST = path.join(EXPORT_DIR, "audit-evidence-manifest.json");
const SCREENSHOT_DIR = "./screenshots/2026-06-05";
const MAINTENANCE_READINESS_SCREENSHOT_SVG = path.join(SCREENSHOT_DIR, "maintenance-readiness-dashboard.svg");
const MAINTENANCE_READINESS_SCREENSHOT_PNG = path.join(SCREENSHOT_DIR, "maintenance-readiness-dashboard.png");
const MAINTENANCE_READINESS_MOBILE_SCREENSHOT_SVG = path.join(SCREENSHOT_DIR, "maintenance-readiness-dashboard-mobile.svg");
const MAINTENANCE_READINESS_MOBILE_SCREENSHOT_PNG = path.join(SCREENSHOT_DIR, "maintenance-readiness-dashboard-mobile.png");

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

function buildMaintenanceDashboardContext(records) {
  const rows = maintenanceRows(records);
  const readyForMaintenance = rows.filter(row =>
    row.approvalState === "Monitor through normal cadence" ||
    row.approvalState === "Ready for approved scheduling discussion"
  ).length;
  const rebootCoordinationRequired = rows.filter(row =>
    row.approvalState === "Not ready - reboot coordination needed"
  ).length;
  const ownerReviewRequired = rows.filter(row =>
    row.approvalState === "Not ready - owner review needed"
  ).length;
  const lifecycleReviewRequired = rows.filter(row =>
    row.approvalState === "Not ready - lifecycle or exception review"
  ).length;
  const blockerCount = rebootCoordinationRequired + ownerReviewRequired + lifecycleReviewRequired;
  const overallStatus = blockerCount > 0 ? "Not Fully Ready" : "Ready for Maintenance";
  const statusTone = blockerCount > 0 ? "elevated" : "ready";
  const readinessPercent = rows.length > 0 ? Math.round((readyForMaintenance / rows.length) * 100) : 0;
  const readinessScore = readinessPercent;
  const trendLabel = blockerCount > 0 ? "Pre-window readiness pressure" : "Ready posture";
  const trendSummary = blockerCount > 0
    ? `${blockerCount} systems need coordination, owner review, or lifecycle handling before the patch window is fully ready.`
    : "No readiness blockers were identified in the current evidence set.";

  return {
    rows,
    systemsReviewed: rows.length,
    readyForMaintenance,
    readinessPercent,
    readinessScore,
    rebootCoordinationRequired,
    ownerReviewRequired,
    lifecycleReviewRequired,
    blockerCount,
    overallStatus,
    statusTone,
    trendLabel,
    trendSummary,
    topItems: rows.filter(row => row.approvalState !== "Monitor through normal cadence").slice(0, 10)
  };
}

function pieSlicePath(cx, cy, radius, startAngle, endAngle) {
  const startRadians = (startAngle - 90) * Math.PI / 180;
  const endRadians = (endAngle - 90) * Math.PI / 180;
  const startX = cx + radius * Math.cos(startRadians);
  const startY = cy + radius * Math.sin(startRadians);
  const endX = cx + radius * Math.cos(endRadians);
  const endY = cy + radius * Math.sin(endRadians);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${startX.toFixed(2)} ${startY.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${endX.toFixed(2)} ${endY.toFixed(2)} Z`;
}

function readinessPieSegments(context) {
  return [
    { label: "Ready", value: context.readyForMaintenance, color: "#12645a" },
    { label: "Reboot", value: context.rebootCoordinationRequired, color: "#9a650f" },
    { label: "Owner", value: context.ownerReviewRequired, color: "#256f91" },
    { label: "Lifecycle", value: context.lifecycleReviewRequired, color: "#9f2f24" }
  ];
}

function renderReadinessPieChart(context, size = 220) {
  const radius = Math.floor(size * 0.36);
  const center = Math.floor(size / 2);
  const total = Math.max(context.systemsReviewed, 1);
  let angle = 0;

  const slices = readinessPieSegments(context).map(segment => {
    const span = segment.value / total * 360;
    const pathData = pieSlicePath(center, center, radius, angle, angle + span);
    angle += span;
    return `<path d="${pathData}" fill="${segment.color}"></path>`;
  }).join("\n              ");

  const legend = readinessPieSegments(context).map(segment => `
              <span class="legend-item"><span style="background:${segment.color}"></span>${escapeHtml(segment.label)} ${segment.value}</span>`).join("");

  return `
            <div class="pie-wrap">
              <svg class="pie-chart" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Maintenance readiness category pie chart">
                ${slices}
                <circle cx="${center}" cy="${center}" r="${Math.floor(radius * 0.52)}" fill="#ffffff"></circle>
                <text x="${center}" y="${center - 2}" text-anchor="middle" fill="#17212f" font-size="28" font-weight="800">${context.readinessPercent}%</text>
                <text x="${center}" y="${center + 20}" text-anchor="middle" fill="#64748b" font-size="12" font-weight="700">ready</text>
              </svg>
              <div class="legend">${legend}
              </div>
            </div>`;
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

function renderMaintenanceReadinessDashboard(records, generatedAt, sourceFiles) {
  const context = buildMaintenanceDashboardContext(records);
  const sourceRows = sourceFiles.map(file => `<li>${escapeHtml(file)}</li>`).join("\n            ");
  const pieChart = renderReadinessPieChart(context);
  const topRows = context.topItems.map(row => `
              <tr>
                <td>${escapeHtml(row.hostname)}</td>
                <td>${escapeHtml(row.businessUnit)}</td>
                <td>${escapeHtml(row.controlArea)}</td>
                <td>${escapeHtml(row.approvalState)}</td>
                <td>${escapeHtml(row.reviewNotes)}</td>
              </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BayouOps Maintenance Readiness Dashboard</title>
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
    * {
      box-sizing: border-box;
    }
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
    h1,
    h2,
    p {
      margin-top: 0;
    }
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
    .subtle {
      color: var(--muted);
    }
    .status-badge {
      min-width: 190px;
      border-radius: 6px;
      padding: 14px 16px;
      background: ${context.statusTone === "ready" ? "var(--teal)" : "var(--red)"};
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
    .card.ready strong {
      color: var(--teal);
    }
    .card.warn strong {
      color: var(--amber);
    }
    .card.risk strong {
      color: var(--red);
    }
    .card.status-card strong {
      font-size: 24px;
      line-height: 1.08;
    }
    .panel {
      margin-top: 22px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 18px;
      background: var(--panel);
    }
    .insight-grid {
      display: grid;
      grid-template-columns: minmax(320px, 0.76fr) minmax(0, 1.24fr);
      gap: 16px;
      margin-top: 22px;
    }
    .pie-wrap {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 18px;
      align-items: center;
    }
    .pie-chart {
      display: block;
    }
    .legend {
      display: grid;
      gap: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 9px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
    }
    .legend-item span {
      width: 12px;
      height: 12px;
      display: inline-block;
      border-radius: 3px;
    }
    .trend-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .trend-item {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      background: #f8fafc;
    }
    .trend-item strong {
      display: block;
      margin-bottom: 6px;
      font-size: 20px;
    }
    .trend-item span {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }
    .two-column {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
      gap: 16px;
      margin-top: 22px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th,
    td {
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
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    footer {
      margin-top: 24px;
      color: var(--muted);
      font-size: 12px;
    }
    @media (max-width: 980px) {
      header,
      .insight-grid,
      .two-column {
        grid-template-columns: 1fr;
      }
      .cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 620px) {
      main {
        padding: 22px 14px 34px;
      }
      h1 {
        font-size: 28px;
      }
      .status-badge {
        width: 100%;
        min-width: 0;
      }
      .export-actions a {
        flex: 1 1 150px;
      }
      .cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .card {
        min-height: 104px;
        padding: 13px;
      }
      .card strong {
        font-size: 27px;
      }
      .card span {
        font-size: 12px;
      }
      .card.status-card strong {
        font-size: 20px;
      }
      .pie-wrap,
      .trend-list {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 340px) {
      .cards {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand-line">BayouOps Suite Pro</div>
        <h1>Maintenance Readiness Dashboard</h1>
        <p class="subtle">Generated ${escapeHtml(generatedAt.toISOString())}. Read-only evidence for patch weekend preparation, CAB discussion, and audit review.</p>
        <p class="notice">Operational Advisory Only - Human Approval Required. This dashboard does not patch systems, reboot systems, remotely execute commands, modify endpoints, or approve maintenance.</p>
        <nav class="export-actions" aria-label="Read-only report exports">
          <a href="maintenance-readiness.csv" download>Export CSV</a>
          <a href="maintenance-readiness-summary.md" download>Export Summary</a>
          <a href="audit-evidence-manifest.json" download>Export Audit Manifest</a>
        </nav>
      </div>
      <div class="status-badge">${escapeHtml(context.overallStatus)}<span>Overall Status</span></div>
    </header>

    <section class="cards" aria-label="Executive maintenance readiness summary">
      <div class="card"><strong>${context.systemsReviewed}</strong><span>Systems Reviewed</span></div>
      <div class="card ready"><strong>${context.readinessScore}</strong><span>Readiness Score</span></div>
      <div class="card ready"><strong>${context.readinessPercent}%</strong><span>Readiness Percentage</span></div>
      <div class="card ready"><strong>${context.readyForMaintenance}</strong><span>Ready for Maintenance</span></div>
      <div class="card warn"><strong>${context.rebootCoordinationRequired}</strong><span>Reboot Coordination Required</span></div>
      <div class="card warn"><strong>${context.ownerReviewRequired}</strong><span>Owner Review Required</span></div>
      <div class="card risk"><strong>${context.lifecycleReviewRequired}</strong><span>Lifecycle Review Required</span></div>
      <div class="card risk status-card"><strong>${escapeHtml(context.overallStatus)}</strong><span>Overall Status</span></div>
    </section>

    <section class="insight-grid">
      <div class="panel">
        <h2>Readiness Categories</h2>
        ${pieChart}
      </div>
      <div class="panel">
        <h2>Readiness Trend</h2>
        <p class="subtle">${escapeHtml(context.trendLabel)}. ${escapeHtml(context.trendSummary)}</p>
        <div class="trend-list">
          <div class="trend-item"><strong>${context.readyForMaintenance}</strong><span>Ready or normal cadence</span></div>
          <div class="trend-item"><strong>${context.blockerCount}</strong><span>Total coordination blockers</span></div>
          <div class="trend-item"><strong>${context.readinessPercent}%</strong><span>Current readiness percentage</span></div>
        </div>
      </div>
    </section>

    <section class="two-column">
      <div class="panel">
        <h2>Patch Weekend Preparation View</h2>
        <table>
          <thead>
            <tr>
              <th>Host</th>
              <th>Business Unit</th>
              <th>Control Area</th>
              <th>Approval State</th>
              <th>Review Notes</th>
            </tr>
          </thead>
          <tbody>${topRows}
          </tbody>
        </table>
      </div>
      <aside class="panel">
        <h2>Manager Use</h2>
        <ul>
          <li>Confirm which systems can enter the maintenance schedule.</li>
          <li>Assign reboot coordination before patch status is trusted.</li>
          <li>Route owner-review and lifecycle items outside routine patching.</li>
          <li>Retain generated evidence for CAB, SOX, audit, or leadership review.</li>
        </ul>
      </aside>
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

function renderMaintenanceReadinessScreenshotSvg(records, generatedAt) {
  const context = buildMaintenanceDashboardContext(records);
  const cardData = [
    ["Systems Reviewed", context.systemsReviewed, "#17212f"],
    ["Readiness Score", context.readinessScore, "#12645a"],
    ["Readiness Percentage", `${context.readinessPercent}%`, "#12645a"],
    ["Ready for Maintenance", context.readyForMaintenance, "#12645a"],
    ["Reboot Coordination Required", context.rebootCoordinationRequired, "#9a650f"],
    ["Owner Review Required", context.ownerReviewRequired, "#9a650f"],
    ["Lifecycle Review Required", context.lifecycleReviewRequired, "#9f2f24"],
    ["Overall Status", context.overallStatus, "#9f2f24"]
  ];

  const cards = cardData.map(([label, value, color], index) => {
    const x = 48 + (index % 4) * 282;
    const y = 164 + Math.floor(index / 4) * 122;
    const valueText = String(value);
    const valueSize = valueText.length > 8 ? 28 : 44;
    return `
      <rect x="${x}" y="${y}" width="250" height="96" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
      <text x="${x + 22}" y="${y + 46}" fill="${color}" font-size="${valueSize}" font-weight="700">${escapeHtml(valueText)}</text>
      <text x="${x + 22}" y="${y + 78}" fill="#64748b" font-size="15" font-weight="700">${escapeHtml(label)}</text>`;
  }).join("");

  const rows = context.topItems.slice(0, 4).map((row, index) => {
    const y = 688 + index * 38;
    return `
      <text x="72" y="${y}" fill="#17212f" font-size="14" font-weight="700">${escapeHtml(row.hostname)}</text>
      <text x="230" y="${y}" fill="#475569" font-size="13">${escapeHtml(row.businessUnit)}</text>
      <text x="390" y="${y}" fill="#475569" font-size="13">${escapeHtml(row.controlArea)}</text>
      <text x="642" y="${y}" fill="#9f2f24" font-size="13" font-weight="700">${escapeHtml(row.approvalState)}</text>`;
  }).join("");

  let pieAngle = 0;
  const pieSlices = readinessPieSegments(context).map(segment => {
    const span = segment.value / Math.max(context.systemsReviewed, 1) * 360;
    const d = pieSlicePath(176, 522, 52, pieAngle, pieAngle + span);
    pieAngle += span;
    return `<path d="${d}" fill="${segment.color}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="#f5f7fa"/>
  <rect x="0" y="0" width="1200" height="126" fill="#17212f"/>
  <text x="48" y="38" fill="#1fb6a6" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">BAYOUOPS SUITE PRO</text>
  <text x="48" y="72" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">Maintenance Readiness Dashboard</text>
  <text x="48" y="100" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="15">Read-only evidence for patch weekend preparation - generated ${escapeHtml(generatedAt.toISOString())}</text>
  <rect x="930" y="34" width="220" height="48" rx="8" fill="${context.statusTone === "ready" ? "#12645a" : "#9f2f24"}"/>
  <text x="1040" y="64" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="700">${escapeHtml(context.overallStatus)}</text>
  <g font-family="Arial, sans-serif">
    ${cards}
    <rect x="48" y="420" width="360" height="190" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="72" y="456" fill="#17212f" font-size="20" font-weight="700">Readiness Categories</text>
    ${pieSlices}
    <circle cx="176" cy="522" r="30" fill="#ffffff"/>
    <text x="176" y="518" text-anchor="middle" fill="#17212f" font-size="22" font-weight="800">${context.readinessPercent}%</text>
    <text x="176" y="536" text-anchor="middle" fill="#64748b" font-size="10" font-weight="700">ready</text>
    <text x="270" y="500" fill="#12645a" font-size="13" font-weight="700">Ready ${context.readyForMaintenance}</text>
    <text x="270" y="524" fill="#9a650f" font-size="13" font-weight="700">Reboot ${context.rebootCoordinationRequired}</text>
    <text x="270" y="548" fill="#256f91" font-size="13" font-weight="700">Owner ${context.ownerReviewRequired}</text>
    <text x="270" y="572" fill="#9f2f24" font-size="13" font-weight="700">Lifecycle ${context.lifecycleReviewRequired}</text>
    <rect x="424" y="420" width="728" height="190" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="448" y="456" fill="#17212f" font-size="20" font-weight="700">Readiness Trend</text>
    <text x="448" y="486" fill="#475569" font-size="14">${escapeHtml(context.trendLabel)}</text>
    <text x="448" y="514" fill="#64748b" font-size="13">${escapeHtml(context.trendSummary)}</text>
    <rect x="448" y="536" width="190" height="40" rx="6" fill="#f8fafc" stroke="#d9e0e8"/>
    <text x="468" y="561" fill="#12645a" font-size="20" font-weight="800">${context.readyForMaintenance}</text>
    <text x="522" y="561" fill="#64748b" font-size="12" font-weight="700">ready</text>
    <rect x="660" y="536" width="190" height="40" rx="6" fill="#f8fafc" stroke="#d9e0e8"/>
    <text x="680" y="561" fill="#9f2f24" font-size="20" font-weight="800">${context.blockerCount}</text>
    <text x="736" y="561" fill="#64748b" font-size="12" font-weight="700">blockers</text>
    <rect x="872" y="536" width="190" height="40" rx="6" fill="#f8fafc" stroke="#d9e0e8"/>
    <text x="892" y="561" fill="#12645a" font-size="20" font-weight="800">${context.readinessScore}</text>
    <text x="948" y="561" fill="#64748b" font-size="12" font-weight="700">score</text>
    <rect x="48" y="626" width="1104" height="256" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="72" y="660" fill="#17212f" font-size="21" font-weight="700">Top Patch Weekend Review Items</text>
    ${rows}
    <text x="72" y="850" fill="#64748b" font-size="13">Operational Advisory Only - Human Approval Required. No patching, rebooting, remote execution, or endpoint modification.</text>
    <text x="48" y="892" fill="#64748b" font-size="12">${escapeHtml(COPYRIGHT_FULL)}</text>
  </g>
</svg>`;
}

function renderMaintenanceReadinessMobileScreenshotSvg(records, generatedAt) {
  const context = buildMaintenanceDashboardContext(records);
  const cardData = [
    ["Systems Reviewed", context.systemsReviewed, "#17212f"],
    ["Readiness Score", context.readinessScore, "#12645a"],
    ["Readiness Percentage", `${context.readinessPercent}%`, "#12645a"],
    ["Ready for Maintenance", context.readyForMaintenance, "#12645a"],
    ["Reboot Coordination", context.rebootCoordinationRequired, "#9a650f"],
    ["Owner Review", context.ownerReviewRequired, "#9a650f"],
    ["Lifecycle Review", context.lifecycleReviewRequired, "#9f2f24"],
    ["Overall Status", context.overallStatus, "#9f2f24"]
  ];

  const cards = cardData.map(([label, value, color], index) => {
    const x = 16 + (index % 2) * 181;
    const y = 202 + Math.floor(index / 2) * 104;
    const valueText = String(value);
    const valueSize = valueText.length > 8 ? 20 : 30;
    return `
      <rect x="${x}" y="${y}" width="165" height="88" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
      <text x="${x + 13}" y="${y + 40}" fill="${color}" font-size="${valueSize}" font-weight="700">${escapeHtml(valueText)}</text>
      <text x="${x + 13}" y="${y + 66}" fill="#64748b" font-size="11" font-weight="700">${escapeHtml(label)}</text>`;
  }).join("");

  let pieAngle = 0;
  const pieSlices = readinessPieSegments(context).map(segment => {
    const span = segment.value / Math.max(context.systemsReviewed, 1) * 360;
    const d = pieSlicePath(88, 735, 46, pieAngle, pieAngle + span);
    pieAngle += span;
    return `<path d="${d}" fill="${segment.color}"/>`;
  }).join("");

  const rows = context.topItems.slice(0, 3).map((row, index) => {
    const y = 1038 + index * 54;
    return `
      <text x="28" y="${y}" fill="#17212f" font-size="13" font-weight="700">${escapeHtml(row.hostname)}</text>
      <text x="28" y="${y + 20}" fill="#475569" font-size="11">${escapeHtml(row.businessUnit)} | ${escapeHtml(row.controlArea)}</text>
      <text x="28" y="${y + 38}" fill="#9f2f24" font-size="11" font-weight="700">${escapeHtml(row.approvalState)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="1280" viewBox="0 0 390 1280">
  <rect width="390" height="1280" fill="#f5f7fa"/>
  <rect x="0" y="0" width="390" height="178" fill="#17212f"/>
  <text x="16" y="34" fill="#1fb6a6" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">BAYOUOPS SUITE PRO</text>
  <text x="16" y="68" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="700">Maintenance</text>
  <text x="16" y="100" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="700">Readiness Dashboard</text>
  <text x="16" y="126" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="12">Read-only patch weekend evidence</text>
  <rect x="16" y="142" width="180" height="36" rx="7" fill="${context.statusTone === "ready" ? "#12645a" : "#9f2f24"}"/>
  <text x="106" y="165" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" font-weight="700">${escapeHtml(context.overallStatus)}</text>
  <g font-family="Arial, sans-serif">
    ${cards}
    <rect x="16" y="630" width="358" height="224" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="28" y="656" fill="#17212f" font-size="18" font-weight="700">Readiness Categories</text>
    ${pieSlices}
    <circle cx="88" cy="735" r="26" fill="#ffffff"/>
    <text x="88" y="733" text-anchor="middle" fill="#17212f" font-size="19" font-weight="800">${context.readinessPercent}%</text>
    <text x="88" y="749" text-anchor="middle" fill="#64748b" font-size="9" font-weight="700">ready</text>
    <text x="158" y="716" fill="#12645a" font-size="12" font-weight="700">Ready ${context.readyForMaintenance}</text>
    <text x="158" y="740" fill="#9a650f" font-size="12" font-weight="700">Reboot ${context.rebootCoordinationRequired}</text>
    <text x="158" y="764" fill="#256f91" font-size="12" font-weight="700">Owner ${context.ownerReviewRequired}</text>
    <text x="158" y="788" fill="#9f2f24" font-size="12" font-weight="700">Lifecycle ${context.lifecycleReviewRequired}</text>
    <rect x="16" y="870" width="358" height="84" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="28" y="902" fill="#17212f" font-size="18" font-weight="700">Readiness Trend</text>
    <text x="28" y="928" fill="#64748b" font-size="11">${escapeHtml(context.blockerCount)} blockers | ${context.readyForMaintenance} ready | score ${context.readinessScore}</text>
    <rect x="16" y="970" width="358" height="262" rx="8" fill="#ffffff" stroke="#d9e0e8"/>
    <text x="28" y="1002" fill="#17212f" font-size="18" font-weight="700">Top Review Items</text>
    ${rows}
    <text x="16" y="1250" fill="#64748b" font-size="10">Operational Advisory Only - Human Approval Required.</text>
    <text x="16" y="1268" fill="#64748b" font-size="9">${escapeHtml(COPYRIGHT_FULL)}</text>
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

function buildAuditEvidenceManifest(records, generatedAt, sourceFiles) {
  const context = buildReportContext(records);
  const rows = maintenanceRows(records);
  const dashboardContext = buildMaintenanceDashboardContext(records);

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
      MAINTENANCE_READINESS_DASHBOARD,
      AUDIT_EVIDENCE_MANIFEST,
      MAINTENANCE_READINESS_SCREENSHOT_SVG,
      MAINTENANCE_READINESS_SCREENSHOT_PNG,
      MAINTENANCE_READINESS_MOBILE_SCREENSHOT_SVG,
      MAINTENANCE_READINESS_MOBILE_SCREENSHOT_PNG
    ],
    summary: {
      systemsReviewed: records.length,
      overallRisk: context.overallRisk,
      maintenanceOverallStatus: dashboardContext.overallStatus,
      readinessScore: dashboardContext.readinessScore,
      readinessPercent: dashboardContext.readinessPercent,
      readyForMaintenance: dashboardContext.readyForMaintenance,
      maintenanceBlockers: dashboardContext.blockerCount,
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
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_CSV, renderCsv(dedupedWorklist));
fs.writeFileSync(OUTPUT_HTML, renderHtml(dedupedWorklist, generatedAt, sourceFiles));
fs.writeFileSync(OUTPUT_SUMMARY, renderSummary(dedupedWorklist, generatedAt, sourceFiles));
fs.writeFileSync(MAINTENANCE_READINESS_CSV, renderMaintenanceReadinessCsv(dedupedWorklist));
fs.writeFileSync(MAINTENANCE_READINESS_SUMMARY, renderMaintenanceReadinessSummary(dedupedWorklist, generatedAt, sourceFiles));
fs.writeFileSync(MAINTENANCE_READINESS_DASHBOARD, renderMaintenanceReadinessDashboard(dedupedWorklist, generatedAt, sourceFiles));
fs.writeFileSync(MAINTENANCE_READINESS_SCREENSHOT_SVG, renderMaintenanceReadinessScreenshotSvg(dedupedWorklist, generatedAt));
fs.writeFileSync(MAINTENANCE_READINESS_MOBILE_SCREENSHOT_SVG, renderMaintenanceReadinessMobileScreenshotSvg(dedupedWorklist, generatedAt));
fs.writeFileSync(AUDIT_EVIDENCE_MANIFEST, JSON.stringify(buildAuditEvidenceManifest(dedupedWorklist, generatedAt, sourceFiles), null, 2) + "\n");
const screenshotPngCreated = convertSvgToPng(MAINTENANCE_READINESS_SCREENSHOT_SVG, MAINTENANCE_READINESS_SCREENSHOT_PNG);
const mobileScreenshotPngCreated = convertSvgToPng(MAINTENANCE_READINESS_MOBILE_SCREENSHOT_SVG, MAINTENANCE_READINESS_MOBILE_SCREENSHOT_PNG);

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
console.log(` Readiness HTML   : ${MAINTENANCE_READINESS_DASHBOARD}`);
console.log(` Audit Manifest   : ${AUDIT_EVIDENCE_MANIFEST}`);
console.log(` Screenshot SVG   : ${MAINTENANCE_READINESS_SCREENSHOT_SVG}`);
console.log(` Screenshot PNG   : ${screenshotPngCreated ? MAINTENANCE_READINESS_SCREENSHOT_PNG : "PNG conversion unavailable"}`);
console.log(` Mobile SVG       : ${MAINTENANCE_READINESS_MOBILE_SCREENSHOT_SVG}`);
console.log(` Mobile PNG       : ${mobileScreenshotPngCreated ? MAINTENANCE_READINESS_MOBILE_SCREENSHOT_PNG : "PNG conversion unavailable"}`);
console.log(" Advisory Only    : Human approval required; no endpoint actions performed.");
console.log("========================================");
console.log("");
