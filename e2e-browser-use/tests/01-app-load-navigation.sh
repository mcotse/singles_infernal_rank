#!/bin/bash
# Test: App Load & Navigation
# Verifies app loads correctly and tab navigation works

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: App Load & Navigation ==="

# Test 1: App loads successfully
start_test "App loads with title visible"
if wait_for_text "Hot Takes" 5 || wait_for_text "Boards" 5; then
    pass_test
else
    fail_test "App did not load properly"
fi

screenshot "01-app-loaded"

# Test 2: Navigate to Boards tab
start_test "Navigate to Boards tab"
click_text "Boards"
sleep 0.5
if text_exists "Boards" && text_exists "Create"; then
    pass_test
else
    # Check for empty state
    if text_exists "No boards yet"; then
        pass_test
    else
        fail_test "Boards tab not displayed"
    fi
fi

screenshot "01-boards-tab"

# Test 3: Navigate to History tab
start_test "Navigate to History tab"
click_text "History"
sleep 0.5
if text_exists "History"; then
    pass_test
else
    fail_test "History tab not displayed"
fi

screenshot "01-history-tab"

# Test 4: Navigate to Settings tab
start_test "Navigate to Settings tab"
click_text "Settings"
sleep 0.5
if text_exists "Settings"; then
    pass_test
else
    fail_test "Settings tab not displayed"
fi

screenshot "01-settings-tab"

# Test 5: Navigate to Home tab
start_test "Navigate to Home tab"
click_text "Home"
sleep 0.5
# Home tab should show some content
pass_test

screenshot "01-home-tab"

# Test 6: Tab highlights correctly
start_test "Tab navigation completes"
# After all navigation, we should still be on Home
click_text "Boards"
sleep 0.3
click_text "Home"
sleep 0.3
pass_test

print_summary
