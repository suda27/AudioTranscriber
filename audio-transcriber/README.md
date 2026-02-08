# Audio Transcriber

An Angular application that uploads audio files to AWS S3 and transcribes them using AWS Transcribe service.

## Features

- 📤 Upload audio files in various formats (MP3, WAV, FLAC, etc.)
- ☁️ Direct upload to AWS S3
- 🎙️ Automatic transcription using AWS Transcribe
- 💬 Real-time status updates
- 📋 Copy transcription results to clipboard

## Prerequisites

- Node.js (v18 or higher)
- Angular CLI (v19 or higher)
- AWS Account with:
  - S3 bucket created
  - AWS Transcribe service access
  - IAM credentials with appropriate permissions

## Installation

1. Navigate to the project directory:
```bash
cd audio-transcriber
```

2. Install dependencies (if not already installed):
```bash
npm install
```

## Configuration

### Option 1: Using AWS Cognito Identity Pool (Recommended for Production)

1. Create a Cognito Identity Pool in AWS Console
2. Configure IAM roles with permissions for:
   - S3: PutObject, GetObject
   - Transcribe: StartTranscriptionJob, GetTranscriptionJob
3. Update `src/app/services/aws-config.service.ts`:
```typescript
cognitoIdentityPoolId: 'us-east-1:your-identity-pool-id';
region: 'us-east-1'; // Your AWS region
s3BucketName: 'your-bucket-name';
```

### Option 2: Direct AWS Credentials (Development Only)

⚠️ **Warning**: Never commit credentials to version control!

1. Update `src/app/services/aws-config.service.ts`:
```typescript
accessKeyId: 'your-access-key-id';
secretAccessKey: 'your-secret-access-key';
region: 'us-east-1';
s3BucketName: 'your-bucket-name';
```

2. For better security, use environment variables:
   - Create `src/environments/environment.ts` and `environment.prod.ts`
   - Store credentials there (and add to `.gitignore`)

## AWS IAM Permissions Required

Your AWS credentials need the following permissions:

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

## Running the Application

1. Start the development server:
```bash
ng serve
```

2. Open your browser and navigate to:
```
http://localhost:4200
```

3. Select an audio file and click "Upload & Transcribe"

## How It Works

1. **File Selection**: User selects an audio file through the file input
2. **S3 Upload**: The file is uploaded directly to your S3 bucket
3. **Transcription Job**: AWS Transcribe job is started with the S3 file URI
4. **Polling**: The app polls for transcription completion
5. **Result Display**: Once complete, the transcription is displayed

## Supported Audio Formats

AWS Transcribe supports:
- MP3
- MP4
- WAV
- FLAC
- OGG
- AMR
- WebM
- M4A

## Project Structure

```
audio-transcriber/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── aws-config.service.ts    # AWS configuration
│   │   │   ├── s3.service.ts            # S3 upload service
│   │   │   └── transcribe.service.ts    # Transcribe service
│   │   ├── app.component.ts             # Main component
│   │   ├── app.component.html           # UI template
│   │   └── app.component.css            # Styles
│   └── ...
└── ...
```

## Security Considerations

### Frontend-Only Approach

**Pros:**
- Simple architecture
- No backend required
- Direct client-to-AWS communication

**Cons:**
- AWS credentials exposed in frontend code (security risk)
- Limited control over access
- Potential for credential abuse

### Recommended Production Approach

For production, consider:
1. **Backend API**: Create a backend service that:
   - Generates presigned URLs for S3 uploads
   - Handles Transcribe API calls
   - Manages AWS credentials securely

2. **AWS Cognito**: Use Cognito Identity Pool for temporary credentials

3. **Environment Variables**: Never hardcode credentials

## Troubleshooting

### "AWS credentials not configured" Error
- Ensure you've set up either Cognito Identity Pool or direct credentials in `aws-config.service.ts`

### "S3 bucket name not configured" Error
- Set the `s3BucketName` in `aws-config.service.ts`

### Upload Fails
- Check IAM permissions for S3 PutObject
- Verify bucket name is correct
- Ensure bucket exists in the specified region

### Transcription Fails
- Check IAM permissions for Transcribe
- Verify the audio file format is supported
- Check that the S3 file URI is accessible

## Development

### Build for Production
```bash
ng build --configuration production
```

### Run Tests
```bash
ng test
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
