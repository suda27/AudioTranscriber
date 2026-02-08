import { Injectable } from '@angular/core';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, TranscriptionJobStatus, MediaFormat } from '@aws-sdk/client-transcribe';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { AwsConfigService } from './aws-config.service';
import { S3Service } from './s3.service';

@Injectable({
  providedIn: 'root'
})
export class TranscribeService {
  private transcribeClient!: TranscribeClient; // Initialized in constructor via initializeTranscribeClient()

  constructor(
    private awsConfig: AwsConfigService,
    private s3Service: S3Service
  ) {
    this.initializeTranscribeClient();
  }

  private initializeTranscribeClient(): void {
    const region = this.awsConfig.getRegion();
    
    // Option 1: Using Cognito Identity Pool (Recommended)
    if (this.awsConfig.cognitoIdentityPoolId) {
      this.transcribeClient = new TranscribeClient({
        region: region,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: region },
          identityPoolId: this.awsConfig.cognitoIdentityPoolId
        })
      });
    } 
    // Option 2: Direct credentials (Development only)
    else if (this.awsConfig.accessKeyId && this.awsConfig.secretAccessKey) {
      this.transcribeClient = new TranscribeClient({
        region: region,
        credentials: {
          accessKeyId: this.awsConfig.accessKeyId,
          secretAccessKey: this.awsConfig.secretAccessKey
        }
      });
    } else {
      throw new Error('AWS credentials not configured. Please set up Cognito Identity Pool or provide credentials.');
    }
  }

  async startTranscriptionJob(s3Uri: string, jobName: string): Promise<string> {
    try {
      // Create organized folder structure: YYYY/MM/DD/jobName.json
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const outputKey = `${year}/${month}/${day}/${jobName}.json`;
      
      const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        Media: {
          MediaFileUri: s3Uri
        },
        MediaFormat: this.detectMediaFormat(s3Uri),
        LanguageCode: 'en-US', // Change as needed
        OutputBucketName: this.awsConfig.getTranscriptionBucketName(),
        OutputKey: outputKey, // Organized folder structure
        Settings: {
          ShowSpeakerLabels: true, // Enable speaker identification
          ShowAlternatives: true, // Required when using MaxAlternatives
          MaxAlternatives: 2, // Must be at least 2 (we'll use the first one)
          MaxSpeakerLabels: 10 // Maximum number of speakers to identify
        }
      });

      const response = await this.transcribeClient.send(command);
      return response.TranscriptionJob?.TranscriptionJobName || jobName;
    } catch (error) {
      console.error('Error starting transcription job:', error);
      throw new Error(`Failed to start transcription job: ${error}`);
    }
  }

  async getTranscriptionJobStatus(jobName: string): Promise<{ status: string; transcript?: string; speakerSegments?: any[] }> {
    try {
      const command = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      });

      const response = await this.transcribeClient.send(command);
      const job = response.TranscriptionJob;

      if (!job) {
        throw new Error('Transcription job not found');
      }

      const status = job.TranscriptionJobStatus || 'UNKNOWN';

      if (status === TranscriptionJobStatus.COMPLETED && job.Transcript?.TranscriptFileUri) {
        // Fetch the transcript from the S3 URI
        const transcriptData = await this.fetchTranscriptWithSpeakers(job.Transcript.TranscriptFileUri);
        return { 
          status, 
          transcript: transcriptData.fullText,
          speakerSegments: transcriptData.speakerSegments
        };
      }

      return { status };
    } catch (error) {
      console.error('Error getting transcription job status:', error);
      throw new Error(`Failed to get transcription job status: ${error}`);
    }
  }

  private async fetchTranscript(transcriptUri: string): Promise<string> {
    try {
      // Parse S3 URI to get bucket and key
      const s3Info = this.s3Service.parseS3Uri(transcriptUri);
      if (!s3Info) {
        throw new Error(`Invalid S3 URI format: ${transcriptUri}`);
      }

      // Fetch transcript from S3 using S3 client
      const transcriptJson = await this.s3Service.getObject(s3Info.bucket, s3Info.key);
      const data = JSON.parse(transcriptJson);
      
      // Extract the transcript text from the JSON response
      if (data.results?.transcripts?.length > 0) {
        return data.results.transcripts[0].transcript;
      }
      
      return 'No transcript found';
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw new Error(`Failed to fetch transcript: ${error}`);
    }
  }

  private async fetchTranscriptWithSpeakers(transcriptUri: string): Promise<{ fullText: string; speakerSegments: any[] }> {
    try {
      // Parse S3 URI to get bucket and key
      const s3Info = this.s3Service.parseS3Uri(transcriptUri);
      if (!s3Info) {
        throw new Error(`Invalid S3 URI format: ${transcriptUri}`);
      }

      // Fetch transcript from S3 using S3 client
      const transcriptJson = await this.s3Service.getObject(s3Info.bucket, s3Info.key);
      const data = JSON.parse(transcriptJson);
      
      // Extract full transcript text
      const fullText = data.results?.transcripts?.length > 0 
        ? data.results.transcripts[0].transcript 
        : 'No transcript found';

      // Parse speaker segments if available
      const speakerSegments: any[] = [];
      
      if (data.results?.speaker_labels?.segments && data.results?.items) {
        const items = data.results.items;
        const segments = data.results.speaker_labels.segments;
        
        // Process each speaker segment
        segments.forEach((segment: any) => {
          const speakerLabel = segment.speaker_label || 'spk_0';
          const startTime = parseFloat(segment.start_time || '0');
          const endTime = parseFloat(segment.end_time || '0');
          
          // Find items that belong to this segment using the items array
          // Items have speaker_label property when speaker labels are enabled
          const segmentItems: any[] = [];
          
          items.forEach((item: any) => {
            const itemStart = parseFloat(item.start_time || '0');
            const itemEnd = parseFloat(item.end_time || itemStart);
            
            // Check if item is within segment time range and has matching speaker label
            if (itemStart >= startTime && itemEnd <= endTime) {
              // Check if this item has the same speaker label (if available)
              if (!item.speaker_label || item.speaker_label === speakerLabel) {
                segmentItems.push(item);
              }
            }
          });

          // If no items found by speaker label, try finding by time range only
          if (segmentItems.length === 0) {
            items.forEach((item: any) => {
              const itemStart = parseFloat(item.start_time || '0');
              const itemEnd = parseFloat(item.end_time || itemStart);
              if (itemStart >= startTime && itemEnd <= endTime) {
                segmentItems.push(item);
              }
            });
          }

          // Build text for this segment
          const segmentText = segmentItems
            .map((item: any) => {
              const content = item.alternatives?.[0]?.content || '';
              // Handle punctuation items (they don't have start_time)
              return content;
            })
            .filter((text: string) => text.trim().length > 0)
            .join(' ')
            .trim();

          if (segmentText) {
            speakerSegments.push({
              speaker: speakerLabel,
              text: segmentText,
              startTime: startTime,
              endTime: endTime
            });
          }
        });
      }

      return {
        fullText,
        speakerSegments: speakerSegments.length > 0 ? speakerSegments : []
      };
    } catch (error) {
      console.error('Error fetching transcript with speakers:', error);
      throw new Error(`Failed to fetch transcript: ${error}`);
    }
  }

  private detectMediaFormat(s3Uri: string): MediaFormat {
    const extension = s3Uri.split('.').pop()?.toLowerCase();
    
    // Map file extensions to AWS Transcribe MediaFormat enum values
    const formatMap: { [key: string]: MediaFormat } = {
      'mp3': MediaFormat.MP3,
      'mp4': MediaFormat.MP4,
      'wav': MediaFormat.WAV,
      'flac': MediaFormat.FLAC,
      'ogg': MediaFormat.OGG,
      'amr': MediaFormat.AMR,
      'webm': MediaFormat.WEBM,
      'm4a': MediaFormat.M4A
    };

    return formatMap[extension || ''] || MediaFormat.MP3;
  }

  async pollTranscriptionJob(jobName: string, maxAttempts: number = 60, intervalMs: number = 5000): Promise<{ transcript: string; speakerSegments?: any[] }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getTranscriptionJobStatus(jobName);
      
      if (result.status === TranscriptionJobStatus.COMPLETED) {
        return {
          transcript: result.transcript || 'Transcription completed but no transcript found',
          speakerSegments: result.speakerSegments
        };
      }
      
      if (result.status === TranscriptionJobStatus.FAILED) {
        throw new Error('Transcription job failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Transcription job timed out');
  }
}

