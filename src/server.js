const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');
const readline = require('readline');
const cron = require('node-cron')

// Define scopes for Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.labels'];

// File path to store and read the authentication token
const TOKEN_PATH = '../private/token.json';

let isFirstRun = true;
// Main function to initiate the Gmail automation process
async function main() {
    try {
        console.log('Gmail Automation Process Started...');

        // Read clientSecret.json file to get API credentials
        const credentialsContent = await fs.readFile(path.join(__dirname, '../private/clientSecret.json'));
        const credentials = JSON.parse(credentialsContent);

        // Authorize and get OAuth2 client
        const oAuth2Client = await authorize(credentials);

        // List and reply to unread emails
        await listAndReplyToUnreadEmails(oAuth2Client);
        isFirstRun = false;
    } catch (err) {
        console.error('Error:', err);
    }
}

// Function to authorize and get OAuth2 client
async function authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try {
        // Try to read existing token from file
        const tokenContent = await fs.readFile(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(tokenContent));
    } catch (err) {
        // If token doesn't exist, get a new access token
        await getAccessToken(oAuth2Client);
    }

    return oAuth2Client;
}

// Function to get access token interactively
async function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const code = await new Promise((resolve) => {
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                resolve(code);
            });
        });

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Store the token to disk for later program executions
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token stored to', TOKEN_PATH);
    } catch (err) {
        console.error('Error retrieving/accessing the token:', err.message);
    }
}


// Function to list and reply to unread emails
async function listAndReplyToUnreadEmails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Get unread emails
    const { data: { messages } } = await getUnreadEmails(gmail);

    if (messages && messages.length > 0) {
        // Process the unread emails
        await processEmails(gmail, messages);
    } else {
        console.log('No unread emails found.');
    }
}

// Function to get unread emails from Gmail
async function getUnreadEmails(gmail) {
    return await gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox -label:sent',
    });
}

// Function to process unread emails
async function processEmails(gmail, messages) {
    let i = 0;
    for (const email of messages) {
        if (i < 3) {
            // Process each email
            await processEmail(gmail, email);
            i++;
        }
    }
}

// Function to process a single email
async function processEmail(gmail, email) {
    // Get email details
    const { data } = await gmail.users.messages.get({
        userId: 'me',
        id: email.id,
    });

    const subject = getEmailHeader(data, 'Subject');
    const sender = getEmailHeader(data, 'From');
    const body = `Hi there,\n\nThis is an automatic reply. Thank you for reaching out. We will get back to you soon.`;

    // Check if the email has already been replied to
    const isReplied = checkIfReplied(data);

    if (!isReplied) {
        // Reply to the email and add a label
        await replyToEmail(gmail, email, sender, subject, body);
    }
}

// Function to get the value of a specific email header
function getEmailHeader(data, headerName) {
    return data.payload.headers.find(header => header.name === headerName)?.value || '';
}

// Function to reply to an email and add a label
async function replyToEmail(gmail, email, sender, subject, body) {
    const replyMessage = createMessage(sender, subject, body);
    const labelToAdd = 'Label_4883731014710322584';

    // Send the reply
    const { data: sendRes } = await gmail.users.messages.send({
        userId: 'me',
        resource: replyMessage,
        threadId: email.threadId,
    });

    console.log(`Replied to email with subject: ${subject}`);

    // Add a label to the replied email
    await gmail.users.messages.modify({
        userId: 'me',
        id: email.id,
        resource: {
            addLabelIds: [labelToAdd],
        },
    });

    console.log(`Added label ${labelToAdd} to the replied email.`);
}

// Function to check if the email has been replied to
function checkIfReplied(emailData) {
    const labels = emailData.labelIds;
    return labels && labels.includes('Label_4883731014710322584');
}

// Function to create a Gmail message
function createMessage(sender, subject, body) {
    const message = `To: ${sender}\nSubject: ${subject}\n\n${body}`;
    const encodedMessage = Buffer.from(message).toString('base64');
    return { raw: encodedMessage };
}

// Call the main function to start the automation process
main();

// Schedule the main function to run every 45 seconds using cron
cron.schedule('*/45 * * * * *', () => {
    // Only run main if it's not the first run
    if (!isFirstRun) {
        main();
    }
});
