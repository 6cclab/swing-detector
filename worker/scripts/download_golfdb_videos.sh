#!/usr/bin/env bash
set -euo pipefail

GOLFDB_DIR="$(cd "$(dirname "$0")/../data/raw/golfdb" && pwd)"
VIDEO_DIR="$GOLFDB_DIR/videos"
URLS_FILE="$GOLFDB_DIR/urls.txt"

mkdir -p "$VIDEO_DIR"

TOTAL=$(wc -l < "$URLS_FILE" | tr -d ' ')
echo "GolfDB: $TOTAL videos in urls.txt"
echo "Already downloaded: $(ls "$VIDEO_DIR" 2>/dev/null | wc -l | tr -d ' ')"
echo ""

DOWNLOADED=0
SKIPPED=0
FAILED=0
COUNT=0

while IFS= read -r URL; do
    COUNT=$((COUNT + 1))
    YT_ID=$(echo "$URL" | sed 's/.*v=\([A-Za-z0-9_-]*\).*/\1/')

    if ls "$VIDEO_DIR/$YT_ID".* &>/dev/null 2>&1; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    echo "[$COUNT/$TOTAL] Downloading $YT_ID..."
    if yt-dlp -f "best[ext=mp4]/best" \
        --no-playlist \
        --socket-timeout 15 \
        --retries 2 \
        --quiet \
        -o "$VIDEO_DIR/%(id)s.%(ext)s" \
        "$URL" 2>/dev/null; then
        DOWNLOADED=$((DOWNLOADED + 1))
    else
        echo "  FAILED: $YT_ID"
        FAILED=$((FAILED + 1))
    fi

    sleep 1
done < "$URLS_FILE"

echo ""
echo "Done: $DOWNLOADED downloaded, $SKIPPED already had, $FAILED failed"
echo "Total videos in $VIDEO_DIR: $(ls "$VIDEO_DIR" | wc -l | tr -d ' ')"
