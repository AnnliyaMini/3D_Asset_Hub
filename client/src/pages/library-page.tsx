import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api.js';
import type { Asset, Facets, LibraryStats } from '../types/types.js';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loading,
  Stars,
  formatBytes,
  formatNumber,
  formatDate,
} from '../components/ui.js';
import styles from './pages.module.css';
import uiStyles from '../components/ui.module.css';

/**
 * Searchable and filterable grid of every asset in the library.
 */
export function LibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [collection, setCollection] = useState('All');
  const [format, setFormat] = useState('');

  /*
   * Load the complete library once.
   * Filtering happens locally below.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      setLoading(true);

      try {
        const [assetData, facetData, statsData] = await Promise.all([
          api.listAssets({}),
          api.getFacets(),
          api.getStats(),
        ]);

        if (cancelled) return;

        setAssets(assetData);
        setFacets(facetData);
        setStats(statsData);
      } catch {
        if (!cancelled) {
          setAssets([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Apply ALL active filters to the loaded assets.
   */
  const filteredAssets = useMemo(() => {
    const query = q.trim().toLowerCase();

    return assets.filter((asset) => {
      /*
       * Search:
       * name
       * description
       * tags
       * collection
       */
      const matchesSearch =
        !query ||
        asset.name.toLowerCase().includes(query) ||
        asset.description.toLowerCase().includes(query) ||
        asset.collectionName.toLowerCase().includes(query) ||
        (asset.tags || []).some((tag) =>
          tag.toLowerCase().includes(query)
        );

      /*
       * Collection.
       */
      const matchesCollection =
        collection === 'All' ||
        asset.collectionName === collection;

      /*
       * Tags.
       *
       * If multiple tags are selected, the asset must contain
       * ALL selected tags.
       */
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((selectedTag) =>
          (asset.tags || []).includes(selectedTag)
        );

      /*
       * Format.
       *
       * We are currently supporting GLB only.
       */
      const assetFormat =
        asset.latest?.metadata?.format?.toLowerCase() ||
        asset.latest?.fileName
          ?.split('.')
          .pop()
          ?.toLowerCase() ||
        '';

      const matchesFormat =
        !format ||
        assetFormat === format.toLowerCase();

      return (
        matchesSearch &&
        matchesCollection &&
        matchesTags &&
        matchesFormat
      );
    });
  }, [assets, q, activeTags, collection, format]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const hasFilters =
    q.trim() !== '' ||
    activeTags.length > 0 ||
    collection !== 'All' ||
    format !== '';

  const statCards = useMemo(
    () => [
      {
        label: 'Assets',
        value: formatNumber(stats?.assets || 0),
      },
      {
        label: 'Versions',
        value: formatNumber(stats?.versions || 0),
      },
      {
        label: 'Triangles',
        value: formatNumber(stats?.triangles || 0),
      },
      {
        label: 'Storage',
        value: formatBytes(stats?.bytes || 0),
      },
      {
        label: 'Comments',
        value: formatNumber(stats?.comments || 0),
      },
    ],
    [stats]
  );

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Asset Library</h1>

          <p className={styles.pageSub}>
            Browse, search and inspect every 3D asset in your organisation.
          </p>
        </div>

        <Link to="/upload">
          <Button>＋ Upload asset</Button>
        </Link>
      </div>

      <div className={styles.statGrid}>
        {statCards.map((s) => (
          <Card key={s.label} className={styles.stat}>
            <div className={styles.statValue}>
              {s.value}
            </div>

            <div className={styles.statLabel}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.libraryLayout}>
        <Card className={styles.filters}>
          {/* COLLECTIONS */}
          <div className={styles.filterGroup}>
            <span className={styles.filterTitle}>
              Collections
            </span>

            <div className={styles.chips}>
              {['All', ...(facets?.collections || [])].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.chip} ${
                      collection === c
                        ? styles.chipActive
                        : ''
                    }`}
                    onClick={() => setCollection(c)}
                  >
                    {c}
                  </button>
                )
              )}
            </div>
          </div>

          {/* FORMAT */}
          <div className={styles.filterGroup}>
            <span className={styles.filterTitle}>
              Formats
            </span>

            <div className={styles.chips}>
              {(facets?.formats || []).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.chip} ${
                    format === f
                      ? styles.chipActive
                      : ''
                  }`}
                  onClick={() =>
                    setFormat(format === f ? '' : f)
                  }
                >
                  .{f}
                </button>
              ))}

              {!facets?.formats?.length && (
                <span className={styles.kvKey}>
                  No assets yet
                </span>
              )}
            </div>
          </div>

          {/* TAGS */}
          <div className={styles.filterGroup}>
            <span className={styles.filterTitle}>
              Tags
            </span>

            <div className={styles.chips}>
              {(facets?.tags || []).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.chip} ${
                    activeTags.includes(tag)
                      ? styles.chipActive
                      : ''
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}

              {!facets?.tags?.length && (
                <span className={styles.kvKey}>
                  No tags yet
                </span>
              )}
            </div>
          </div>

          {/* CLEAR */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('');
                setActiveTags([]);
                setCollection('All');
                setFormat('');
              }}
            >
              Clear all filters
            </Button>
          )}
        </Card>

        <div>
          {/* SEARCH */}
          <div className={styles.searchBar}>
            <input
              className={`${uiStyles.input} ${styles.searchInput}`}
              placeholder="Search by name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading && (
            <Loading label="Loading assets…" />
          )}

          {!loading && filteredAssets.length === 0 && (
            <EmptyState
              icon="🗂️"
              title={
                hasFilters
                  ? 'No assets match those filters'
                  : 'Your library is empty'
              }
              hint={
                hasFilters
                  ? 'Try clearing a filter or searching for something else.'
                  : 'Upload your first 3D asset to get started.'
              }
            />
          )}

          {!loading && filteredAssets.length > 0 && (
            <>
              <div
                style={{
                  marginBottom: 12,
                  color: 'var(--muted)',
                  fontSize: 13,
                }}
              >
                Showing {filteredAssets.length} of {assets.length}{' '}
                assets
              </div>

              <div className={styles.grid}>
                {filteredAssets.map((asset) => (
                  <Card
                    key={asset.id}
                    className={styles.assetCard}
                  >
                    <Link
                      to={`/assets/${asset.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      {asset.latest?.thumbnail ? (
                        <img
                          src={asset.latest.thumbnail}
                          alt={asset.name}
                          className={styles.assetThumb}
                        />
                      ) : (
                        <div className={styles.assetThumb}>
                          🧊
                        </div>
                      )}

                      <div className={styles.assetBody}>
                        <div className={styles.assetName}>
                          {asset.name}
                        </div>

                        <div className={styles.tagRow}>
                          <Badge tone="accent">
                            .{asset.latest?.metadata.format}
                          </Badge>

                          <Badge>
                            v{asset.versions?.length || 1}
                          </Badge>

                          {(asset.tags || [])
                            .slice(0, 2)
                            .map((tag) => (
                              <Badge key={tag}>
                                {tag}
                              </Badge>
                            ))}
                        </div>

                        <div className={styles.assetMeta}>
                          <span>
                            {formatNumber(
                              asset.latest?.metadata
                                .triangles || 0
                            )}{' '}
                            tris
                          </span>

                          <span>
                            {formatBytes(
                              asset.latest?.metadata
                                .fileSize || 0
                            )}
                          </span>
                        </div>

                        <div className={styles.assetMeta}>
                          <span>
                            {asset.ownerName} ·{' '}
                            {formatDate(asset.updatedAt)}
                          </span>

                          {asset.ratingCount > 0 && (
                            <Stars
                              value={asset.averageRating}
                            />
                          )}
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}