import { Router } from "express";
import multer from "multer";
import path from "path";

import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "src/uploads");
  },

  filename(req, file, cb) {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  uploadFile
);

export default router;