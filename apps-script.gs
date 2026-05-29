// Paste this entire file into your Google Apps Script editor.
// Deploy as a Web App (Execute as: Me, Who has access: Anyone).
// Copy the deployment URL into the ENDPOINT variable in request-access.html.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var p = e.parameter;

  // Write to sheet
  // Column order: Timestamp | Request Type | Name | Email | Organization |
  //               Role | LinkedIn | Evaluating | Geography | Sector |
  //               Timeframe | Decision Makers | Referral | Additional Context
  sheet.appendRow([
    new Date(),
    p.request_type,
    p.name,
    p.email,
    p.organization,
    p.role,
    p.linkedin,
    p.evaluating,
    p.geography,
    p.sector,
    p.timeframe,
    p.decision_makers,
    p.referral,
    p.additional_context
  ]);

  // Send alert email
  var body = [
    'New access request submitted.',
    '',
    'Requesting:  ' + (p.request_type || '—'),
    '',
    'Name:         ' + (p.name || '—'),
    'Email:        ' + (p.email || '—'),
    'Organization: ' + (p.organization || '—'),
    'Role:         ' + (p.role || '—'),
    'LinkedIn:     ' + (p.linkedin || '—'),
    '',
    '── What are you evaluating? ─────────────────────────',
    (p.evaluating || '—'),
    '',
    'Geography:    ' + (p.geography || '—'),
    'Sector:       ' + (p.sector || '—'),
    'Timeframe:    ' + (p.timeframe || '—'),
    'Others:       ' + (p.decision_makers || '—'),
    'Heard via:    ' + (p.referral || '—'),
    '',
    '── Additional context ──────────────────────────────',
    (p.additional_context || '—')
  ].join('\n');

  MailApp.sendEmail({
    to: 'sid@motif54.com',
    subject: 'Access Request — ' + (p.name || 'Unknown') + ' (' + (p.request_type || '—') + ')',
    body: body
  });

  return ContentService.createTextOutput('OK');
}
