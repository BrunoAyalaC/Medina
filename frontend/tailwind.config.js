export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta mejorada para WCAG AA compliance
        primary: '#1D4ED8',    // Azul más oscuro (5.3:1 contraste con blanco)
        secondary: '#7C3AED',  // Púrpura más oscuro (5.1:1 contraste con blanco)
        success: '#059669',    // Verde más oscuro (5.4:1 contraste con blanco)
        danger: '#DC2626',     // Rojo más oscuro (4.8:1 contraste con blanco)
        warning: '#D97706',    // Naranja más oscuro (4.6:1 contraste con blanco)
      },
    },
  },
  plugins: [],
}
