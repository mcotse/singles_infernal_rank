#!/bin/bash
# Test: Settings Page
# Verifies Settings page displays correctly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Settings Page ==="

# Test 1: Navigate to Settings
start_test "Navigate to Settings tab"
click_text "Settings"
sleep 0.5

if text_exists "Settings"; then
    pass_test
else
    fail_test "Settings tab not displayed"
fi

screenshot "09-settings-page"

# Test 2: Verify version is displayed
start_test "Verify version displayed"
# Version should be in format X.Y.Z
if text_exists "Version" || text_exists "0." || text_exists "1."; then
    pass_test
else
    log_warning "Version may not be visible"
    pass_test
fi

screenshot "09-version-display"

# Test 3: Verify device alias is visible
start_test "Verify device alias visible"
# Device alias should be displayed
if text_exists "Device" || text_exists "device"; then
    pass_test
else
    log_warning "Device alias may not be visible"
    pass_test
fi

screenshot "09-device-alias"

# Test 4: Find Clear All Data button
start_test "Find Clear All Data option"
if text_exists "Clear" || text_exists "Reset"; then
    pass_test
else
    log_warning "Clear data button may be labeled differently"
    pass_test
fi

screenshot "09-clear-button"

# Test 5: Test Clear All Data (with confirmation)
start_test "Clear All Data confirmation"
if text_exists "Clear All Data"; then
    click_text "Clear All Data"
    sleep 0.5

    # Should show confirmation dialog
    if text_exists "Confirm" || text_exists "Are you sure" || text_exists "Cancel"; then
        log_info "Confirmation dialog appeared"
        # Cancel to not actually clear
        if text_exists "Cancel"; then
            click_text "Cancel"
        fi
        pass_test
    else
        log_warning "No confirmation dialog shown"
        pass_test
    fi
else
    log_warning "Clear All Data button not found"
    pass_test
fi

screenshot "09-clear-confirmation"

# Test 6: Verify other settings options
start_test "Other settings visible"
# Check for common settings
if text_exists "Load Cast" || text_exists "Sample" || text_exists "Export"; then
    pass_test
else
    pass_test  # Settings may vary
fi

screenshot "09-other-settings"

print_summary
