// ===================================================================================
// ARQUIVO: auth.js
// RESPONSABILIDADE: Gerir o registo, login e logout de utilizadores.
// ===================================================================================

import { auth, db } from './config.js';
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
 * Regista um novo utilizador na plataforma com a estrutura de dados completa da v7.
 * @param {string} name - O nome completo do utilizador.
 * @param {string} email - O email para o registo.
 * @param {string} password - A senha para o registo.
 * @param {string} phone - O número de WhatsApp do utilizador.
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function registerUser(name, email, password, phone) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Gera um @username simples a partir do email
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');

        // Cria o documento do utilizador no Firestore com a estrutura de dados completa do briefing.
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            username: `@${username}`, // Adiciona o @username
            email: email,
            phone: phone,
            role: 'cliente',
            accountStatus: 'ativo', // 'ativo' ou 'inativo'
            createdAt: serverTimestamp(),
            
            // Estrutura da Economia Interna
            saldoBRLC: 0,       // Saldo principal em Reais (BRLC)
            saldoBTCC: 0,       // Saldo da moeda interna (BTCC)
            
            // Campos para KYC (verificação)
            cpf: null,
            nomeCompletoVerificado: null,
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

