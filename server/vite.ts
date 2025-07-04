import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server, port?: number) {
  // Dynamic import to avoid loading Vite in production
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfig = await import("../vite.config.js");
  const { nanoid } = await import("nanoid");
  
  const viteLogger = createLogger();

  // Get the actual port from the server or use provided port
  const address = server.address();
  const actualPort = port || (typeof address === 'object' && address ? address.port : 3000);
  
  console.log(`🔧 Setting up Vite HMR on port ${actualPort}`);
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      port: actualPort,
      host: 'localhost'
    },
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...viteConfig.default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: any, options: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  console.log(`🔍 Looking for static files in: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Build directory not found: ${distPath}`);
    console.log("Available directories:");
    try {
      const parentDir = path.resolve(__dirname, "..", "dist");
      if (fs.existsSync(parentDir)) {
        const contents = fs.readdirSync(parentDir);
        console.log("Contents of /app/dist:", contents);
      } else {
        console.log("❌ /app/dist directory doesn't exist");
      }
    } catch (e) {
      console.error("Error checking directories:", e);
    }
    
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log(`✅ Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    console.log(`📄 Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
  });
}
