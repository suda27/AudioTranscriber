# How to Create a Cognito Identity Pool

## Important: User Pool vs Identity Pool

You currently have a **User Pool** (`ap-south-1_j21lPmsNt`), but we need an **Identity Pool**:

- **User Pool**: Handles user authentication (sign up, sign in)
- **Identity Pool**: Provides temporary AWS credentials for accessing AWS services (S3, Transcribe)

## Step-by-Step: Create Identity Pool

### Step 1: Navigate to Identity Pools
1. Go to AWS Console
2. Search for **Amazon Cognito**
3. In the left sidebar, click **Identity pools** (NOT "User pools")
4. Click **Create identity pool**

### Step 2: Configure Identity Pool
1. **Identity pool name**: Enter a name (e.g., "audio-transcriber-identity-pool")
2. **Authentication providers**:
   - ✅ Check **"Enable access to unauthenticated identities"**
   - This allows the frontend to get credentials without user login
3. Click **Next**

### Step 3: Configure IAM Roles
1. **Unauthenticated role**:
   - Choose **"Create a new IAM Role"** or **"Use an existing IAM role"**
   - If creating new, name it (e.g., "AudioTranscriberUnauthenticatedRole")
   - Click **"View policy document"** and use this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::kani-audio/*",
        "arn:aws:s3:::kani-audio-transcription/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    }
  ]
}
```

2. **Authenticated role** (optional, can use same as unauthenticated):
   - Same permissions as above
3. Click **Next**

### Step 4: Review and Create
1. Review your settings
2. Click **Create identity pool**

### Step 5: Copy the Identity Pool ID
After creation, you'll see:
- **Identity pool ID**: This is what you need!
- Format: `ap-south-1:12345678-1234-1234-1234-123456789012`
- Copy this full ID (including region and colon)

### Step 6: Update Configuration
Update `src/app/services/aws-config.service.ts`:
```typescript
cognitoIdentityPoolId: string = 'ap-south-1:your-identity-pool-id-here';
```

## Quick Alternative: Use AWS CLI

If you have AWS CLI configured:

```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name audio-transcriber-identity-pool \
  --allow-unauthenticated-identities \
  --region ap-south-1
```

This will return the Identity Pool ID in the response.

## Verify IAM Role Permissions

After creating the Identity Pool, make sure the IAM role has the correct permissions:

1. Go to **IAM Console** → **Roles**
2. Find the role you created (e.g., "AudioTranscriberUnauthenticatedRole")
3. Click **Add permissions** → **Create inline policy**
4. Use the JSON policy from Step 3 above
5. Save

## Troubleshooting

### "Identity pool not found"
- Make sure you're using the Identity Pool ID, not User Pool ID
- Verify the region matches (ap-south-1)

### "Access denied" errors
- Check IAM role permissions for S3 and Transcribe
- Ensure the role is attached to the Identity Pool

### "Invalid identity pool ID format"
- Must be: `region:hex-id` (colon separator)
- The hex-id part must be hexadecimal (0-9, a-f only)

