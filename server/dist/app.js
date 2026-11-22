import express from "express";
import authRouter from "./routes/auth.js";
import foodRouter from "./routes/food.js";
import ngosRouter from "./routes/ngos.js";
import gamificationRouter from "./routes/gamification.js";
export function createApp() {
    const app = express();
    app.use(express.json());
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/api/auth", authRouter);
    app.use("/api/food", foodRouter);
    app.use("/api/ngos", ngosRouter);
    app.use("/api/gamification", gamificationRouter);
    app.use((_req, res) => {
        res.status(404).json({ error: "Not found" });
    });
    return app;
}
