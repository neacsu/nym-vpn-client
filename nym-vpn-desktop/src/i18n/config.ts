import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './en/common.json';
import home from './en/home.json';
import settings from './en/settings.json';
import nodeLocation from './en/node-location.json';
import backendMessages from './en/backend-messages.json';
import display from './en/display.json';
import login from './en/login.json';

const defaultNS = 'common';

i18n.use(initReactI18next).init({
  lng: 'en',
  debug: import.meta.env.DEV,
  resources: {
    en: {
      common,
      home,
      settings,
      nodeLocation,
      backendMessages,
      display,
      login,
    },
  },
  ns: [
    'common',
    'home',
    'settings',
    'nodeLocation',
    'backendMessages',
    'display',
    'login',
  ],
  defaultNS,

  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

export default i18n;
