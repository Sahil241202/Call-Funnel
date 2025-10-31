const geminiService = require('../config/gemini');
const logger = require('../config/logger');

class AnalysisService {
  async analyzeCall(transcript, callScript, callStages) {
    try {
      // Validate inputs
      if (!transcript || typeof transcript !== 'string') {
        throw new Error('Transcript must be a non-empty string');
      }

      if (!callScript || typeof callScript !== 'string') {
        throw new Error('Call script must be a non-empty string');
      }

      if (!Array.isArray(callStages) || callStages.length === 0) {
        throw new Error('Call stages must be a non-empty array');
      }

      // Perform AI analysis
      const analysisResult = await geminiService.analyzeCallScript(
        transcript,
        callScript,
        callStages
      );

      // Extract stage names from callStages array structure (new format with stageName field)
      const stageNames = callStages.map(stageObj => stageObj.stageName);

      // Determine drop-off stage: first required stage marked as not present
      let dropOff = null;
      for (const stageObj of callStages) {
        if (stageObj.required === true) {
          // Find this stage in the analysis result
          const stageResult = analysisResult.stages?.find(s => s.stageName === stageObj.stageName);
          if (stageResult && stageResult.present === false) {
            dropOff = stageObj.stageName;
            break;
          }
        }
      }

      // The result already includes dropOff, stages, callStageSequence, and summary from Gemini
      // Ensure dropOff is set correctly
      const result = {
        stages: analysisResult.stages,
        dropOff: analysisResult.dropOff || dropOff,
        callStageSequence: analysisResult.callStageSequence || [],
        summary: analysisResult.summary
      };

      logger.info('Analysis completed successfully');

      return result;
    } catch (error) {
      logger.error('Analysis service error:', error);
      throw error;
    }
  }

}

module.exports = new AnalysisService();
