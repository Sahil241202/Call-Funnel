const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { validateTranscript } = require('../middleware/validation');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// Create a new transcript
router.post('/', validateTranscript, (req, res) => {
  try {
    const transcriptId = uuidv4();
    const transcript = {
      id: transcriptId,
      ...req.body
    };

    database.saveTranscript(transcriptId, transcript);
    
    logger.info(`Transcript created: ${transcriptId}`);
    
    res.status(201).json({
      success: true,
      message: 'Transcript created successfully',
      data: transcript
    });
  } catch (error) {
    logger.error('Error creating transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transcript',
      error: error.message
    });
  }
});

// Get all transcripts
router.get('/', (req, res) => {
  try {
    const transcripts = Array.from(database.transcripts.entries()).map(([id, transcript]) => ({
      id,
      ...transcript
    }));
    
    res.json({
      success: true,
      data: transcripts
    });
  } catch (error) {
    logger.error('Error fetching transcripts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transcripts',
      error: error.message
    });
  }
});

// Get a specific transcript
router.get('/:id', (req, res) => {
  try {
    const transcript = database.getTranscript(req.params.id);
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found'
      });
    }

    res.json({
      success: true,
      data: transcript
    });
  } catch (error) {
    logger.error('Error fetching transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transcript',
      error: error.message
    });
  }
});

// Update a transcript
router.put('/:id', validateTranscript, (req, res) => {
  try {
    const transcript = database.getTranscript(req.params.id);
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found'
      });
    }

    const updatedTranscript = {
      ...transcript,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date()
    };

    database.saveTranscript(req.params.id, updatedTranscript);
    
    logger.info(`Transcript updated: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Transcript updated successfully',
      data: updatedTranscript
    });
  } catch (error) {
    logger.error('Error updating transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transcript',
      error: error.message
    });
  }
});

// Delete a transcript
router.delete('/:id', (req, res) => {
  try {
    const transcript = database.getTranscript(req.params.id);
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found'
      });
    }

    // Note: In a real implementation, you'd want to check for dependencies
    // before deleting (e.g., analyses that reference this transcript)
    
    database.transcripts.delete(req.params.id);
    
    logger.info(`Transcript deleted: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Transcript deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transcript',
      error: error.message
    });
  }
});

module.exports = router;
