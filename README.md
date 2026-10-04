# 3D Asset Hub 

A full-stack web application for uploading, inspecting, versioning and validating 3D assets.

| Objective | Where it lives |
|---|---|
| 1. Upload via browse + drag-and-drop | `client/src/components/upload-panel.tsx`, `client/src/pages/upload-page.tsx` |
| 2. Automatic thumbnails + metadata extraction | `client/src/services/three-loader.ts` |
| 3. Browser 3D viewer metadata, comments & ratings | `client/src/components/model-viewer.tsx` |
| 4. Version management, metadata, comments & ratings  |  `client/src/pages/asset-page.tsx`|
| 5. Search & filtering by metadata, tags, collections | `client/src/pages/library-page.tsx` |
| 6. Multi-platform readiness assessment + reports | `client/src/components/readiness-report.tsx`,`client/src/pages/asset-page.tsx` |
| Login & authentication | `server/utils/jwt.ts` (JWT ), `client/src/context/auth-context.tsx`,`client/src/pages/auth-page.tsx` |

Supported formats: **GLB**

---

## Running locally

### Prerequisites

- **Node.js 20+**
- **MongoDB** running locally (default `mongodb://127.0.0.1:27017`)

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `MONGO_URL` | `mongodb://127.0.0.1:27017` | MongoDB connection string |
| `JWT_SECRET` | dev fallback | Signs session tokens — **set this in production** |
| `PORT` | `5000` | API port when running the server standalone |

---

## How it works

**Upload & processing.** The model is parsed entirely in the browser with three.js.
Triangles, vertices, meshes, materials, textures, max texture size, animation clips,
skinning and the bounding box are walked out of the object graph, and a PNG thumbnail
is rendered offscreen. Only then is the file sent to the server, along with its
metadata — so the server never needs a headless GPU.

**Versioning.** Each asset holds an append-only array of versions. Uploading a new
revision pushes onto it; every previous file, thumbnail and metadata snapshot stays
downloadable, while `latest` always resolves to the newest revision.

**Readiness assessment.** Each version is scored against three target platforms
(Web, Unity, Unreal). Every rule — format support, triangle budget,
 file size — is graded pass / warn / fail,
weighted into a 0–100 score, and any non-passing rule carries concrete remediation advice.

---
## Running the project
# Clone the repository:

git clone https://github.com/YOUR-USERNAME/3DAsset_Hub.git

Move into the project directory:
cd 3DAsset_Hub

# Install Client Dependencies
Open a terminal in the project folder and run:
cd client
npm install


# Install Server Dependencies

Open another terminal and run:
cd server
npm install

Create the required .env file inside the server folder.
Replace the values with your own configuration.

# 1. Start the Server
Open a terminal:

cd server
npm run dev

The backend server will start on the configured port, for example:
http://localhost:5000

# 2. Start the Client
Open a second terminal:

cd client
npm run dev

Vite will provide a local URL, usually:
http://localhost:5173
Open the displayed URL in your browser.

The project now runs on the localhost