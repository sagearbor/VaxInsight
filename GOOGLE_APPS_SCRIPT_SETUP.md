# Google Apps Script Email Setup

Follow these steps to enable email sending from the VaxInsight dashboard.

## Step 1: Create the Apps Script

1. Go to https://script.google.com/
2. Click "New Project"
3. Delete any existing code and paste this:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const recipient = 'sagearbor+vaccineUpdateDashboard@gmail.com';
    const subject = data.subject || 'Update Suggestion for VaxInsight';
    const body = data.message || 'No message provided';
    const senderInfo = data.senderEmail ? `\n\nFrom: ${data.senderEmail}` : '';

    GmailApp.sendEmail(recipient, subject, body + senderInfo);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Email sent successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Email service is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click the disk icon or Ctrl+S to save
5. Name the project "VaxInsight Email Service"

## Step 2: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Click the gear icon next to "Select type" and choose "Web app"
3. Configure:
   - Description: "VaxInsight Email Service"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. Click "Authorize access" and sign in with your Google account
6. Review permissions and click "Allow"
7. **Copy the Web app URL** - it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## Step 3: Add URL to VaxInsight

Add the URL to your `.env.local` file:

```
VITE_GEMINI_API_KEY=your_gemini_key
VITE_EMAIL_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Then restart the dev server.

## Testing

1. Open the dashboard
2. Click "Suggest Update"
3. Type a test message
4. Click "Send Suggestion"
5. Check that the email arrives at sagearbor+vaccineUpdateDashboard@gmail.com

## Troubleshooting

- **CORS errors**: The Apps Script handles CORS automatically for POST requests
- **Authorization errors**: Make sure you authorized the script with your Google account
- **No email received**: Check spam folder, or verify the script deployed correctly
