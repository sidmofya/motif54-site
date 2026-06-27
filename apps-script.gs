// Paste this entire file into your Google Apps Script editor.
// Deploy as a Web App (Execute as: Me, Who has access: Anyone).
// Copy the deployment URL into:
//   - the ENDPOINT variable in request-access.html, and
//   - the OUTREACH_TRACKING_ENDPOINT env var in Netlify (for outreach page views).

function doPost(e) {
  var p = e.parameter;

  // Outreach microsite view beacon (event=view | event=video).
  // Routed first so a stray "event" field never lands in the requests sheet.
  if (p.event === 'view' || p.event === 'video') {
    return handleOutreachView(p);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

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

// Records an outreach microsite open / video-progress event on a "Views" sheet
// and emails an alert. Reuses the same spreadsheet + MailApp plumbing as above.
function handleOutreachView(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Views');
  if (!sheet) {
    sheet = ss.insertSheet('Views');
    sheet.appendRow([
      'Timestamp', 'Event', 'Code', 'Company', 'First Name', 'Milestone', 'Referrer'
    ]);
  }

  // Column order: Timestamp | Event | Code | Company | First Name | Milestone | Referrer
  sheet.appendRow([
    new Date(),
    p.event,
    p.code,
    p.company,
    p.first_name,
    p.milestone || '',
    p.referrer || ''
  ]);

  // Only alert on the open and the near-complete video watch — not every tick.
  if (p.event === 'view' || p.milestone === '90%') {
    var who = (p.first_name || 'Someone') + ' at ' + (p.company || '—');
    var what = p.event === 'view'
      ? 'opened your page'
      : 'watched ' + (p.milestone || '') + ' of the video';
    MailApp.sendEmail({
      to: 'sid@motif54.com',
      subject: 'Outreach view — ' + who + ' (' + (p.code || '—') + ')',
      body: who + ' ' + what + '.\n\nPage: https://motif54.com/r/' + (p.code || '') +
            '\nReferrer: ' + (p.referrer || '—')
    });
  }

  return ContentService.createTextOutput('OK');
}
