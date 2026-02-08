# AWS Amplify Environment Variables Configuration

## Setting Up OpenAI API Key in AWS Amplify

### Step 1: Add Environment Variable in Amplify Console

1. Go to your AWS Amplify Console
2. Select your app: **AudioTranscriber**
3. Navigate to: **Hosting** → **Environment variables**
4. Click **"Manage variables"** button
5. Click **"Add variable"** or **"Add environment variable"**

### Step 2: Configure the Variable

Add the following environment variable:

- **Variable name**: `NG_APP_OPENAI_API_KEY`
- **Value**: Your OpenAI API key (e.g., `sk-proj-...`)
- **Branch**: Select the branch(es) where you want this variable available
  - For all branches: Select "All branches" or leave branch selection empty
  - For specific branch: Select the branch name (e.g., `main`, `master`)

### Step 3: Save and Redeploy

1. Click **"Save"** or **"Add"**
2. The environment variable will be available during the next build
3. Trigger a new build by:
   - Pushing a new commit to your repository, OR
   - Going to **Actions** → **Redeploy this version**

## How It Works

- Angular's build system automatically replaces `process.env['NG_APP_OPENAI_API_KEY']` with the actual value at build time
- The variable name **must** be prefixed with `NG_APP_` for Angular to recognize it
- The value is embedded into the JavaScript bundle during the build process
- The environment variable is only available at build time, not at runtime

## Current Build Configuration

Your current `amplify.yml` build configuration:

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
        - ls -la
        - npm run build
  artifacts:
    baseDirectory: audio-transcriber/dist/audio-transcriber/browser/
    files:
      - "**/*"
  cache:
    paths:
      - audio-transcriber/.npm/**/*
```

**No changes needed** - The environment variables set in the Amplify console are automatically available during the build process.

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Exposure**: Since this is a frontend application, the API key will be embedded in the JavaScript bundle and visible to anyone who inspects the code. This is a security risk.

2. **Recommended Approach**: For production, consider:
   - Creating a backend API endpoint that handles OpenAI API calls
   - Using AWS Lambda or API Gateway to proxy requests to OpenAI
   - Storing the API key securely on the backend

3. **Current Implementation**: The current setup uses `dangerouslyAllowBrowser: true` which is acceptable for development but should be reconsidered for production.

## Testing

After setting the environment variable:

1. Trigger a new build in Amplify
2. Check the build logs to ensure the build completes successfully
3. Test the summary generation feature in your deployed app
4. If the API key is not set, you'll see an error: "OpenAI API key is not configured"

## Troubleshooting

### Environment Variable Not Working

1. **Check variable name**: Must be exactly `NG_APP_OPENAI_API_KEY` (case-sensitive)
2. **Check branch selection**: Ensure the variable is set for the branch you're deploying
3. **Redeploy**: Environment variables only take effect on new builds
4. **Check build logs**: Look for any errors related to environment variables

### API Key Not Found Error

- Verify the environment variable is set in Amplify console
- Ensure the variable name is `NG_APP_OPENAI_API_KEY`
- Check that a new build was triggered after setting the variable
- The fallback key will be used if the environment variable is not set (for local development)

