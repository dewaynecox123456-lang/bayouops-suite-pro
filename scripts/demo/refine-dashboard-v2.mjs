import fs from "fs";

const file = "./scripts/demo/render-demo-dashboard.mjs";

if (!fs.existsSync(file)) {
  console.error("Renderer not found.");
  process.exit(1);
}

let content = fs.readFileSync(file, "utf8");

const patches = [

{
find: `<body>

<h1>BayouOps Executive Readiness Dashboard</h1>`,
replace: `<body>

<div class="ops-banner">
Operational Status: Elevated Risk Environment
</div>

<h1>BayouOps Executive Readiness Dashboard</h1>`
},

{
find: `.footer {
    margin-top: 40px;
    opacity: 0.5;
    font-size: 12px;
}`,
replace: `.footer {
    margin-top: 40px;
    opacity: 0.5;
    font-size: 12px;
}

.ops-banner {
    background: linear-gradient(
        90deg,
        #7f1d1d,
        #991b1b
    );

    padding: 14px 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    font-weight: bold;
    letter-spacing: 0.5px;
    box-shadow: 0 0 20px rgba(239,68,68,0.25);
}

.badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.5px;
}

.badge-high {
    background: rgba(239,68,68,0.15);
    color: #ef4444;
    border: 1px solid #ef4444;
}

.badge-medium {
    background: rgba(245,158,11,0.15);
    color: #f59e0b;
    border: 1px solid #f59e0b;
}

.badge-low {
    background: rgba(34,197,94,0.15);
    color: #22c55e;
    border: 1px solid #22c55e;
}

tbody tr:nth-child(even) {
    background: rgba(255,255,255,0.02);
}

tbody tr:hover {
    background: rgba(56,189,248,0.08);
}`
},

{
find: `<div class="metric">${critical}</div>`,
replace: `<div class="metric bad">${critical}</div>
<div style="margin-top:8px; opacity:0.7;">
Requires remediation review
</div>`
},

{
find: `<h2>Highest Risk Operational Systems</h2>`,
replace: `<div class="chart-card" style="margin-bottom:40px;">
<h3>Business Unit Operational Exposure</h3>

<table>
<thead>
<tr>
<th>Business Unit</th>
<th>Critical Systems</th>
<th>Average Score</th>
<th>Operational Status</th>
</tr>
</thead>

<tbody>
<tr>
<td>Security</td>
<td>12</td>
<td class="bad">58%</td>
<td><span class="badge badge-high">HIGH</span></td>
</tr>

<tr>
<td>Finance</td>
<td>7</td>
<td class="warn">64%</td>
<td><span class="badge badge-medium">ELEVATED</span></td>
</tr>

<tr>
<td>Infrastructure</td>
<td>4</td>
<td class="good">91%</td>
<td><span class="badge badge-low">STABLE</span></td>
</tr>
</tbody>
</table>
</div>

<h2>Highest Risk Operational Systems</h2>`
},

{
find: `<td class="bad">\${server.exposureLevel}</td>`,
replace: `<td>
<span class="badge \${server.exposureLevel === 'High'
? 'badge-high'
: server.exposureLevel === 'Medium'
? 'badge-medium'
: 'badge-low'}">
\${server.exposureLevel.toUpperCase()}
</span>
</td>`
}

];

let applied = 0;

for (const patch of patches) {
    if (content.includes(patch.find)) {
        content = content.replace(patch.find, patch.replace);
        applied++;
        console.log("Applied patch.");
    } else {
        console.log("Skipped patch.");
    }
}

const backup = `${file}.backup-${Date.now()}`;

fs.copyFileSync(file, backup);
fs.writeFileSync(file, content);

console.log("");
console.log("======================================");
console.log(" Dashboard Refinement v2 Applied");
console.log("======================================");
console.log(" Patches Applied :", applied);
console.log(" Backup Created  :", backup);
console.log("======================================");
console.log("");
