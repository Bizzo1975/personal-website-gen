#!/bin/bash
# Wrapper script for docker-compose to load environment variables
# Used by systemd service

set -e

cd /opt/app/site

# Load environment variables from .env.production
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
    export $(cat .env.production | grep -v '^#' | grep -v '^$' | grep '=' | xargs)
fi

# If starting containers, clean up old corrupted containers first
if [ "$1" = "up" ] && [ "$2" = "-d" ]; then
    # Clean up any old containers with corrupted metadata
    echo "Cleaning up old containers..."
    /usr/bin/docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    # Remove any containers with site_ prefix
    docker ps -a --filter "name=site_" --format "{{.ID}}" | while read container_id; do
        [ -n "$container_id" ] && docker rm -f "$container_id" 2>/dev/null || true
    done
    
    # Remove any orphaned containers that might cause ContainerConfig errors
    docker ps -a --format "{{.ID}} {{.Names}}" | grep -E "site_|21cf1b9dbc1f|0869c4b2e190" | awk '{print $1}' | while read container_id; do
        [ -n "$container_id" ] && docker rm -f "$container_id" 2>/dev/null || true
    done
    
    # Prune system to remove unused data
    docker system prune -f 2>/dev/null || true
fi

# Execute docker-compose command
exec /usr/bin/docker-compose -f docker-compose.prod.yml "$@"

