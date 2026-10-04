import { useNavigate } from 'react-router-dom';
import * as api from '../services/api.js';
import { UploadPanel } from '../components/upload-panel.js';
import { Card } from '../components/ui.js';
import styles from './pages.module.css';

/**
 * page for publishing a brand new asset into the library.
 */
export function UploadPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Upload a 3D asset</h1>
          <p className={styles.pageSub}>
            Drop a model to parse it in the browser — metadata and a preview thumbnail are generated automatically.
          </p>
        </div>
      </div>

      <Card style={{ padding: 22 }}>
        <UploadPanel
          onCancel={() => navigate('/')}
          onSubmit={async ({ processed, name, description, tags, collectionName, notes }) => {
            const uploaded = await api.uploadFile(processed.file);
            const asset = await api.createAsset({
              name,
              description,
              tags,
              collectionName,
              fileName: uploaded.fileName,
              storedName: uploaded.storedName,
              thumbnail: processed.thumbnail,
              metadata: processed.metadata,
              notes,
            });
            navigate(`/assets/${asset.id}`);
          }}
        />
      </Card>
    </>
  );
}
