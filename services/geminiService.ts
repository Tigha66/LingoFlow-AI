import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Audio Context for playback
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// Helpers for Audio Decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateConversationResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  lastMessage: string,
  context: { language: string; level: string }
) => {
  try {
    const systemInstruction = `You are a helpful, friendly, and encouraging language tutor helping a student learn ${context.language}. 
    The student is at a ${context.level} level.
    Keep your responses concise (under 40 words) and conversational.
    Always reply in ${context.language}, but keep the vocabulary appropriate for their level.
    Do not provide long grammar explanations unless asked. Just converse naturally.`;

    // We use a fresh chat for simplicity in this demo, but in prod you'd persist the chat object
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: h.parts
      }))
    });

    const response = await chat.sendMessage({ message: lastMessage });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the language server. Please try again.";
  }
};

export const generateGrammarCorrection = async (originalText: string, language: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following sentence in ${language} spoken by a student: "${originalText}".
      If there are grammar mistakes, return a JSON object with:
      - "hasMistake": boolean
      - "corrected": string (the corrected sentence)
      - "explanation": string (very brief explanation in English)
      
      If it is correct or "perfect", return hasMistake: false.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasMistake: { type: Type.BOOLEAN },
            corrected: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Grammar Check Error", error);
    return null;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      ctx,
      24000,
      1,
    );

    return { buffer: audioBuffer, ctx };
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const playAudioBuffer = (buffer: AudioBuffer, ctx: AudioContext) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  return source; // Return so we can stop it if needed
};