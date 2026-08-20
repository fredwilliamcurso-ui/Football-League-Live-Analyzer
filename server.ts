import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Direct download endpoints for Android APK and AAB
  app.get(["/Football-League-Live-Analyzer.apk", "/downloads/Football-League-Live-Analyzer.apk", "/app-debug.apk", "/api/download/apk"], (req, res) => {
    const apkPaths = [
      path.join(process.cwd(), "public", "Football-League-Live-Analyzer.apk"),
      path.join(process.cwd(), "public", "downloads", "Football-League-Live-Analyzer.apk"),
      path.join(process.cwd(), "public", "app-debug.apk"),
    ];
    for (const p of apkPaths) {
      if (fs.existsSync(p)) {
        res.setHeader("Content-Disposition", 'attachment; filename="Football-League-Live-Analyzer.apk"');
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        return res.sendFile(p);
      }
    }
    res.status(404).send("APK file not found");
  });

  app.get(["/Football-League-Live-Analyzer.aab", "/downloads/Football-League-Live-Analyzer.aab", "/app-release.aab", "/api/download/aab"], (req, res) => {
    const aabPaths = [
      path.join(process.cwd(), "public", "Football-League-Live-Analyzer.aab"),
      path.join(process.cwd(), "public", "downloads", "Football-League-Live-Analyzer.aab"),
      path.join(process.cwd(), "public", "app-release.aab"),
    ];
    for (const p of aabPaths) {
      if (fs.existsSync(p)) {
        res.setHeader("Content-Disposition", 'attachment; filename="Football-League-Live-Analyzer.aab"');
        res.setHeader("Content-Type", "application/octet-stream");
        return res.sendFile(p);
      }
    }
    res.status(404).send("AAB file not found");
  });

  // Direct download endpoint for the Android Project ZIP
  app.get(["/Football-League-Live-Analyzer-Android.zip", "/api/download/zip"], (req, res) => {
    const zipPath = path.join(process.cwd(), "Football-League-Live-Analyzer-Android.zip");
    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="Football-League-Live-Analyzer-Android.zip"');
      res.setHeader("Content-Type", "application/zip");
      return res.sendFile(zipPath);
    }
    const publicZip = path.join(process.cwd(), "public", "Football-League-Live-Analyzer-Android.zip");
    if (fs.existsSync(publicZip)) {
      res.setHeader("Content-Disposition", 'attachment; filename="Football-League-Live-Analyzer-Android.zip"');
      res.setHeader("Content-Type", "application/zip");
      return res.sendFile(publicZip);
    }
    res.status(404).send("ZIP file not found");
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
