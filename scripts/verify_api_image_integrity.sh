#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-chamberofcommerceai-api:local}"

echo "== Verify API image integrity =="
echo "Image: ${IMAGE_TAG}"

docker run --rm --entrypoint sh "${IMAGE_TAG}" -lc '
  set -eu
  cd /app

  for target in \
    src/services/geo_intelligence.js \
    src/routes/geo_intelligence.js
  do
    if [ ! -s "${target}" ]; then
      echo "Critical module missing or empty: ${target}" >&2
      exit 1
    fi
  done

  node --input-type=module -e "
    const service = await import(\"./src/services/geo_intelligence.js\");
    const route = await import(\"./src/routes/geo_intelligence.js\");
    const requiredServiceExports = [\"buildGeoProfile\", \"buildGeoContentBrief\"];
    for (const key of requiredServiceExports) {
      if (!(key in service)) {
        throw new Error(\"Missing service export: \" + key);
      }
    }
    if (!(\"default\" in route)) {
      throw new Error(\"Missing default export in geo route module\");
    }
    console.log(JSON.stringify({
      service_exports: Object.keys(service).sort(),
      route_exports: Object.keys(route).sort()
    }));
  "
'

echo "API image integrity verified."
