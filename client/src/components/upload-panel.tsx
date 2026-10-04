import { useCallback, useRef, useState } from 'react';
import { Badge, Button, Input, Textarea, Alert, formatBytes, formatNumber } from '../components/ui.js';
import { parseModel, extractMetadata, renderThumbnail, readFile, extensionOf } from '../services/three-loader.js';
import { SUPPORTED_FORMATS } from '../types/types.js';
import type { AssetMetadata } from '../types/types.js';
import styles from '../pages/upload.module.css';
import uiStyles from '../components/ui.module.css';

export type ProcessedFile = {
  file: File;
  metadata: AssetMetadata;
  thumbnail?: string;
};

type Props = {
  mode?: 'create' | 'version';
  onSubmit: (data: {
    processed: ProcessedFile;
    name: string;
    description: string;
    tags: string[];
    collectionName: string;
    notes: string;
  }) => Promise<void>;
  onCancel?: () => void;
};

export function UploadPanel({ mode = 'create', onSubmit, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState<ProcessedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [collectionName, setCollectionName] = useState('Uncategorized');
  const [notes, setNotes] = useState('');

  const process = useCallback(async (file: File) => {
    setError('');
    const ext = extensionOf(file.name);
    if (!SUPPORTED_FORMATS.includes(ext as typeof SUPPORTED_FORMATS[number])) {
      setError(`Unsupported format ".${ext}". Supported: ${SUPPORTED_FORMATS.join(', ').toUpperCase()}.`);
      return;
    }
    setProcessing(true);
    try {
      const buffer = await readFile(file);
      const model = await parseModel(buffer, file.name);
      const metadata = extractMetadata(model, file.size, file.name);
      const thumbnail = renderThumbnail(model);
      setProcessed({ file, metadata, thumbnail });
      if (!name) setName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [name]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) process(file);
  };

  const submit = async () => {
    if (!processed) return;
    if (mode === 'create' && !name.trim()) {
      setError('Please give the asset a name');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        processed,
        name: name.trim(),
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        collectionName: collectionName.trim() || 'Uncategorized',
        notes,
      });
      setProcessed(null);
      setName('');
      setDescription('');
      setTags('');
      setNotes('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!processed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <Alert>{error}</Alert>}
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {processing ? (
            <>
              <div className={uiStyles.spinner} />
              <div className={styles.dropTitle}>Processing model…</div>
              <div className={styles.dropHint}>Extracting metadata and rendering a thumbnail</div>
            </>
          ) : (
            <>
              <div className={styles.dropIcon}>📦</div>
              <div className={styles.dropTitle}>Drop a 3D file here, or click to browse</div>
              <div className={styles.dropHint}>Metadata and a thumbnail are generated automatically</div>
              <div className={styles.formats}>
                {SUPPORTED_FORMATS.map((f) => <Badge key={f}>.{f}</Badge>)}
              </div>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) process(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  const m = processed.metadata;
  const stats: Array<[string, string]> = [
    ['Format', `.${m.format}`],
    ['File size', formatBytes(m.fileSize)],
    ['Triangles', formatNumber(m.triangles)],
    ['Vertices', formatNumber(m.vertices)],
    ['Meshes', formatNumber(m.meshes)],
    ['Materials', formatNumber(m.materials)],
    ['Textures', formatNumber(m.textures)],
    ['Max texture', m.maxTextureSize ? `${m.maxTextureSize}px` : '—'],
    ['Animations', formatNumber(m.animations)],
    ['Bounds', `${m.boundingBox.x} × ${m.boundingBox.y} × ${m.boundingBox.z}`],
  ];

  return (
    <div className={styles.preview}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {processed.thumbnail
          ? <img src={processed.thumbnail} alt="Generated preview" className={styles.thumb} />
          : <div className={styles.thumb} />}
        <div className={styles.fileName}>{processed.file.name}</div>
        <Button variant="ghost" size="sm" onClick={() => setProcessed(null)}>Choose a different file</Button>
      </div>

      <div className={styles.form}>
        {error && <Alert>{error}</Alert>}

        <div className={styles.metaGrid}>
          {stats.map(([label, value]) => (
            <div key={label} className={styles.metaItem}>
              <span className={styles.metaLabel}>{label}</span>
              <span className={styles.metaValue}>{value}</span>
            </div>
          ))}
        </div>

        {mode === 'create' && (
          <>
            <Input label="Asset name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sci-fi helmet" />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this asset for?"
            />
            <div className={styles.row}>
              <Input
                label="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="character, hard-surface, pbr"
              />
              <Input
                label="Collection"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Environment Kit"
              />
            </div>
          </>
        )}

        <Input
          label={mode === 'create' ? 'Version notes' : 'What changed in this revision?'}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={mode === 'create' ? 'Initial upload' : 'Reduced poly count, baked normals'}
        />

        <div className={styles.actions}>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Publishing…' : mode === 'create' ? 'Publish asset' : 'Add new version'}
          </Button>
          {onCancel && <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>}
        </div>
      </div>
    </div>
  );
}
