const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { validateCallScript } = require('../middleware/validation');
const { readCallScriptContent, isValidCallScriptId } = require('../services/callScriptService');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// Create a new call script
router.post('/', validateCallScript, (req, res) => {
  try {
    const { name, description, id } = req.body;
    
    // Validate if the call script ID exists in our file mapping
    if (!isValidCallScriptId(id)) {
      return res.status(400).json({
        success: false,
        message: `Call script with ID ${id} not found`,
        availableIds: Object.keys(require('../services/callScriptService').CALL_SCRIPT_FILE_MAP)
      });
    }

    // Read content from the mapped file
    const content = readCallScriptContent(id);
    
    const callScriptId = uuidv4();
    const callScript = {
      id: callScriptId,
      name,
      description,
      scriptId: id, // Store the original script ID for reference
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    database.saveCallScript(callScriptId, callScript);
    
    logger.info(`Call script created: ${callScriptId} with script ID: ${id}`);
    
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

// Get available call script IDs (for frontend to know what IDs are available)
router.get('/available/ids', (req, res) => {
  try {
    const { getAvailableCallScriptIds, CALL_SCRIPT_FILE_MAP } = require('../services/callScriptService');
    
    res.json({
      success: true,
      data: {
        availableIds: getAvailableCallScriptIds(),
        fileMapping: CALL_SCRIPT_FILE_MAP
      }
    });
  } catch (error) {
    logger.error('Error fetching available call script IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available call script IDs',
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

    const { name, description, scriptId } = req.body;
    
    // If scriptId is being updated, validate it
    if (scriptId && !isValidCallScriptId(scriptId)) {
      return res.status(400).json({
        success: false,
        message: `Call script with ID ${scriptId} not found`,
        availableIds: Object.keys(require('../services/callScriptService').CALL_SCRIPT_FILE_MAP)
      });
    }

    // Read content from the mapped file if scriptId is provided
    let content = callScript.content;
    if (scriptId) {
      content = readCallScriptContent(scriptId);
    }

    const updatedCallScript = {
      ...callScript,
      name: name || callScript.name,
      description: description || callScript.description,
      scriptId: scriptId || callScript.scriptId,
      content,
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
