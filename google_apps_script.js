/**
 * Google Apps Script — RAC PSVPEC Voting App
 * 
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire code into Code.gs
 * 3. Update the SHEET_ID below with your Google Sheet ID
 * 4. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL and paste it as SCRIPT_URL in RACVotingApp.jsx
 */

// ⚠️ Only the ID part — NOT the full URL
const SHEET_ID = '11ggxal9n3-ykYMkojUao3GNTYJv2QwMRMQ9Et95BtxM';
const SHEET_NAME = 'Sheet1'; // Change if your sheet tab has a different name

/**
 * Handles incoming POST requests from the voting app.
 * Writes voter data + formatted IST timestamp to the sheet.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // Create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Voter Name',
        'Email',
        'Contact',
        'Department',
        'Year',
        'President Vote'
      ]);

      // Style the header row
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#D4AF37');
      headerRange.setFontColor('#000000');
    }

    // The timestamp is already formatted as IST from the client
    // e.g. "April 29, 2026, at 10:01:36 AM."
    var timestamp = data.timestamp || formatTimestampIST(new Date());

    // Append the vote row
    sheet.appendRow([
      timestamp,
      data.voterName || '',
      data.email || '',
      data.contact || '',
      data.department || '',
      data.year || '',
      data.president || ''
    ]);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 7);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Vote recorded' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Formats a date to IST (Asia/Kolkata) readable string.
 * Uses Utilities.formatDate which works in Google Apps Script.
 * Output: "April 29, 2026, at 10:01:36 AM."
 */
function formatTimestampIST(date) {
  var ist = Utilities.formatDate(date, 'Asia/Kolkata', 'MMMM d, yyyy, \'at\' h:mm:ss a.');
  return ist;
}

/**
 * ✅ ONE-TIME FUNCTION: Converts all existing ISO timestamps to IST format.
 * 
 * HOW TO RUN:
 * 1. In the toolbar dropdown, select "convertExistingTimestamps"
 * 2. Click the ▶ Run button
 * 3. Grant permissions when prompted
 * 4. Check your sheet — all ISO timestamps will be converted!
 */
function convertExistingTimestamps() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    Logger.log('No data rows found (only header or empty sheet).');
    return;
  }

  // Get all timestamp values in column A (skip header row 1)
  var timestampRange = sheet.getRange(2, 1, lastRow - 1, 1);
  var timestamps = timestampRange.getValues();

  var convertedCount = 0;

  for (var i = 0; i < timestamps.length; i++) {
    var cellValue = String(timestamps[i][0]).trim();

    // Check if it looks like an ISO timestamp (e.g. "2026-04-29T01:26:42.293Z")
    if (cellValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      var date = new Date(cellValue);

      if (!isNaN(date.getTime())) {
        timestamps[i][0] = formatTimestampIST(date);
        convertedCount++;
      }
    }
  }

  // Write all converted values back at once (efficient batch update)
  timestampRange.setValues(timestamps);

  Logger.log('Done! Converted ' + convertedCount + ' timestamps to IST format.');
}

/**
 * Handles GET requests (optional — useful for testing).
 * Visit the deployment URL in a browser to verify it's live.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'active',
      message: 'RAC PSVPEC Voting API is live.',
      timestamp: formatTimestampIST(new Date())
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
