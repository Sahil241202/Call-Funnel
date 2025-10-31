const Joi = require('joi');

// Updated analysis request schema - accepts direct data
const analysisRequestSchema = Joi.object({
  transcript: Joi.string().required().min(10),
  callScript: Joi.string().required().min(1),
  callStages: Joi.array().items(
    Joi.object({
      stageName: Joi.string().required().min(1),
      required: Joi.boolean().required(),
      description: Joi.string().required(),
      keyPoints: Joi.array().items(Joi.string()).default([])
    })
  ).min(1).required()
});


const validate = (schema) => {
  return (req, res, next) => {
    // Debug: Log received body keys for troubleshooting
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: ['Request body is empty. Please ensure Content-Type is application/json and the body contains valid JSON.']
      });
    }
    
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
  validateAnalysisRequest: validate(analysisRequestSchema),
};
