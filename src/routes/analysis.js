const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');
const { validateAnalysisRequest } = require('../middleware/validation');
const logger = require('../config/logger');

// Analyze a transcript against a call script
router.post('/analyze', validateAnalysisRequest, async (req, res) => {
  try {
    const { transcriptId, callScriptId } = req.body;
    
    const analysis = await analysisService.analyzeCall(transcriptId, callScriptId);
    
    logger.info(`Analysis completed: ${analysis.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Analysis completed successfully',
      data: analysis
    });
  } catch (error) {
    logger.error('Error performing analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

// Get a specific analysis
router.get('/:id', async (req, res) => {
  try {
    const analysis = await analysisService.getAnalysis(req.params.id);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error fetching analysis:', error);
    res.status(404).json({
      success: false,
      message: 'Analysis not found',
      error: error.message
    });
  }
});

// Get all analyses
router.get('/', async (req, res) => {
  try {
    const analyses = await analysisService.getAllAnalyses();
    
    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    logger.error('Error fetching analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses',
      error: error.message
    });
  }
});

// Get analyses by call script
router.get('/script/:callScriptId', async (req, res) => {
  try {
    const analyses = await analysisService.getAnalysesByScript(req.params.callScriptId);
    
    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    logger.error('Error fetching analyses by script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses',
      error: error.message
    });
  }
});

// Get analyses by transcript
router.get('/transcript/:transcriptId', async (req, res) => {
  try {
    const analyses = await analysisService.getAnalysesByTranscript(req.params.transcriptId);
    
    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    logger.error('Error fetching analyses by transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses',
      error: error.message
    });
  }
});

// Get analysis statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const analyses = await analysisService.getAllAnalyses();
    const statistics = analysisService.calculateStatistics(analyses);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error calculating statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics',
      error: error.message
    });
  }
});

// Get statistics for a specific call script
router.get('/stats/script/:callScriptId', async (req, res) => {
  try {
    const analyses = await analysisService.getAnalysesByScript(req.params.callScriptId);
    const statistics = analysisService.calculateStatistics(analyses);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error calculating script statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics',
      error: error.message
    });
  }
});

module.exports = router;
