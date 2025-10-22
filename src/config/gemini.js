const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    // Using Gemini 1.5 Flash - best for text analysis and cost-effective
    // Perfect for students as it's free tier friendly
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent analysis
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
  }

  async analyzeCallScript(transcript, callScript) {
    try {
      const prompt = this.buildAnalysisPrompt(transcript, callScript);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAnalysisResponse(text);
    } catch (error) {
      logger.error('Gemini API Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  buildAnalysisPrompt(transcript, callScript) {
    return `
You are an expert call quality analyst. Analyze the following conversation transcript against the provided call script to determine if all required points are covered.

CALL SCRIPT REQUIREMENTS:
${JSON.stringify(callScript, null, 2)}

TRANSCRIPT TO ANALYZE:
${transcript}

ANALYSIS TASK:
For each of the 4 main points (Introduction, Pitch, Data Collection, Closing), determine:
1. Is this point present in the transcript? (true/false)
2. What evidence supports this? (quote relevant parts)
3. Quality score (1-10) - how well was this point executed?
4. Suggestions for improvement

RESPONSE FORMAT (JSON only, no additional text):
{
  "overallScore": number,
  "points": {
    "introduction": {
      "present": boolean,
      "evidence": "string",
      "qualityScore": number,
      "suggestions": "string"
    },
    "pitch": {
      "present": boolean,
      "evidence": "string", 
      "qualityScore": number,
      "suggestions": "string"
    },
    "dataCollection": {
      "present": boolean,
      "evidence": "string",
      "qualityScore": number,
      "suggestions": "string"
    },
    "closing": {
      "present": boolean,
      "evidence": "string",
      "qualityScore": number,
      "suggestions": "string"
    }
  },
  "summary": "string",
  "recommendations": ["string"]
}

Be thorough but concise. Focus on factual analysis based on the transcript content.
`;
  }

  parseAnalysisResponse(text) {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Failed to parse Gemini response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  async generateTranscript(audioFile) {
    // Placeholder for future audio-to-text functionality
    // This would integrate with Google Cloud Speech-to-Text or similar
    throw new Error('Audio transcription not yet implemented');
  }
}

module.exports = new GeminiService();
