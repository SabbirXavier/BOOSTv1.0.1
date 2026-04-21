import api from "./api";

/**
 * Generates audio for a tip message using the backend TTS proxy
 */
export async function generateTTS(text: string, voiceName: string = 'Zephyr'): Promise<string | undefined> {
  try {
    const response = await api.post('/tts', { text, voiceName });
    return response.data.audioData;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return undefined;
  }
}
