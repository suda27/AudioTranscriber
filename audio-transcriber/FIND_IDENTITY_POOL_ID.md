# How to Find Your Cognito Identity Pool ID

## The Error
The Identity Pool ID format must be: `region:hexadecimal-id` where the hexadecimal part contains only:
- Numbers: 0-9
- Lowercase letters: a-f
- Hyphens: -

## Current Issue
The ID `j21lPmsNt` contains invalid characters:
- `l` (lowercase L) - not valid hex
- `P` (uppercase P) - not valid hex (must be lowercase)
- `s` - not valid hex
- `N` (uppercase N) - not valid hex (must be lowercase)

## How to Find the Correct Identity Pool ID

### Step 1: Go to AWS Cognito Console
1. Log in to AWS Console
2. Navigate to **Amazon Cognito** service
3. Click on **Identity pools** in the left sidebar

### Step 2: Find Your Identity Pool
1. Look for the identity pool you created (or the one you want to use)
2. Click on the identity pool name

### Step 3: Copy the Identity Pool ID
1. On the identity pool details page, you'll see:
   - **Identity pool ID**: This is what you need!
   - It should look like: `ap-south-1:12345678-1234-1234-1234-123456789012`
   - Or shorter format: `ap-south-1:abc123def456`

2. **Important**: The format is `region:hex-id`
   - The part after the colon (`:`) must be hexadecimal (0-9, a-f only)
   - It can include hyphens

### Step 4: Update the Configuration
1. Copy the full Identity Pool ID (including the region and colon)
2. Update `src/app/services/aws-config.service.ts`:
   ```typescript
   cognitoIdentityPoolId: string = 'ap-south-1:your-actual-hex-id-here';
   ```

## Example Valid Formats
✅ Valid:
- `ap-south-1:12345678-1234-1234-1234-123456789012`
- `ap-south-1:abc123def456`
- `ap-south-1:a1b2c3d4-e5f6-7890-abcd-ef1234567890`

❌ Invalid:
- `ap-south-1:j21lPmsNt` (contains invalid characters: l, P, s, N)
- `ap-south-1_j21lPmsNt` (uses underscore instead of colon)
- `ap-south-1:J21LPMSNT` (uppercase letters not allowed)

## Alternative: Check AWS CLI
If you have AWS CLI configured, you can also find it:
```bash
aws cognito-identity list-identity-pools --max-results 10
```

This will list your identity pools with their IDs.

