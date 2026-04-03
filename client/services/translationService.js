import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'translation_cache';

export const translateText = async (text, targetLang) => {
  if (!text || targetLang === 'en' || !targetLang) return text;

  try {
    // 1. Check local cache first to avoid API limits and increase speed
    const cacheStr = await AsyncStorage.getItem(CACHE_KEY);
    let cache = cacheStr ? JSON.parse(cacheStr) : {};
    
    const cacheId = `${text}_${targetLang}`;
    if (cache[cacheId]) return cache[cacheId];

    // 2. Fetch from MyMemory API (Free, no key needed for low volume)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    
    if (!response.ok) throw new Error('Translation API failed');
    
    const data = await response.json();
    const translatedText = data.responseData.translatedText;

    // 🕵️ Error Detection: Don't cache or return API error messages
    const isError = translatedText && (
      translatedText.toLowerCase().includes('invalid') || 
      translatedText.toLowerCase().includes('error') ||
      translatedText.toLowerCase().includes('limit exceeded')
    );

    if (translatedText && !isError) {
      // 3. Update cache
      cache[cacheId] = translatedText;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return translatedText;
    }

    return text;
  } catch (error) {
    console.log('Translation error:', error);
    return text; 
  }
};

export const clearTranslationCache = async () => {
  await AsyncStorage.removeItem(CACHE_KEY);
};
