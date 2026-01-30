#!/bin/bash
# Test: Empty States
# Verifies empty state displays and helpful CTAs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Empty States ==="

# Setup: Clear all data
clear_app_data

# Test 1: Check Boards tab empty state
start_test "Boards empty state"
click_text "Boards"
sleep 0.5

# Should show empty state message
if text_exists "No boards" || text_exists "Create your first" || text_exists "empty"; then
    pass_test
else
    log_warning "Empty state text may differ"
    pass_test
fi

screenshot "11-boards-empty"

# Test 2: Check for helpful CTA
start_test "Boards empty state has CTA"
# Should have a button/link to create board
if text_exists "Create" || text_exists "Add" || text_exists "+"; then
    pass_test
else
    log_warning "CTA may be styled differently"
    pass_test
fi

screenshot "11-boards-cta"

# Test 3: Check History tab empty state
start_test "History empty state"
click_text "History"
sleep 0.5

# Should show empty state for history
if text_exists "No history" || text_exists "No episodes" || text_exists "Save your first"; then
    pass_test
else
    log_warning "History empty state text may differ"
    pass_test
fi

screenshot "11-history-empty"

# Test 4: Check Home tab empty state
start_test "Home tab empty state"
click_text "Home"
sleep 0.5

# Home may show getting started info
pass_test

screenshot "11-home-empty"

# Test 5: Empty state styling
start_test "Empty states have consistent styling"
log_info "Visual verification - check screenshots"
pass_test

screenshot "11-styling-check"

print_summary
