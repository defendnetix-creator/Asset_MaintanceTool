#!/usr/bin/env bash
# Seed AssetMT database using Prisma - from backend directory

set -e

WORKDIR="/c/Users/Akash Hodlur/Projects/Asset_MaintanceTool/backend"

echo "🌱 Starting AssetMT database seed from backend directory..."

# Run prisma seed using tsx from the backend directory
npx tsx prisma/seed.ts

SEED_EXIT=$?

if [ $SEED_EXIT -eq 0 ]; then
    echo "✅ Database seeded successfully!"
else
    echo "❌ Database seeding failed with exit code: $SEED_EXIT"
    exit 1
fi