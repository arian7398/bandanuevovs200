
// Archivo con funciones para exportar datos

/**
 * Genera un archivo PDF de todos los registros
 */
function exportToPDF() {
  // Verificar si el usuario tiene sesión activa
  var session = getUserSession();
  if (!session) {
    return {
      success: false,
      message: "Sesión expirada, por favor vuelve a iniciar sesión"
    };
  }
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Si el usuario no es admin, crear una hoja temporal solo con sus registros
    var tempSheetNeeded = false;
    var tempSheetName = null;
    
    if (session.role !== 'admin') {
      // Obtener registros filtrados por usuario
      var casos = getCasos(); // Ya están filtrados por usuario en esta función
      
      // Crear hoja temporal
      tempSheetName = "Temp_Export_" + session.username + "_" + new Date().getTime();
      var tempSheet = ss.insertSheet(tempSheetName);
      
      // Añadir encabezados
      var headers = getHeaders();
      tempSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      tempSheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285F4')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      
      // Añadir datos
      for (var i = 0; i < casos.length; i++) {
        var rowData = [];
        for (var j = 0; j < headers.length; j++) {
          rowData.push(casos[i][headers[j]] || '');
        }
        tempSheet.appendRow(rowData);
      }
      
      // Ajustar ancho de columnas
      tempSheet.autoResizeColumns(1, headers.length);
      
      // Usar esta hoja para la exportación
      sheet = tempSheet;
      tempSheetNeeded = true;
    }
    
    // Obtener URL de exportación a PDF
    var sheetId = sheet.getSheetId();
    var ssId = ss.getId();
    var exportUrl = 'https://docs.google.com/spreadsheets/d/' + ssId + '/export?'
      + 'format=pdf&'
      + 'size=A4&'
      + 'portrait=true&'
      + 'fitw=true&'
      + 'gridlines=false&'
      + 'printtitle=false&'
      + 'sheetnames=false&'
      + 'pagenum=false&'
      + 'gid=' + sheetId;
    
    // Opciones para obtener el PDF
    var options = {
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      }
    };
    
    // Obtener el PDF
    var response = UrlFetchApp.fetch(exportUrl, options);
    var pdfBlob = response.getBlob().setName("Registros_" + new Date().toISOString().split('T')[0] + ".pdf");
    
    // Si se creó una hoja temporal, eliminarla
    if (tempSheetNeeded && tempSheetName) {
      ss.deleteSheet(ss.getSheetByName(tempSheetName));
    }
    
    // Obtener URL para descargar el PDF
    var pdfData = Utilities.base64Encode(pdfBlob.getBytes());
    
    return {
      success: true,
      fileName: pdfBlob.getName(),
      mimeType: pdfBlob.getContentType(),
      data: pdfData
    };
  } catch (error) {
    return {
      success: false,
      message: "Error al exportar a PDF: " + error.toString()
    };
  }
}

/**
 * Genera un archivo Excel de todos los registros
 */

/* function exportToExcel() {
  // Verificar si el usuario tiene sesión activa
  var session = getUserSession();
  if (!session) {
    return {
      success: false,
      message: "Sesión expirada, por favor vuelve a iniciar sesión"
    };
  }
  
  try {
    // Obtener registros (ya filtrados por usuario si es necesario)
    var casos = getCasos();
    var headers = getHeaders();
    
    // Crear un nuevo libro de Excel
    var ss = getSpreadsheet();
    var tempSheetName = "Temp_Excel_Export_" + new Date().getTime();
    var tempSheet = ss.insertSheet(tempSheetName);
    
    // Añadir encabezados
    tempSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    tempSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    
    // Añadir datos
    var rowsData = [];
    for (var i = 0; i < casos.length; i++) {
      var rowData = [];
      for (var j = 0; j < headers.length; j++) {
        rowData.push(casos[i][headers[j]] || '');
      }
      rowsData.push(rowData);
    }
    
    if (rowsData.length > 0) {
      tempSheet.getRange(2, 1, rowsData.length, headers.length).setValues(rowsData);
    }
    
    // Ajustar ancho de columnas
    tempSheet.autoResizeColumns(1, headers.length);
    
    // Exportar como archivo Excel (.xlsx)
    var url = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?format=xlsx&gid=" + tempSheet.getSheetId();
    
    var options = {
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      }
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var excelBlob = response.getBlob().setName("Registros_" + new Date().toISOString().split('T')[0] + ".xlsx");
    
    // Eliminar la hoja temporal
    ss.deleteSheet(tempSheet);
    
    // Convertir a base64 para enviar al cliente
    var excelData = Utilities.base64Encode(excelBlob.getBytes());
    
    return {
      success: true,
      fileName: excelBlob.getName(),
      mimeType: excelBlob.getContentType(),
      data: excelData
    };
  } catch (error) {
    return {
      success: false,
      message: "Error al exportar a Excel: " + error.toString()
    };
  }
} */

function exportToExcel() {
  // Verificar si el usuario tiene sesión activa
  var session = getUserSession();
  if (!session) {
    return {
      success: false,
      message: "Sesión expirada, por favor vuelve a iniciar sesión"
    };
  }
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Exportar directamente la hoja completa
    var url = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?format=xlsx&gid=" + sheet.getSheetId();
    
    var options = {
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      }
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var excelBlob = response.getBlob().setName("Registros_" + new Date().toISOString().split('T')[0] + ".xlsx");
    
    // Convertir a base64 para enviar al cliente
    var excelData = Utilities.base64Encode(excelBlob.getBytes());
    
    return {
      success: true,
      fileName: excelBlob.getName(),
      mimeType: excelBlob.getContentType(),
      data: excelData
    };
  } catch (error) {
    return {
      success: false,
      message: "Error al exportar a Excel: " + error.toString()
    };
  }
}
