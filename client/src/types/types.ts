/**
 * geometry and material statistics extracted from a 3D asset at upload time.
 */
export type AssetMetadata = {
  triangles: number;
  vertices: number;
  meshes: number;
  materials: number;
  textures: number;
  maxTextureSize: number;
  animations: number;
  boundingBox: { x: number; y: number; z: number };
  fileSize: number;
  format: string;
  hasSkinnedMesh: boolean;
};

/**
 * an immutable revision of an asset.
 */
export type AssetVersion = {
  version: number;
  fileName: string;
  storedName: string;
  thumbnail?: string;
  metadata: AssetMetadata;
  notes?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
};

/**
 * a user comment with an optional star rating.
 */
export type AssetComment = {
  id: string;
  body: string;
  rating?: number;
  authorId: string;
  authorName: string;
  createdAt: string;
};

/**
 * a managed 3D asset including all of its revisions.
 */
export type Asset = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  collectionName: string;
  ownerId: string;
  ownerName: string;
  versions: AssetVersion[];
  latest: AssetVersion;
  comments: AssetComment[];
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * the signed-in user identity.
 */
export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
};

/**
 * a single rule evaluation inside a readiness report.
 */
export type ReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  actual: number | string | boolean;
  expected?: number | string | boolean;
  advice?: string;
};

export type PlatformReport = {
  platform: 'Web' | 'Unity' | 'Unreal';
  icon: string;
  score: number;
  status: 'ready' | 'needs-work' | 'not-ready';
  checks: ReadinessCheck[];
};
/**
 * aggregated filter options derived from the library.
 */
export type Facets = {
  tags: string[];
  collections: string[];
  formats: string[];
  total: number;
};

/**
 * library-wide counters for the dashboard.
 */
export type LibraryStats = {
  assets: number;
  versions: number;
  triangles: number;
  bytes: number;
  comments: number;
};

/**
 * file extensions the viewer and processor can handle.
 */
export const SUPPORTED_FORMATS = ['glb'] as const;
