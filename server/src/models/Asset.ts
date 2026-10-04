import mongoose from "mongoose";

const assetVersionSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    storedName: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    metadata: {
      triangles: { type: Number, default: 0 },
      vertices: { type: Number, default: 0 },
      meshes: { type: Number, default: 0 },
      materials: { type: Number, default: 0 },
      textures: { type: Number, default: 0 },
      maxTextureSize: { type: Number, default: 0 },
      animations: { type: Number, default: 0 },

      boundingBox: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 },
      },

      fileSize: { type: Number, default: 0 },
      format: { type: String, default: "" },
      hasSkinnedMesh: { type: Boolean, default: false },
    },

    notes: {
      type: String,
      default: "",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    collectionName: {
      type: String,
      default: "General",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    versions: {
      type: [assetVersionSchema],
      default: [],
    },

    comments: {
      type: [
        {
          body: { type: String, required: true },
          rating: { type: Number },
          authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    averageRating: {
  type: Number,
  default: 0,
},

ratingCount: {
  type: Number,
  default: 0,
},

    downloads: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Asset", assetSchema);