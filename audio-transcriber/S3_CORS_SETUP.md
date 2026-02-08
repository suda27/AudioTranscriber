# S3 CORS Configuration Guide

## The Error
"Failed to fetch" when uploading to S3 typically means the S3 bucket doesn't have CORS (Cross-Origin Resource Sharing) configured to allow browser requests.

## Solution: Configure CORS on Your S3 Bucket

### Step 1: Go to S3 Console
1. Log in to AWS Console
2. Navigate to **Amazon S3**
3. Click on your bucket: **`kani-audio`**

### Step 2: Configure CORS
1. Click on the **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**

### Step 3: Add CORS Configuration
Paste this CORS configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**For Production (More Secure):**
Replace `"*"` in `AllowedOrigins` with your specific domain:
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:4200",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### Step 4: Save Configuration
1. Click **Save changes**

### Step 5: Repeat for Transcription Bucket
Do the same for **`kani-audio-transcription`** bucket:
1. Go to S3 Console
2. Click on **`kani-audio-transcription`**
3. Go to **Permissions** tab
4. Edit **CORS** configuration
5. Use the same JSON configuration as above
6. Save

## Alternative: Using AWS CLI

If you have AWS CLI configured:

```bash
# For kani-audio bucket
aws s3api put-bucket-cors \
  --bucket kani-audio \
  --cors-configuration file://cors-config.json

# For kani-audio-transcription bucket
aws s3api put-bucket-cors \
  --bucket kani-audio-transcription \
  --cors-configuration file://cors-config.json
```

Create `cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## Verify CORS Configuration

After configuring CORS, you can verify it:

```bash
aws s3api get-bucket-cors --bucket kani-audio
```

## Additional Checks

### 1. Verify Bucket Exists
- Make sure `kani-audio` bucket exists in `ap-south-1` region
- Make sure `kani-audio-transcription` bucket exists in `ap-south-1` region

### 2. Check IAM Permissions
Ensure your Cognito Identity Pool's IAM role has:
- `s3:PutObject` permission on `kani-audio/*`
- `s3:GetObject` permission on `kani-audio-transcription/*`

### 3. Check Region
Make sure the buckets are in the same region as your Cognito Identity Pool (`ap-south-1`)

## Testing

After configuring CORS:
1. Wait a few seconds for changes to propagate
2. Try uploading a file again
3. Check browser console for any additional errors

## Troubleshooting

### Still getting "Failed to fetch"?
1. **Check browser console** for detailed error messages
2. **Verify bucket names** are correct in `aws-config.service.ts`
3. **Check network tab** in browser DevTools to see the actual request/response
4. **Verify IAM role** has correct permissions
5. **Clear browser cache** and try again

### CORS errors in browser console?
- Make sure CORS configuration is saved correctly
- Check that `AllowedOrigins` includes your domain (or `*` for development)
- Verify `AllowedMethods` includes `PUT` and `POST`

