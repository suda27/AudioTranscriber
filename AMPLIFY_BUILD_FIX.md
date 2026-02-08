# AWS Amplify Build Fix

## Problem
The build phase can't find the `audio-transcriber` directory because Amplify resets the working directory between phases.

## Solution: Use Absolute Path or Verify Directory

### Option 1: Verify Directory First (Recommended)

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - ls -la
        - cd audio-transcriber
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - ls -la
        - cd audio-transcriber
        - npm run build
  artifacts:
    baseDirectory: audio-transcriber/dist/audio-transcriber/browser/
    files:
      - "**/*"
  cache:
    paths:
      - audio-transcriber/.npm/**/*
      - audio-transcriber/node_modules/**/*
```

### Option 2: Use Full Path in Build Command

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd audio-transcriber
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - cd audio-transcriber || (echo "Directory not found, listing:" && ls -la && exit 1)
        - npm run build
  artifacts:
    baseDirectory: audio-transcriber/dist/audio-transcriber/browser/
    files:
      - "**/*"
  cache:
    paths:
      - audio-transcriber/.npm/**/*
      - audio-transcriber/node_modules/**/*
```

### Option 3: Check if Directory Structure is Correct

The error suggests the directory might not exist. Verify:
1. The directory is actually named `audio-transcriber` (not `audio-transcriber/` or something else)
2. It's at the root of your repository
3. It's committed to git (not in .gitignore)

