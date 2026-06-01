import fs from "fs";

const targetFile = "./scripts/demo/render-demo-dashboard.mjs";

if (!fs.existsSync(targetFile)) {
  console.error("Renderer file not found:", targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, "utf8");

const replacements = [
  {
    find: `background: #071226;`,
    replace: `background:
radial-gradient(circle at top left,
#0f1f3d,
#071226 45%,
#030712 100%);`
  },

  {
    find: `grid-template-columns: repeat(4, 1fr);`,
    replace: `grid-template-columns: repeat(5, 1fr);`
  },

  {
    find: `.chart-card {
    background: #1e293b;
    border-radius: 16px;
    padding: 20px;
}`,
    replace: `.chart-card {
    background: #1e293b;
    border-radius: 16px;
    padding: 20px;
    min-height: 420px;
}

.chart-card canvas {
    max-height: 320px;
}`
  },

  {
    find: `<div class="footer">
© 2026 BayouFinds.com — BayouOps Suite Pro
</div>`,
    replace: `<div class="footer">
© 2026 BayouFinds.com — BayouOps Suite Pro<br>
Last Generated: \${new Date().toLocaleString()}
</div>`
  },

  {
    find: `</div>

</div>

<div class="executive-summary">`,
    replace: `</div>

<div class="card">
<div>Operational Exposure</div>
<div class="metric bad">HIGH</div>
</div>

</div>

<div class="executive-summary">`
  }
];

let modified = false;

for (const item of replacements) {
  if (content.includes(item.find)) {
    content = content.replace(item.find, item.replace);
    console.log("Patched section.");
    modified = true;
  } else {
    console.log("Skipped section (not found).");
  }
}

if (!modified) {
  console.log("No modifications applied.");
  process.exit(0);
}

const backup = `${targetFile}.backup-${Date.now()}`;

fs.copyFileSync(targetFile, backup);
fs.writeFileSync(targetFile, content);

console.log("");
console.log("======================================");
console.log(" BayouOps Renderer Refined");
console.log("======================================");
console.log(" Backup :", backup);
console.log(" Updated:", targetFile);
console.log("======================================");
console.log("");
