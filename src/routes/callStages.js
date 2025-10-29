const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { validateCallStages } = require('../middleware/validation');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// Create a new call stages script
router.post('/', validateCallStages, (req, res) => {
  try {
    const callStagesId = uuidv4();
    const callStages = {
      id: callStagesId,
      ...req.body
    };

    database.saveCallStages(callStagesId, callStages);
    
    logger.info(`Call stages created: ${callStagesId}`);
    
    res.status(201).json({
      success: true,
      message: 'Call script created successfully',
      data: callStages
    });
  } catch (error) {
    logger.error('Error creating call stages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call stages',
      error: error.message
    });
  }
});

// Get all call stages
router.get('/', (req, res) => {
  try {
    const callStages = database.getAllCallStages();
    
    res.json({
      success: true,
      data: callStages
    });
  } catch (error) {
    logger.error('Error fetching call stages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call stages',
      error: error.message
    });
  }
});

// Get a specific call stages script
router.get('/:id', (req, res) => {
  try {
    const callStages = database.getCallStages(req.params.id);
    
    if (!callStages) {
      return res.status(404).json({
        success: false,
        message: 'Call stages not found'
      });
    }

    res.json({
      success: true,
      data: callStages
    });
  } catch (error) {
    logger.error('Error fetching call stages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call stages',
      error: error.message
    });
  }
});

// Update a call stages script
router.put('/:id', validateCallStages, (req, res) => {
  try {
    const callStages = database.getCallStages(req.params.id);
    
    if (!callStages) {
      return res.status(404).json({
        success: false,
        message: 'Call stages not found'
      });
    }

    const updatedCallStages = {
      ...callStages,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date()
    };

    database.saveCallStages(req.params.id, updatedCallStages);
    
    logger.info(`Call stages updated: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Call stages updated successfully',
      data: updatedCallStages
    });
  } catch (error) {
    logger.error('Error updating call stages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call stages',
      error: error.message
    });
  }
});

// Delete a call stages script
router.delete('/:id', (req, res) => {
  try {
    const callStages = database.getCallStages(req.params.id);
    
    if (!callStages) {
      return res.status(404).json({
        success: false,
        message: 'Call stages not found'
      });
    }

    // Note: In a real implementation, you'd want to check for dependencies
    // before deleting (e.g., analyses that reference this script)
    
    database.callStages.delete(req.params.id);
    
    logger.info(`Call stages deleted: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Call stages deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting call stages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete call stages',
      error: error.message
    });
  }
});

module.exports = router;
