#!/bin/bash
# E2E Browser-Use Test Utilities
# Shared functions for browser-use based E2E tests

set -e

# Configuration
export BASE_URL="${BASE_URL:-http://localhost:5173/hot-takes/}"
export VIEWPORT_WIDTH="${VIEWPORT_WIDTH:-430}"
export VIEWPORT_HEIGHT="${VIEWPORT_HEIGHT:-932}"
export SCREENSHOTS_DIR="$(dirname "$0")/screenshots"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
CURRENT_TEST=""

# ============================================================================
# Core Functions
# ============================================================================

# Log info message
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Log success message
log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

# Log error message
log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Log warning message
log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Start a test
start_test() {
    CURRENT_TEST="$1"
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}[TEST]${NC} $1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Pass a test
pass_test() {
    ((TESTS_PASSED++))
    log_success "$CURRENT_TEST"
}

# Fail a test
fail_test() {
    ((TESTS_FAILED++))
    log_error "$CURRENT_TEST: $1"
}

# Print test summary
print_summary() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                      TEST SUMMARY${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Failed:${NC} $TESTS_FAILED"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed!${NC}"
        return 0
    else
        echo -e "\n${RED}Some tests failed!${NC}"
        return 1
    fi
}

# ============================================================================
# Browser-Use Wrapper Functions
# ============================================================================

# Initialize browser session with mobile viewport
setup_browser() {
    log_info "Setting up browser session..."
    browser-use open "$BASE_URL" --width "$VIEWPORT_WIDTH" --height "$VIEWPORT_HEIGHT" 2>/dev/null || true
    sleep 2
}

# Clear all app data and reload
clear_app_data() {
    log_info "Clearing app data..."
    browser-use eval "
        localStorage.clear();
        indexedDB.deleteDatabase('singles-infernal-rank-images');
    " 2>/dev/null || true
    sleep 0.5
    browser-use navigate "$BASE_URL" 2>/dev/null || true
    sleep 1
}

# Navigate to URL
navigate_to() {
    local url="$1"
    log_info "Navigating to: $url"
    browser-use navigate "$url" 2>/dev/null || true
    sleep 1
}

# Click element by text
click_text() {
    local text="$1"
    log_info "Clicking: '$text'"
    browser-use click "$text" 2>/dev/null || true
    sleep 0.5
}

# Click element by index (from browser-use state)
click_index() {
    local index="$1"
    log_info "Clicking element at index: $index"
    browser-use click --index "$index" 2>/dev/null || true
    sleep 0.5
}

# Type text into focused element
type_text() {
    local text="$1"
    log_info "Typing: '$text'"
    browser-use type "$text" 2>/dev/null || true
    sleep 0.3
}

# Take screenshot with name
screenshot() {
    local name="$1"
    local filename="${SCREENSHOTS_DIR}/${name}.png"
    log_info "Taking screenshot: $name"
    browser-use screenshot "$filename" 2>/dev/null || true
}

# Get current page state (elements list)
get_state() {
    browser-use state 2>/dev/null || true
}

# Check if text exists on page
text_exists() {
    local text="$1"
    local state=$(get_state)
    if echo "$state" | grep -q "$text"; then
        return 0
    else
        return 1
    fi
}

# Wait for text to appear (with timeout)
wait_for_text() {
    local text="$1"
    local timeout="${2:-10}"
    local elapsed=0

    log_info "Waiting for text: '$text' (timeout: ${timeout}s)"

    while [ $elapsed -lt $timeout ]; do
        if text_exists "$text"; then
            log_success "Found: '$text'"
            return 0
        fi
        sleep 1
        ((elapsed++))
    done

    log_error "Timeout waiting for: '$text'"
    return 1
}

# Evaluate JavaScript and return result
eval_js() {
    local script="$1"
    browser-use eval "$script" 2>/dev/null || true
}

# Close browser session
teardown_browser() {
    log_info "Closing browser session..."
    browser-use close 2>/dev/null || true
}

# ============================================================================
# App-Specific Helper Functions
# ============================================================================

# Navigate to a specific tab
go_to_tab() {
    local tab="$1"
    log_info "Navigating to $tab tab..."
    click_text "$tab"
    sleep 0.5
}

# Load seed data from Settings
load_seed_data() {
    log_info "Loading seed data..."
    go_to_tab "Settings"
    sleep 0.5
    click_text "Load Cast & Photos"
    sleep 3  # Wait for data to load

    if text_exists "Created 2 boards"; then
        log_success "Seed data loaded successfully"
        return 0
    else
        log_warning "Seed data may not have loaded correctly"
        return 1
    fi
}

# Set test data via localStorage
# Uses base64 encoding to avoid JSON injection issues
set_test_data() {
    local boards_json="$1"
    local cards_json="$2"
    local snapshots_json="${3:-[]}"

    log_info "Setting test data via localStorage..."

    # Encode JSON as base64 to avoid quote/escape issues
    local boards_b64=$(echo -n "$boards_json" | base64)
    local cards_b64=$(echo -n "$cards_json" | base64)
    local snapshots_b64=$(echo -n "$snapshots_json" | base64)

    eval_js "
        localStorage.setItem('singles-infernal-rank:boards', atob('$boards_b64'));
        localStorage.setItem('singles-infernal-rank:cards', atob('$cards_b64'));
        localStorage.setItem('singles-infernal-rank:snapshots', atob('$snapshots_b64'));
    "

    # Reload to apply data
    navigate_to "$BASE_URL"
    sleep 1
}

# Get localStorage value
get_storage() {
    local key="$1"
    eval_js "localStorage.getItem('singles-infernal-rank:$key')"
}

# ============================================================================
# Assertion Functions
# ============================================================================

# Assert text exists on page
assert_text() {
    local text="$1"
    local message="${2:-Text '$text' should be visible}"

    if text_exists "$text"; then
        log_success "$message"
        return 0
    else
        log_error "$message"
        return 1
    fi
}

# Assert text does NOT exist on page
assert_no_text() {
    local text="$1"
    local message="${2:-Text '$text' should NOT be visible}"

    if ! text_exists "$text"; then
        log_success "$message"
        return 0
    else
        log_error "$message"
        return 1
    fi
}

# Assert URL contains path
assert_url_contains() {
    local path="$1"
    local current_url=$(eval_js "window.location.href")

    if echo "$current_url" | grep -q "$path"; then
        log_success "URL contains: $path"
        return 0
    else
        log_error "URL should contain '$path' but was: $current_url"
        return 1
    fi
}

# Export all functions for subshells
export -f log_info log_success log_error log_warning
export -f start_test pass_test fail_test print_summary
export -f setup_browser clear_app_data navigate_to click_text click_index
export -f type_text screenshot get_state text_exists wait_for_text
export -f eval_js teardown_browser go_to_tab load_seed_data
export -f set_test_data get_storage assert_text assert_no_text assert_url_contains
