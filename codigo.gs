// Archivo principal de Google Apps Script

// ID de la hoja de cálculo
const SPREADSHEET_ID = '1nn7E27XSxW0qQ6WfRSoNiAmEauNb2quzYv9eaztjtUM';

// Variables globales
const SHEET_NAME = 'Registros';
const USER_COLUMN = 'Usuario Creador'; // Nueva columna para asociar registros con usuarios
const VERIFICATION_SHEET = 'Verificacion'; // Hoja para almacenar códigos de verificación

// Constantes para autenticación
const USUARIOS = [
  { username: 'admin', password: 'fecor2025', role: 'admin', email: 'fccecco_meet2@mpfn.gob.pe' },
  { username: 'fecore1', password: '123', role: 'user', email: 'fecore1@ejemplo.com' },
  { username: 'fecore2', password: '123', role: 'user', email: 'fecore2@ejemplo.com' },
  { username: 'fecore3', password: '123', role: 'user', email: 'fecore3@ejemplo.com' },
  { username: 'fecore4', password: '123', role: 'user', email: 'fecore4@ejemplo.com' }
  // Añadir más usuarios con su correo electrónico
];

// Propiedades para manejo de sesión
const SESION_DURATION_SECONDS = 3600; // 1 hora

// Duración de validez del código en milisegundos (10 minutos)
const CODE_VALIDITY_DURATION = 10 * 60 * 1000;

// Número máximo de intentos permitidos
const MAX_ATTEMPTS = 3;

/**
 * Función doGet - Punto de entrada para la aplicación web
 */
function doGet(e) {
  // Obtener el parámetro de acción o usar 'login' por defecto
  var action = e.parameter.action || 'login';
  
  // Verificar si hay una sesión activa
  var userSession = getUserSession();
  
  // Si no hay sesión activa y no es la página de login o verificación, redirigir al login
  if (!userSession && action !== 'login' && action !== 'verify') {
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Sistema de Registro - Login')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Manejar las diferentes acciones
  switch(action) {
    case 'login':
      return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('Sistema de Registro - Login')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case 'verify':
      // Crear template con los parámetros pasados en la URL
      var template = HtmlService.createTemplateFromFile('verificacion');
      
      // Asegurarse de que la plantilla tenga acceso a los parámetros
      // Esto es crítico para que el username se pase correctamente
      template.username = e.parameter.username || '';
      
      return template
        .evaluate()
        .setTitle('Verificación de Código')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case 'formulario':
      return HtmlService.createTemplateFromFile('formulario')
        .evaluate()
        .setTitle('Formulario de Registro')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case 'historial':
      return HtmlService.createTemplateFromFile('historial')
        .evaluate()
        .setTitle('Historial de Registros')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    default:
      return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('Sistema de Registro - Login')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Incluir archivos HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtener la hoja de cálculo por ID
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Configurar la hoja de verificación para códigos
 */
function setupVerificationSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(VERIFICATION_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(VERIFICATION_SHEET);
    
    // Definir encabezados para la hoja de verificación
    var headers = [
      'Username',
      'Código',
      'Timestamp',
      'Intentos',
      'Activo'
    ];
    
    // Establecer los encabezados en la primera fila
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Dar formato a la fila de encabezados
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    
    // Ajustar ancho de columnas
    sheet.autoResizeColumns(1, headers.length);
  }
}

/**
 * Manejar el proceso de inicio de sesión inicial
 */
function handleLogin(username, password) {
  const usuario = USUARIOS.find(user => user.username === username && user.password === password);
  
  if (!usuario) {
    return { success: false, message: "Usuario o contraseña incorrectos" };
  }
  
  // Si la autenticación es correcta, genera y envía el código
  const verificationCode = generateVerificationCode();
  
  // Guarda el código en la hoja de verificación
  saveVerificationCode(username, verificationCode);
  
  // Envía el código por correo
  const emailSent = sendVerificationEmail(usuario.email, verificationCode);
  
  if (!emailSent) {
    return { success: false, message: "Error al enviar el código de verificación" };
  }
  
  return { 
    success: true, 
    message: "Se ha enviado un código de verificación a su correo", 
    requiresVerification: true,
    username: username
  };
}

/**
 * Genera un código de verificación de 6 dígitos
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Guarda el código de verificación en la hoja de cálculo
 */
/* function saveVerificationCode(username, code) {
  setupVerificationSheet();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(VERIFICATION_SHEET);
  
  // Buscar si ya existe un código para este usuario
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][4] === true) {
      // Actualizar el código existente
      sheet.getRange(i + 1, 2).setValue(code);
      sheet.getRange(i + 1, 3).setValue(new Date().getTime());
      sheet.getRange(i + 1, 4).setValue(0);
      return;
    }
  }
  
  // Si no existe, añadir un nuevo registro
  sheet.appendRow([
    username,
    code,
    new Date().getTime(),
    0,
    true
  ]);
} */

function saveVerificationCode(username, code) {
  setupVerificationSheet();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(VERIFICATION_SHEET);
  
  // Asegurarse de que el código sea string y no tenga espacios extra
  code = String(code).trim();
  console.log("Guardando código para " + username + ": " + code);
  
  // Buscar si ya existe un código para este usuario
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][4] === true) {
      // Actualizar el código existente
      sheet.getRange(i + 1, 2).setValue(code);
      sheet.getRange(i + 1, 3).setValue(new Date().getTime());
      sheet.getRange(i + 1, 4).setValue(0);
      return;
    }
  }
  
  // Si no existe, añadir un nuevo registro
  sheet.appendRow([
    username,
    code,
    new Date().getTime(),
    0,
    true
  ]);
}

