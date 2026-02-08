#!/bin/bash
# ============================================
# Cursor Memory Diagnostic & Cleanup
# Run: bash scripts/cursor-memory-check.sh
# ============================================

echo "=========================================="
echo "  CURSOR MEMORY DIAGNOSTIC"
echo "=========================================="
echo ""

# System info
RAM_GB=$(sysctl -n hw.memsize | awk '{printf "%.0f", $1/1024/1024/1024}')
echo "System RAM: ${RAM_GB} GB"
sysctl vm.swapusage 2>/dev/null
echo ""

# Cursor processes memory
echo "--- Cursor Processes (sorted by memory) ---"
ps aux | grep -i "[C]ursor" | awk '{printf "%-8s %6s MB  %5s%% CPU  %s\n", $2, $6/1024, $3, $11}' | sort -t'M' -k2 -rn | head -20
echo ""

# Total Cursor memory
TOTAL_MB=$(ps aux | grep -i "[C]ursor" | awk '{sum+=$6} END {printf "%.0f", sum/1024}')
echo "TOTAL Cursor Memory: ${TOTAL_MB} MB (${RAM_GB} GB available)"
echo ""

# Warning levels
if [ "$TOTAL_MB" -gt 6000 ]; then
    echo "⚠️  CRITICAL: Cursor uses >${TOTAL_MB}MB. Restart Cursor NOW!"
    echo "   Run: killall 'Cursor Helper' ; open -a Cursor"
elif [ "$TOTAL_MB" -gt 4000 ]; then
    echo "⚠️  WARNING: Cursor uses ${TOTAL_MB}MB. Consider starting a new chat."
else
    echo "✅ OK: Cursor memory usage is normal (${TOTAL_MB}MB)"
fi

echo ""
echo "--- Tips to reduce memory ---"
echo "1. Start a NEW chat (Cmd+L) instead of continuing long ones"
echo "2. Close unused editor tabs (Cmd+W)"
echo "3. If > 6GB: Restart Cursor (Cmd+Q then reopen)"
echo "4. Clear chat history: Cmd+Shift+P > 'Clear Chat'"
echo ""

# Node processes that might be orphaned
echo "--- Orphaned Node processes ---"
ps aux | grep "[n]ode" | grep -v "Cursor" | awk '{printf "PID %-8s %6s MB  %s\n", $2, $6/1024, $11}' | head -10
echo ""

echo "Done."
