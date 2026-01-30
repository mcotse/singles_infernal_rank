# E2E Tests with browser-use

End-to-end tests for the Hot Takes / Singles Infernal Ranking app using browser-use CLI.

## Prerequisites

1. **Dev server running**: `bun run dev`
2. **browser-use CLI available**: This comes with Claude Code's MCP integration

## Quick Start

```bash
# Run all tests
./e2e-browser-use/run-all.sh

# Run a single test
./e2e-browser-use/run-all.sh --single 01-app-load-navigation.sh

# List available tests
./e2e-browser-use/run-all.sh --list
```

## Test Files

| File | Description |
|------|-------------|
| `01-app-load-navigation.sh` | App load, title, tab navigation |
| `02-board-management.sh` | Board CRUD: create, view, delete |
| `03-card-management.sh` | Card CRUD: add, edit, delete |
| `04-drag-drop.sh` | Drag-and-drop reordering (limited) |
| `05-episode-history.sh` | Episode snapshot creation |
| `06-compare-mode.sh` | Episode comparison |
| `07-sample-data.sh` | Load seed data (ported from Playwright) |
| `08-import-export.sh` | Data import/export |
| `09-settings.sh` | Settings page verification |
| `10-spaces.sh` | Spaces collaborative features |
| `11-empty-states.sh` | Empty state displays |
| `12-nickname-toggle.sh` | Nickname toggle (ported from Playwright) |
| `13-responsive-viewport.sh` | PWA/viewport tests (ported from Playwright) |

## Configuration

Default settings in `utils.sh`:

```bash
BASE_URL=http://localhost:5173/hot-takes/
VIEWPORT_WIDTH=430    # iPhone 14 Pro Max
VIEWPORT_HEIGHT=932
```

Override with environment variables:

```bash
BASE_URL=http://localhost:3000/ ./e2e-browser-use/run-all.sh
```

## Screenshots

Screenshots are saved to `e2e-browser-use/screenshots/` during test runs:
- Named with test number prefix (e.g., `01-app-loaded.png`)
- Useful for debugging failures
- Cleared on each test run (manual cleanup if needed)

## Key Selectors

The app uses these `data-testid` attributes:

| Element | data-testid |
|---------|-------------|
| Rank card | `rank-card` |
| Bottom sheet modal | `bottom-sheet` |
| Rank badge | `rank-badge` |
| Drag handle | `drag-handle` |
| Empty state | `empty-state` |
| Photo placeholder | `photo-placeholder` |

## Limitations

browser-use has some limitations compared to Playwright:

1. **No drag-and-drop simulation**: Drag operations require manual testing
2. **Limited dimension measuring**: Can't get exact pixel measurements
3. **No file picker interaction**: Import tests require manual file selection
4. **Session persistence**: Browser stays open between tests (by design)

## Cleanup

After testing:

```bash
# Close browser session
browser-use close

# Clear screenshots
rm -rf e2e-browser-use/screenshots/*.png
```

## Writing New Tests

1. Create a new `.sh` file in `tests/`
2. Source utilities: `source "$SCRIPT_DIR/../utils.sh"`
3. Use provided helper functions:
   - `start_test "Description"` - Begin a test
   - `pass_test` / `fail_test "reason"` - Record result
   - `click_text "Button Text"` - Click element
   - `type_text "input"` - Type into focused field
   - `screenshot "name"` - Save screenshot
   - `text_exists "text"` - Check if text is on page
   - `wait_for_text "text" timeout` - Wait for text to appear
   - `clear_app_data` - Reset localStorage/IndexedDB
   - `load_seed_data` - Load sample data

Example:

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: My Feature ==="

start_test "Feature does something"
click_text "Button"
if text_exists "Expected Result"; then
    pass_test
else
    fail_test "Did not see expected result"
fi

screenshot "my-feature-result"

print_summary
```

## Ported Tests

Three tests were ported from the original Playwright test suite:

1. **07-sample-data.sh** (from `seed-data.test.ts`)
   - Loads seed data, verifies boards, tests card editing

2. **12-nickname-toggle.sh** (from `history-nickname-toggle.test.ts`)
   - Tests nickname toggle in History timeline
   - Verifies persistence after reload

3. **13-responsive-viewport.sh** (from `modal-responsive-width.test.ts`)
   - Tests modal behavior at different viewport sizes
   - Mobile (430px): full-width modal
   - Desktop (1280px): constrained 500px modal

## Troubleshooting

**Tests fail immediately**
- Ensure dev server is running: `bun run dev`
- Check BASE_URL matches your dev server

**Browser not opening**
- browser-use is only available in Claude Code sessions
- Not available as standalone CLI

**Tests timeout**
- Increase wait times in test files
- Check for JavaScript errors in browser console

**Screenshots not saving**
- Ensure `screenshots/` directory exists
- Check write permissions
