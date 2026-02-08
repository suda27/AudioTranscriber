import { Injectable } from '@angular/core';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private openai: OpenAI;
  // Fallback API key (for local development only)
  // In production, this will be overridden by NG_APP_OPENAI_API_KEY environment variable
  private fallbackApiKey: string = '';

  constructor() {
    // Get API key from environment variable (set in AWS Amplify)
    // Angular will replace process.env['NG_APP_OPENAI_API_KEY'] at build time
    // If not set, fall back to the hardcoded key (for local dev)
    const apiKey = (typeof process !== 'undefined' && 
                    process.env && 
                    process.env['NG_APP_OPENAI_API_KEY']) 
      ? process.env['NG_APP_OPENAI_API_KEY'] 
      : this.fallbackApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set NG_APP_OPENAI_API_KEY environment variable.');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Note: In production, consider using a backend API for better security
    });
  }

  async generateSummary(transcriptionText: string, speakerSegments?: any[]): Promise<string> {
    try {
      // Format the conversation for better context
      let conversationText = transcriptionText;
      
      if (speakerSegments && speakerSegments.length > 0) {
        // Format as a conversation with speaker labels
        conversationText = speakerSegments
          .map(seg => `${seg.speaker}: ${seg.text}`)
          .join('\n\n');
      }

      const prompt = `Please provide a concise summary of the following conversation transcript. 
Focus on the main topics discussed, key points, decisions made, and important information.
Keep the summary clear and well-structured.

Transcript:
${conversationText}

Summary:`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using a cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes conversations clearly and concisely.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
      return summary.trim();
    } catch (error: any) {
      console.error('Error generating summary:', error);
      throw new Error(`Failed to generate summary: ${error.message || 'Unknown error'}`);
    }
  }
}

