const Joi = require('joi');

const callScriptSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  introduction: Joi.object({
    required: Joi.boolean().default(true),
    description: Joi.string().required(),
    keyPoints: Joi.array().items(Joi.string()).default([])
  }).required(),
  pitch: Joi.object({
    required: Joi.boolean().default(true),
    description: Joi.string().required(),
    keyPoints: Joi.array().items(Joi.string()).default([])
  }).required(),
  dataCollection: Joi.object({
    required: Joi.boolean().default(true),
    description: Joi.string().required(),
    keyPoints: Joi.array().items(Joi.string()).default([])
  }).required(),
  closing: Joi.object({
    required: Joi.boolean().default(true),
    description: Joi.string().required(),
    keyPoints: Joi.array().items(Joi.string()).default([])
  }).required()
});

const transcriptSchema = Joi.object({
  content: Joi.string().required().min(10),
  metadata: Joi.object({
    duration: Joi.number().optional(),
    participants: Joi.array().items(Joi.string()).optional(),
    date: Joi.date().optional()
  }).optional()
});

const analysisRequestSchema = Joi.object({
  transcriptId: Joi.string().required(),
  callScriptId: Joi.string().required()
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  validateCallScript: validate(callScriptSchema),
  validateTranscript: validate(transcriptSchema),
  validateAnalysisRequest: validate(analysisRequestSchema)
};
