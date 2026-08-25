import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  isDemoRouteAllowed,
  readSetupJourney,
  saveSetupJourney,
  type SetupJourney,
} from '../../services/setupJourney';
import GlassLoader from '../ui/GlassLoader';
import { DemoLockedRoute, OnboardingExperience } from './OnboardingExperience';
import { useDeviceAppearance } from './OnboardingGlass';

const DashboardPage = React.lazy(() => import('../../pages/Home'));

export function isSetupRoute(pathname: string) {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return normalized === '/setup' || normalized.startsWith('/setup/');
}

export function shouldForceCompletedConfiguration(pathname: string, phase: SetupJourney['phase']) {
  return isSetupRoute(pathname) && phase === 'done';
}

function DashboardLoading() {
  const appearance = useDeviceAppearance();
  return (
    <div
      className={`apple-bg-main flex min-h-[100dvh] items-center justify-center ${
        appearance === 'light' ? 'dashboard-theme-light' : 'dashboard-theme-dark'
      }`}
    >
      <GlassLoader
        size="lg"
        label="Preparazione dashboard…"
        description="Carichiamo la tua casa e i relativi controlli."
      />
    </div>
  );
}

export function ExperienceGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<SetupJourney>(() => {
    return readSetupJourney(window.localStorage, {
      embedded: window.parent !== window,
    });
  });
  const handleJourneyChange = useCallback((next: SetupJourney) => setJourney(next), []);
  const setupRoute = isSetupRoute(location.pathname);
  const forceConfiguration = shouldForceCompletedConfiguration(location.pathname, journey.phase);

  useEffect(() => {
    if (journey.phase === 'done' && journey.mode === 'demo' && location.pathname === '/') {
      navigate('/home', { replace: true });
    }
  }, [journey.mode, journey.phase, location.pathname, navigate]);

  if (journey.phase !== 'done' || setupRoute) {
    return (
      <OnboardingExperience
        journey={journey}
        onJourneyChange={handleJourneyChange}
        forceConfiguration={forceConfiguration}
      />
    );
  }

  if (journey.mode === 'demo' && !isDemoRouteAllowed(location.pathname)) {
    return (
      <DemoLockedRoute
        pathname={location.pathname}
        onConnect={() => {
          const embedded = window.parent !== window;
          const next = saveSetupJourney({
            phase: 'discover',
            mode: 'real',
            connectionMethod: embedded ? 'panel' : 'direct',
          }, window.localStorage);
          setJourney(next);
          navigate('/setup');
        }}
      />
    );
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPage />
    </Suspense>
  );
}

export default ExperienceGate;
