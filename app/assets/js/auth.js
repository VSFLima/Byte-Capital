// ===================================================================================
// ARQUIVO: auth.js
// RESPONSABILIDADE: Gerir o registo, login e logout de utilizadores.
// ===================================================================================

// Importa os serviços de autenticação (auth) e base de dados (db) que inicializámos no config.js
import { auth, db } from './config.js';

// Importa as funções específicas do Firebase que vamos utilizar neste ficheiro
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Regista um novo utilizador na plataforma com a nova estrutura de dados completa.
 * @param {string} name - O nome completo do utilizador.
 * @param {string} email - O email para o registo.
 * @param {string} password - A senha para o registo.
 * @param {string} phone - O número de WhatsApp do utilizador.
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function registerUser(name, email, password, phone) {
    try {
        // 1. Cria o utilizador no serviço de Autenticação do Firebase.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Cria o documento do utilizador no Firestore com a estrutura de dados completa do nosso plano.
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            role: 'cliente',
            createdAt: serverTimestamp(),
            
            // Estrutura da Carteira (Economia Interna)
            saldoBRLC: 0,       // Saldo principal em Reais (BRLC)
            saldoBTCC: 0,       // Saldo da moeda interna (BTCC)
            
            // Campos para KYC (verificação)
            cpf: null,
            pixInfo: null,

            // Campos para o Plano de Carreira
            patamar: 'Afiliado',
            volumeEquipe: 0,
            indicadosDiretosAtivos: 0,
            downline: {} // Mapa para a rede de indicados
        });

    } catch (error) {
        console.error("Erro no registo do utilizador: ", error.code);
        throw error;
    }
}

/**
 * Autentica (faz login) de um utilizador existente.
 * @param {string} email - O email do utilizador.
 * @param {string} password - A senha do utilizador.
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Erro no login do utilizador: ", error.code);
        throw error;
    }
}

/**
 * Termina a sessão (faz logout) do utilizador atualmente autenticado.
 */
function logoutUser() {
    signOut(auth);
}

/**
 * Ouve as mudanças no estado de autenticação em tempo real.
 * @param {function} callback - Uma função a ser chamada sempre que o estado de autenticação mudar.
 */
function listenToAuthChanges(callback) {
    onAuthStateChanged(auth, callback);
}

// Exporta as funções para que o main.js possa importá-las e usá-las.
export { registerUser, loginUser, logoutUser, listenToAuthChanges };

