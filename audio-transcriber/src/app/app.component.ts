import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { S3Service } from './services/s3.service';
import { TranscribeService } from './services/transcribe.service';

export interface SpeakerSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface SavedJob {
  jobName: string;
  fileName: string;
  fileSize: number;
  startTime: number;
  status: 'in_progress' | 'completed' | 'failed';
  transcript?: string;
  speakerSegments?: SpeakerSegment[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isTranscribing: boolean = false;
  uploadProgress: number = 0;
  transcriptionStatus: string = '';
  transcriptionResult: string = '';
  speakerSegments: SpeakerSegment[] = [];
  showSpeakerView: boolean = true; // Default to speaker view if available
  errorMessage: string = '';
  showConfirmModal: boolean = false;
  savedJobs: SavedJob[] = [];
  showSavedJobs: boolean = false;
  currentJobName: string = '';

  constructor(
    private s3Service: S3Service,
    private transcribeService: TranscribeService
  ) {
    this.loadSavedJobs();
    this.checkForInProgressJobs();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.errorMessage = '';
      this.transcriptionResult = '';
      this.speakerSegments = [];
      this.transcriptionStatus = '';
    }
  }

  showConfirmationModal(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first';
      return;
    }
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  async confirmAndUpload(): Promise<void> {
    this.showConfirmModal = false;
    await this.uploadAndTranscribe();
  }

  async uploadAndTranscribe(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first';
      return;
    }

    this.isUploading = true;
    this.isTranscribing = false;
    this.errorMessage = '';
    this.transcriptionResult = '';
    this.speakerSegments = [];
    this.transcriptionStatus = 'Uploading file to S3...';
    this.uploadProgress = 0;

    try {
      // Upload to S3
      this.uploadProgress = 30;
      const s3Uri = await this.s3Service.uploadFile(this.selectedFile);
      this.uploadProgress = 100;
      this.transcriptionStatus = 'File uploaded successfully. Starting transcription...';

      // Start transcription job
      this.isUploading = false;
      this.isTranscribing = true;
      const jobName = `transcription-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      this.currentJobName = jobName;
      
      // Save job to session storage
      const jobInfo: SavedJob = {
        jobName: jobName,
        fileName: this.selectedFile!.name,
        fileSize: this.selectedFile!.size,
        startTime: Date.now(),
        status: 'in_progress'
      };
      this.saveJob(jobInfo);
      
      await this.transcribeService.startTranscriptionJob(s3Uri, jobName);
      this.transcriptionStatus = 'Transcription job started. Waiting for results...';

      // Poll for transcription results
      const result = await this.transcribeService.pollTranscriptionJob(jobName);
      this.transcriptionResult = result.transcript;
      this.speakerSegments = result.speakerSegments || [];
      this.transcriptionStatus = 'Transcription completed successfully!';
      this.isTranscribing = false;

      // Update saved job with results
      jobInfo.status = 'completed';
      jobInfo.transcript = result.transcript;
      jobInfo.speakerSegments = result.speakerSegments || [];
      this.saveJob(jobInfo);

    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred during upload or transcription';
      this.isUploading = false;
      this.isTranscribing = false;
      this.transcriptionStatus = '';
      
      // Update saved job with error status
      if (this.currentJobName) {
        const jobInfo = this.getJob(this.currentJobName);
        if (jobInfo) {
          jobInfo.status = 'failed';
          this.saveJob(jobInfo);
        }
      }
    }
  }

  // Session Storage Methods
  private saveJob(job: SavedJob): void {
    const jobs = this.getSavedJobs();
    const index = jobs.findIndex(j => j.jobName === job.jobName);
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    sessionStorage.setItem('transcriptionJobs', JSON.stringify(jobs));
    this.savedJobs = jobs;
  }

  private getSavedJobs(): SavedJob[] {
    const stored = sessionStorage.getItem('transcriptionJobs');
    return stored ? JSON.parse(stored) : [];
  }

  private getJob(jobName: string): SavedJob | null {
    const jobs = this.getSavedJobs();
    return jobs.find(j => j.jobName === jobName) || null;
  }

  loadSavedJobs(): void {
    this.savedJobs = this.getSavedJobs();
  }

  async checkForInProgressJobs(): Promise<void> {
    const inProgressJobs = this.savedJobs.filter(j => j.status === 'in_progress');
    if (inProgressJobs.length > 0) {
      // Check status of in-progress jobs
      for (const job of inProgressJobs) {
        try {
          const result = await this.transcribeService.getTranscriptionJobStatus(job.jobName);
          if (result.status === 'COMPLETED' && result.transcript) {
            job.status = 'completed';
            job.transcript = result.transcript;
            job.speakerSegments = result.speakerSegments || [];
            this.saveJob(job);
          } else if (result.status === 'FAILED') {
            job.status = 'failed';
            this.saveJob(job);
          }
        } catch (error) {
          console.error(`Error checking job ${job.jobName}:`, error);
        }
      }
    }
  }

  async retrieveJob(job: SavedJob): Promise<void> {
    if (job.status === 'completed' && job.transcript) {
      this.transcriptionResult = job.transcript;
      this.speakerSegments = job.speakerSegments || [];
      this.transcriptionStatus = 'Transcription retrieved from saved session';
      this.showSavedJobs = false;
    } else if (job.status === 'in_progress') {
      // Try to get current status
      this.transcriptionStatus = 'Checking job status...';
      this.isTranscribing = true;
      try {
        const result = await this.transcribeService.pollTranscriptionJob(job.jobName);
        this.transcriptionResult = result.transcript;
        this.speakerSegments = result.speakerSegments || [];
        this.transcriptionStatus = 'Transcription completed successfully!';
        this.isTranscribing = false;
        
        job.status = 'completed';
        job.transcript = result.transcript;
        job.speakerSegments = result.speakerSegments || [];
        this.saveJob(job);
        this.showSavedJobs = false;
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to retrieve transcription';
        this.isTranscribing = false;
      }
    }
  }

  deleteJob(jobName: string): void {
    const jobs = this.getSavedJobs().filter(j => j.jobName !== jobName);
    sessionStorage.setItem('transcriptionJobs', JSON.stringify(jobs));
    this.savedJobs = jobs;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  getJobStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async copyToClipboard(): Promise<void> {
    try {
      let textToCopy = this.transcriptionResult;
      
      // If we have speaker segments, format them nicely
      if (this.speakerSegments.length > 0) {
        textToCopy = this.speakerSegments
          .map(seg => `${this.formatSpeakerName(seg.speaker)}: ${seg.text}`)
          .join('\n\n');
      }
      
      await navigator.clipboard.writeText(textToCopy);
      alert('Transcription copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  }

  formatSpeakerName(speakerLabel: string): string {
    // Convert spk_0, spk_1 to Speaker 1, Speaker 2, etc.
    const match = speakerLabel.match(/spk_(\d+)/);
    if (match) {
      const speakerNum = parseInt(match[1]) + 1;
      return `Speaker ${speakerNum}`;
    }
    return speakerLabel;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getSpeakerColor(speaker: string): string {
    // Assign consistent colors to speakers
    const speakerIndex = parseInt(speaker.replace('spk_', '')) || 0;
    const colors = [
      '#007bff', // Blue
      '#28a745', // Green
      '#ffc107', // Yellow
      '#dc3545', // Red
      '#6f42c1', // Purple
      '#fd7e14', // Orange
      '#20c997', // Teal
      '#e83e8c'  // Pink
    ];
    return colors[speakerIndex % colors.length];
  }
}
