# Quiz App with Groq API

A dynamic quiz generator that fetches questions based on topics using Groq API.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
Make sure your `.env` file has your Groq API key:
```
Quiz_API_KEY=gsk_your_actual_key_here
```

Get your key from: https://console.groq.com/keys

### 3. Start the Backend Server
```bash
npm start
```

You should see:
```
🚀 Server running at http://localhost:3000
✅ API Key loaded: Yes
```

### 4. Open the App
Open `index.html` in your browser (or go to `http://localhost:3000`)

### 5. Use the App
- Enter a topic (e.g., "Python", "History", "Biology")
- Click "Start Quiz"
- The backend will fetch questions from Groq API
- Answer the quiz and see your results

## Files

- `index.html` - Main HTML file
- `style.css` - Styling
- `script.js` - Frontend logic
- `server.js` - Backend API server (reads .env and proxies Groq API)
- `.env` - Contains your Groq API key (DO NOT COMMIT)
- `package.json` - Node.js dependencies

## Security Note

Your API key is stored in `.env` and never exposed to the browser. The backend handles all API communication securely.

## Troubleshooting

**"Failed to generate questions"?**
- Make sure `npm start` is running
- Check that `.env` has your Groq API key
- Open browser console (F12) and check for errors

**CORS errors?**
- CORS is already configured in server.js
- Make sure you're accessing the app from `http://localhost:3000`
