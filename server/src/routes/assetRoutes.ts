import { Router } from "express";

import {
  createAsset,
  deleteAsset,
  getAsset,
  getAssets,
  getFacets,
  getStats,
  addComment,
  getReadiness,
  addVersion,
} from "../controllers/assetController.js";

import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", getAssets);

router.get("/facets", getFacets);
router.get("/stats", getStats);
router.get("/:id/readiness", getReadiness);
router.get("/:id", getAsset);

router.post("/", authMiddleware, createAsset);

router.delete("/:id", authMiddleware, deleteAsset);

router.post("/:id/comments", authMiddleware, addComment);
router.post("/:id/versions", authMiddleware, addVersion);

export default router;