/**
 * Envía el código de verificación por correo
 */
/* function sendVerificationEmail(email, code) {
  const subject = "Código de verificación - Sistema FECOR";
  const body = `
    Su código de verificación es: ${code}
    
    Este código será válido durante 10 minutos.
    
    Si usted no solicitó este código, por favor ignore este mensaje.
  `;
  
  try {
    GmailApp.sendEmail(email, subject, body);
    return true;
  } catch (error) {
    console.error("Error al enviar correo: " + error);
    return false;
  }
} */

function sendVerificationEmail(email, code) {
  const subject = "Código de verificación - Sistema FECOR";
  const plainBody = "Su código de verificación es: " + code + "\n\nEste código será válido durante 10 minutos.\n\nSi usted no solicitó este código, por favor ignore este mensaje.";
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50;">Sistema FECOR</h2>
        <p style="color: #7f8c8d;">Ministerio Público - Fiscalías Especializadas</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px;">Hola,</p>
        <p style="margin-top: 15px;">Se ha solicitado un código de verificación para acceder al Sistema FECOR. Su código es:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background-color: #e9ecef; padding: 15px 30px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</div>
        </div>
        
        <p>Este código será válido por <strong>10 minutos</strong>.</p>
        <p style="margin-bottom: 0;">Si usted no solicitó este código, por favor ignore este mensaje y contacte al administrador del sistema.</p>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #95a5a6; margin-top: 20px;">
        <p>Este es un mensaje automático, por favor no responda a este correo.</p>
        <p>© ${new Date().getFullYear()} Sistema FECOR - Todos los derechos reservados</p>
      </div>
    </div>
  `;
  
  try {
    GmailApp.sendEmail(
      email,
      subject,
      plainBody,
      {
        htmlBody: htmlBody
      }
    );
    return true;
  } catch (error) {
    console.error("Error al enviar correo: " + error);
    return false;
  }
}


/**
 * Verifica el código ingresado por el usuario
 */
/* function verifyCode(username, submittedCode) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(VERIFICATION_SHEET);
  
  if (!sheet) {
    return { success: false, message: "Error en el sistema de verificación" };
  }
  
  // Buscar el código para este usuario
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][4] === true) {
      // Obtener los datos de verificación
      var storedCode = data[i][1];
      var timestamp = data[i][2];
      var attempts = data[i][3];
      
      // Incrementar los intentos
      attempts++;
      sheet.getRange(i + 1, 4).setValue(attempts);
      
      // Comprobar si se excedió el número máximo de intentos
      if (attempts > MAX_ATTEMPTS) {
        sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código
        return { success: false, message: "Excedido el número máximo de intentos. Inicie sesión nuevamente." };
      }
      
      // Comprobar si el código ha expirado (10 minutos)
      var currentTime = new Date().getTime();
      if (currentTime - timestamp > CODE_VALIDITY_DURATION) {
        sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código expirado
        return { success: false, message: "El código ha expirado. Por favor, inicie sesión nuevamente." };
      }
      
      // Comprobar si el código es correcto
      if (storedCode !== submittedCode) {
        return { 
          success: false, 
          message: `Código incorrecto. Intentos restantes: ${MAX_ATTEMPTS - attempts}`,
          attemptsLeft: MAX_ATTEMPTS - attempts
        };
      }
      
      // Si el código es correcto, desactivar el código y crear sesión
      sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código
      
      // Crear la sesión
      const usuario = USUARIOS.find(user => user.username === username);
      createUserSession(username, usuario.role);
      
      return { 
        success: true, 
        message: "Verificación exitosa", 
        role: usuario.role 
      };
    }
  }
  
  return { success: false, message: "No hay un código de verificación activo para este usuario" };
}
*/

// Función para validar usuario (compatibilidad con el nombre de función en index.html)
function validateUser(username, password) {
  // Redirigir a handleLogin para mantener la coherencia
  return handleLogin(username, password);
}

/**
 * Verifica el código ingresado por el usuario
 * Esta función se llama desde verificacion.html
 */
/* function verifyCode(username, submittedCode) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(VERIFICATION_SHEET);
  
  if (!sheet) {
    return { success: false, message: "Error en el sistema de verificación" };
  }
  
  // Buscar el código para este usuario
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][4] === true) {
      // Obtener los datos de verificación
      var storedCode = data[i][1];
      var timestamp = data[i][2];
      var attempts = data[i][3];
      
      // Incrementar los intentos
      attempts++;
      sheet.getRange(i + 1, 4).setValue(attempts);
      
      // Comprobar si se excedió el número máximo de intentos
      if (attempts > MAX_ATTEMPTS) {
        sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código
        return { success: false, message: "Excedido el número máximo de intentos. Inicie sesión nuevamente." };
      }
      
      // Comprobar si el código ha expirado (10 minutos)
      var currentTime = new Date().getTime();
      if (currentTime - timestamp > CODE_VALIDITY_DURATION) {
        sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código expirado
        return { success: false, message: "El código ha expirado. Por favor, inicie sesión nuevamente." };
      }
      
      // Comprobar si el código es correcto
      if (storedCode !== submittedCode) {
        return { 
          success: false, 
          message: `Código incorrecto. Intentos restantes: ${MAX_ATTEMPTS - attempts}`,
          attemptsLeft: MAX_ATTEMPTS - attempts
        };
      }
      
      // Si el código es correcto, desactivar el código y crear sesión
      sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código
      
      // Crear la sesión
      const usuario = USUARIOS.find(user => user.username === username);
      createUserSession(username, usuario.role);
      
      return { 
        success: true, 
        message: "Verificación exitosa", 
        role: usuario.role 
      };
    }
  }
  
  return { success: false, message: "No hay un código de verificación activo para este usuario" };
}
 */

/**
 * Función para crear una sesión de usuario y devolver la URL de redirección
 * Esta función debe ser llamada desde el verificador de código
 */
function createSessionAndGetRedirectUrl(username, role) {
  // Crear la sesión del usuario
  createUserSession(username, role);
  
  // Construir la URL de redirección basada en el rol
  var scriptUrl = ScriptApp.getService().getUrl();
  var redirectUrl = scriptUrl + "?action=formulario";
  
  return {
    success: true,
    redirectUrl: redirectUrl
  };
}



/**
 * Verifica el código ingresado por el usuario
 */
function verifyCode(username, submittedCode) {
  
  // Registrar los valores para depuración
  console.log("Usuario: " + username);
  console.log("Código recibido: " + submittedCode);
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(VERIFICATION_SHEET);
  
  if (!sheet) {
    return { success: false, message: "Error en el sistema de verificación" };
  }
  
  // Buscar el código para este usuario
  var data = sheet.getDataRange().getValues();
  console.log("Buscando código para el usuario: " + username);
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][4] === true) {
      // Obtener los datos de verificación
      var storedCode = String(data[i][1]).trim(); // Convertir a string y eliminar espacios
      var timestamp = data[i][2];
      var attempts = data[i][3];
      
      console.log("Código almacenado: " + storedCode);
      console.log("Timestamp: " + new Date(timestamp));
      console.log("Intentos: " + attempts);
      
      // Limpiar el código ingresado
      submittedCode = String(submittedCode).trim();
      
      // Incrementar los intentos
      attempts++;
      sheet.getRange(i + 1, 4).setValue(attempts);
      
      // Comprobar si se excedió el número máximo de intentos
      if (attempts > MAX_ATTEMPTS) {
        sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código
        return { success: false, message: "Excedido el número máximo de intentos. Inicie sesión nuevamente." };
      }
      
      // Comprobar si el código ha expirado (10 minutos)
      var currentTime = new Date().getTime();
      if (currentTime - timestamp > CODE_VALIDITY_DURATION) {
        sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código expirado
        return { success: false, message: "El código ha expirado. Por favor, inicie sesión nuevamente." };
      }
      
      // Comprobar si el código es correcto (comparación estricta)
      console.log("Comparando: '" + storedCode + "' con '" + submittedCode + "'");
      if (storedCode !== submittedCode) {
        return { 
          success: false, 
          message: `Código incorrecto. Intentos restantes: ${MAX_ATTEMPTS - attempts}`,
          attemptsLeft: MAX_ATTEMPTS - attempts
        };
      }
      
      // Si el código es correcto, desactivar el código y crear sesión
      sheet.getRange(i + 1, 5).setValue(false); // Desactivar el código
      
      // Crear la sesión usando la función existente en auto.gs
      const usuario = USUARIOS.find(user => user.username === username);

      if (usuario) {
 
        // Llamar a la función de auto.gs que espera recibir el objeto usuario completo
        createUserSession(usuario);
        
        // Construir URL de redirección
        var scriptUrl = ScriptApp.getService().getUrl();
        var redirectUrl = scriptUrl + "?action=formulario";
        
        return { 
          success: true, 
          message: "Verificación exitosa", 
          role: usuario.role,
          redirectUrl: redirectUrl // Puedes incluir esta línea si quieres pasar la URL al cliente
        };
      } else {
        console.log("Usuario no encontrado en la lista: " + username);
        return { success: false, message: "Error en la verificación: Usuario no encontrado" };
        
      }
    }
  }
  
  console.log("No se encontró un código activo para el usuario: " + username);
  return { success: false, message: "No hay un código de verificación activo para este usuario" };
}


/**
 * Crear la hoja de cálculo y configurar encabezados si no existe
 */
function setupSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    
    // Definir encabezados incluyendo el nuevo campo de Usuario Creador
    var headers = [
      'ID',
      'Fecha de Registro',
      USER_COLUMN, // Nueva columna para el usuario que creó el registro
      // Información General
      'Fiscalía',
      'Fiscal a Cargo',
      // Detalles del Caso
      'Unidad de Inteligencia',
      'Instructor a Cargo',
      'Forma de Inicio de Investigación',
      'Carpeta Fiscal',
      'Fecha del Hecho',
      'Fecha Ingreso Carpeta Fiscal',
      'Etapas del Caso', 
      // Información del Agraviado
      'Tipo de Agraviado',
      'Agraviados',
      'Función que Ejerce',
      'Tipo de Empresa',
      // Información del Denunciado
      'Delitos',
      'Lugar de los Hechos',
      'Denunciados',
      'Datos de Interés del Denunciado',
      'Nombre/Apodo Banda Criminal',
      'Cantidad de Miembros de Banda',
      'Modalidad de Violencia',
      'Modalidad de Amenaza',
      'Atentados Cometidos',
      // Instrumentos y Métodos de Extorsión
      'Instrumentos de Extorsión',
      'Forma de Pago',
      'Números Telefónicos',
      'IMEI de Teléfonos',
      'Cuenta de Pago',
      'Titulares de Pago',
      // Datos de Interés de Pagos
      'Tipo de Pago',
      'Monto Solicitado',
      'Monto Pagado',
      'Número de Pagos',
      'Otros Tipos de Pago',
      // Sumilla y Observaciones
      'Sumilla de Hechos',
      'Observaciones'
    ];
    
    // Establecer los encabezados en la primera fila
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Dar formato a la fila de encabezados
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    
    // Ajustar ancho de columnas
    sheet.autoResizeColumns(1, headers.length);
  }
}

/**
 * Obtiene todos los encabezados de la hoja.
 */
function getHeaders() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers;
}

/**
 * Genera un ID único para nuevos registros.
 */
function generateUniqueId() {
  return Utilities.getUuid();
}

/**
 * Verifica y limpia la hoja de cálculo si es necesario.
 */
function checkAndSetupSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    setupSheet();
  }
}

/**
 * Funciones para manejo de sesión de usuario
 */
function createUserSession(username, role) {
  var userProperties = PropertiesService.getUserProperties();
  var sessionData = {
    username: username,
    role: role,
    timestamp: new Date().getTime()
  };
  
  userProperties.setProperty('userSession', JSON.stringify(sessionData));
}

function getUserSession() {
  var userProperties = PropertiesService.getUserProperties();
  var sessionJson = userProperties.getProperty('userSession');
  
  if (!sessionJson) {
    return null;
  }
  
  var sessionData = JSON.parse(sessionJson);
  var currentTime = new Date().getTime();
  
  // Verificar si la sesión ha expirado
  if (currentTime - sessionData.timestamp > SESION_DURATION_SECONDS * 1000) {
    clearUserSession();
    return null;
  }
  
  // Actualizar el timestamp para mantener la sesión activa
  sessionData.timestamp = currentTime;
  userProperties.setProperty('userSession', JSON.stringify(sessionData));
  
  return sessionData;
}

function clearUserSession() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('userSession');
}

function logout() {
  clearUserSession();
  return true;
}

/**
 * Función para redirigir según el rol después de la verificación
 */
function getUrlForRole(role) {
  var scriptUrl = ScriptApp.getService().getUrl();
  
  if (role === 'admin') {
    return scriptUrl + '?action=formulario';
  } else {
    return scriptUrl + '?action=formulario';
  }
}
