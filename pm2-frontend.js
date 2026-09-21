const { spawn } = require("child_process");
const path = require("path");

const frontend = spawn(
  path.join(__dirname, "frontend", "node_modules", ".bin", "vite"),
  ["--host"],
  {
    cwd: path.join(__dirname, "frontend"),
    stdio: "inherit",
    shell: true
  }
);

frontend.on("error", (err) => {
  console.error("Frontend error:", err);
});
