import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const images = [
  "agent-market/content-writer:latest",
  "agent-market/competitor-monitor:latest",
  "agent-market/website-monitor:latest",
  "agent-market/news-digest-bot:latest",
  "agent-market/review-responder-2gis:latest",
  "ai-support-bot-bot:latest",
];

const date = new Date().toISOString().slice(0, 10);
const reportPath = join("infra", "security", `trivy-${date}.md`);

mkdirSync(join("infra", "security"), { recursive: true });

writeFileSync(
  reportPath,
  [
    `# Trivy image scan - ${date}`,
    "",
    "Generated locally via `npm run scan:images`.",
    "",
    "Command pattern:",
    "",
    "```bash",
    "trivy image --quiet --severity HIGH,CRITICAL --format table --ignore-unfixed --scanners vuln <image>",
    "```",
    "",
  ].join("\n"),
  "utf8",
);

let exitCode = 0;

for (const image of images) {
  appendFileSync(reportPath, `## ${image}\n\n\`\`\`text\n`, "utf8");

  const result = spawnSync(
    "trivy",
    [
      "image",
      "--quiet",
      "--severity",
      "HIGH,CRITICAL",
      "--format",
      "table",
      "--ignore-unfixed",
      "--scanners",
      "vuln",
      image,
    ],
    {
      encoding: "utf8",
    },
  );

  if (result.error) {
    if ("code" in result.error && result.error.code === "ENOENT") {
      appendFileSync(
        reportPath,
        "Trivy is not installed or not available in PATH.\n```\n",
        "utf8",
      );
      console.error("Trivy is not installed or not available in PATH.");
      process.exit(1);
    }

    appendFileSync(
      reportPath,
      `${result.error.message}\n\`\`\`\n`,
      "utf8",
    );
    console.error(result.error.message);
    exitCode = exitCode || 1;
    continue;
  }

  const output = [result.stdout, result.stderr]
    .filter(Boolean)
    .join("")
    .trimEnd();

  appendFileSync(reportPath, `${output}\n\`\`\`\n\n`, "utf8");

  if ((result.status ?? 0) !== 0) {
    exitCode = exitCode || result.status || 1;
  }
}

process.exit(exitCode);
