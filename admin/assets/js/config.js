// Importa as funções de inicialização dos SDKs do Firebase que vamos precisar.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===================================================================================
// CONFIGURAÇÃO DO FIREBASE
// Este objeto contém as "chaves" que ligam o nosso painel de admin ao seu projeto Firebase.
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
const app = initializeApp(firebaseConfig);

// Inicializa os serviços que vamos usar no painel de admin.
const auth = getAuth(app);       // Serviço de Autenticação (para verificar se o admin está logado)
const db = getFirestore(app);    // Serviço do Firestore (para ler e escrever dados dos utilizadores)

// Exporta os serviços inicializados para que outros ficheiros .js do painel possam usá-los.
export { auth, db };

