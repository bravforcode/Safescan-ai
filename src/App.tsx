import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingModal } from './components/OnboardingModal';
import { useAuth } from './context/AuthContext';

// Code-split all page-level components
const HomePage          = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ScanPage          = lazy(() => import('./pages/ScanPage').then(m => ({ default: m.ScanPage })));
const AlertsPage        = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const CartPage          = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const LoginPage         = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ProfilePage       = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const FavoritesPage     = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const HistoryPage       = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const CommunityPage     = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const DiaryPage         = lazy(() => import('./pages/DiaryPage').then(m => ({ default: m.DiaryPage })));
const DictionaryPage    = lazy(() => import('./pages/DictionaryPage').then(m => ({ default: m.DictionaryPage })));

// Fallback component for route loading
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fadeIn">
      <div className="space-y-4 text-center">
        <div className="flex gap-2 justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm text-gray-500 font-medium">กำลังโหลดหน้า...</p>
      </div>
    </div>
  );
}

// Preload heavy pages on app mount
function preloadPage(importFn: () => Promise<unknown>) {
  importFn().catch(() => {});
}

function AppLayout() {
  const { user, profile, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Preload all lazy routes on mount
  useEffect(() => {
    preloadPage(() => import('./pages/ProductDetailPage'));
    preloadPage(() => import('./pages/ProfilePage'));
    preloadPage(() => import('./pages/FavoritesPage'));
    preloadPage(() => import('./pages/HistoryPage'));
    preloadPage(() => import('./pages/CommunityPage'));
    preloadPage(() => import('./pages/DiaryPage'));
    preloadPage(() => import('./pages/DictionaryPage'));
  }, []);

  // Show onboarding for brand-new users (no allergens set, no scans yet)
  useEffect(() => {
    if (!loading && user && profile) {
      const isNew = (profile.allergens?.length ?? 0) === 0 && profile.scan_count === 0;
      const seenKey = `safescan_onboarded_${user.id}`;
      if (isNew && !localStorage.getItem(seenKey)) {
        localStorage.setItem(seenKey, '1');
        // Slight delay so the page loads first
        const t = setTimeout(() => setShowOnboarding(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, [user, profile, loading]);

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 w-full min-h-screen flex flex-col">
        <div className="w-full max-w-5xl mx-auto flex-1">
          <ErrorBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/"                  element={<HomePage />} />
                <Route path="/scan"              element={<ScanPage />} />
                <Route path="/product/:barcode"  element={<ProductDetailPage />} />
                <Route path="/alerts"            element={<AlertsPage />} />
                <Route path="/profile"           element={<ProfilePage />} />
                <Route path="/cart"              element={<CartPage />} />
                <Route path="/login"             element={<LoginPage />} />
                <Route path="/favorites"         element={<FavoritesPage />} />
                <Route path="/history"           element={<HistoryPage />} />
                <Route path="/community"         element={<CommunityPage />} />
                <Route path="/diary"             element={<DiaryPage />} />
                <Route path="/dictionary"        element={<DictionaryPage />} />
                <Route path="*"                  element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <BottomNav />
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppLayout />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
