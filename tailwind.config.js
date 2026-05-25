// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}", // Check karein kya yeh line aisi hi likhi hai?
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }



/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',            // App router ke liye
    './pages/**/*.{js,ts,jsx,tsx,mdx}',          // Pages router ke liye
    './components/**/*.{js,ts,jsx,tsx,mdx}',     // Components ke liye
    './src/**/*.{js,ts,jsx,tsx,mdx}',            // Agar src folder use ho raha hai
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};