# AWS Amplify Build Configuration

## Recommended Configuration (Explicit - Most Reliable)

Since Amplify's working directory behavior can vary, it's safest to be explicit in each phase:

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
        - cd audio-transcriber
        - npm run build
  artifacts:
    baseDirectory: audio-transcriber/dist/audio-transcriber/browser
    files:
      - '**/*'
  cache:
    paths:
      - audio-transcriber/.npm/**/*
      - audio-transcriber/node_modules/**/*
```

## Why Add `cd` Again in Build Phase?

**Yes, you should add `cd audio-transcriber` in the build phase** because:

1. **Explicit is better than implicit**: While Amplify *usually* maintains the working directory across phases, it's not guaranteed
2. **Each phase can reset**: Some Amplify configurations reset the working directory between phases
3. **Better error messages**: If the directory doesn't exist, you'll get a clear error instead of a confusing "file not found"
4. **More reliable**: Ensures the build always runs from the correct directory

## Alternative: Single Phase Approach

You could also combine everything in one phase:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd audio-transcriber && npm ci --cache .npm --prefer-offline
    build:
      commands:
        - cd audio-transcriber && npm run build
  artifacts:
    baseDirectory: audio-transcriber/dist/audio-transcriber/browser
    files:
      - '**/*'
  cache:
    paths:
      - audio-transcriber/.npm/**/*
      - audio-transcriber/node_modules/**/*
```

## Verification

After deploying, check the Amplify build logs. You should see:
- ✅ `cd audio-transcriber` executed successfully
- ✅ `npm run build` finds package.json
- ✅ Build output created in correct location
- ✅ Artifacts found and deployed

If you see "No such file or directory" errors, the working directory wasn't maintained and you need the explicit `cd` in each phase.
