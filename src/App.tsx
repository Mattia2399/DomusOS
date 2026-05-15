import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { EmbeddedDashboardExamplePage } from './pages/Home';
import { GridTestView } from './pages/GridTestView';

export default function App() {
  return (
    <Routes>
      <Route path="/grid-test/*" element={<GridTestView />} />
      <Route path="*" element={<EmbeddedDashboardExamplePage />} />
    </Routes>
  );
}
