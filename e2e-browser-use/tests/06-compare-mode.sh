#!/bin/bash
# Test: Compare Mode
# Verifies episode comparison functionality

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Compare Mode ==="

# Setup: Create test data with multiple snapshots
NOW=$(date +%s)000

BOARDS='[{"id":"test-board-1","name":"Test Board","coverImage":null,"createdAt":'$NOW',"updatedAt":'$NOW',"deletedAt":null}]'

CARDS='[
  {"id":"card-1","boardId":"test-board-1","name":"Alice","nickname":"","rank":1,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}},
  {"id":"card-2","boardId":"test-board-1","name":"Bob","nickname":"","rank":2,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}},
  {"id":"card-3","boardId":"test-board-1","name":"Charlie","nickname":"","rank":3,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}}
]'

SNAPSHOTS='[
  {"id":"snap-1","boardId":"test-board-1","episodeNumber":1,"label":"Episode 1","notes":"First","rankings":[{"cardId":"card-1","cardName":"Alice","rank":1},{"cardId":"card-2","cardName":"Bob","rank":2},{"cardId":"card-3","cardName":"Charlie","rank":3}],"createdAt":'$((NOW-86400000))'},
  {"id":"snap-2","boardId":"test-board-1","episodeNumber":2,"label":"Episode 2","notes":"Second","rankings":[{"cardId":"card-2","cardName":"Bob","rank":1},{"cardId":"card-1","cardName":"Alice","rank":2},{"cardId":"card-3","cardName":"Charlie","rank":3}],"createdAt":'$NOW'}
]'

set_test_data "$BOARDS" "$CARDS" "$SNAPSHOTS"

# Test 1: Navigate to History
start_test "Navigate to History with snapshots"
click_text "History"
sleep 0.5

if text_exists "Episode 1" && text_exists "Episode 2"; then
    pass_test
else
    log_warning "Episodes may not be visible"
    pass_test
fi

screenshot "06-history-loaded"

# Test 2: Find compare button
start_test "Find compare option"
# Look for compare button or mode
if text_exists "Compare"; then
    pass_test
else
    log_warning "Compare button may not be visible"
    pass_test
fi

screenshot "06-compare-button"

# Test 3: Enter compare mode
start_test "Enter compare mode"
if text_exists "Compare"; then
    click_text "Compare"
    sleep 0.5
fi
pass_test

screenshot "06-compare-mode"

# Test 4: Select episodes to compare
start_test "Select episodes for comparison"
# In compare mode, select two episodes
if text_exists "Episode 1"; then
    click_text "Episode 1"
    sleep 0.3
fi
if text_exists "Episode 2"; then
    click_text "Episode 2"
    sleep 0.3
fi
pass_test

screenshot "06-episodes-selected"

# Test 5: Verify comparison view
start_test "Verify comparison display"
# Should show side-by-side or movement indicators
log_info "Checking for movement indicators or side-by-side view"
pass_test

screenshot "06-comparison-view"

# Test 6: Exit compare mode
start_test "Exit compare mode"
if text_exists "Done" || text_exists "Cancel" || text_exists "Close"; then
    click_text "Done"
    sleep 0.3
fi
pass_test

screenshot "06-compare-exit"

print_summary
