import crypto from "crypto";
import fs from "fs";
import path from "path";

const PRODUCT = "BayouOps Suite Pro";
const SUPPORT_EMAIL = "support@bayoufinds.com";
const ISSUED_BY = "BayouFinds / Dewayne Cox";
const OUTPUT_DIR = "./private/licenses";

function printUsage() {
  console.log(`
BayouOps offline license generator

Usage:
  node scripts/license/generate-license.mjs --licensed-to "Customer Name" --email customer@example.com [options]

Options:
  --licensed-to  Customer or organization name. Required.
  --email        Customer email address. Required.
  --edition      License edition. Default: Professional.
  --expires-on   Expiration date in YYYY-MM-DD format. Default: one year from issue date.
  --notes        Optional seller notes included in the license JSON.
  --help         Show this help text.
`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.trim();

    if (key === "help") {
      args.help = true;
      continue;
    }

    const value = inlineValue ?? argv[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value.trim();

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return args;
}

function requireArg(args, key, label) {
  const value = args[key];

  if (!value) {
    throw new Error(`${label} is required. Pass --${key} "value".`);
  }

  return value;
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function defaultExpiration(issuedOn) {
  const expiresOn = new Date(issuedOn);
  expiresOn.setUTCFullYear(expiresOn.getUTCFullYear() + 1);
  return toDateOnly(expiresOn);
}

function assertDateOnly(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime()) || toDateOnly(date) !== value) {
    throw new Error(`${label} is not a valid calendar date.`);
  }

  return value;
}

function generateLicenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const groups = [];

  for (let groupIndex = 0; groupIndex < 4; groupIndex += 1) {
    let group = "";
    const bytes = crypto.randomBytes(4);

    for (const byte of bytes) {
      group += alphabet[byte % alphabet.length];
    }

    groups.push(group);
  }

  return `BAYOUOPS-${groups.join("-")}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "customer";
}

function writeLicense(license) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputFile = path.join(
    OUTPUT_DIR,
    `${license.issuedOn}-${slugify(license.licensedTo)}-license.json`
  );

  fs.writeFileSync(outputFile, `${JSON.stringify(license, null, 2)}\n`);

  return outputFile;
}

try {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const issuedOn = toDateOnly(new Date());
  const expiresOn = assertDateOnly(
    args["expires-on"] || defaultExpiration(new Date(`${issuedOn}T00:00:00Z`)),
    "expiresOn"
  );

  const license = {
    product: PRODUCT,
    licensedTo: requireArg(args, "licensed-to", "licensedTo"),
    customerEmail: requireArg(args, "email", "customerEmail"),
    licenseKey: generateLicenseKey(),
    edition: args.edition || "Professional",
    issuedOn,
    expiresOn,
    supportEmail: SUPPORT_EMAIL,
    issuedBy: ISSUED_BY,
    notes: args.notes || "Generated offline by BayouFinds for manual customer delivery."
  };

  const outputFile = writeLicense(license);

  console.log("");
  console.log("========================================");
  console.log(" BayouOps Offline License Generated");
  console.log("========================================");
  console.log(` Customer      : ${license.licensedTo}`);
  console.log(` Email         : ${license.customerEmail}`);
  console.log(` Edition       : ${license.edition}`);
  console.log(` Expires On    : ${license.expiresOn}`);
  console.log(` License Key   : ${license.licenseKey}`);
  console.log(` Output File   : ${outputFile}`);
  console.log(" Delivery Note : Manually send this license.json to the customer. Do not commit private/licenses/.");
  console.log("========================================");
  console.log("");
} catch (error) {
  console.error("");
  console.error("BayouOps offline license generation failed.");
  console.error(`Error: ${error.message}`);
  console.error("");
  printUsage();
  process.exit(1);
}
