import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "src/uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/assets", assetRoutes);

app.get("/", (req, res) => {
  res.send("Asset Hub API Running 🚀");
});

export default app;