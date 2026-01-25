import { startServer } from './app.js';

// Iniciar servidor
startServer().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
