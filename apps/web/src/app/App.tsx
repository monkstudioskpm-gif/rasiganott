import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ProtectedRoute } from '../components/AdminGuard';
import { AdminLayout } from '../components/AdminLayout';
import { CreatorLayout } from '../components/CreatorLayout';
import { HomePage } from '../pages/HomePage';
import { TitleDetailPage } from '../pages/TitleDetailPage';
import { WatchPage } from '../pages/WatchPage';
import { ShotsPage } from '../pages/ShotsPage';
import { BrowsePage } from '../pages/BrowsePage';
import { CategoryPage } from '../pages/CategoryPage';
import { SearchPage } from '../pages/SearchPage';
import { LibraryPage } from '../pages/LibraryPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminPeoplePage } from '../pages/admin/AdminPeoplePage';
import { AdminGenresPage } from '../pages/admin/AdminGenresPage';
import { AdminContentFormPage } from '../pages/admin/AdminContentFormPage';
import { CreatorDashboardPage } from '../pages/creator/CreatorDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppContent() {
  const location = useLocation();
  const isWatch = location.pathname.startsWith('/watch');
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/people');
  const isCreator = location.pathname.startsWith('/creator');
  const isShots = location.pathname.startsWith('/shots') || location.pathname.startsWith('/reels');
  const isCustomLayout = isWatch || isAdmin || isCreator;

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-gray-100 font-sans">
      {!isCustomLayout && <Header />}

      <main className={isCustomLayout || isShots ? 'flex-1 w-full' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/title/:slug" element={<TitleDetailPage />} />
          <Route path="/watch/:titleId" element={<WatchPage />} />
          <Route path="/watch/:titleId/:episodeId" element={<WatchPage />} />
          <Route path="/shots" element={<ShotsPage />} />
          <Route path="/reels" element={<Navigate to="/shots" replace />} />
          <Route path="/browse/:kind" element={<BrowsePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<LibraryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/creator"
            element={
              <ProtectedRoute requiredRole="CREATOR">
                <CreatorLayout>
                  <CreatorDashboardPage />
                </CreatorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titles"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/people"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminPeoplePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/people"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminPeoplePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/genres"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminGenresPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titles/new"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminContentFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titles/:id/edit"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout>
                  <AdminContentFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <h2 className="text-4xl font-extrabold text-white">404</h2>
                <p className="text-gray-400">Page not found.</p>
                <a href="/" className="px-5 py-2.5 bg-sky-500 text-white font-semibold rounded-xl text-sm">
                  Return Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
