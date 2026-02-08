# Quick Setup Guide

## Step 1: Configure AWS Credentials

Edit `src/app/services/aws-config.service.ts` and add your AWS configuration:

```typescript
// Option 1: Cognito Identity Pool (Recommended)
cognitoIdentityPoolId: 'us-east-1:your-identity-pool-id';
region: 'us-east-1';
s3BucketName: 'your-bucket-name';

// OR Option 2: Direct Credentials (Development only)
accessKeyId: 'your-access-key-id';
secretAccessKey: 'your-secret-access-key';
region: 'us-east-1';
s3BucketName: 'your-bucket-name';
```

## Step 2: Set Up AWS Resources

### Create S3 Bucket
1. Go to AWS S3 Console
2. Create a new bucket
3. Note the bucket name and region

### Set Up IAM Permissions

Create an IAM user or role with these permissions:

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
      "Resource": "arn:aws:s3:::your-bucket-name/*"
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

### Option A: Using Cognito Identity Pool (Recommended)

1. Go to AWS Cognito Console
2. Create a new Identity Pool
3. Enable "Enable access to unauthenticated identities"
4. Create IAM roles for authenticated and unauthenticated identities
5. Attach the permissions policy above to the unauthenticated role
6. Copy the Identity Pool ID

### Option B: Using Direct Credentials (Quick Start for Testing)

1. Create an IAM user in AWS Console
2. Attach the permissions policy above
3. Create access keys
4. Use the access key ID and secret in the config

## Step 3: Install and Run

```bash
cd audio-transcriber
npm install
ng serve
```

Open http://localhost:4200 in your browser.

## Step 4: Test

1. Click "Choose Audio File"
2. Select an audio file (MP3, WAV, etc.)
3. Click "Upload & Transcribe"
4. Wait for the transcription to complete
5. Copy the result!

## Troubleshooting

### "AWS credentials not configured"
- Make sure you've filled in either `cognitoIdentityPoolId` OR both `accessKeyId` and `secretAccessKey`

### "S3 bucket name not configured"
- Set the `s3BucketName` in `aws-config.service.ts`

### Upload fails with 403 Forbidden
- Check IAM permissions for S3 PutObject
- Verify bucket name is correct
- Ensure bucket exists in the specified region

### Transcription fails
- Check IAM permissions for Transcribe
- Verify audio format is supported
- Check AWS Transcribe service limits

## Security Notes

⚠️ **Important**: 
- Never commit credentials to Git
- For production, use Cognito Identity Pool or a backend API
- Direct credentials in frontend code is a security risk

