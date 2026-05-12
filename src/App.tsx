import React from 'react';
import { EmbeddedDashboardExamplePage } from './pages/Home';
import { GridTestView } from './pages/GridTestView';

export default function App() {
  // Always mount the main application shell so left/right sidebars
  // remain available even on hard refresh over /consumi routes.
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (pathname === '/grid-test' || pathname === '/grid-test/') {
    return <GridTestView />;
  }

  return <EmbeddedDashboardExamplePage />;
}
