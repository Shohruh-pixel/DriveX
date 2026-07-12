#!/bin/sh
set -e

if [ ! -f /app/data/service-centers.json ]; then
  echo "Seeding empty volume from image defaults..."
  cp -rn /app/data-seed/. /app/data/
fi

exec node server.js
