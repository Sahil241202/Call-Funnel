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

    // Build example format
    const exampleStages = stageNames.map((stage, index) => {
      const isFirst = index === 0;
      return `    "${stage}": {
      "present": ${isFirst ? 'true' : 'false'},
      "evidence": ${isFirst ? '"relevant quote from transcript"' : '""'}
    }`;
    }).join(',\n');

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

IMPORTANT: You must respond with ONLY valid JSON, no markdown formatting, no code blocks, no additional text before or after.

RESPONSE FORMAT - Return a JSON object with this exact structure:
{
  "stages": {
${stageNames.map(stage => `    "${stage}": {
      "present": false,
      "evidence": ""
    }`).join(',\n')}
  },
  "summary": ""
}

EXAMPLE OUTPUT FORMAT:
{
  "stages": {
${exampleStages}
  },
  "summary": "Brief summary describing which stages were found"
}

CRITICAL: Return ONLY the JSON object. Do not include markdown formatting like \`\`\`json or \`\`\`. Start directly with { and end with }.
`;
  }

  parseAnalysisResponse(text) {
    try {
      // Log the raw response for debugging
      logger.info('Raw Gemini response received:', text.substring(0, 500));
      
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      
      // Remove markdown code blocks (```json or ```)
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/gm, '');
      cleanedText = cleanedText.replace(/\n?```\s*$/gm, '');
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON found in response. Full response:', text);
        throw new Error('No valid JSON found in response');
      }
      
      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);
      
      // Validate the response structure
      if (!parsed.stages || typeof parsed.stages !== 'object') {
        logger.error('Invalid response structure. Parsed:', parsed);
        throw new Error('Response missing required "stages" object');
      }
      
      if (!parsed.summary || typeof parsed.summary !== 'string') {
        logger.warn('Response missing summary field, adding default');
        parsed.summary = 'Analysis completed';
      }
      
      return parsed;
    } catch (error) {
      logger.error('Failed to parse Gemini response:', error);
      logger.error('Response text that failed to parse:', text);
      throw new Error(`Invalid response format from AI: ${error.message}`);
    }
  }

  async generateTranscript(audioFile) {
    // Placeholder for future audio-to-text functionality
    // This would integrate with Google Cloud Speech-to-Text or similar
    throw new Error('Audio transcription not yet implemented');
  }
}

module.exports = new GeminiService();
