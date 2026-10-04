import type { PlatformReport } from '../types/types.js';
import { Badge, Card } from '../components/ui.js';
import styles from '../pages/pages.module.css';

function scoreClass(score: number) {
  if (score >= 85) return styles.scoreReady;
  if (score >= 60) return styles.scoreWarn;
  return styles.scoreFail;
}

function scoreColor(score: number) {
  if (score >= 85) return 'var(--success)';
  if (score >= 60) return 'var(--warn)';
  return 'var(--danger)';
}

const VERDICT_LABEL = {
  ready: 'Ready',
  'needs-work': 'Needs work',
  'not-ready': 'Not ready',
} as const;

const VERDICT_TONE = {
  ready: 'success',
  'needs-work': 'warn',
  'not-ready': 'danger',
} as const;

function checkIcon(passed: boolean) {
  return passed ? '✅' : '❌';
}

/**
 * Renders the multi-platform compatibility assessment
 * for the selected asset version.
 */
export function ReadinessReport({
  reports,
}: {
  reports: PlatformReport[];
}) {
  const ready = reports.filter(
    (report) => report.status === 'ready'
  ).length;

  const work = reports.filter(
    (report) => report.status === 'needs-work'
  ).length;

  const blocked = reports.filter(
    (report) => report.status === 'not-ready'
  ).length;

  return (
    <>
      <div className={styles.summaryBar}>
        <Badge tone="success">
          {ready} ready
        </Badge>

        <Badge tone="warn">
          {work} need work
        </Badge>

        <Badge tone="danger">
          {blocked} not ready
        </Badge>
      </div>

      <div className={styles.reportGrid}>
        {reports.map((report) => (
          <Card
            key={report.platform}
            className={styles.report}
          >
            <div className={styles.reportHead}>
              <span className={styles.reportIcon}>
                {report.icon}
              </span>

              <div>
                <div className={styles.reportName}>
                  {report.platform}
                </div>

                <Badge
                  tone={
                    VERDICT_TONE[report.status] ?? 'warn'
                  }
                >
                  {VERDICT_LABEL[report.status] ??
                    report.status}
                </Badge>
              </div>

              <span
                className={`${styles.reportScore} ${scoreClass(
                  report.score
                )}`}
              >
                {report.score}
              </span>
            </div>

            <div className={styles.scoreTrack}>
              <div
                className={styles.scoreFill}
                style={{
                  width: `${report.score}%`,
                  background: scoreColor(report.score),
                }}
              />
            </div>

            <div>
              {(report.checks ?? []).map((check) => (
                <div
                  key={check.key}
                  className={styles.checkRow}
                >
                  <span className={styles.checkIcon}>
                    {checkIcon(check.passed)}
                  </span>

                  <div className={styles.checkMain}>
                    <div className={styles.checkLabel}>
                      {check.label}
                    </div>

                    <div className={styles.checkNums}>
                      {String(check.actual)}
                      {check.expected !== undefined
                        ? ` · ${String(check.expected)}`
                        : ''}
                    </div>

                    {!check.passed && check.advice && (
                      <div className={styles.checkAdvice}>
                        {check.advice}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}