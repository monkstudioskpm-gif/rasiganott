import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { HomePage } from '../pages/HomePage';
import { TitleDetailPage } from '../pages/TitleDetailPage';
import { WatchPage } from '../pages/WatchPage';
import { ReelsPage } from '../pages/ReelsPage';
import { BrowsePage } from '../pages/BrowsePage';
import { CategoryPage } from '../pages/CategoryPage';
import { SearchPage } from '../pages/SearchPage';
import { LibraryPage } from '../pages/LibraryPage';
import { LoginPage } from '../pages/LoginPage';

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
  const isReels = location.pathname === '/reels';
  const isWatch = location.pathname.startsWith('/watch');

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-gray-100">
      {!isReels && !isWatch && <Header />}
      <main className={isReels || isWatch ? 'flex-1 w-full' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/title/:slug" element={<TitleDetailPage />} />
          <Route path="/watch/:titleId" element={<WatchPage />} />
          <Route path="/watch/:titleId/:episodeId" element={<WatchPage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/browse/:kind" element={<BrowsePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/login" element={<LoginPage />} />
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
