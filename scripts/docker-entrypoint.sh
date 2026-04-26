#!/bin/sh
# Docker entrypoint script for Next.js standalone mode
# Ensures server binds to 0.0.0.0 instead of container hostname

set -e

# Force HOSTNAME to 0.0.0.0
export HOSTNAME=0.0.0.0
export HOST=0.0.0.0

# Start the Next.js server
exec node server.js

