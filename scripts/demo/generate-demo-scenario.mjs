import fs from "fs";
import path from "path";
import {
  loadLinesOfBusinessConfig,
  printLobConfigWarnings
} from "./lob-config.mjs";

const OUTPUT_DIR = "./demo-data/generated";
const lobConfig = loadLinesOfBusinessConfig();

printLobConfigWarnings(lobConfig);

const serverRoles = [
  "WEB",
  "SQL",
  "APP",
  "FILE",
  "DC",
  "NOC",
  "API",
  "EDGE"
];

const riskStates = [
  "Healthy",
  "Warning",
  "Critical"
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomScore(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createServer(index) {
  const risk = rand(riskStates);

  let score = 95;

  if (risk === "Warning") score = randomScore(70, 89);
  if (risk === "Critical") score = randomScore(35, 69);

  return {
    hostname: `BAYOU-${rand(serverRoles)}-${String(index).padStart(3, "0")}`,
    businessUnit: rand(lobConfig.linesOfBusiness),
    role: rand(serverRoles),
    os: "Windows Server 2022",
    readinessScore: score,
    riskState: risk,
    missingPatches:
      risk === "Healthy"
        ? randomScore(0, 2)
        : risk === "Warning"
        ? randomScore(3, 9)
        : randomScore(10, 30),
    rebootPending: Math.random() > 0.7,
    lastPatchedDaysAgo:
      risk === "Healthy"
        ? randomScore(1, 14)
        : risk === "Warning"
        ? randomScore(15, 45)
        : randomScore(46, 180),
    sqlFailoverProtected: Math.random() > 0.5,
    exposureLevel:
      risk === "Healthy"
        ? "Low"
        : risk === "Warning"
        ? "Medium"
        : "High"
  };
}

const dataset = [];

for (let i = 1; i <= 120; i++) {
  dataset.push(createServer(i));
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const outputFile = path.join(
  OUTPUT_DIR,
  `bayouops-demo-${Date.now()}.json`
);

fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2));

console.log("");
console.log("========================================");
console.log(" BayouOps Demo Scenario Generated");
console.log("========================================");
console.log(` Servers Generated : ${dataset.length}`);
console.log(` LOB Config        : ${lobConfig.configPath}`);
console.log(` LOB Names         : ${lobConfig.linesOfBusiness.join(", ")}`);
console.log(` Output File       : ${outputFile}`);
console.log("========================================");
console.log("");
