const { GoogleGenAI, Type } = require('@google/genai');
const logger = require('./logger');
const responseSchemaJson = require('../../responseSchema.json');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    // Using Gemini 2.5 Flash - best for text analysis and cost-effective
    // Initialize the new GoogleGenAI client
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  // Convert JSON schema to Type-based schema for @google/genai
  convertJsonSchemaToType(jsonSchema) {
    if (jsonSchema.type === 'object') {
      const schema = {
        type: Type.OBJECT,
        properties: {},
        required: jsonSchema.required || []
      };

      Object.keys(jsonSchema.properties || {}).forEach(key => {
        const prop = jsonSchema.properties[key];
        
        if (prop.type === 'array') {
          // Handle array items
          if (prop.items && prop.items.additionalProperties) {
            // Handle dynamic object keys in array (stages)
            schema.properties[key] = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                additionalProperties: this.convertJsonSchemaToType(prop.items.additionalProperties)
              }
            };
          } else if (prop.items) {
            schema.properties[key] = {
              type: Type.ARRAY,
              items: this.convertJsonSchemaToType(prop.items)
            };
          } else {
            schema.properties[key] = { type: Type.ARRAY };
          }
        } else if (prop.type === 'string') {
          schema.properties[key] = { type: Type.STRING };
        } else if (prop.type === 'boolean') {
          schema.properties[key] = { type: Type.BOOLEAN };
        } else if (prop.oneOf) {
          // Handle nullable types (string | null)
          schema.properties[key] = { 
            type: Type.STRING,
            nullable: true 
          };
        } else if (prop.type === 'object') {
          schema.properties[key] = this.convertJsonSchemaToType(prop);
        }
      });

      return schema;
    } else if (jsonSchema.type === 'array') {
      return {
        type: Type.ARRAY,
        items: this.convertJsonSchemaToType(jsonSchema.items)
      };
    } else if (jsonSchema.type === 'string') {
      return { type: Type.STRING };
    } else if (jsonSchema.type === 'boolean') {
      return { type: Type.BOOLEAN };
    }
    
    return jsonSchema;
  }

  async analyzeCallScript(transcript, callScript, callStages) {
    try {
      const prompt = this.buildAnalysisPrompt(transcript, callScript, callStages);
      
      // Convert JSON schema to Type-based schema
      const responseSchema = this.convertJsonSchemaToType(responseSchemaJson);
      
      // Use the new @google/genai API structure
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      
      // The new API might return text as a property or the response might be structured differently
      let text;
      
      // Log response structure for debugging
      logger.info('Response type:', typeof response);
      logger.info('Response keys:', Object.keys(response || {}));
      
      if (typeof response === 'string') {
        // Response is already the text string
        text = response;
      } else if (typeof response.text === 'function') {
        text = await response.text();
      } else if (typeof response.text === 'string') {
        text = response.text;
      } else if (response.data && typeof response.data === 'string') {
        text = response.data;
      } else if (response.content) {
        if (typeof response.content === 'string') {
          text = response.content;
        } else if (typeof response.content.text === 'function') {
          text = await response.content.text();
        } else if (typeof response.content.text === 'string') {
          text = response.content.text;
        }
      } else {
        // Log the full response for debugging
        logger.error('Unexpected response structure:', JSON.stringify(response, null, 2));
        throw new Error('Unexpected response structure from Gemini API. Check logs for details.');
      }
      
      return this.parseAnalysisResponse(text);
    } catch (error) {
      logger.error('Gemini API Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  buildAnalysisPrompt(transcript, callScript, callStages) {
    // Extract stage names from callStages array structure (new format with stageName field)
    const stageNames = callStages.map(stageObj => stageObj.stageName);

    return `
You are an expert call quality analyst. Analyze the following conversation transcript against the provided call script and call stages to determine if all required stages are covered.

CALL SCRIPT:
${callScript}

CALL STAGES REQUIREMENTS:
${JSON.stringify(callStages, null, 2)}

TRANSCRIPT TO ANALYZE:
${transcript}

ANALYSIS TASK:
For each stage defined in the call stages array, determine:
1. The stageName (from the callStages array)
2. Is this stage present in the transcript? (true/false)
3. What evidence supports this? (quote relevant parts from transcript that demonstrate the stage was covered)

Return the stages as an array where each item has: stageName (string), present (boolean), and evidence (string).

Additionally, extract the chronological sequence of stages as they occur in the conversation. The same stage can appear multiple times. Use only the provided stage names and list them in the order they appear in the transcript.

Identify the drop-off stage: The first required stage (where required: true) that is marked as not present (present: false). If all required stages are present, set dropOff to null.

STAGES TO ANALYZE: ${stageNames.join(', ')}

Provide a brief summary describing which stages were found and any observations about the call quality.
`;
  }

  parseAnalysisResponse(text) {
    try {
      // Log the raw response for debugging
      logger.info('Raw Gemini response received:', text.substring(0, 500));
      
      // Since we're using responseSchema, the response should already be valid JSON
      // But we'll still clean it up in case there's any formatting
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present (shouldn't happen with schema, but just in case)
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/gm, '');
      cleanedText = cleanedText.replace(/\n?```\s*$/gm, '');
      
      const parsed = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!parsed.stages || !Array.isArray(parsed.stages)) {
        logger.error('Invalid response structure. Parsed:', parsed);
        throw new Error('Response missing required "stages" array');
      }

      // Validate each stage has the required fields
      parsed.stages.forEach((stage, index) => {
        if (!stage.stageName || typeof stage.stageName !== 'string') {
          logger.warn(`Stage at index ${index} missing stageName field`);
        }
      });
      
      if (parsed.dropOff !== null && typeof parsed.dropOff !== 'string') {
        logger.warn('Invalid dropOff field, setting to null');
        parsed.dropOff = null;
      }
      
      if (!parsed.summary || typeof parsed.summary !== 'string') {
        logger.warn('Response missing summary field, adding default');
        parsed.summary = 'Analysis completed';
      }

      // Normalize callStageSequence
      if (!Array.isArray(parsed.callStageSequence)) {
        logger.warn('Response missing callStageSequence field, adding default');
        parsed.callStageSequence = [];
      } else {
        parsed.callStageSequence = parsed.callStageSequence
          .filter(item => typeof item === 'string');
      }
      
      return parsed;
    } catch (error) {
      logger.error('Failed to parse Gemini response:', error);
      logger.error('Response text that failed to parse:', text);
      throw new Error(`Invalid response format from AI: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
