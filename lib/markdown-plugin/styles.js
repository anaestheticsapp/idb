const fonts = `
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 300;
    font-display: swap;
    src: local('Roboto-Light'),
        url('/assets/fonts/roboto-v27-latin-300.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
  }
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local('Roboto-Regular'),
        url('/assets/fonts/roboto-v27-latin-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
  }
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: local('Roboto Medium'),
        url('/assets/fonts/roboto-v27-latin-500.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
  }
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: local('Roboto Bold'),
        url('/assets/fonts/roboto-v27-latin-700.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
  }
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 900;
    font-display: swap;
    src: local('Roboto Black'),
        url('/assets/fonts/roboto-v27-latin-900.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
  }
`;
const colors = `
  --gray: 210deg;
  --gray-0: hsl(var(--gray) 17% 98%);
  --gray-1: hsl(var(--gray) 17% 95%);
  --gray-2: hsl(var(--gray) 16% 93%);
  --gray-3: hsl(var(--gray) 14% 89%);
  --gray-4: hsl(var(--gray) 14% 83%);
  --gray-5: hsl(var(--gray) 11% 71%);
  --gray-6: hsl(var(--gray) 7% 56%);
  --gray-7: hsl(var(--gray) 15% 35%);
  --gray-8: hsl(var(--gray) 9% 31%);
  --gray-9: hsl(var(--gray) 10% 23%);
  --gray-10: hsl(var(--gray) 11% 15%);
  --red-0: hsl(0deg 100% 98%);
  --red-1: hsl(0deg 100% 95%);
  --red-2: hsl(0deg 100% 89%);
  --red-3: hsl(0deg 100% 83%);
  --red-4: hsl(0deg 100% 76%);
  --red-5: hsl(0deg 100% 71%);
  --red-6: hsl(0deg 94% 65%);
  --red-7: hsl(0deg 86% 59%);
  --red-8: hsl(0deg 74% 54%);
  --red-9: hsl(0deg 65% 48%);
  --pink-0: hsl(336deg 100% 97%);
  --pink-1: hsl(336deg 100% 94%);
  --pink-2: hsl(338deg 91% 87%);
  --pink-3: hsl(339deg 90% 81%);
  --pink-4: hsl(339deg 88% 74%);
  --pink-5: hsl(339deg 82% 67%);
  --pink-6: hsl(339deg 76% 59%);
  --pink-7: hsl(339deg 67% 52%);
  --pink-8: hsl(339deg 68% 45%);
  --pink-9: hsl(339deg 69% 38%);
  --grape-0: hsl(280deg 67% 96%);
  --grape-1: hsl(287deg 77% 92%);
  --grape-2: hsl(288deg 86% 86%);
  --grape-3: hsl(289deg 85% 78%);
  --grape-4: hsl(288deg 83% 71%);
  --grape-5: hsl(288deg 75% 64%);
  --grape-6: hsl(288deg 67% 58%);
  --grape-7: hsl(288deg 56% 52%);
  --grape-8: hsl(288deg 54% 46%);
  --grape-9: hsl(288deg 54% 40%);
  --violet-0: hsl(252deg 100% 97%);
  --violet-1: hsl(257deg 100% 93%);
  --violet-2: hsl(256deg 100% 87%);
  --violet-3: hsl(255deg 94% 79%);
  --violet-4: hsl(255deg 93% 72%);
  --violet-5: hsl(255deg 91% 67%);
  --violet-6: hsl(255deg 86% 63%);
  --violet-7: hsl(255deg 78% 60%);
  --violet-8: hsl(255deg 67% 55%);
  --violet-9: hsl(255deg 53% 50%);
  --indigo: 220deg;
  --indigo-0: hsl(223deg 100% 96%);
  --indigo-1: hsl(225deg 100% 93%);
  --indigo-2: hsl(228deg 100% 86%);
  --indigo-3: hsl(228deg 100% 78%);
  --indigo-4: hsl(228deg 96% 72%);
  --indigo-5: hsl(228deg 94% 67%);
  --indigo-6: hsl(228deg 89% 63%);
  --indigo-7: hsl(228deg 81% 59%);
  --indigo-8: hsl(228deg 69% 55%);
  --indigo-9: hsl(230deg 57% 50%);
  --blue-0: hsl(205deg 100% 95%);
  --blue-1: hsl(206deg 100% 91%);
  --blue-2: hsl(206deg 100% 82%);
  --blue-3: hsl(206deg 96% 72%);
  --blue-4: hsl(207deg 91% 64%);
  --blue-5: hsl(207deg 86% 57%);
  --blue-6: hsl(208deg 80% 52%);
  --blue-7: hsl(208deg 77% 47%);
  --blue-8: hsl(209deg 77% 43%);
  --blue-9: hsl(209deg 75% 38%);
  --cyan-0: hsl(185deg 81% 94%);
  --cyan-1: hsl(185deg 84% 88%);
  --cyan-2: hsl(186deg 77% 77%);
  --cyan-3: hsl(187deg 74% 65%);
  --cyan-4: hsl(187deg 69% 55%);
  --cyan-5: hsl(188deg 72% 47%);
  --cyan-6: hsl(187deg 80% 42%);
  --cyan-7: hsl(188deg 83% 37%);
  --cyan-8: hsl(189deg 85% 32%);
  --cyan-9: hsl(189deg 85% 28%);
  --teal-0: hsl(161deg 79% 95%);
  --teal-1: hsl(160deg 85% 87%);
  --teal-2: hsl(162deg 78% 77%);
  --teal-3: hsl(162deg 72% 65%);
  --teal-4: hsl(162deg 68% 54%);
  --teal-5: hsl(162deg 73% 46%);
  --teal-6: hsl(162deg 82% 40%);
  --teal-7: hsl(162deg 87% 35%);
  --teal-8: hsl(162deg 88% 30%);
  --teal-9: hsl(162deg 88% 26%);
  --green-0: hsl(131deg 67% 95%);
  --green-1: hsl(128deg 76% 90%);
  --green-2: hsl(128deg 71% 82%);
  --green-3: hsl(129deg 68% 73%);
  --green-4: hsl(130deg 61% 64%);
  --green-5: hsl(130deg 57% 56%);
  --green-6: hsl(131deg 50% 50%);
  --green-7: hsl(131deg 53% 46%);
  --green-8: hsl(131deg 54% 40%);
  --green-9: hsl(132deg 52% 35%);
  --lime-0: hsl(79deg 81% 94%);
  --lime-1: hsl(80deg 83% 88%);
  --lime-2: hsl(81deg 81% 80%);
  --lime-3: hsl(82deg 75% 69%);
  --lime-4: hsl(83deg 73% 59%);
  --lime-5: hsl(84deg 69% 51%);
  --lime-6: hsl(85deg 74% 45%);
  --lime-7: hsl(85deg 79% 40%);
  --lime-8: hsl(86deg 84% 36%);
  --lime-9: hsl(85deg 84% 32%);
  --yellow-0: hsl(50deg 100% 93%);
  --yellow-1: hsl(49deg 100% 87%);
  --yellow-2: hsl(49deg 100% 80%);
  --yellow-3: hsl(48deg 100% 70%);
  --yellow-4: hsl(47deg 100% 62%);
  --yellow-5: hsl(45deg 97% 54%);
  --yellow-6: hsl(42deg 96% 50%);
  --yellow-7: hsl(39deg 100% 48%);
  --yellow-8: hsl(35deg 100% 47%);
  --yellow-9: hsl(31deg 100% 45%);
  --orange-0: hsl(34deg 100% 95%);
  --orange-1: hsl(33deg 100% 90%);
  --orange-2: hsl(33deg 100% 83%);
  --orange-3: hsl(32deg 100% 74%);
  --orange-4: hsl(31deg 100% 65%);
  --orange-5: hsl(29deg 100% 58%);
  --orange-6: hsl(27deg 98% 54%);
  --orange-7: hsl(24deg 94% 50%);
  --orange-8: hsl(21deg 90% 48%);
  --orange-9: hsl(17deg 87% 45%);
`;
const shadows = `
  --shadow-1: 0 1px 2px -1px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
  --shadow-2:
    0 3px 5px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 7px 14px -5px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 5%));
  --shadow-3:
    0 -1px 3px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 2%)),
    0 1px 2px -5px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 2%)),
    0 2px 5px -5px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 4%)),
    0 4px 12px -5px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 5%)),
    0 12px 15px -5px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 7%));
  --shadow-4:
    0 -2px 5px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 2%)),
    0 1px 1px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 2px 2px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 5px 5px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 4%)),
    0 9px 9px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 5%)),
    0 16px 16px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 6%));
  --shadow-5:
    0 -1px 2px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 2%)),
    0 2px 1px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 5px 5px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 10px 10px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 4%)),
    0 20px 20px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 5%)),
    0 40px 40px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 7%));
  --shadow-6:
    0 -1px 2px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 2%)),
    0 3px 2px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 7px 5px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 3%)),
    0 12px 10px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 4%)),
    0 22px 18px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 5%)),
    0 41px 33px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 6%)),
    0 100px 80px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 7%));
  --inner-shadow-0: inset 0 0 0 1px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
  --inner-shadow-1: inset 0 1px 2px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
  --inner-shadow-2: inset 0 1px 4px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
  --inner-shadow-3: inset 0 2px 8px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
  --inner-shadow-4: inset 0 2px 14px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
`;
const elevate = `
  --elevate-1: hsl(0deg 0% var(--brightness) / 5%);
  --elevate-2: hsl(0deg 0% var(--brightness) / 12%);
  --elevate-3: hsl(0deg 0% var(--brightness) / 20%);
  --elevate-4: hsl(0deg 0% var(--brightness) / 60%);
  --elevate-5: hsl(0deg 0% var(--brightness) / 70%);
  --elevate-6: hsl(0deg 0% var(--brightness) / 87%);
`;
const styles = `${fonts}
  :root {
    ${colors}
    ${shadows}
    ${elevate}
    --space-xxs: .25rem;
    --space-xs: .5rem;
    --space-s: 1rem;
    --space-m: 1.5rem;
    --space-l: 2rem;
    --space-xl: 3rem;
    --space-xxl: 6rem;

    --hue: 205;
    --saturation: 100%;
    --lightness: 50%;

    --shell-surface1: #fff;
    --shell-text1: hsl(0deg 0% 13%);
    --shell-text2: hsl(0deg 0% 60%);

    --color-blue: #1a73e8;
    --color-orange: #ff9800;
    --color-purple: #3f51b5;
  }
  * {
    box-sizing: border-box;
    margin: 0;
  }
  *:not(:defined) {
    display: none;
  }
  html {
    --duration: 0.5s;
    --timing: ease;

    --toolbar-height-fallback: 32px;
  }
  body, html {
    height: 100%;
    font: 16px/1.3 Roboto, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    background: var(--background1);
    color: var(--text1);
    overscroll-behavior: none;
  }
  main {
    padding: var(--space-m);
  }
  code {
    background: var(--gray-10);
    color: var(--gray-2);
    padding: var(--space-s);
    border-radius: var(--space-xxs);
    margin: var(--space-m);
    display: block;
  }
  svg-icon:not(:defined) {
    display: none;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #19232a inset;
    -webkit-text-fill-color: #fff;
    transition: background-color 5000s ease-in-out 0s;
  }`;

export default styles;
