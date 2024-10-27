const express = require('express');
const bodyParser = require('body-parser');
const { initalizeDBIfNeeded, getMessages, createMessage } = require('./src/send_text');
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/messages', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        res.status(400).send('Message is required');
        return;
    }
    await createMessage(message);
    res.redirect('/messages');
});

// sample result: [ { id: 1, text: 'TEXT', created_at: 2024-10-27T08:13:55.715Z } ]
app.get('/messages', async (req, res) => {
    const messages = await getMessages();
    console.log('messages:', messages);
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Messages</title>
    </head>
    <body>
        <h1>Send a Message</h1>
        <form action="/messages" method="post">
            <label for="message">Message:</label>
            <input type="text" id="message" name="message" required>
            <button type="submit">Send</button>
        </form>
        <h2>Latest Messages</h2>
        <ul>
            ${messages && messages.length ? messages.map(msg => `<li>${msg.created_at.toISOString()} - ${msg.text}</li>`).join('') : '<li>No messages</li>'}
        </ul>
    </body>
    </html>
    `;
    res.send(html);
});

const server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    initalizeDBIfNeeded();
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
    } else {
        console.error(`Server error: ${err}`);
    }
});
