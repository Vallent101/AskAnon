# AskAnon - Anonymous Advice & Confessions

A simple, anonymous platform where users can post questions or confessions and receive advice from the community. No login required!

## Features

- ✅ Post anonymous questions or confessions
- ✅ Reply to posts anonymously
- ✅ No login or registration required
- ✅ Questions displayed newest first
- ✅ Real-time updates
- ✅ Beautiful, modern UI

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Realtime Database**:
   - Go to Build → Realtime Database
   - Click "Create Database"
   - Choose your location
   - Start in **test mode** (for development)
4. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Copy the `firebaseConfig` object

### 2. Configure Firebase in the App

Open `index.html` and replace the Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Set Up Database Rules

In Firebase Console → Realtime Database → Rules, use these rules for development:

```json
{
  "rules": {
    "questions": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ Important:** For production, you should implement proper security rules to prevent abuse.

### 4. Run the App

Simply open `index.html` in your web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## File Structure

```
├── index.html      # Main HTML file
├── styles.css      # Styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Technologies Used

- HTML5
- CSS3 (with modern gradients and animations)
- Vanilla JavaScript
- Firebase Realtime Database

## Future Enhancements

- Rate limiting to prevent spam
- Moderation features
- Categories/tags for questions
- Search functionality
- Character count indicators
- Dark mode
- Mobile app version

## License

Feel free to use and modify this project for your own purposes!
