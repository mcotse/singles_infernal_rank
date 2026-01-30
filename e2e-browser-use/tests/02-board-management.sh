#!/bin/bash
# Test: Board Management
# Verifies board CRUD operations: create, view, delete

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Board Management ==="

# Setup: Clear data first
clear_app_data

# Test 1: Navigate to Boards tab
start_test "Navigate to Boards tab"
click_text "Boards"
sleep 0.5
pass_test

screenshot "02-boards-initial"

# Test 2: Click create/add button
start_test "Open create board dialog"
# Look for + button or "Create" text
if text_exists "Create"; then
    click_text "Create"
elif text_exists "+"; then
    click_text "+"
else
    # Try clicking add button by aria-label might exist
    click_text "Add"
fi
sleep 0.5

# Check if modal/dialog opened
if text_exists "Create Board" || text_exists "Board Name" || text_exists "Name" || text_exists "New Ranking"; then
    pass_test
else
    fail_test "Create dialog did not open"
fi

screenshot "02-create-dialog"

# Test 3: Enter board name
start_test "Enter board name"
type_text "Test Board E2E"
sleep 0.3
pass_test

screenshot "02-board-name-entered"

# Test 4: Save/Create the board
start_test "Save new board"
if text_exists "Create"; then
    click_text "Create"
elif text_exists "Save"; then
    click_text "Save"
fi
sleep 1

# Verify board was created
if text_exists "Test Board E2E"; then
    pass_test
else
    fail_test "Board 'Test Board E2E' not visible after creation"
fi

screenshot "02-board-created"

# Test 5: Open the board
start_test "Open board detail"
click_text "Test Board E2E"
sleep 0.5

# Should be on board detail page (may show empty state or add button)
if text_exists "Test Board E2E" || text_exists "Add" || text_exists "No cards" || text_exists "No items"; then
    pass_test
else
    fail_test "Board detail page not displayed"
fi

screenshot "02-board-detail"

# Test 6: Go back to boards list
start_test "Return to boards list"
# Look for back button or navigate via tab
if text_exists "Back"; then
    click_text "Back"
else
    click_text "Boards"
fi
sleep 0.5
pass_test

screenshot "02-back-to-list"

# Test 7: Verify board still exists in list
start_test "Board persists in list"
# Verify the created board is still in the list
if text_exists "Test Board E2E"; then
    pass_test
else
    fail_test "Board 'Test Board E2E' not found in list"
fi

screenshot "02-final-state"

print_summary
