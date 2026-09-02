#!/usr/bin/env bash
# Seed the AssetMT database using Prisma

WORKDIR="/c/Users/Akash Hodlur/Projects/Asset_MaintanceTool"
DOCKER_COMPOSE="$WORKDIR/docker-compose.yml"
DOCKER="/c/Users/Akash Hodlur/AppData/Local/Programs/DockerDesktop/resources/bin/docker"
PRISMA_SEED="npx tsx prisma/seed.ts"

# Verify docker exists
if [ ! -f "$DOCKER" ]; then
    echo "ERROR: Docker not found at $DOCKER"
    exit 1
fi

# Verify compose file exists
if [ ! -f "$DOCKER_COMPOSE" ]; then
    echo "ERROR: docker-compose.yml not found at $DOCKER_COMPOSE"
    exit 1
fi

echo "🌱 Starting AssetMT database seed..."

# Run prisma seed in the backend container
"$DOCKER" compose -f "$DOCKER_COMPOSE" exec backend "$PRISMA_SEED"

SEED_EXIT=$?

if [ $SEED_EXIT -eq 0 ]; then
    echo "✅ Database seeded successfully!"
else
    echo "❌ Database seeding failed with exit code: $SEED_EXIT"
fi