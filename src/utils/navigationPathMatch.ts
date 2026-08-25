type ParsedNavigationTarget = {
  pathname: string;
  hash: string;
  search: string;
  view: string;
  pathSegments: string[];
  hashSegments: string[];
};

function parsePathSegments(value: string) {
  return value
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function parseHashSegments(value: string) {
  const normalized = value.replace(/^#/, '').replace(/^\//, '');
  if (!normalized) {
    return [];
  }
  return parsePathSegments(normalized);
}

function parseNavigationTarget(value: string): ParsedNavigationTarget | null {
  try {
    const parsed = new URL(value, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const search = parsed.search.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    return {
      pathname,
      hash,
      search,
      view,
      pathSegments: parsePathSegments(pathname),
      hashSegments: parseHashSegments(hash),
    };
  } catch {
    return null;
  }
}

function stripIngressPrefix(pathSegments: string[]) {
  if (pathSegments.length < 2) {
    return pathSegments;
  }
  if (
    pathSegments[0] === 'api' &&
    pathSegments[1] === 'hassio_ingress' &&
    pathSegments.length >= 3
  ) {
    return pathSegments.slice(3);
  }
  if (
    pathSegments[0] === 'hassio' &&
    pathSegments[1] === 'ingress' &&
    pathSegments.length >= 3
  ) {
    return pathSegments.slice(3);
  }
  if (pathSegments[0] === 'hassio_ingress' && pathSegments.length >= 2) {
    return pathSegments.slice(2);
  }
  return pathSegments;
}

function buildSegmentCandidates(pathSegments: string[]) {
  const direct = pathSegments;
  const stripped = stripIngressPrefix(pathSegments);
  if (stripped === direct) {
    return [direct];
  }
  const strippedKey = stripped.join('/');
  if (!strippedKey) {
    return [direct];
  }
  return [direct, stripped];
}

function containsContiguousSegments(source: string[], target: string[]) {
  if (target.length === 0 || source.length < target.length) {
    return false;
  }
  for (let start = 0; start <= source.length - target.length; start += 1) {
    let isMatch = true;
    for (let offset = 0; offset < target.length; offset += 1) {
      if (source[start + offset] !== target[offset]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      return true;
    }
  }
  return false;
}

function matchesBySegments(
  currentPathSegments: string[],
  currentHashSegments: string[],
  targetSegments: string[],
) {
  if (targetSegments.length === 0) {
    return false;
  }
  const sourcePathCandidates = buildSegmentCandidates(currentPathSegments);
  if (
    sourcePathCandidates.some((candidate) =>
      containsContiguousSegments(candidate, targetSegments),
    )
  ) {
    return true;
  }
  return containsContiguousSegments(currentHashSegments, targetSegments);
}

export function isPathActiveForLocation(path: string, currentLocation: string) {
  const target = path.trim().toLowerCase();
  const normalizedCurrentLocation = currentLocation.trim();
  if (!target || !normalizedCurrentLocation) {
    return false;
  }
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return normalizedCurrentLocation.toLowerCase().startsWith(target);
  }

  const current = parseNavigationTarget(normalizedCurrentLocation);
  if (!current) {
    return false;
  }

  if (target.startsWith('#')) {
    if (current.hash === target) {
      return true;
    }
    const targetHashSegments = parseHashSegments(target);
    return matchesBySegments(current.pathSegments, current.hashSegments, targetHashSegments);
  }

  if (target.startsWith('?')) {
    if (current.search === target) {
      return true;
    }
    const targetParams = new URLSearchParams(target.slice(1));
    const targetView = (targetParams.get('view') ?? '').trim().toLowerCase();
    return targetView.length > 0 && targetView === current.view;
  }

  const targetRoute = parseNavigationTarget(target);
  if (!targetRoute) {
    return false;
  }

  if (targetRoute.pathname === '/') {
    return current.pathname === '/';
  }

  if (
    current.pathname === targetRoute.pathname ||
    current.pathname.startsWith(`${targetRoute.pathname}/`)
  ) {
    return true;
  }

  if (targetRoute.view && targetRoute.view === current.view) {
    return true;
  }

  if (targetRoute.hash && targetRoute.hash === current.hash) {
    return true;
  }

  const targetPathCandidates = buildSegmentCandidates(targetRoute.pathSegments);
  return targetPathCandidates.some((candidate) =>
    matchesBySegments(current.pathSegments, current.hashSegments, candidate),
  );
}

export function isPathActiveForCurrentLocation(path: string) {
  if (typeof window === 'undefined') {
    return false;
  }
  return isPathActiveForLocation(path, window.location.href);
}
