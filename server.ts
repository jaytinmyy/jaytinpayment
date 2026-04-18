
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./firebase.js"; 
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { UAParser } from "ua-parser-js";

// Note: To use our existing firebase config in Node, we might need a slight adjustment
// if it uses browser-only APIs, but Firebase JS SDK is designed for both.

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API for tracking shared views
  app.post("/api/track-view", async (req, res) => {
    const { shareKey } = req.body;
    if (!shareKey) return res.status(400).json({ error: "Missing share key" });

    try {
      // 1. Find the ledger by shareKey
      const ledgersRef = collection(db, "ledgers");
      const q = query(ledgersRef, where("shareKey", "==", shareKey));
      const snap = await getDocs(q);

      if (snap.empty) return res.status(404).json({ error: "Protocol not found" });

      const ledgerDoc = snap.docs[0];
      const ledgerId = ledgerDoc.id;

      // 2. Extract visitor info
      const uaString = req.headers["user-agent"] || "";
      const parser = new UAParser(uaString);
      const uaResult = parser.getResult();

      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
      const device = `${uaResult.device.vendor || ""} ${uaResult.device.model || ""} (${uaResult.os.name} ${uaResult.os.version})`.trim() || "Browser/Desktop";

      // 3. Add visit record
      const visitsRef = collection(db, "ledgers", ledgerId, "visits");
      await addDoc(visitsRef, {
        timestamp: serverTimestamp(),
        ip: Array.isArray(ip) ? ip[0] : ip,
        userAgent: uaString,
        device: device,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Tracking failure:", error);
      res.status(500).json({ error: "Internal Protocol Error" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VAULT SERVER] Protocol Active on Port ${PORT}`);
  });
}

startServer();
