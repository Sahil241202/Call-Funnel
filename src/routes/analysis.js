const express = require('express');
const router = express.Router();
const multer = require('multer');
const analysisService = require('../services/analysisService');
const { validateAnalysisRequest } = require('../middleware/validation');
const logger = require('../config/logger');

// Configure multer for file uploads (in-memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to handle both JSON body and file uploads
const handleRequestBody = async (req, res, next) => {
  // If body already has data (JSON request), proceed
  if (req.body && Object.keys(req.body).length > 0 && req.body.transcript) {
    return next();
  }
  
  // If file was uploaded (form-data), parse it
  const uploadedFile = req.file || (req.files && req.files[0]);
  
  if (uploadedFile) {
    try {
      const fileContent = uploadedFile.buffer.toString('utf8');
      const jsonData = JSON.parse(fileContent);
      
      // Populate req.body with parsed JSON data
      req.body = jsonData;
      logger.info('Parsed JSON from uploaded file:', Object.keys(jsonData));
      return next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON file',
        error: error.message
      });
    }
  }
  
  // If neither JSON body nor file is present, continue (validation will catch it)
  next();
};

// Analyze a transcript against a call script
// Accepts both: JSON body (raw) or file upload (form-data)
router.post('/analyze', upload.any(), handleRequestBody, validateAnalysisRequest, async (req, res) => {
  try {
    const { transcript, callScript, callStages } = req.body;
    
    const result = await analysisService.analyzeCall(transcript, callScript, callStages);
    
    logger.info('Analysis completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      data: {
        result: result,
        status: 'completed',
        metadata: {
          analyzedAt: new Date().toISOString()
        }
      }
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

module.exports = router;
