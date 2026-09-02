#!/usr/bin/env bash
# Seed AssetMT database using Prisma

set -e

WORKDIR="/c/Users/Akash Hodlur/Projects/Asset_MaintanceTool"
CD_CMD="cd \"$WORKDIR\""

# Change to project directory
cd "$WORKDIR" || { echo "ERROR: Cannot change to $WORKDIR"; exit 1; }

echo "🌱 Starting AssetMT database seed..."

# Run prisma seed using tsx
npx tsx prisma/seed.ts

SEED_EXIT=$?

if [ $SEED_EXIT -eq 0 ]; then
    echo "✅ Database seeded successfully!"
else
    echo "❌ Database seeding failed with exit code: $SEED_EXIT"
    exit 1
fi