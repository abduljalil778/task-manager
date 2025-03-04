class ErrorMiddleware {
  // Middleware for handling 404 routes
  routeNotFound = (req, res, next) => {
    const error = new Error(`Route Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };

  // Middleware for handling general errors
  errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle specific Mongoose error
    if (err.name === "CastError" && err.kind === "ObjectId") {
      statusCode = 404;
      message = "Resource not found";
    }

    res.status(statusCode).json({
      message,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  };
}

export default new ErrorMiddleware();
