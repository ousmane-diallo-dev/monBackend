export default (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    console.error('Validation error:', error.details);
    return res.status(400).json({ 
      message: 'Erreur de validation: ' + error.details.map(d => d.message).join(', '),
      errors: error.details.map(d => d.message) 
    });
  }
  req.body = value;
  next();
};
