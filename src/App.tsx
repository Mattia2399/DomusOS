import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { EmbeddedDashboardExamplePage } from './pages/Home';
import { BetaLandingPage } from './pages/BetaLandingPage';

const GridTestView = import.meta.env.DEV ? React.lazy(() => import('./pages/GridTestView')) : null;

export default function App() {
  return (
    <div className="apple-bg-main min-h-screen">
      <Routes>
        <Route path="/beta" element={<BetaLandingPage />} />
        {GridTestView ? (
          <Route
            path="/grid-test/*"
            element={
              <Suspense fallback={null}>
                <GridTestView />
              </Suspense>
            }
          />
        ) : null}
        <Route path="*" element={<EmbeddedDashboardExamplePage />} />
      </Routes>
    </div>
  );
}
