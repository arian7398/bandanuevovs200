
// Archivo con funciones para manejar los registros

/**
 * Guarda un nuevo registro en la hoja de cálculo
 */
/* function saveRegistroToCaso(formData) {
  // Asegurarse de que la hoja existe y tiene la columna de usuario
  checkAndSetupSheet();
  ensureUserColumnExists();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Generar ID único para el registro
  var id = generateUniqueId();
  
  // Obtener fecha actual
  var fechaRegistro = new Date().toLocaleDateString('es-ES');
  
  // Obtener usuario actual
  var currentUser = getCurrentUsername();
  
  // Crear array con datos en el orden correcto según los encabezados
  var headers = getHeaders();
  var rowData = [];
  
  // Encontrar índices importantes
  var userColumnIndex = headers.indexOf(USER_COLUMN);
  
  // Para cada encabezado, añadir el valor correspondiente
  for (var i = 0; i < headers.length; i++) {
    if (i === 0) { // ID
      rowData.push(id);
    } else if (i === 1) { // Fecha de Registro
      rowData.push(fechaRegistro);
    } else if (i === userColumnIndex) { // Usuario Creador
      rowData.push(currentUser);
    } else {
      rowData.push(formData[headers[i]] || ''); // Datos del formulario
    }
  }
  
  var recordObject = {};
  for (var j = 0; j < headers.length; j++) {
    recordObject[headers[j]] = j < rowData.length ? rowData[j] : '';
  }
  
  return {
    success: true,
    id: id,
    message: "Registro guardado correctamente",
    record: recordObject  // Esto enviará el registro completo al cliente para localStorage
  };
}
 */
//-----------
/**
 * Asegura que la columna de usuario existe en la hoja
 */
function ensureUserColumnExists() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Obtener encabezados
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Verificar si existe la columna de usuario
  var userColumnIndex = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === USER_COLUMN) {
      userColumnIndex = i;
      break;
    }
  }
  
  // Si no existe la columna, añadirla después de Fecha de Registro
  if (userColumnIndex === -1) {
    var fechaIndex = -1;
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] === 'Fecha de Registro') {
        fechaIndex = i;
        break;
      }
    }
    
    if (fechaIndex !== -1) {
      // Insertar columna después de Fecha de Registro
      sheet.insertColumnAfter(fechaIndex + 1);
      // Establecer nombre en celda de encabezado
      sheet.getRange(1, fechaIndex + 2).setValue(USER_COLUMN);
      // Dar formato a la celda de encabezado
      sheet.getRange(1, fechaIndex + 2)
        .setBackground('#4285F4')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
        
      // Si hay datos existentes, establecer el usuario actual para todos los registros existentes
      if (sheet.getLastRow() > 1) {
        var currentUser = getCurrentUsername() || 'sistema';
        var dataRange = sheet.getRange(2, fechaIndex + 2, sheet.getLastRow() - 1, 1);
        var fillValues = Array(sheet.getLastRow() - 1).fill([currentUser]);
        dataRange.setValues(fillValues);
      }
    }
  }
}

/**
 * Obtiene todos los registros de la hoja
 * Filtra por usuario si es necesario
 */
//-------------------------------------------------
function getCasos() {
  checkAndSetupSheet();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Obtener encabezados
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Si no hay datos en la hoja, devolver array vacío
  if (sheet.getLastRow() <= 1) {
    return [];
  }
  
  // Obtener todas las filas de datos (excluyendo la fila de encabezados)
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  var data = dataRange.getValues();
  
  // Obtener información del usuario actual
  var currentUser = getCurrentUsername();
  var currentRole = getCurrentUserRole();
  
  // Array para almacenar los resultados
  var result = [];
  
  // Para cada fila de datos
  for (var i = 0; i < data.length; i++) {
    // Si la fila tiene datos (primera celda no está vacía)
    if (data[i][0]) {
      // Convertir datos a objeto con claves según encabezados
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = data[i][j];
      }
      
      // Incluir todos los registros independientemente del usuario para probar
      result.push(record);
    }
  }
  
  // Añadir log para depuración
  Logger.log("Registros encontrados: " + result.length);
  
  return result;
}

/**
 * Obtiene un registro específico por ID
 */
function saveRegistroToCaso(formData) {
  // Asegurarse de que la hoja existe y tiene la columna de usuario
  checkAndSetupSheet();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Generar ID único para el registro que incluye el usuario
  var id = generateUniqueId();
  
  // Obtener fecha actual
  var fechaRegistro = new Date().toLocaleDateString('es-ES');
  
  // Obtener usuario actual
  var currentUser = getCurrentUsername();
  
  // Crear array con datos en el orden correcto según los encabezados
  var headers = getHeaders();
  var rowData = [];
  
  // Primeras columnas fijas
  rowData.push(id); // ID
  rowData.push(fechaRegistro); // Fecha de Registro
  rowData.push(currentUser.toUpperCase()); // Usuario Creador en mayúsculas
  
  // Añadir el resto de datos siguiendo el orden de los encabezados
  for (var i = 3; i < headers.length; i++) {
    var header = headers[i];
    // Convertir a mayúsculas si es un string, de lo contrario dejarlo igual
    var value = formData[header] || '';
    if (typeof value === 'string') {
      value = value.toUpperCase();
    }
    rowData.push(value);
  }
  
  // Añadir fila a la hoja
  sheet.appendRow(rowData);
  
  // Crear un objeto completo para el registro
  var recordObject = {};
  for (var j = 0; j < headers.length; j++) {
    recordObject[headers[j]] = j < rowData.length ? rowData[j] : '';
  }
  
  // Registrar en el log para debug
  Logger.log("Registro guardado con ID: " + id + " para usuario: " + currentUser);
  
  return {
    success: true,
    id: id,
    message: "Registro guardado correctamente",
    record: recordObject
  };
}

