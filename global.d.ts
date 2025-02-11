// global.d.ts
export {};

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    grammars: SpeechGrammarList;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    start(): void;
    stop(): void;
  }

  interface SpeechGrammarList extends EventTarget {}

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: {
      isFinal: boolean;
      [index: number]: SpeechRecognitionResult;
      length: number;
    }[];
  }

  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
    isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  // Add more if needed.
}
