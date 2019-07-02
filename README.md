# Bulk delete Gmail messages

Ever needed to permanently delete 1000+ Gmail messages? It's a real pain, using the web interface!

This tiny Nodejs script lets you bulk delete messages by search query with ease, using the Gmail API.

## How to use

- Clone this repo and run `yarn` (or `npm install`).
- Go to https://developers.google.com/gmail/api/quickstart/nodejs#step_1_turn_on_the, click the "Enable Gmail API"-button and download the `credentials.json` file into the repo's root directory.
- Open a terminal, navigate to the repo and type `node . --query="has:attachment larger:5M"`

## Example queries:

- `has:attachment larger:5M` - Delete all emails with attachments larger than 5 Mb
- `from:notifications@facebookmail.com` - Delete all FB notifications
- `in:trash` - Delete all emails in trash

Here's a complete list of available Gmail search operators: https://support.google.com/mail/answer/7190?hl=en

## Warranty

I wrote this for private use soley, to clean up my 10 year old Gmail inbox faster. No warranty, no support. Feel free to use.
