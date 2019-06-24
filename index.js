const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const searchPhrase = 'from:notifications@facebookmail.com';

let searchQuery = {
    userId: 'me',
    q: searchPhrase,
    maxResults: 500
};

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://mail.google.com/' // Full access to the account, including permanent deletion of threads and messages. This scope should only be requested if your application needs to immediately and permanently delete threads and messages, bypassing Trash; all other actions can be performed with less permissive scopes.
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), deleteEmailsByQuery);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function deleteEmailsByQuery(auth) {
    const gmail = google.gmail({
        version: 'v1',
        auth
    });

    const bulkDeleteMessages = (requestBody) => {
        gmail.users.messages.batchDelete({
            userId: 'me',
            resource: requestBody
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            if (res.status === 204) {
                console.log(`Permanently deleted ${requestBody.ids.length} emails.`);
            }
        });
    }

    const findMessages = (query) => {
        gmail.users.messages.list(query, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            //console.log(res.data.messages);
            const messages = res.data.messages;
            // console.log(messages);
            const batchRequestBody = {
                ids: []
            };

            if (messages && messages.length) {
                messages.forEach((msg) => {
                    batchRequestBody.ids.push(msg.id);
                });
                bulkDeleteMessages(batchRequestBody);

                if (res.data.nextPageToken) {
                    searchQuery.pageToken = res.data.nextPageToken;
                    findMessages(searchQuery);
                }
            } else {
                console.log('No (more) matching emails found.');
            }
        });
    }

    findMessages(searchQuery);
}

function trashEmailsByQuery(auth) {
    const gmail = google.gmail({
        version: 'v1',
        auth
    });

    const bulkTrashMessages = (requestBody) => {
        gmail.users.messages.batchModify({
            userId: 'me',
            resource: requestBody
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            if (res.status === 204) {
                console.log(`Trashed ${requestBody.ids.length} emails.`);
            }
        });
    }

    const findMessages = (query) => {
        gmail.users.messages.list(query, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            //console.log(res.data.messages);
            const messages = res.data.messages;
            // console.log(messages);
            const batchRequestBody = {
                ids: [],
                addLabelIds: [
                    'TRASH'
                ]
            };

            if (messages && messages.length) {
                messages.forEach((msg) => {
                    batchRequestBody.ids.push(msg.id);
                });
                bulkTrashMessages(batchRequestBody);

                if (res.data.nextPageToken) {
                    searchQuery.pageToken = res.data.nextPageToken;
                    findMessages(searchQuery);
                }
            } else {
                console.log('No (more) matching emails found.');
            }
        });
    }

    findMessages(searchQuery);
}

module.exports = {
    SCOPES,
    deleteEmailsByQuery,
    trashEmailsByQuery
};
