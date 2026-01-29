#!/usr/bin/env bash
# Ralph Loop — autonomous plan / build orchestrator
# Usage:
#   ./loop.sh              # build mode, infinite iterations
#   ./loop.sh plan         # planning mode, infinite iterations
#   ./loop.sh plan 3       # planning mode, max 3 iterations
#   ./loop.sh 10           # build mode, max 10 iterations

set -euo pipefail

MODE="build"
MAX_ITERATIONS=0  # 0 = unlimited

# Parse arguments
if [[ "${1:-}" == "plan" ]]; then
  MODE="plan"
  shift
fi

if [[ -n "${1:-}" ]]; then
  MAX_ITERATIONS="$1"
fi

PROMPT_FILE="PROMPT_${MODE}.md"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: $PROMPT_FILE not found. Run from the project root."
  exit 1
fi

PROMPT=$(cat "$PROMPT_FILE")

echo "========================================"
echo " Ralph Loop"
echo " Mode:       $MODE"
echo " Prompt:     $PROMPT_FILE"
echo " Max Iters:  ${MAX_ITERATIONS:-unlimited}"
echo "========================================"
echo ""

ITERATION=0

while true; do
  ITERATION=$((ITERATION + 1))

  if [[ "$MAX_ITERATIONS" -gt 0 && "$ITERATION" -gt "$MAX_ITERATIONS" ]]; then
    echo "Reached max iterations ($MAX_ITERATIONS). Stopping."
    break
  fi

  echo "----------------------------------------"
  echo " Iteration $ITERATION — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "----------------------------------------"

  echo "$PROMPT" | claude -p \
    --dangerously-skip-permissions \
    --model opus \
    --verbose

  echo ""
  echo "Iteration $ITERATION complete."
  echo ""
done

echo "========================================"
echo " Ralph Loop finished."
echo "========================================"
