const Joi = require('joi');

const callScriptSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().min(1)
  ).required(),
  content: Joi.string().optional() // Content will be populated by backend
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
  callScriptId: Joi.string().required(),
  callStageId: Joi.string().required()
});

// Dynamic call stages schema - allows any stage names with required structure
const callStagesSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500)
}).pattern(
  Joi.string().min(1), // Any string key (stage name)
  Joi.object({
    required: Joi.boolean().default(true),
    description: Joi.string().required(),
    keyPoints: Joi.array().items(Joi.string()).default([])
  })
).min(1); // At least one stage must be provided

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
  validateAnalysisRequest: validate(analysisRequestSchema),
  validateCallStages: validate(callStagesSchema)
};
