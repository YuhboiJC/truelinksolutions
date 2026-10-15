#!/usr/bin/env bash
# Builds the marketing site + TrueLink HQ dashboard into one folder and zip
# ready to upload to Hostinger public_html.
set -euo pipefail
cd "$(dirname "$0")"
(cd web && npm ci && npm run build)
(cd hq && npm ci && npm run build)
rm -rf release && mkdir -p release/site
cp -r web/dist/. release/site/
mkdir -p release/site/hq && cp -r hq/dist/. release/site/hq/
(cd release/site && zip -qr ../truelink-site.zip .)
echo "Built release/truelink-site.zip"