/* //codigo anterior por si falla el de arriba
function getCasoById(id) {

  // Añadir log para verificar ID recibido
  console.log("ID recibido para búsqueda: " + id);
  console.log("Tipo de ID: " + typeof id);
  checkAndSetupSheet();
  ensureUserColumnExists();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Obtener encabezados
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Obtener usuario actual y rol
  var currentUser = getCurrentUsername();
  var currentRole = getCurrentUserRole();
  
  // Encontrar el índice de la columna del usuario creador
  var userColumnIndex = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === USER_COLUMN) {
      userColumnIndex = i;
      break;
    }
  }
  
  // Obtener todas las filas
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
  var data = dataRange.getValues();
  
  // Buscar el registro con el ID específico
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      // Verificar si el usuario tiene permisos para ver este registro
      if (currentRole === 'admin' || 
          userColumnIndex === -1 || 
          !data[i][userColumnIndex] || 
          data[i][userColumnIndex] === currentUser) {
        // Convertir a objeto
        var record = {};
        for (var j = 0; j < headers.length; j++) {
          record[headers[j]] = data[i][j];
        }
        return record;
      } else {
        // El usuario no tiene permiso para ver este registro
        return { error: "No tienes permiso para ver este registro" };
      }
    }
  }
  
  // No se encontró el registro
  return { error: "Registro no encontrado" };
} */



/**
 * Actualiza un registro existente
 */
function updateCaso(id, formData) {
  checkAndSetupSheet();
  ensureUserColumnExists();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Obtener encabezados
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Obtener usuario actual y rol
  var currentUser = getCurrentUsername();
  var currentRole = getCurrentUserRole();
  
  // Encontrar el índice de la columna del usuario creador
  var userColumnIndex = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === USER_COLUMN) {
      userColumnIndex = i;
      break;
    }
  }
  
  // Obtener todas las filas
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
  var data = dataRange.getValues();
  
  // Buscar el registro a actualizar
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      // Verificar si el usuario tiene permisos para editar este registro
      if (currentRole === 'admin' || 
          userColumnIndex === -1 || 
          !data[i][userColumnIndex] || 
          data[i][userColumnIndex] === currentUser) {
        
        // Crear array con datos actualizados
        var rowData = [];
        
        // Para cada encabezado, mantener o actualizar el valor
        for (var j = 0; j < headers.length; j++) {
          var header = headers[j];
          
          if (j === 0) { // ID
            rowData.push(id); // Mantener ID original
          } else if (j === 1) { // Fecha de Registro
            rowData.push(data[i][1]); // Mantener fecha original
          } else if (j === userColumnIndex) { // Usuario Creador
            // Si el registro no tiene usuario asignado, asignar el usuario actual
            rowData.push(data[i][userColumnIndex] || currentUser);
          } else {
            // Actualizar si se proporcionó un nuevo valor, sino mantener el original
            rowData.push(formData[header] !== undefined ? formData[header] : data[i][j]);
          }
        }
         
        // Actualizar la fila en la hoja
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowData]);
        
        return {
          success: true,
          message: "Registro actualizado correctamente"
        };
      } else {
        // El usuario no tiene permiso para editar este registro
        return {
          success: false,
          message: "No tienes permiso para editar este registro"
        };
      }
    }
  }
  var recordObject = {};
  for (var j = 0; j < headers.length; j++) {
    recordObject[headers[j]] = j < rowData.length ? rowData[j] : '';
  }
  
  return {
    success: true,
    message: "Registro actualizado correctamente",
    record: recordObject
  };
}

/**
 * Elimina un registro (solo para administradores)
 */
function deleteCaso(id) {
 /*  // Solo los administradores pueden eliminar registros
  if (!isAdmin()) {
    return {
      success: false,
      message: "No tienes permiso para eliminar registros"
    };
  } */
  checkAndSetupSheet();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Obtener todas las filas
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  var data = dataRange.getValues();
  
  // Buscar la fila con el ID específico
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      // Eliminar la fila
      sheet.deleteRow(i + 2); // +2 porque i empieza en 0 y la fila 1 son los encabezados
      
      return {
        success: true,
        message: "Registro eliminado correctamente"
      };
    }
  }
  
  // No se encontró el registro
  return {
    success: false,
    message: "Registro no encontrado"
  };
}
