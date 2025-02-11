# Speech-to-Text with GPT-4 Integration

A minimalist Next.js application that converts speech to text in real-time and processes it with GPT-4.

## Features

- Real-time speech-to-text using the Web Speech API
- GPT-4 integration for processing transcribed text
- Streaming responses from GPT-4
- Clean, minimalist UI with dark mode support

## Prerequisites

- Node.js 16.8 or later
- An OpenAI API key

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment on Vercel

1. Fork this repository
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your forked repository
4. Add your `OPENAI_API_KEY` as an environment variable in the Vercel project settings
5. Deploy!

## Browser Support

The application uses the Web Speech API, which is supported in most modern browsers. For best results, use Chrome or Edge.

## License

MIT