import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/auth-context.js';
import { AppShell } from './app-shell.js';
import { AuthPage } from './pages/auth-page.js';
import { LibraryPage } from './pages/library-page.js';
import { UploadPage } from './pages/upload-page.js';
import { AssetPage } from './pages/asset-page.js';
import { Loading } from './components/ui.js';
import themeStyles from './theme.module.css';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <Loading label="Loading…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Routing() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />}/>
      <Route element={<Protected> <AppShell /></Protected>}>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/assets/:id" element={<AssetPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export function AssetHubApp() {
  return (
    <div className={themeStyles.theme}>
    <AuthProvider>
      <Routing />
    </AuthProvider>
    </div>
  );
}