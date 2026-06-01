import fs from "fs";

export const LOB_CONFIG_FILE = "./config/lines-of-business.json";

export const DEFAULT_LINES_OF_BUSINESS = [
  "Finance",
  "Operations",
  "Human Resources",
  "Security",
  "Infrastructure",
  "Retail",
  "Customer Support"
];

const DEFAULT_ALIASES = {
  HR: "Human Resources"
};

function cleanName(value) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueNames(values) {
  return [...new Set(values.map(cleanName).filter(Boolean))];
}

function normalizeAliases(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return { ...DEFAULT_ALIASES };
  }

  const aliases = {};

  for (const [from, to] of Object.entries(value)) {
    const cleanFrom = cleanName(from);
    const cleanTo = cleanName(to);

    if (cleanFrom && cleanTo) {
      aliases[cleanFrom] = cleanTo;
    }
  }

  return aliases;
}

function fallbackConfig(warnings) {
  return {
    configPath: LOB_CONFIG_FILE,
    linesOfBusiness: [...DEFAULT_LINES_OF_BUSINESS],
    aliases: { ...DEFAULT_ALIASES },
    warnings
  };
}

export function loadLinesOfBusinessConfig() {
  if (!fs.existsSync(LOB_CONFIG_FILE)) {
    return fallbackConfig([
      `${LOB_CONFIG_FILE} was not found. Using default demo Lines of Business. Create this JSON file to rename, add, or remove customer LOB names.`
    ]);
  }

  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(LOB_CONFIG_FILE, "utf8"));
  } catch (error) {
    return fallbackConfig([
      `${LOB_CONFIG_FILE} could not be parsed as JSON. Using default demo Lines of Business until the file is corrected.`,
      error.message
    ]);
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return fallbackConfig([
      `${LOB_CONFIG_FILE} must contain a JSON object with a linesOfBusiness array. Using default demo Lines of Business.`
    ]);
  }

  if (!Array.isArray(parsed.linesOfBusiness)) {
    return fallbackConfig([
      `${LOB_CONFIG_FILE} must include a linesOfBusiness array. Using default demo Lines of Business.`
    ]);
  }

  const linesOfBusiness = uniqueNames(parsed.linesOfBusiness);

  if (linesOfBusiness.length === 0) {
    return fallbackConfig([
      `${LOB_CONFIG_FILE} has no usable Lines of Business. Add at least one non-empty string to linesOfBusiness. Using default demo Lines of Business.`
    ]);
  }

  return {
    configPath: LOB_CONFIG_FILE,
    linesOfBusiness,
    aliases: normalizeAliases(parsed.aliases),
    warnings: []
  };
}

export function mapLineOfBusiness(value, config) {
  const cleanValue = cleanName(value);

  if (!cleanValue) {
    return "Unassigned";
  }

  return config.aliases[cleanValue] || cleanValue;
}

export function printLobConfigWarnings(config) {
  for (const warning of config.warnings) {
    console.warn(`LOB config warning: ${warning}`);
  }
}
