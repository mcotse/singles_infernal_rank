#!/bin/bash
# Kill orphaned vitest/bun test processes
# Safe to run - only kills vitest-related processes, not dev servers

# Kill vitest parent processes
pkill -f "vitest" 2>/dev/null

# Kill orphaned bun workers from vitest
pkill -f "vitest/dist/workers" 2>/dev/null

# Give processes time to terminate gracefully
sleep 0.5

# Force kill any remaining
pkill -9 -f "vitest" 2>/dev/null
pkill -9 -f "vitest/dist/workers" 2>/dev/null

echo "Cleaned up vitest processes"
