#!/bin/bash
#
# OWASP ZAP Baseline Security Scan
# 
# This script runs OWASP ZAP baseline scan against the application
# and generates a security report. Designed for CI/CD integration.
#
# Prerequisites:
# - Docker installed
# - Application running and accessible
#
# Usage:
#   ./scripts/security/run-zap-baseline.sh <target-url> [report-output-dir]
#
# Example:
#   ./scripts/security/run-zap-baseline.sh https://app.luneo.app ./security-reports

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TARGET_URL="${1:-}"
REPORT_DIR="${2:-./security-reports}"
ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable"
TIMEOUT="${ZAP_TIMEOUT:-600}" # 10 minutes default
FAIL_ON_HIGH="${ZAP_FAIL_ON_HIGH:-true}"
FAIL_ON_MEDIUM="${ZAP_FAIL_ON_MEDIUM:-false}"

# Validate inputs
if [ -z "$TARGET_URL" ]; then
  echo -e "${RED}Error: Target URL is required${NC}"
  echo "Usage: $0 <target-url> [report-output-dir]"
  exit 1
fi

# Create report directory
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/zap-report-$(date +%Y%m%d-%H%M%S).html"
JSON_REPORT="$REPORT_DIR/zap-report-$(date +%Y%m%d-%H%M%S).json"

echo -e "${GREEN}Starting OWASP ZAP Baseline Scan${NC}"
echo "Target URL: $TARGET_URL"
echo "Report directory: $REPORT_DIR"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
  exit 1
fi

# Pull latest ZAP image
echo -e "${YELLOW}Pulling OWASP ZAP image...${NC}"
docker pull "$ZAP_IMAGE" || {
  echo -e "${RED}Failed to pull ZAP image${NC}"
  exit 1
}

# Run ZAP baseline scan
echo -e "${YELLOW}Running ZAP baseline scan...${NC}"
echo "This may take several minutes..."

docker run --rm \
  -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
  "$ZAP_IMAGE" \
  zap-baseline.py \
  -t "$TARGET_URL" \
  -J \
  -j \
  -r "zap-report.html" \
  -I \
  --hook "/zap/auth_hook.py" \
  -d \
  -m "$TIMEOUT" \
  || ZAP_EXIT_CODE=$?

# Check if scan completed
if [ ${ZAP_EXIT_CODE:-0} -ne 0 ] && [ ${ZAP_EXIT_CODE:-0} -ne 2 ]; then
  echo -e "${RED}ZAP scan failed with exit code: ${ZAP_EXIT_CODE}${NC}"
  exit 1
fi

# Move reports to proper location
if [ -f "$REPORT_DIR/zap-report.html" ]; then
  mv "$REPORT_DIR/zap-report.html" "$REPORT_FILE"
  echo -e "${GREEN}HTML report saved to: $REPORT_FILE${NC}"
fi

if [ -f "$REPORT_DIR/zap-report.json" ]; then
  mv "$REPORT_DIR/zap-report.json" "$JSON_REPORT"
  echo -e "${GREEN}JSON report saved to: $JSON_REPORT${NC}"
fi

# Parse results and check thresholds
if [ -f "$JSON_REPORT" ]; then
  echo ""
  echo -e "${YELLOW}Scan Results Summary:${NC}"
  
  # Extract counts (requires jq)
  if command -v jq &> /dev/null; then
    HIGH_COUNT=$(jq -r '.site[] | select(.@name == "'"$TARGET_URL"'") | .alerts[] | select(.riskcode == "3") | .name' "$JSON_REPORT" | wc -l | tr -d ' ')
    MEDIUM_COUNT=$(jq -r '.site[] | select(.@name == "'"$TARGET_URL"'") | .alerts[] | select(.riskcode == "2") | .name' "$JSON_REPORT" | wc -l | tr -d ' ')
    LOW_COUNT=$(jq -r '.site[] | select(.@name == "'"$TARGET_URL"'") | .alerts[] | select(.riskcode == "1") | .name' "$JSON_REPORT" | wc -l | tr -d ' ')
    INFO_COUNT=$(jq -r '.site[] | select(.@name == "'"$TARGET_URL"'") | .alerts[] | select(.riskcode == "0") | .name' "$JSON_REPORT" | wc -l | tr -d ' ')
    
    echo "  High risk findings: $HIGH_COUNT"
    echo "  Medium risk findings: $MEDIUM_COUNT"
    echo "  Low risk findings: $LOW_COUNT"
    echo "  Informational findings: $INFO_COUNT"
    
    # Fail build if thresholds exceeded
    if [ "$FAIL_ON_HIGH" = "true" ] && [ "$HIGH_COUNT" -gt 0 ]; then
      echo -e "${RED}Build failed: High risk findings detected${NC}"
      exit 1
    fi
    
    if [ "$FAIL_ON_MEDIUM" = "true" ] && [ "$MEDIUM_COUNT" -gt 0 ]; then
      echo -e "${RED}Build failed: Medium risk findings detected${NC}"
      exit 1
    fi
    
    if [ "$HIGH_COUNT" -eq 0 ] && [ "$MEDIUM_COUNT" -eq 0 ]; then
      echo -e "${GREEN}✓ No high or medium risk findings${NC}"
    fi
  else
    echo "  Install 'jq' for detailed summary parsing"
  fi
fi

echo ""
echo -e "${GREEN}ZAP baseline scan completed${NC}"
echo "Reports available in: $REPORT_DIR"

# Exit with ZAP exit code (2 = warnings, 0 = success)
exit ${ZAP_EXIT_CODE:-0}
