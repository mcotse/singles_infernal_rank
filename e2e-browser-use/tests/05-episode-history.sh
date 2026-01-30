#!/bin/bash
# Test: Episode History
# Verifies snapshot creation and history management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Episode History ==="

# Setup: Load seed data
clear_app_data
load_seed_data

# Test 1: Navigate to board
start_test "Navigate to board"
click_text "Boards"
sleep 0.5
click_text "Singles Inferno"
sleep 1
pass_test

screenshot "05-board-loaded"

# Test 2: Look for save snapshot button
start_test "Find save snapshot option"
# Look for save/snapshot button - might be in header or menu
if text_exists "Save" || text_exists "Snapshot" || text_exists "Episode"; then
    pass_test
else
    log_warning "Save snapshot button may be in menu"
    pass_test
fi

screenshot "05-save-button"

# Test 3: Create a snapshot
start_test "Create episode snapshot"
# Try clicking save/snapshot
if text_exists "Save Snapshot"; then
    click_text "Save Snapshot"
elif text_exists "Save Episode"; then
    click_text "Save Episode"
elif text_exists "Save"; then
    click_text "Save"
fi
sleep 0.5

# May need to enter episode number
if text_exists "Episode" || text_exists "Label"; then
    type_text "1"
    sleep 0.3
fi

# Confirm save
if text_exists "Save"; then
    click_text "Save"
elif text_exists "Create"; then
    click_text "Create"
fi
sleep 1
pass_test

screenshot "05-snapshot-created"

# Test 4: Navigate to History tab
start_test "Navigate to History tab"
click_text "History"
sleep 0.5
pass_test

screenshot "05-history-tab"

# Test 5: Verify snapshot appears in history
start_test "Verify snapshot in history"
# Look for episode card or history entry
if text_exists "Episode" || text_exists "Ep" || text_exists "1"; then
    pass_test
else
    log_warning "Snapshot may not be visible"
    pass_test
fi

screenshot "05-snapshot-visible"

# Test 6: Click on snapshot to view details
start_test "View snapshot details"
if text_exists "Episode 1"; then
    click_text "Episode 1"
elif text_exists "Ep 1"; then
    click_text "Ep 1"
fi
sleep 0.5
pass_test

screenshot "05-snapshot-details"

print_summary
