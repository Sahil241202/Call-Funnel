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

  async analyzeCallScript(transcript, callScript, callStages) {
    try {
      const prompt = this.buildAnalysisPrompt(transcript, callScript, callStages);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAnalysisResponse(text);
    } catch (error) {
      logger.error('Gemini API Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  buildAnalysisPrompt(transcript, callScript, callStages) {
    // Extract stage names from callStages dynamically
    const stageNames = Object.keys(callStages).filter(key => 
      key !== 'id' && key !== 'name' && key !== 'description' && 
      key !== 'createdAt' && key !== 'updatedAt'
    );

    // Build dynamic stages object for the response
    const stagesObject = {};
    stageNames.forEach(stageName => {
      stagesObject[stageName] = {
        "present": false,
        "evidence": ""
      };
    });

    return `
You are an expert call quality analyst. Analyze the following conversation transcript against the provided call script and call stages to determine if all required stages are covered.

CALL SCRIPT:
${JSON.stringify(callScript, null, 2)}

CALL STAGES REQUIREMENTS:
${JSON.stringify(callStages, null, 2)}

TRANSCRIPT TO ANALYZE:
${transcript}

ANALYSIS TASK:
For each stage defined in the call stages, determine:
1. Is this stage present in the transcript? (true/false)
2. What evidence supports this? (quote relevant parts from transcript)

STAGES TO ANALYZE: ${stageNames.join(', ')}

RESPONSE FORMAT (JSON only, no additional text):
{
  "stages": ${JSON.stringify(stagesObject, null, 2)},
  "summary": "Brief summary of the analysis"
}

Be thorough but concise. Focus on factual analysis based on the transcript content. Only include stages that are defined in the call stages object.
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
