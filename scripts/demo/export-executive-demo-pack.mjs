import fs from "fs";
import path from "path";

const DASHBOARD_FILE = "./screenshots/demo/executive-dashboard.html";
const GENERATED_DIR = "./demo-data/generated";
const EXPORT_ROOT = "./exports/demo";

function fail(message) {
  console.error("");
  console.error("BayouOps executive demo export failed.");
  console.error(`Error: ${message}`);
  console.error("");
  process.exit(1);
}

function formatTimestamp(date) {
  return date.toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
}

function findLatestDataset() {
  if (!fs.existsSync(GENERATED_DIR)) {
    fail(`Generated dataset directory is missing: ${GENERATED_DIR}`);
  }

  const latest = fs
    .readdirSync(GENERATED_DIR)
    .filter(file => file.endsWith(".json"))
    .map(file => {
      const fullPath = path.join(GENERATED_DIR, file);
      return {
        file,
        fullPath,
        modifiedAt: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)[0];

  if (!latest) {
    fail(`Generated dataset is missing. Expected at least one JSON file under ${GENERATED_DIR}`);
  }

  return latest;
}

if (!fs.existsSync(DASHBOARD_FILE)) {
  fail(`Dashboard HTML is missing: ${DASHBOARD_FILE}. Run node scripts/demo/render-demo-dashboard.mjs first.`);
}

const generatedAt = new Date();
const timestamp = formatTimestamp(generatedAt);
const latestDataset = findLatestDataset();
const exportDir = path.join(EXPORT_ROOT, `executive-demo-${timestamp}`);

fs.mkdirSync(exportDir, { recursive: true });

const dashboardExport = path.join(exportDir, "executive-dashboard.html");
const datasetExport = path.join(exportDir, latestDataset.file);
const summaryExport = path.join(exportDir, "SUMMARY.md");
const metadataExport = path.join(exportDir, "metadata.json");

fs.copyFileSync(DASHBOARD_FILE, dashboardExport);
fs.copyFileSync(latestDataset.fullPath, datasetExport);

const includedFiles = [
  path.basename(dashboardExport),
  path.basename(datasetExport),
  path.basename(summaryExport),
  path.basename(metadataExport)
];

const summary = `# BayouOps Executive Demo Export

Generated: ${generatedAt.toISOString()}

This local export pack contains the current executive dashboard HTML and the latest generated demo JSON dataset used by the dashboard renderer.

## Included Files

- executive-dashboard.html
- ${latestDataset.file}
- SUMMARY.md
- metadata.json

## Open Locally

Open executive-dashboard.html in a browser to review or share the static executive dashboard.
`;

const metadata = {
  name: "BayouOps Executive Demo Export",
  generatedAt: generatedAt.toISOString(),
  exportPath: exportDir,
  sourceFiles: {
    dashboard: DASHBOARD_FILE,
    dataset: latestDataset.fullPath
  },
  includedFiles
};

fs.writeFileSync(summaryExport, summary);
fs.writeFileSync(metadataExport, `${JSON.stringify(metadata, null, 2)}\n`);

console.log("");
console.log("========================================");
console.log(" BayouOps Executive Demo Pack Exported");
console.log("========================================");
console.log(` Export Path       : ${exportDir}`);
console.log(` Dashboard         : ${dashboardExport}`);
console.log(` Dataset           : ${datasetExport}`);
console.log(` Metadata          : ${metadataExport}`);
console.log(" Next Suggested Action: Open executive-dashboard.html from the export folder and share or archive the folder.");
console.log("========================================");
console.log("");
