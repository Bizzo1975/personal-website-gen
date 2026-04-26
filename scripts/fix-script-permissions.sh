#!/bin/bash

# Script to fix script permissions and line endings
# Run this on the production server: /opt/app/site/scripts

set -e

SCRIPT_DIR="/opt/app/site/scripts"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Fixing Script Permissions and Line Endings"
echo "=========================================="
echo ""

# Fix all shell scripts
for script in *.sh; do
    if [ -f "$script" ]; then
        echo "Fixing: $script"
        
        # Remove Windows line endings (CRLF -> LF)
        sed -i 's/\r$//' "$script"
        
        # Make executable
        chmod +x "$script"
        
        echo "  ✓ Fixed line endings and permissions"
    fi
done

echo ""
echo "=========================================="
echo "Fix Complete"
echo "=========================================="
echo ""
echo "All scripts should now be executable."
echo ""

