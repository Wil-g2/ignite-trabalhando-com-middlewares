module.exports = class AppError {  
  static NotFound(response, msg = 'Not found') {
    return response.status(404).json({error: msg});
  }

  static BadRequest(response, msg = 'Erro in client') {
    return response.status(400).json({error: msg});
  }

  static Forbidden(response, msg = 'Forbidden') {
    return response.status(403).json({error: msg});
  }
  
}