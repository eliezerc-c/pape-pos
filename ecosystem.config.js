const path = require("path");

module.exports = {
  apps: [
    {
      name: "pape-backend",
      cwd: path.join(__dirname, "backend"),
      script: path.join(__dirname, "backend", "node_modules", "tsx", "dist", "cli.mjs"),
      args: "watch src/index.ts",
      watch: ["src"],
      env: {
        NODE_ENV: "development",
        PORT: 3001,
        DATABASE_URL: "postgresql://postgres:admin01@localhost:5432/pape_pos",
        JWT_SECRET: "tu_secret_seguro_cambiar_2024",
        STORAGE_PATH: "./storage/products",
        BACKUP_PATH: "./database/backups",
        FRONTEND_URL: "http://localhost:5173",
        BACKEND_URL: "http://localhost:3001",
        ELECTRON_DEV: "true",
      },
    },
    {
      name: "pape-frontend",
      cwd: path.join(__dirname, "frontend"),
      script: path.join(__dirname, "frontend", "node_modules", "vite", "bin", "vite.js"),
      args: "--host --port 5173",
      env: {
        NODE_ENV: "development",
        PORT: 5173,
        FRONTEND_URL: "http://localhost:5173",
        BACKEND_URL: "http://localhost:3001",
      },
    },
  ],
};
