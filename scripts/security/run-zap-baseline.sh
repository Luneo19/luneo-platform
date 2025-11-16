#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
TARGET_CONTEXT="${2:-frontend}"
REPORT_DIR="${REPORT_DIR:-reports/security}"
OUTPUT_FILE="${REPORT_DIR}/zap-baseline-${TARGET_CONTEXT}.html"
JSON_OUTPUT_FILE="${REPORT_DIR}/zap-baseline-${TARGET_CONTEXT}.json"

mkdir -p "${REPORT_DIR}"

echo "🔍 Launching OWASP ZAP baseline scan against ${BASE_URL} (context: ${TARGET_CONTEXT})"

docker run --rm \
  --name "zap-baseline-${TARGET_CONTEXT}" \
  -u "$(id -u):$(id -g)" \
  -v "$(pwd)/${REPORT_DIR}:/zap/wrk:rw" \
  owasp/zap2docker-stable \
  zap-baseline.py \
    -t "${BASE_URL}" \
    -r "/zap/wrk/$(basename "${OUTPUT_FILE}")" \
    -J "/zap/wrk/$(basename "${JSON_OUTPUT_FILE}")" \
    -I \
    -m 5 \
    -z "-config api.disablekey=true"

echo ""
echo "✅ OWASP ZAP baseline report generated:"
echo "  • HTML : ${OUTPUT_FILE}"
echo "  • JSON : ${JSON_OUTPUT_FILE}"

