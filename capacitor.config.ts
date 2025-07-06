import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jacoporossetto.bookscanai',
  appName: 'Booksnap', // Aggiornato con il nuovo nome dell'app
  webDir: 'dist',
  server: {
    // Questa impostazione garantisce che l'app Android venga eseguita in un contesto sicuro
    androidScheme: 'https'
  },
};

export default config;
