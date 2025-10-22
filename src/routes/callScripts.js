const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { validateCallScript } = require('../middleware/validation');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// Create a new call script
router.post('/', validateCallScript, (req, res) => {
  try {
    const callScriptId = uuidv4();
    const callScript = {
      id: callScriptId,
      ...req.body
    };

    database.saveCallScript(callScriptId, callScript);
    
    logger.info(`Call script created: ${callScriptId}`);
    
    res.status(201).json({
      success: true,
      message: 'Call script created successfully',
      data: callScript
    });
  } catch (error) {
    logger.error('Error creating call script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call script',
      error: error.message
    });
  }
});

// Get all call scripts
router.get('/', (req, res) => {
  try {
    const callScripts = database.getAllCallScripts();
    
    res.json({
      success: true,
      data: callScripts
    });
  } catch (error) {
    logger.error('Error fetching call scripts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call scripts',
      error: error.message
    });
  }
});

// Get a specific call script
router.get('/:id', (req, res) => {
  try {
    const callScript = database.getCallScript(req.params.id);
    
    if (!callScript) {
      return res.status(404).json({
        success: false,
        message: 'Call script not found'
      });
    }

    res.json({
      success: true,
      data: callScript
    });
  } catch (error) {
    logger.error('Error fetching call script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call script',
      error: error.message
    });
  }
});

// Update a call script
router.put('/:id', validateCallScript, (req, res) => {
  try {
    const callScript = database.getCallScript(req.params.id);
    
    if (!callScript) {
      return res.status(404).json({
        success: false,
        message: 'Call script not found'
      });
    }

    const updatedCallScript = {
      ...callScript,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date()
    };

    database.saveCallScript(req.params.id, updatedCallScript);
    
    logger.info(`Call script updated: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Call script updated successfully',
      data: updatedCallScript
    });
  } catch (error) {
    logger.error('Error updating call script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call script',
      error: error.message
    });
  }
});

// Delete a call script
router.delete('/:id', (req, res) => {
  try {
    const callScript = database.getCallScript(req.params.id);
    
    if (!callScript) {
      return res.status(404).json({
        success: false,
        message: 'Call script not found'
      });
    }

    // Note: In a real implementation, you'd want to check for dependencies
    // before deleting (e.g., analyses that reference this script)
    
    database.callScripts.delete(req.params.id);
    
    logger.info(`Call script deleted: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Call script deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting call script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete call script',
      error: error.message
    });
  }
});

module.exports = router;
