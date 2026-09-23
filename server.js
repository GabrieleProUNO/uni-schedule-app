const express = require('express');
const path = require('path');
const apiFunc = require('./netlify/functions/api');

const app = express();
const PORT = process.env.PORT || 8888;

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Mock Netlify function route
app.get('/.netlify/functions/api', async (req, res) => {
    // Construct mock event
    const event = {
        queryStringParameters: req.query
    };
    
    try {
        const result = await apiFunc.handler(event, {});
        res.status(result.statusCode);
        for (const [key, value] of Object.entries(result.headers || {})) {
            res.setHeader(key, value);
        }
        res.send(result.body);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Ready for local development!`);
});
