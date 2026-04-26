#!/bin/bash

# Quick memory check - shows essential info only

echo "========================================="
echo "QUICK MEMORY CHECK"
echo "========================================="
echo ""

# System memory
echo "System Memory:"
free -h | grep -E "Mem|Swap"
echo ""

# Top 5 processes by memory
echo "Top 5 Memory Consumers:"
ps aux --sort=-%mem | head -6 | awk '{printf "%-10s %6s %6s %10s %s\n", $1, $2, $3"%", $4"%", $11}'
echo ""

# Docker containers
if command -v docker >/dev/null 2>&1; then
    echo "Docker Container Memory:"
    docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "No containers running"
    echo ""
    
    echo "Docker Disk Usage:"
    docker system df | head -5
fi
echo ""

