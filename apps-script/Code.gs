const SHEET_NAME = 'RSVPs';

const C = {
  TIMESTAMP: 0,
  REFERENCE: 1,
  NAME: 2,
  GUESTS: 3,
  MESSAGE: 4,
  RESPONSE: 5
};

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

function findRowByReference(sheet, reference) {
  const values = sheet.getDataRange().getValues();
  const normalized = reference.trim().toLowerCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][C.REFERENCE]).trim().toLowerCase() === normalized) {
      return { rowIndex: i + 1, data: values[i] };
    }
  }
  return null;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action } = data;

    if (action === 'lookup') return handleLookup(data);
    if (action === 'rsvp') return handleRsvp(data);

    return respond({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return respond({ status: 'error', message: err.message });
  }
}

function handleLookup(data) {
  const sheet = getSheet();
  const reference = (data.reference || '').trim();
  if (!reference) return respond({ status: 'error', message: 'Reference is required' });

  const match = findRowByReference(sheet, reference);
  if (!match) return respond({ status: 'ok', valid: false });

  const row = match.data;
  const response = normalizeResponse(row[C.RESPONSE]);
  const responded = response === 'attending' || response === 'declined';

  return respond({
    status: 'ok',
    valid: true,
    responded,
    response,
    name: row[C.NAME],
    guests: row[C.GUESTS],
    message: responded ? row[C.MESSAGE] : '',
    timestamp: responded ? row[C.TIMESTAMP] : ''
  });
}

function handleRsvp(data) {
  const sheet = getSheet();
  const reference = (data.reference || '').trim();
  if (!reference) return respond({ status: 'error', message: 'Reference is required' });

  const match = findRowByReference(sheet, reference);
  if (!match) return respond({ status: 'error', message: 'Invalid reference' });

  const responseStatus = normalizeResponse(data.response);
  if (responseStatus === 'waiting') return respond({ status: 'error', message: 'Response is required' });

  const updatedRow = [
    new Date(),
    match.data[C.REFERENCE],
    (data.name || '').trim(),
    data.guests || '',
    data.message || '',
    responseStatus
  ];

  sheet.getRange(match.rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  return respond({ status: 'ok', result: normalizeResponse(match.data[C.RESPONSE]) === 'waiting' ? 'created' : 'updated' });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeResponse(value) {
  const response = String(value || '').trim().toLowerCase();
  if (response === 'attending' || response === 'accepted' || response === 'yes' || response === 'true') return 'attending';
  if (response === 'declined' || response === 'no') return 'declined';
  if (!response || response === 'waiting' || response === 'false') return 'waiting';
  return 'waiting';
}
