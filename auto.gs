// Archivo con funciones de autenticación y manejo de sesión

/**
 * Valida las credenciales de un usuario
 */
function validateUser(username, password) {
  // Buscar el usuario en la lista de usuarios permitidos
  var user = USUARIOS.find(function(u) {
    return u.username === username && u.password === password;
  });
  
  if (user) {
    // Crear una nueva sesión para el usuario
    createUserSession(user);
    return {
      success: true,
      role: user.role,
      username: user.username
    };
  } else {
    return {
      success: false,
      message: 'Nombre de usuario o contraseña incorrectos'
    };
  }
}

/**
 * Crea una sesión para el usuario autenticado
 */
function createUserSession(user) {
  var cache = CacheService.getScriptCache();
  var sessionId = Utilities.getUuid();
  
  // Guardar datos de la sesión en la caché
  var sessionData = {
    username: user.username,
    role: user.role,
    timestamp: new Date().getTime()
  };
  
  cache.put(sessionId, JSON.stringify(sessionData), SESION_DURATION_SECONDS);
  
  // Guardar el ID de sesión en las propiedades del usuario
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('sessionId', sessionId);
  
  return sessionId;
}

/**
 * Obtiene la información de la sesión actual
 */
function getUserSession() {
  var userProperties = PropertiesService.getUserProperties();
  var sessionId = userProperties.getProperty('sessionId');
  
  if (!sessionId) {
    return null;
  }
  
  var cache = CacheService.getScriptCache();
  var sessionDataString = cache.get(sessionId);
  
  if (!sessionDataString) {
    // La sesión ha expirado o no existe
    userProperties.deleteProperty('sessionId');
    return null;
  }
  
  var sessionData = JSON.parse(sessionDataString);
  
  // Verificar si la sesión ha expirado
  var currentTime = new Date().getTime();
  if (currentTime - sessionData.timestamp > SESION_DURATION_SECONDS * 1000) {
    cache.remove(sessionId);
    userProperties.deleteProperty('sessionId');
    return null;
  }
  
  // Actualizar timestamp para extender la sesión
  sessionData.timestamp = currentTime;
  cache.put(sessionId, JSON.stringify(sessionData), SESION_DURATION_SECONDS);
  
  return sessionData;
}

/**
 * Cierra la sesión del usuario actual
 */
function logout() {
  var userProperties = PropertiesService.getUserProperties();
  var sessionId = userProperties.getProperty('sessionId');
  
  if (sessionId) {
    var cache = CacheService.getScriptCache();
    cache.remove(sessionId);
    userProperties.deleteProperty('sessionId');
  }
  
  // Borrar todas las propiedades de usuario para asegurar el cierre completo
  userProperties.deleteAllProperties();
  
  // Devolver URL base para redirección
  var url = ScriptApp.getService().getUrl();
  
  return {
    success: true,
    url: url
  };
}

/**
 * Verifica si el usuario tiene rol de administrador
 */
function isAdmin() {
  var session = getUserSession();
  return session && session.role === 'admin';
}

/**
 * Obtiene el nombre de usuario de la sesión actual
 */
function getCurrentUsername() {
  var session = getUserSession();
  return session ? session.username : null;
}

/**
 * Obtiene el rol del usuario actual
 */
function getCurrentUserRole() {
  var session = getUserSession();
  return session ? session.role : null;
}
