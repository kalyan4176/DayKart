export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: error.errors.map((err) => ({
        path: err.path.slice(1).join('.'),
        message: err.message,
      })),
    });
  }
};
