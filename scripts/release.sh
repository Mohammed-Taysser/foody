#!/bin/bash

set -e  # Exit on error

VERSION_TYPE=$1

# ✅ Validate input
if [[ -z "$VERSION_TYPE" ]]; then
  echo "❌ ERROR: No version type provided (expected: patch | minor | major)"
  exit 1
fi

if [[ "$VERSION_TYPE" != "patch" && "$VERSION_TYPE" != "minor" && "$VERSION_TYPE" != "major" ]]; then
  echo "❌ ERROR: Invalid version type '$VERSION_TYPE'. Use: patch, minor, or major."
  exit 1
fi

# 📝 Get current version (before bump)
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# 🛠️ Bump version without commit
echo "🔧 Bumping version (no commit)..."
npm version "$VERSION_TYPE" --no-git-tag-version

# 📝 Generate changelog
echo "📝 Generating changelog..."
pnpm changelog:generate

# ✅ Add both files to a single commit
git add package.json package-lock.json 2>/dev/null || true
git add CHANGELOG.md

# 🧹 Commit and tag
NEW_VERSION=$(node -p "require('./package.json').version")
git commit -m "chore(release): v$NEW_VERSION"
git tag "v$NEW_VERSION"

# 🚀 Push everything
git push
git push --tags

echo "🎉 Release complete: v$NEW_VERSION"
