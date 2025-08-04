// ===================================================================================
// ARQUIVO: config.js
// RESPONSABILIDADE: Centralizar a configuração do Firebase e inicializar os serviços
// principais da aplicação (Autenticação e Base de Dados Firestore).
// ===================================================================================

// Importa as funções de inicialização dos SDKs do Firebase que vamos precisar.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===================================================================================
// CONFIGURAÇÃO DO FIREBASE
// Este objeto contém as "chaves" que ligam a nossa aplicação ao seu projeto Firebase.
// ATENÇÃO: É CRUCIAL TROCAR ESTAS CHAVES POR NOVAS ANTES DE LANÇAR O SITE!
// ===================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyBfxGvGb1lwmLFS88AGyLa5_RhTlWARWA4",
    authDomain: "byte-capital.firebaseapp.com",
    projectId: "byte-capital",
    storageBucket: "byte-capital.appspot.com",
    messagingSenderId: "940011807520",
    appId: "1:940011807520:web:8657dc5ce02d07a5302d45"
};

// ===================================================================================
// INICIALIZAÇÃO E EXPORTAÇÃO DOS SERVIÇOS
// ===================================================================================

// Inicializa a aplicação Firebase com a configuração acima.
// Esta é a ligação principal com o Firebase.
const app = initializeApp(firebaseConfig);

// Inicializa os serviços que vamos usar e guarda as suas referências.
const auth = getAuth(app);       // Serviço de Autenticação (para login, registo, etc.)
const db = getFirestore(app);    // Serviço do Firestore (a nossa base de dados NoSQL)

// Exporta os serviços inicializados para que outros ficheiros .js (módulos) possam usá-los.
// Ex: main.js e auth.js poderão importar 'auth' e 'db' a partir deste ficheiro.
export { auth, db };

