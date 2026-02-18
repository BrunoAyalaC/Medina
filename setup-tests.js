/**
 * Setup para tests - Cargar variables de entorno
 */
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env.test
dotenv.config({ path: path.join(__dirname, '.env.test') });

// Configurar timeouts
jest.setTimeout(15000);

