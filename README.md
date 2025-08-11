# Arigato App

A multi-language gratitude messages app designed for visitors to Japan. Express your gratitude in various situations with pre-written messages in English, Japanese, Chinese, and Korean.

## Features

- 🌍 **Multi-language Support**: English, Japanese, Chinese, Korean
- 🎯 **Situational Messages**: Airport, Hotel, Restaurant, Transportation, Shopping
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 📋 **Copy to Clipboard**: Easy message copying functionality
- ⌨️ **Keyboard Navigation**: Use arrow keys to navigate messages
- 👆 **Touch Support**: Swipe gestures for mobile devices
- 🔊 **Text-to-Speech**: Japanese pronunciation for gratitude messages and onomatopoeia dictionary
- 🎵 **Premium Onomatopoeia Dictionary**: 41 scenes with 615 Japanese onomatopoeia examples

## Usage

1. Select your preferred language (EN, JA, ZH, KO)
2. Choose a situation (Airport, Hotel, Restaurant, etc.)
3. Browse through the gratitude messages
4. Click "📋 Copy" to copy the message to your clipboard
5. Use the message in your real-life situation in Japan!

## Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd arigato-app-starter

# Start local server
npx http-server -p 3000
# or
python -m http.server 8000
```

## Text-to-Speech Feature

The app includes a text-to-speech feature for Japanese pronunciation:

- **Enable/Disable**: Click the 🔊 button in the header to toggle TTS functionality
- **Gratitude Messages**: Click 🔊 next to any message to hear Japanese pronunciation
- **Onomatopoeia Dictionary**: Each onomatopoeia item has a 🔊 button for pronunciation
- **Voice Selection**: Automatically selects the best available Japanese voice
- **Performance**: Includes anti-spam protection and automatic cleanup

**Note**: TTS requires browser support for Speech Synthesis API. The feature is automatically enabled when supported.

Then open `http://localhost:3000` in your browser.

## Deployment

This app is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel for automatic deployments.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- JSON for localization

## License

MIT License 