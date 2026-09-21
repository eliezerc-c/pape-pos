const path = require("path");

module.exports = {
  apps: [
    {
      name: "pape-backend",
      cwd: path.join(__dirname, "backend"),
      script: path.join(__dirname, "pm2-backend.js"),
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "pape-frontend",
      cwd: path.join(__dirname, "frontend"),
      script: path.join(__dirname, "pm2-frontend.js"),
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};
