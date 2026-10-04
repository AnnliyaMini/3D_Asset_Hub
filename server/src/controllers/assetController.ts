import { Request, Response } from "express";
import Asset from "../models/Asset.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Format an asset consistently for the frontend.
 */
function formatAsset(asset: any) {
  const versions = asset.versions || [];

  const latest =
    versions.length > 0
      ? versions.reduce((latest: any, current: any) =>
          current.version > latest.version ? current : latest
        )
      : undefined;

  const ratings = (asset.comments || [])
    .map((c: any) => c.rating)
    .filter((rating: any) => typeof rating === "number");

  const averageRating =
    ratings.length > 0
      ? ratings.reduce(
          (sum: number, rating: number) => sum + rating,
          0
        ) / ratings.length
      : 0;

  return {
    id: asset._id.toString(),
    name: asset.name,
    description: asset.description || "",
    tags: asset.tags || [],
    collectionName: asset.collectionName || "General",

    ownerId: asset.uploadedBy?._id?.toString() || "",
    ownerName: asset.uploadedBy?.name || "Unknown",

    versions: versions.map((v: any) => ({
      version: v.version,
      fileName: v.fileName,
      storedName: v.storedName,
      thumbnail: v.thumbnail || "",
      metadata: v.metadata || {},
      notes: v.notes || "",
      uploadedBy:
        v.uploadedBy?._id?.toString() ||
        v.uploadedBy?.toString() ||
        "",
      uploadedByName: v.uploadedBy?.name || "Unknown",
      createdAt: v.createdAt,
    })),

    latest: latest
      ? {
          version: latest.version,
          fileName: latest.fileName,
          storedName: latest.storedName,
          thumbnail: latest.thumbnail || "",
          metadata: latest.metadata || {},
          notes: latest.notes || "",
          uploadedBy:
            latest.uploadedBy?._id?.toString() ||
            latest.uploadedBy?.toString() ||
            "",
          uploadedByName: latest.uploadedBy?.name || "Unknown",
          createdAt: latest.createdAt,
        }
      : undefined,

    comments: (asset.comments || []).map((c: any) => ({
      id: c._id.toString(),
      body: c.body,
      rating: c.rating,
      authorId:
        c.authorId?._id?.toString() ||
        c.authorId?.toString() ||
        "",
      authorName: c.authorId?.name || "Unknown",
      createdAt: c.createdAt,
    })),

    averageRating,
    ratingCount: ratings.length,

    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

/**
 * Create Asset
 */
export async function createAsset(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const asset = await Asset.create({
      name: req.body.name,
      description: req.body.description || "",
      tags: req.body.tags || [],
      collectionName: req.body.collectionName || "General",
      uploadedBy: userId,

      versions: [
        {
          version: 1,
          fileName: req.body.fileName,
          storedName: req.body.storedName,
          thumbnail: req.body.thumbnail || "",
          metadata: req.body.metadata || {},
          notes: req.body.notes || "Initial upload",
          uploadedBy: userId,
        },
      ],
    });

    return res.status(201).json({
      id: asset._id.toString(),
      name: asset.name,
    });
  } catch (err) {
    console.error("CREATE ASSET ERROR:", err);

    return res.status(500).json({
      message: "Could not create asset",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Get All Assets
 */
export async function getAssets(
  req: Request,
  res: Response
) {
  try {
    const assets = await Asset.find()
      .populate("uploadedBy", "name email")
      .populate("versions.uploadedBy", "name email")
      .populate("comments.authorId", "name")
      .sort({ createdAt: -1 });

    return res.json(assets.map(formatAsset));
  } catch (err) {
    console.error("GET ASSETS ERROR:", err);

    return res.status(500).json({
      message: "Could not fetch assets",
    });
  }
}

/**
 * Get Asset Facets
 */
export async function getFacets(
  req: Request,
  res: Response
) {
  try {
    const assets = await Asset.find();

    const tags = [
      ...new Set(
        assets.flatMap((asset) => asset.tags || [])
      ),
    ];

    const collections = [
      ...new Set(
        assets
          .map((asset) => asset.collectionName || "General")
          .filter(Boolean)
      ),
    ];

    const formats = ['glb'];

    return res.json({
  tags,
  collections,
  formats: ['glb'],
  total: assets.length,
});
  } catch (err) {
    console.error("GET FACETS ERROR:", err);

    return res.status(500).json({
      message: "Could not fetch facets",
    });
  }
}

/**
 * Get Library Stats
 *
 * Stats are calculated from the actual stored asset data.
 */
export async function getStats(
  req: Request,
  res: Response
) {
  try {
    const assets = await Asset.find().lean();

    let versionCount = 0;
    let triangles = 0;
    let bytes = 0;
    let comments = 0;

    for (const asset of assets) {
      comments += asset.comments?.length || 0;

      for (const version of asset.versions || []) {
        versionCount += 1;

        const metadata: any = version.metadata || {};

        const triangleValue =
          metadata.triangles ??
          metadata.triangleCount ??
          metadata.polygons ??
          metadata.polyCount ??
          0;

        const fileSizeValue =
          metadata.fileSize ??
          metadata.size ??
          metadata.bytes ??
          0;

        if (typeof triangleValue === "number") {
          triangles += triangleValue;
        }

        if (typeof fileSizeValue === "number") {
          bytes += fileSizeValue;
        }
      }
    }

    return res.json({
      assets: assets.length,
      versions: versionCount,
      triangles,
      bytes,
      comments,
    });
  } catch (err) {
    console.error("GET STATS ERROR:", err);

    return res.status(500).json({
      message: "Could not fetch stats",
    });
  }
}

/**
 * Get Single Asset
 */
export async function getAsset(
  req: Request,
  res: Response
) {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .populate("versions.uploadedBy", "name email")
      .populate("comments.authorId", "name email");

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    return res.json(formatAsset(asset));
  } catch (err) {
    console.error("GET ASSET ERROR:", err);

    return res.status(500).json({
      message: "Server Error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Add New Asset Version
 */
export async function addVersion(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const existingVersions = asset.versions || [];

    const highestVersion =
      existingVersions.length > 0
        ? Math.max(
            ...existingVersions.map(
              (version: any) => version.version || 0
            )
          )
        : 0;

    const nextVersion = highestVersion + 1;

    asset.versions.push({
      version: nextVersion,
      fileName: req.body.fileName,
      storedName: req.body.storedName,
      thumbnail: req.body.thumbnail || "",
      metadata: req.body.metadata || {},
      notes: req.body.notes || "",
      uploadedBy: userId,
    });

    await asset.save();

    const updated = await Asset.findById(asset._id)
      .populate("uploadedBy", "name email")
      .populate("versions.uploadedBy", "name email")
      .populate("comments.authorId", "name email");

    if (!updated) {
      return res.status(404).json({
        message: "Asset not found after update",
      });
    }

    return res.status(201).json(formatAsset(updated));
  } catch (err) {
    console.error("ADD VERSION ERROR:", err);

    return res.status(500).json({
      message: "Could not add asset version",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Delete Asset
 */
export async function deleteAsset(
  req: Request,
  res: Response
) {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Asset deleted",
    });
  } catch (err) {
    console.error("DELETE ASSET ERROR:", err);

    return res.status(500).json({
      message: "Delete failed",
    });
  }
}

/**
 * Add Comment
 */
export async function addComment(
  req: AuthRequest,
  res: Response
) {
  try {
    const { body, rating } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    asset.comments.push({
      body: body.trim(),
      rating,
      authorId: userId,
    });

    await asset.save();

    const updated = await Asset.findById(asset._id)
      .populate("uploadedBy", "name email")
      .populate("versions.uploadedBy", "name email")
      .populate("comments.authorId", "name email");

    if (!updated) {
      return res.status(404).json({
        message: "Asset not found after update",
      });
    }

    return res.json(formatAsset(updated));
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);

    return res.status(500).json({
      message: "Could not add comment",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Calculate readiness from actual asset metadata.
 */
function calculatePlatformReadiness(
  platform: "Web" | "Unity" | "Unreal",
  metadata: any
) {
  const checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    actual: number | string | boolean;
    expected?: number | string | boolean;
    advice?: string;
  }> = [];

  const fileSize =
    metadata.fileSize ??
    metadata.size ??
    metadata.bytes ??
    0;

  const triangles =
    metadata.triangles ??
    metadata.triangleCount ??
    metadata.polygons ??
    metadata.polyCount ??
    0;

  const format = String(
    metadata.format ||
      metadata.fileFormat ||
      metadata.extension ||
      ""
  ).toLowerCase();

  const hasDimensions =
    Number(metadata.width || 0) > 0 &&
    Number(metadata.height || 0) > 0;

  /*
   * These are intentionally metadata-based checks.
   * The score therefore changes when the uploaded asset's
   * metadata changes instead of always returning 100.
   */

  if (platform === "Web") {
    const formatPassed =
      !format ||
      ["glb"].includes(format);

    checks.push({
      key: "format",
      label: "Supported 3D format",
      passed: formatPassed,
      actual: format || "unknown",
      expected: "glb",
      advice: "Use a browser-friendly 3D format such as GLB.",
    });

    const sizePassed =
      !fileSize || fileSize <= 100 * 1024 * 1024;

    checks.push({
      key: "fileSize",
      label: "Web file size",
      passed: sizePassed,
      actual: fileSize,
      expected: "<= 100 MB",
      advice: "Reduce texture or mesh size for web delivery.",
    });

    const trianglePassed =
      !triangles || triangles <= 25000;

    checks.push({
      key: "triangles",
      label: "Web triangle count",
      passed: trianglePassed,
      actual: triangles,
      expected: "<= 25,000",
      advice: "Reduce mesh complexity for better browser performance.",
    });

    
  }

  if (platform === "Unity") {
    const formatPassed =
      !format ||
      ["glb"].includes(format);

    checks.push({
      key: "format",
      label: "Unity-compatible format",
      passed: formatPassed,
      actual: format || "unknown",
      expected: "glb",
      advice: "Export the asset in a Unity-compatible format.",
    });

    const trianglePassed =
      !triangles || triangles <= 500000;

    checks.push({
      key: "triangles",
      label: "Unity triangle count",
      passed: trianglePassed,
      actual: triangles,
      expected: "<= 500,000",
      advice: "Reduce mesh complexity if the model is too heavy.",
    });

    const sizePassed =
      !fileSize || fileSize <= 250 * 1024 * 1024;

    checks.push({
      key: "fileSize",
      label: "Unity file size",
      passed: sizePassed,
      actual: fileSize,
      expected: "<= 250 MB",
      advice: "Compress textures and remove unnecessary data.",
    });
  }

  if (platform === "Unreal") {
    const formatPassed =
      !format ||
      ["glb"].includes(format);

    checks.push({
      key: "format",
      label: "Unreal-compatible format",
      passed: formatPassed,
      actual: format || "unknown",
      expected: "glb",
      advice: "Export the asset in an Unreal-compatible format.",
    });

    const trianglePassed =
      !triangles || triangles <= 600000;

    checks.push({
      key: "triangles",
      label: "Unreal triangle count",
      passed: trianglePassed,
      actual: triangles,
      expected: "<= 600,000",
      advice: "Reduce mesh complexity for real-time use.",
    });

    const sizePassed =
      !fileSize || fileSize <= 500 * 1024 * 1024;

    checks.push({
      key: "fileSize",
      label: "Unreal file size",
      passed: sizePassed,
      actual: fileSize,
      expected: "<= 500 MB",
      advice: "Optimize large textures and unnecessary asset data.",
    });
  }

  const passed = checks.filter((check) => check.passed).length;

  const score =
    checks.length > 0
      ? Math.round((passed / checks.length) * 100)
      : 0;

  const status =
    score >= 85
      ? "ready"
      : score >= 60
        ? "needs-work"
        : "not-ready";

  return {
    platform,
    icon:
      platform === "Web"
        ? "🌐"
        : platform === "Unity"
          ? "🎮"
          : "🕹️",
    score,
    status,
    checks,
  };
}

/**
 * Get Asset Readiness
 */
export async function getReadiness(
  req: Request,
  res: Response
) {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const versionNumber =
      Number(req.query.version) ||
      Math.max(
        ...(asset.versions || []).map(
          (v: any) => v.version || 0
        ),
        1
      );

    const version = asset.versions.find(
      (v: any) => v.version === versionNumber
    );

    if (!version) {
      return res.status(404).json({
        message: "Version not found",
      });
    }

    const metadata: any = version.metadata || {};

    const reports = [
      calculatePlatformReadiness("Web", metadata),
      calculatePlatformReadiness("Unity", metadata),
      calculatePlatformReadiness("Unreal", metadata),
    ];

    return res.json({
      version: versionNumber,
      reports,
    });
  } catch (err) {
    console.error("GET READINESS ERROR:", err);

    return res.status(500).json({
      message: "Could not calculate readiness",
    });
  }
}