// Paste this entire file into your Google Apps Script editor.
// Deploy as a Web App (Execute as: Me, Who has access: Anyone).
// Copy the deployment URL into the ENDPOINT variable in briefing.html.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var p = e.parameter;

  // Write to sheet
  // Column order: Timestamp | Name | Email | Role |
  //               Constraint | Capital Scale | Time Horizon |
  //               Domains | Dealbreaker Risks
  sheet.appendRow([
    new Date(),
    p.name,
    p.email,
    p.role,
    p.constraint,
    p.capital_scale,
    p.time_horizon,
    p.domains,
    p.dealbreaker_risks
  ]);

  // Send alert email
  var body = [
    'New briefing request submitted.',
    '',
    'Name:   ' + p.name,
    'Email:  ' + p.email,
    'Role:   ' + p.role,
    '',
    '── Q1: Primary constraint ──────────────────────────',
    p.constraint,
    '',
    '── Q2: Capital scale ───────────────────────────────',
    p.capital_scale,
    'Time horizon: ' + (p.time_horizon || '—'),
    '',
    '── Q3: Domains ─────────────────────────────────────',
    (p.domains || '—'),
    '',
    '── Q4: Dealbreaker risks ───────────────────────────',
    p.dealbreaker_risks
  ].join('\n');

  MailApp.sendEmail({
    to: 'sid@motif54.com',
    subject: 'Briefing Request — ' + p.name + ' (' + p.email + ')',
    body: body
  });

  return ContentService.createTextOutput('OK');
}
