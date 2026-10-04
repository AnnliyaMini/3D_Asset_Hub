import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api.js';
import { useAuth } from '../context/auth-context.tsx';
import { ModelViewer } from '../components/model-viewer.js';
import { ReadinessReport } from '../components/readiness-report.js';
import { UploadPanel } from '../components/upload-panel.js';
import type { Asset, AssetVersion, PlatformReport } from '../types/types.js';
import {
  Alert, Badge, Button, Card, EmptyState, Loading, Stars, StarPicker, Textarea,
  formatBytes, formatNumber, formatDate,
} from '../components/ui.js';
import styles from './pages.module.css';

type Tab = 'metadata' | 'versions' | 'readiness' | 'comments';

/**
 * detail view of one asset — 3D viewer, metadata, version history,
 * platform readiness report and the comment/rating thread.
 */
export function AssetPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('metadata');
  const [selected, setSelected] = useState<number | null>(null);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState('');
  const [addingVersion, setAddingVersion] = useState(false);

  const [commentBody, setCommentBody] = useState('');
  const [rating, setRating] = useState(0);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAsset(id);
setAsset(data);

if (data.latest?.version != null) {
  setSelected((prev) => prev ?? data.latest.version);
} else if (data.versions?.length) {
  setSelected((prev) => prev ?? data.versions[data.versions.length - 1].version);
}
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const version: AssetVersion | undefined =
  asset?.versions?.find((v) => v.version === selected) ||
  asset?.latest ||
  undefined;

  useEffect(() => {
  if (!asset?.id || !version?.version) return;

  setReadinessLoading(true);
  setReadinessError('');

  api.getReadiness(asset.id, version.version)
    .then((res) => {
      const safeReports = Array.isArray(res.reports)
        ? res.reports.map((report) => ({
            ...report,
            checks: Array.isArray(report.checks) ? report.checks : [],
          }))
        : [];

      setReports(safeReports);
    })
    .catch((err) => {
      console.error('READINESS ERROR:', err);
      setReports([]);
      setReadinessError((err as Error).message);
    })
    .finally(() => {
      setReadinessLoading(false);
    });
}, [asset?.id, version?.version]);

  const postComment = async () => {
    if (!commentBody.trim()) return;
    setPosting(true);
    try {
      const updated = await api.addComment(id, commentBody, rating || undefined);
      setAsset(updated);
      setCommentBody('');
      setRating(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this asset and all of its versions? This cannot be undone.')) return;
    try {
      await api.deleteAsset(id);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <Loading label="Loading asset…" />;
  if (!asset) {
  return <EmptyState icon="🚫" title="Asset not found" hint={error} />;
}

if (!version) {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{asset.name}</h1>
          <p className={styles.pageSub}>
            This asset has no valid version data.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Library
          </Button>

          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16 }}>
          <Alert>{error}</Alert>
        </div>
      )}
    </>
  );
}

  const m = version.metadata;
  const canManage = user && (user.id === asset.ownerId || user.role === 'admin');

  const metaRows: Array<[string, string]> = [
    ['Format', `.${m.format}`],
    ['File size', formatBytes(m.fileSize)],
    ['Triangles', formatNumber(m.triangles)],
    ['Vertices', formatNumber(m.vertices)],
    ['Meshes', formatNumber(m.meshes)],
    ['Materials', formatNumber(m.materials)],
    ['Textures', formatNumber(m.textures)],
    ['Max texture', m.maxTextureSize ? `${m.maxTextureSize}px` : '—'],
    ['Animations', formatNumber(m.animations)],
    ['Skinned mesh', m.hasSkinnedMesh ? 'Yes' : 'No'],
    ['Bounding box', `${m.boundingBox.x} × ${m.boundingBox.y} × ${m.boundingBox.z}`],
    ['Source file', version.fileName],
    ['Uploaded by', version.uploadedByName],
    ['Uploaded', formatDate(version.createdAt)],
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{asset.name}</h1>
          <p className={styles.pageSub}>
            {asset.collectionName} · owned by {asset.ownerName} · updated {formatDate(asset.updatedAt)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={() => navigate('/')}>← Library</Button>
          <a href={api.fileUrl(version.storedName)} download={version.fileName}>
            <Button variant="secondary">⬇ Download v{version.version}</Button>
          </a>
          {canManage && (
            <Button onClick={() => { setAddingVersion(true); setTab('versions'); }}>＋ New version</Button>
          )}
          {canManage && <Button variant="danger" onClick={remove}>Delete</Button>}
        </div>
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert>{error}</Alert></div>}

      <div className={styles.detailLayout}>
        <div>
          <div className={styles.viewerBox}>
            <ModelViewer url={api.fileUrl(version.storedName)} fileName={version.fileName} />
          </div>

          <div style={{ marginTop: 20 }}>
            <div className={styles.tabs}>
              {(['metadata', 'versions', 'readiness', 'comments'] as Tab[]).map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'metadata' && 'Metadata'}
                  {t === 'versions' && `Versions (${asset.versions.length})`}
                  {t === 'readiness' && 'Platform readiness'}
                  {t === 'comments' && `Comments (${asset.comments.length})`}
                </button>
              ))}
            </div>

            {tab === 'metadata' && (
              <Card style={{ padding: 18 }}>
                {metaRows.map(([k, v]) => (
                  <div key={k} className={styles.kv}>
                    <span className={styles.kvKey}>{k}</span>
                    <span className={styles.kvValue}>{v}</span>
                  </div>
                ))}
              </Card>
            )}

            {tab === 'versions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {addingVersion && (
                  <Card style={{ padding: 18 }}>
                    <UploadPanel
                      mode="version"
                      onCancel={() => setAddingVersion(false)}
                      onSubmit={async ({ processed, notes }) => {
                        const uploaded = await api.uploadFile(processed.file);
                        const updated = await api.addVersion(asset.id, {
                          fileName: uploaded.fileName,
                          storedName: uploaded.storedName,
                          thumbnail: processed.thumbnail,
                          metadata: processed.metadata,
                          notes,
                        });
                       setAsset(updated);
                      setSelected(updated.latest.version);
                      setReports([]);
                      setReadinessError('');
                      setReadinessLoading(true);
                      setAddingVersion(false);
                      setTab('versions');
                      }}
                    />
                  </Card>
                )}

                {asset.versions.map((v) => (
                  <div
                    key={v.version}
                    className={`${styles.versionRow} ${v.version === version.version ? styles.versionActive : ''}`}
                    onClick={() => setSelected(v.version)}
                  >
                    {v.thumbnail
                      ? <img src={v.thumbnail} alt="" className={styles.versionThumb} />
                      : <div className={styles.versionThumb} />}
                    <div className={styles.versionInfo}>
                      <div className={styles.versionTitle}>
                        Version {v.version}{' '}
                        {v.version === asset.latest.version && <Badge tone="success">Latest</Badge>}
                      </div>
                      <div className={styles.versionSub}>
                        {v.notes} · {formatNumber(v.metadata.triangles)} tris · {formatBytes(v.metadata.fileSize)}
                      </div>
                      <div className={styles.versionSub}>
                        {v.uploadedByName} · {formatDate(v.createdAt)}
                      </div>
                    </div>
                    <a
                      href={api.fileUrl(v.storedName)}
                      download={v.fileName}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm">⬇</Button>
                    </a>
                  </div>
                ))}
              </div>
            )}

            {tab === 'readiness' && (
  readinessLoading ? (
    <Loading label="Assessing platform compatibility…" />
  ) : readinessError ? (
    <Alert>{readinessError}</Alert>
  ) : reports.length > 0 ? (
    <ReadinessReport reports={reports} />
  ) : (
    <EmptyState
      icon="⚠️"
      title="No readiness results"
      hint="No platform compatibility checks were returned for this version."
    />
  )
)}

            {tab === 'comments' && (
              <div>
                {user && (
                  <div className={styles.commentForm}>
                    <Textarea
                      placeholder="Share feedback on this asset…"
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                    />
                    <div className={styles.ratingRow}>
                      <span className={styles.kvKey}>Rating:</span>
                      <StarPicker value={rating} onChange={setRating} />
                      <div style={{ flex: 1 }} />
                      <Button size="sm" onClick={postComment} disabled={posting || !commentBody.trim()}>
                        {posting ? 'Posting…' : 'Post comment'}
                      </Button>
                    </div>
                  </div>
                )}

                {asset.comments.length === 0
                  ? <EmptyState icon="💬" title="No comments yet" hint="Be the first to review this asset." />
                  : (
                    <div className={styles.commentList}>
                      {asset.comments.map((c) => (
                        <div key={c.id} className={styles.comment}>
                          <div className={styles.commentHead}>
                            <span className={styles.commentAuthor}>{c.authorName}</span>
                            {c.rating ? <Stars value={c.rating} /> : null}
                            <span className={styles.commentDate}>{formatDate(c.createdAt)}</span>
                          </div>
                          <div className={styles.commentBody}>{c.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <Card className={styles.sidePanel}>
          <div>
            <h2 className={styles.detailTitle}>{asset.name}</h2>
            {asset.description && <p className={styles.detailDesc}>{asset.description}</p>}
          </div>

          <div className={styles.tagRow}>
            <Badge tone="accent">.{m.format}</Badge>
            <Badge>v{version.version} of {asset.versions.length}</Badge>
            {asset.tags.map((t) => <Badge key={t}>{t}</Badge>)}
          </div>

          {asset.ratingCount > 0 && (
            <div className={styles.ratingRow}>
              <Stars value={asset.averageRating} />
              <span className={styles.kvKey}>
                {asset.averageRating.toFixed(1)} · {asset.ratingCount} rating{asset.ratingCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div>
            <div className={styles.kv}><span className={styles.kvKey}>Triangles</span><span className={styles.kvValue}>{formatNumber(m.triangles)}</span></div>
            <div className={styles.kv}><span className={styles.kvKey}>File size</span><span className={styles.kvValue}>{formatBytes(m.fileSize)}</span></div>
            <div className={styles.kv}><span className={styles.kvKey}>Meshes</span><span className={styles.kvValue}>{formatNumber(m.meshes)}</span></div>
            <div className={styles.kv}><span className={styles.kvKey}>Materials</span><span className={styles.kvValue}>{formatNumber(m.materials)}</span></div>
          </div>

          {reports.length > 0 && (
            <div>
              <span className={styles.filterTitle}>Platform readiness</span>
              {reports.map((r) => (
                <div key={r.platform} className={styles.kv}>
                  <span className={styles.kvKey}>{r.icon} {r.platform}</span>
                  <span
                    className={styles.kvValue}
                    style={{ color: r.score >= 85 ? 'var(--success)' : r.score >= 60 ? 'var(--warn)' : 'var(--danger)' }}
                  >
                    {r.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
