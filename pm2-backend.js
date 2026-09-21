const { spawn } = require("child_process");
const path = require("path");

const backend = spawn(
  path.join(__dirname, "backend", "node_modules", ".bin", "tsx"),
  ["watch", "src/index.ts"],
  {
    cwd: path.join(__dirname, "backend"),
    stdio: "inherit",
    shell: true
  }
);

backend.on("error", (err) => {
  console.error("Backend error:", err);
});
