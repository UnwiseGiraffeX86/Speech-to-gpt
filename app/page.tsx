'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Define the necessary types for the Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  webkitSpeechGrammarList: any;
}

declare var window: IWindow;

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    const speechRecognitionList = new window.webkitSpeechGrammarList();
    recognition.grammars = speechRecognitionList;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentInterimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        // Process transcript to ensure proper capitalization and punctuation
        const processedTranscript = transcript
          // Capitalize first letter of sentences
          .replace(/(^\w|\.\s+\w)/g, (letter: string) => letter.toUpperCase())
          // Add period if sentence ends without punctuation
          .replace(/([a-z])\s+([A-Z])/g, '$1. $2')
          // Ensure space after punctuation
          .replace(/([.,!?])([A-Za-z])/g, '$1 $2');

        if (event.results[i].isFinal) {
          // For final results, ensure it ends with proper punctuation
          const finalText = processedTranscript.trim();
          const lastChar = finalText.slice(-1);
          const punctuation = /[.,!?]/.test(lastChar) ? '' : '.';
          setFinalTranscript(prev => {
            const separator = prev ? ' ' : '';
            return prev + separator + finalText + punctuation;
          });
          setInterimTranscript('');
        } else {
          currentInterimTranscript += processedTranscript;
        }
      }
      
      setInterimTranscript(currentInterimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    // Add any remaining interim transcript to final transcript with proper punctuation
    if (interimTranscript) {
      const processedInterim = interimTranscript
        .trim()
        .replace(/(^\w|\.\s+\w)/g, (letter: string) => letter.toUpperCase());
      const lastChar = processedInterim.slice(-1);
      const punctuation = /[.,!?]/.test(lastChar) ? '' : '.';
      setFinalTranscript(prev => {
        const separator = prev ? ' ' : '';
        return prev + separator + processedInterim + punctuation;
      });
      setInterimTranscript('');
    }
  }, [interimTranscript]);

  const sendToGPT = async () => {
    const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim();
    if (!fullTranscript) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const response = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullTranscript }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
  
      if (!reader) throw new Error('No reader available');
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error('Error sending to GPT:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Failed to get response from GPT-4'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTranscript = () => {
    setFinalTranscript('');
    setInterimTranscript('');
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          Speech to GPT-4
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Transcript</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearTranscript}
                  title="Clear transcript"
                >
                  <span className="sr-only">Clear transcript</span>
                  ×
                </Button>
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div className="h-[300px] overflow-y-auto p-4 bg-muted/50 rounded-lg">
              <span className="text-foreground">{finalTranscript}</span>
              {interimTranscript && (
                <span className="text-muted-foreground">{' ' + interimTranscript}</span>
              )}
              {!finalTranscript && !interimTranscript && (
                <span className="text-muted-foreground">Start speaking...</span>
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">GPT-4 Response</h2>
              <Button
                onClick={sendToGPT}
                disabled={isLoading || (!finalTranscript && !interimTranscript)}
                size="icon"
              >
                <Send className={cn("h-5 w-5", isLoading && "animate-pulse")} />
              </Button>
            </div>
            <div className="h-[300px] overflow-y-auto p-4 bg-muted/50 rounded-lg">
              {response || 'GPT-4 response will appear here...'}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}