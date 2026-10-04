import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/auth-context.js";
import { Alert, Button, Card, Input } from '../components/ui.js';
import styles from './pages.module.css';

/**
 * combined sign-in / sign-up screen.
 */
export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('admin@assethub.com');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, name, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.authWrap}>
      <Card className={styles.authCard}>
        <div className={styles.authBrand}>
          <span className={styles.logoMark}>🧊</span> Asset Hub
        </div>
        <p className={styles.authSub}>
          {mode === 'signin'
            ? 'Sign in to manage your 3D asset library.'
            : 'Create an account to start uploading assets.'}
        </p>

        <form className={styles.authForm} onSubmit={submit}>
          {error && <Alert>{error}</Alert>}

          {mode === 'signup' && (
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@assethub.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />

          <Button type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className={styles.authSwitch}>
          {mode === 'signin' ? "Don't have an account? " : 'Already registered? '}
          <button
            className={styles.linkButton}
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        {mode === 'signin' && (
          <div className={styles.demoBox}>
            Demo account — <code>admin@assethub.com</code> / <code>admin123</code>
          </div>
        )}
      </Card>
    </div>
  );
}
