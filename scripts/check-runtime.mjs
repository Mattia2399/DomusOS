const MINIMUM_NODE_VERSION = [22, 22, 0];

function parseVersion(version) {
  return version.split('.').map((part) => Number.parseInt(part, 10));
}

function isSupportedNode(version) {
  const current = parseVersion(version);
  return MINIMUM_NODE_VERSION.every((minimumPart, index) => {
    const currentPart = current[index] ?? 0;
    const previousPartsMatch = MINIMUM_NODE_VERSION
      .slice(0, index)
      .every((part, previousIndex) => (current[previousIndex] ?? 0) === part);
    return !previousPartsMatch || currentPart >= minimumPart;
  });
}

if (!isSupportedNode(process.versions.node)) {
  console.error(
    `Node.js ${process.versions.node} non supportato. Usa Node.js 22.22.0 o successivo.`,
  );
  process.exit(1);
}

console.log(`Runtime supportato: Node.js ${process.versions.node}.`);
