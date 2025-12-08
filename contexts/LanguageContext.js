import React, { createContext, useState, useContext } from 'react';

const TRANSLATIONS = {
  en: {
    // Common
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',

    // Home
    searchPlaceholder: 'search your circle',
    tapInstruction: 'drag to rotate • tap a connection • pinch to zoom',

    // Settings
    settings: 'Settings',
    account: 'Account',
    profile: 'Profile',
    privacy: 'Privacy',
    notifications: 'Notifications',
    preferences: 'Preferences',
    darkMode: 'Dark Mode',
    language: 'Language',
    theme: 'Theme',
    support: 'Support',
    helpCenter: 'Help Center',
    contactUs: 'Contact Us',
    about: 'About',
    logOut: 'Log Out',

    // Contact
    call: 'Call',
    message: 'Message',
    connectionDetails: 'Connection Details',
  },
  es: {
    back: 'Atrás',
    save: 'Guardar',
    cancel: 'Cancelar',
    done: 'Hecho',

    searchPlaceholder: 'buscar en tu círculo',
    tapInstruction: 'arrastra para rotar • toca una conexión • pellizca para zoom',

    settings: 'Configuración',
    account: 'Cuenta',
    profile: 'Perfil',
    privacy: 'Privacidad',
    notifications: 'Notificaciones',
    preferences: 'Preferencias',
    darkMode: 'Modo Oscuro',
    language: 'Idioma',
    theme: 'Tema',
    support: 'Soporte',
    helpCenter: 'Centro de Ayuda',
    contactUs: 'Contáctanos',
    about: 'Acerca de',
    logOut: 'Cerrar Sesión',

    call: 'Llamar',
    message: 'Mensaje',
    connectionDetails: 'Detalles de Conexión',
  },
  fr: {
    back: 'Retour',
    save: 'Enregistrer',
    cancel: 'Annuler',
    done: 'Terminé',

    searchPlaceholder: 'rechercher votre cercle',
    tapInstruction: 'glisser pour tourner • toucher une connexion • pincer pour zoomer',

    settings: 'Paramètres',
    account: 'Compte',
    profile: 'Profil',
    privacy: 'Confidentialité',
    notifications: 'Notifications',
    preferences: 'Préférences',
    darkMode: 'Mode Sombre',
    language: 'Langue',
    theme: 'Thème',
    support: 'Support',
    helpCenter: 'Centre d\'Aide',
    contactUs: 'Nous Contacter',
    about: 'À Propos',
    logOut: 'Se Déconnecter',

    call: 'Appeler',
    message: 'Message',
    connectionDetails: 'Détails de Connexion',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const t = (key) => {
    return TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const changeLanguage = (lang) => {
    if (TRANSLATIONS[lang]) {
      setCurrentLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ t, currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
