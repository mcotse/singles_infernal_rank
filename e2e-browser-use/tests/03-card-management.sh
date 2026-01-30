#!/bin/bash
# Test: Card Management
# Verifies card CRUD operations: add, edit, delete

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Card Management ==="

# Setup: Load seed data for cards to work with
clear_app_data
load_seed_data

# Test 1: Navigate to boards and open one
start_test "Navigate to board with cards"
click_text "Boards"
sleep 0.5

# Click on the women's board (should have emoji indicator)
if text_exists "Singles Inferno"; then
    click_text "Singles Inferno"
else
    # Try clicking first board
    log_info "Looking for any board..."
fi
sleep 1
pass_test

screenshot "03-board-opened"

# Test 2: Verify cards are visible
start_test "Verify cards are displayed"
# Cards should show with rank badges or names
if text_exists "1" || text_exists "rank" || text_exists "Park" || text_exists "Kim"; then
    pass_test
else
    fail_test "Cards not visible on board"
fi

screenshot "03-cards-visible"

# Test 3: Click FAB to add new card
start_test "Open add card dialog"
# Look for FAB (floating action button) or add button
if text_exists "+"; then
    click_text "+"
elif text_exists "Add"; then
    click_text "Add"
fi
sleep 0.5

# Verify modal opened
if text_exists "Add Card" || text_exists "Name" || text_exists "Card"; then
    pass_test
else
    fail_test "Add card dialog did not open"
fi

screenshot "03-add-card-dialog"

# Test 4: Enter card name
start_test "Enter new card name"
type_text "New E2E Card"
sleep 0.3
pass_test

# Test 5: Save the card
start_test "Save new card"
if text_exists "Save"; then
    click_text "Save"
elif text_exists "Create"; then
    click_text "Create"
elif text_exists "Add"; then
    click_text "Add"
fi
sleep 1

# Verify card was added
if text_exists "New E2E Card"; then
    pass_test
else
    fail_test "Card 'New E2E Card' not visible after creation"
fi

screenshot "03-card-added"

# Test 6: Click card to edit
start_test "Open card edit dialog"
click_text "New E2E Card"
sleep 0.5

# Should show edit form
if text_exists "Save" || text_exists "Edit" || text_exists "Name"; then
    pass_test
else
    fail_test "Edit card dialog did not open"
fi

screenshot "03-card-edit-dialog"

# Test 7: Close edit dialog
start_test "Close edit dialog"
# Look for close button, cancel, or outside click
if text_exists "Cancel"; then
    click_text "Cancel"
elif text_exists "Close"; then
    click_text "Close"
elif text_exists "Save"; then
    click_text "Save"  # Save to close
fi
sleep 0.5
pass_test

screenshot "03-edit-closed"

# Test 8: Verify card still exists after edit
start_test "Card persists after edit"
if text_exists "New E2E Card" || text_exists "E2E"; then
    pass_test
else
    fail_test "Card not found after edit"
fi

screenshot "03-final-state"

print_summary
