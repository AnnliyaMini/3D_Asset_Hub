import { Request, Response } from "express";

export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    res.json({
  storedName: req.file.filename,
  fileName: req.file.originalname,
  size: req.file.size,
  url: `/uploads/${req.file.filename}`,
});

  } catch (err) {
    res.status(500).json({
      message: "Upload failed",
    });
  }
}