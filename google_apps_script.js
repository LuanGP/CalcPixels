// Google Apps Script para contador de visitas
// Cole este código no Google Apps Script (script.google.com)

function doPost(e) {
  try {
    // Verificar se há dados na requisição
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // Abrir planilha (substitua pelo ID da sua planilha)
    const spreadsheetId = '1TYLV7D8ahHn9-rkCBWDV8NoELuPM3W4Rkb1ojBLUFws';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    
    if (action === 'increment') {
      // Incrementar contador
      const currentCount = parseInt(sheet.getRange('A1').getValue()) || 0;
      const newCount = currentCount + 1;
      sheet.getRange('A1').setValue(newCount);
      
      // Registrar timestamp
      const timestamp = data.timestamp || new Date().toISOString();
      sheet.getRange('B1').setValue(timestamp);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: newCount
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === 'get') {
      // Buscar contador atual
      const currentCount = parseInt(sheet.getRange('A1').getValue()) || 0;
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: currentCount
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Para requisições GET, retornar o contador atual
  try {
    const spreadsheetId = '1TYLV7D8ahHn9-rkCBWDV8NoELuPM3W4Rkb1ojBLUFws';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    const currentCount = parseInt(sheet.getRange('A1').getValue()) || 0;
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: currentCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
} 