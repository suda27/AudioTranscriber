# Current Configuration

## ✅ Configured Settings

### AWS Cognito Identity Pool
- **Identity Pool ID**: `ap-south-1_j21lPmsNt`
- **Region**: `ap-south-1` (Asia Pacific - Mumbai)

### S3 Buckets
- **Audio Upload Bucket**: `kani-audio`
  - Used for storing uploaded audio files
  - Files are stored in: `audio-files/{timestamp}-{random}.{extension}`

- **Transcription Output Bucket**: `kani-audio-transcription`
  - Used for storing transcription results
  - Files are organized in folders: `YYYY/MM/DD/{jobName}.json`
  - Example: `2024/01/15/transcription-1234567890-abc123.json`

## Required IAM Permissions

Your Cognito Identity Pool's IAM role needs the following permissions:

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

## Folder Structure

### Audio Files (kani-audio bucket)
```
kani-audio/
└── audio-files/
    ├── 1705123456789-abc123.mp3
    ├── 1705123457890-def456.wav
    └── ...
```

### Transcription Files (kani-audio-transcription bucket)
```
kani-audio-transcription/
└── 2024/
    └── 01/
        └── 15/
            ├── transcription-1705123456789-abc123.json
            ├── transcription-1705123457890-def456.json
            └── ...
```

## Testing the Configuration

1. Ensure both S3 buckets exist:
   - `kani-audio`
   - `kani-audio-transcription`

2. Verify Cognito Identity Pool IAM role has the required permissions

3. Run the application:
   ```bash
   ng serve
   ```

4. Upload an audio file and verify:
   - File appears in `kani-audio/audio-files/`
   - Transcription appears in `kani-audio-transcription/YYYY/MM/DD/`

## Notes

- The transcription files are automatically organized by date (year/month/day)
- Each transcription job gets a unique name with timestamp and random string
- All operations happen directly from the browser (frontend-only)

