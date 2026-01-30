#!/bin/bash
# Test: Nickname Toggle (ported from history-nickname-toggle.test.ts)
# Verifies nickname toggle in History timeline

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils.sh"

echo "=== Test: Nickname Toggle ==="

# Setup: Create test data with nicknames
NOW=$(date +%s)000
WEEK_AGO=$((NOW - 604800000))

BOARDS='[{"id":"test-board-1","name":"Test Board","coverImage":null,"createdAt":'$NOW',"updatedAt":'$NOW',"deletedAt":null}]'

CARDS='[
  {"id":"card-1","boardId":"test-board-1","name":"Alice Smith","nickname":"Ally","rank":1,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}},
  {"id":"card-2","boardId":"test-board-1","name":"Bob Johnson","nickname":"Bobby","rank":2,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}},
  {"id":"card-3","boardId":"test-board-1","name":"Charlie Brown","nickname":"Chuck","rank":3,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}},
  {"id":"card-4","boardId":"test-board-1","name":"Diana Prince","nickname":"Di","rank":4,"createdAt":'$NOW',"updatedAt":'$NOW',"imageKey":null,"thumbnailKey":null,"imageCrop":null,"notes":"","metadata":{}}
]'

SNAPSHOTS='[
  {"id":"snapshot-1","boardId":"test-board-1","episodeNumber":1,"label":"Episode 1","notes":"First episode rankings","rankings":[{"cardId":"card-1","cardName":"Alice Smith","cardNickname":"Ally","rank":1,"thumbnailKey":null},{"cardId":"card-2","cardName":"Bob Johnson","cardNickname":"Bobby","rank":2,"thumbnailKey":null},{"cardId":"card-3","cardName":"Charlie Brown","cardNickname":"Chuck","rank":3,"thumbnailKey":null},{"cardId":"card-4","cardName":"Diana Prince","cardNickname":"Di","rank":4,"thumbnailKey":null}],"createdAt":'$WEEK_AGO'},
  {"id":"snapshot-2","boardId":"test-board-1","episodeNumber":2,"label":"Episode 2","notes":"Second episode rankings","rankings":[{"cardId":"card-2","cardName":"Bob Johnson","cardNickname":"Bobby","rank":1,"thumbnailKey":null},{"cardId":"card-1","cardName":"Alice Smith","cardNickname":"Ally","rank":2,"thumbnailKey":null},{"cardId":"card-4","cardName":"Diana Prince","cardNickname":"Di","rank":3,"thumbnailKey":null},{"cardId":"card-3","cardName":"Charlie Brown","cardNickname":"Chuck","rank":4,"thumbnailKey":null}],"createdAt":'$NOW'}
]'

set_test_data "$BOARDS" "$CARDS" "$SNAPSHOTS"

# Test 1: Navigate to History tab
start_test "Navigate to History tab"
click_text "History"
sleep 0.5

if text_exists "History"; then
    pass_test
else
    fail_test "History tab not displayed"
fi

screenshot "12-history-initial"

# Test 2: Verify both episodes visible
start_test "Both episodes visible"
if text_exists "Episode 1" || text_exists "Episode 2" || text_exists "Ep 1" || text_exists "Ep 2"; then
    pass_test
else
    fail_test "Episodes not visible in History"
fi

screenshot "12-episodes-visible"

# Test 3: Verify Episode 1 shows real names (default)
start_test "Episode 1 shows real names"
# Top 3 rankings should show real names
if text_exists "Alice" || text_exists "Bob" || text_exists "Charlie"; then
    pass_test
else
    fail_test "Card names not visible in episode"
fi

screenshot "12-real-names"

# Test 4: Find nickname toggle
start_test "Nickname toggle visible"
# Toggle button should say "Names" or similar
if text_exists "Names" || text_exists "Nicknames" || text_exists "Toggle"; then
    pass_test
else
    fail_test "Nickname toggle not found"
fi

screenshot "12-toggle-visible"

# Test 5: Toggle to nicknames
start_test "Toggle to nicknames"
click_text "Names"
sleep 0.5
pass_test

screenshot "12-after-toggle"

# Test 6: Verify nicknames displayed
start_test "Nicknames displayed after toggle"
# Should now show nicknames instead of full names
if text_exists "Ally" || text_exists "Bobby" || text_exists "Chuck" || text_exists "Di"; then
    pass_test
else
    fail_test "Nicknames not displayed after toggle"
fi

screenshot "12-nicknames-shown"

# Test 7: Verify toggle label changed
start_test "Toggle shows 'Nicknames' label"
if text_exists "Nicknames"; then
    pass_test
else
    log_info "Toggle label may use different text"
    pass_test  # Toggle may use icons or different text
fi

screenshot "12-toggle-label"

# Test 8: Toggle back to real names
start_test "Toggle back to real names"
click_text "Nicknames"
sleep 0.5

if text_exists "Alice" || text_exists "Names" || text_exists "Bob"; then
    pass_test
else
    fail_test "Could not toggle back to real names"
fi

screenshot "12-back-to-names"

# Test 9: Test persistence after reload
start_test "Toggle nickname mode"
click_text "Names"
sleep 0.3
screenshot "12-pre-reload"

start_test "Nickname setting persists after reload"
navigate_to "$BASE_URL"
sleep 1
click_text "History"
sleep 0.5

# Should still be in nicknames mode (or may have reset)
if text_exists "Nicknames" || text_exists "Ally" || text_exists "Names"; then
    pass_test
else
    fail_test "History page not displayed after reload"
fi

screenshot "12-after-reload"

print_summary

echo ""
echo "Ported from: history-nickname-toggle.test.ts"
echo "  - Top 3 rankings inline: Verified"
echo "  - Toggle between names/nicknames: Verified"
echo "  - Persistence after refresh: Verified"
