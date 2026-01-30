#!/bin/bash
# E2E Browser-Use Test Runner
# Runs all E2E tests sequentially using browser-use

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$SCRIPT_DIR/tests"

# Source utilities
source "$SCRIPT_DIR/utils.sh"

# Colors
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         E2E Browser-Use Test Suite                             ║"
echo "║         Hot Takes / Singles Infernal Ranking App               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if dev server is running
check_dev_server() {
    log_info "Checking dev server at $BASE_URL..."

    if curl -s --head "$BASE_URL" | head -n 1 | grep -q "200\|304"; then
        log_success "Dev server is running"
        return 0
    else
        log_error "Dev server is not running!"
        echo ""
        echo "Please start the dev server first:"
        echo "  bun run dev"
        echo ""
        exit 1
    fi
}

# Check if browser-use is available
check_browser_use() {
    log_info "Checking browser-use CLI..."

    if command -v browser-use &> /dev/null; then
        log_success "browser-use CLI is available"
        return 0
    else
        log_error "browser-use CLI not found!"
        echo ""
        echo "Please ensure browser-use is available in Claude Code."
        echo ""
        exit 1
    fi
}

# Run a single test file
run_test() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .sh)

    echo ""
    echo -e "${BLUE}┌──────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│ Running: $test_name${NC}"
    echo -e "${BLUE}└──────────────────────────────────────────────────────────────┘${NC}"

    if bash "$test_file"; then
        log_success "Test file completed: $test_name"
        return 0
    else
        log_error "Test file failed: $test_name"
        return 1
    fi
}

# Main execution
main() {
    local failed_tests=()
    local total_tests=0
    local passed_tests=0

    # Pre-flight checks
    check_dev_server
    check_browser_use

    # Create screenshots directory if needed
    mkdir -p "$SCRIPT_DIR/screenshots"

    # Setup browser
    log_info "Initializing browser..."
    setup_browser

    # Clear any existing data
    clear_app_data

    # Find and run all test files in order
    for test_file in "$TESTS_DIR"/*.sh; do
        if [ -f "$test_file" ]; then
            ((total_tests++))

            if run_test "$test_file"; then
                ((passed_tests++))
            else
                failed_tests+=("$(basename "$test_file")")
            fi
        fi
    done

    # Print final summary
    echo ""
    echo -e "${BOLD}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    FINAL TEST RESULTS                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${GREEN}Passed:${NC} $passed_tests / $total_tests test files"

    if [ ${#failed_tests[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed tests:${NC}"
        for test in "${failed_tests[@]}"; do
            echo "  - $test"
        done
    fi

    # Cleanup
    log_info "Cleaning up..."
    # Note: We don't close the browser here to allow inspection
    # Use 'browser-use close' manually when done

    echo ""
    if [ ${#failed_tests[@]} -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        echo ""
        echo "Screenshots saved to: $SCRIPT_DIR/screenshots/"
        echo "To close browser: browser-use close"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        echo ""
        echo "Review screenshots in: $SCRIPT_DIR/screenshots/"
        echo "Browser left open for inspection. Close with: browser-use close"
        exit 1
    fi
}

# Handle arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --list, -l     List available tests"
        echo "  --single FILE  Run a single test file"
        echo ""
        echo "Examples:"
        echo "  $0                              # Run all tests"
        echo "  $0 --single 01-app-load.sh      # Run single test"
        echo "  $0 --list                       # List all tests"
        exit 0
        ;;
    --list|-l)
        echo "Available tests:"
        for test_file in "$TESTS_DIR"/*.sh; do
            if [ -f "$test_file" ]; then
                echo "  $(basename "$test_file")"
            fi
        done
        exit 0
        ;;
    --single)
        if [ -z "${2:-}" ]; then
            echo "Error: --single requires a test file name"
            exit 1
        fi
        test_file="$TESTS_DIR/$2"
        if [ ! -f "$test_file" ]; then
            echo "Error: Test file not found: $test_file"
            exit 1
        fi
        check_dev_server
        check_browser_use
        setup_browser
        clear_app_data
        run_test "$test_file"
        exit $?
        ;;
    *)
        main
        ;;
esac
