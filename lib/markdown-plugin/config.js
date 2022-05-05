import template from './template.js';

const config = {
  meta: [
    { charset: 'utf-8' },
    {
      name: 'viewport',
      content: 'user-scalable=no, initial-scale=1.0, maximum-scale=1.0, width=device-width, viewport-fit=cover',
    },
    { name: 'theme-color', content: '#000000' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-title', content: 'IndexedDB Demo' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
  ],
  publicPath: '/',
  template,
};
export default config;
