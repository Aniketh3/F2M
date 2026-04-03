import React, { createContext, useState, useContext, useEffect } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../services/translations';
import { translateText, clearTranslationCache } from '../services/translationService';

export const LanguageContext = createContext({
  language: 'en',
  changeLanguage: () => {},
  t: (key) => key
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // 🧹 Flush potentially corrupted cache from previous runs
    clearTranslationCache(); 
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('userLanguage');
      if (savedLang) {
        setLanguage(savedLang);
      }
    } catch (e) {
      console.log('Error loading language', e);
    }
  };

  const changeLanguage = async (newLang) => {
    try {
      setLanguage(newLang);
      await AsyncStorage.setItem('userLanguage', newLang);
    } catch (e) {
      console.log('Error saving language', e);
    }
  };

  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// 📝 Standalone Dynamic Translation Component
export const TranslatedText = ({ text, style, ...props }) => {
  const { language } = useLanguage();
  const [result, setResult] = useState(text);

  useEffect(() => {
    let isMounted = true;
    const getTranslation = async () => {
      if (language === 'en' || !text) {
        if (isMounted) setResult(text);
        return;
      }
      const translated = await translateText(text, language);
      if (isMounted) setResult(translated);
    };

    getTranslation();
    return () => { isMounted = false; };
  }, [text, language]);

  return <Text style={style} {...props}>{result}</Text>;
};
