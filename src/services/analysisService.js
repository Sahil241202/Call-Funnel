const geminiService = require('../config/gemini');
const database = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class AnalysisService {
  async analyzeCall(transcriptId, callScriptId) {
    try {
      // Get transcript and call script from database
      const transcript = database.getTranscript(transcriptId);
      const callScript = database.getCallScript(callScriptId);

      if (!transcript) {
        throw new Error('Transcript not found');
      }

      if (!callScript) {
        throw new Error('Call script not found');
      }

      // Perform AI analysis
      const analysisResult = await geminiService.analyzeCallScript(
        transcript.content,
        callScript
      );

      // Create analysis record
      const analysisId = uuidv4();
      const analysis = {
        id: analysisId,
        transcriptId,
        callScriptId,
        result: analysisResult,
        status: 'completed',
        metadata: {
          transcriptMetadata: transcript.metadata,
          callScriptName: callScript.name,
          analyzedAt: new Date()
        }
      };

      // Save analysis
      database.saveAnalysis(analysisId, analysis);

      logger.info(`Analysis completed for transcript ${transcriptId} and script ${callScriptId}`);

      return analysis;
    } catch (error) {
      logger.error('Analysis service error:', error);
      throw error;
    }
  }

  async getAnalysis(analysisId) {
    const analysis = database.getAnalysis(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    return analysis;
  }

  async getAllAnalyses() {
    return database.getAllAnalyses();
  }

  async getAnalysesByScript(callScriptId) {
    const allAnalyses = database.getAllAnalyses();
    return allAnalyses.filter(analysis => analysis.callScriptId === callScriptId);
  }

  async getAnalysesByTranscript(transcriptId) {
    const allAnalyses = database.getAllAnalyses();
    return allAnalyses.filter(analysis => analysis.transcriptId === transcriptId);
  }

  // Helper method to calculate overall statistics
  calculateStatistics(analyses) {
    if (!analyses || analyses.length === 0) {
      return {
        totalAnalyses: 0,
        averageScore: 0,
        pointCoverage: {
          introduction: 0,
          pitch: 0,
          dataCollection: 0,
          closing: 0
        }
      };
    }

    const totalAnalyses = analyses.length;
    const totalScore = analyses.reduce((sum, analysis) => 
      sum + (analysis.result.overallScore || 0), 0);
    const averageScore = totalScore / totalAnalyses;

    const pointCoverage = {
      introduction: 0,
      pitch: 0,
      dataCollection: 0,
      closing: 0
    };

    analyses.forEach(analysis => {
      if (analysis.result.points) {
        Object.keys(pointCoverage).forEach(point => {
          if (analysis.result.points[point]?.present) {
            pointCoverage[point]++;
          }
        });
      }
    });

    // Convert to percentages
    Object.keys(pointCoverage).forEach(point => {
      pointCoverage[point] = Math.round((pointCoverage[point] / totalAnalyses) * 100);
    });

    return {
      totalAnalyses,
      averageScore: Math.round(averageScore * 10) / 10,
      pointCoverage
    };
  }
}

module.exports = new AnalysisService();
