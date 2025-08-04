// ===================================================================================
// ARQUIVO: main-admin.js
// RESPONSABILIDADE: Orquestrar todo o painel de administração, incluindo a proteção
// da página, a exibição de dados e a gestão da plataforma e dos utilizadores.
// ===================================================================================

import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ... (O resto do código, desde a secção de ELEMENTOS DO DOM até às FUNÇÕES PRINCIPAIS, permanece o mesmo) ...
const statsTotalUsers = document.getElementById('stats-total-users');
const statsTotalBalance = document.getElementById('stats-total-balance');
const statsTotalReferral = document.getElementById('stats-total-referral');
const usersTableBody = document.getElementById('users-table-body');
const logoutBtn = document.getElementById('logout-btn');
const settingsForm = document.getElementById('settings-form');
// ... (todos os outros inputs do formulário) ...
const pendingDepositsContainer = document.getElementById('pending-deposits');
const pendingWithdrawalsContainer = document.getElementById('pending-withdrawals');

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

async function loadUsersData() { /* ... (código existente, sem alterações) ... */ }
async function loadPlatformSettings() { /* ... (código existente, sem alterações) ... */ }
function addEventListenersToUserButtons() { /* ... (código existente, sem alterações) ... */ }
async function handleCreditChange(uid, type) { /* ... (código existente, sem alterações) ... */ }
async function handleRoleChange(uid) { /* ... (código existente, sem alterações) ... */ }

// ===================================================================================
// NOVAS FUNÇÕES PARA AÇÕES PENDENTES
// ===================================================================================

/**
 * Carrega e exibe todos os pedidos de depósito com o estado 'pendente'.
 */
async function loadPendingDeposits() {
    const q = query(collection(db, "deposit_requests"), where("status", "==", "pendente"));
    const querySnapshot = await getDocs(q);
    
    pendingDepositsContainer.innerHTML = '';
    if (querySnapshot.empty) {
        pendingDepositsContainer.innerHTML = `<p class="text-gray-500 text-sm">Nenhum depósito pendente.</p>`;
        return;
    }

    querySnapshot.forEach(doc => {
        const request = doc.data();
        const requestEl = document.createElement('div');
        requestEl.className = 'bg-gray-700 p-2 rounded-lg text-sm flex justify-between items-center';
        requestEl.innerHTML = `
            <div>
                <p class="font-semibold">${request.userName}</p>
                <p class="text-xs text-green-400">${formatCurrency(request.amount)}</p>
            </div>
            <div class="space-x-2">
                <button data-id="${doc.id}" data-uid="${request.uid}" data-amount="${request.amount}" class="approve-deposit-btn bg-green-600 px-2 py-1 text-xs rounded hover:bg-green-700">Aprovar</button>
                <button data-id="${doc.id}" class="deny-request-btn bg-red-600 px-2 py-1 text-xs rounded hover:bg-red-700">Recusar</button>
            </div>
        `;
        pendingDepositsContainer.appendChild(requestEl);
    });

    // Adiciona os event listeners aos novos botões
    document.querySelectorAll('.approve-deposit-btn').forEach(btn => btn.addEventListener('click', approveDeposit));
    document.querySelectorAll('.deny-request-btn').forEach(btn => btn.addEventListener('click', (e) => denyRequest('deposit_requests', e.target.dataset.id)));
}

/**
 * Carrega e exibe todos os pedidos de saque com o estado 'pendente' ou 'em_analise'.
 */
async function loadPendingWithdrawals() {
    const q = query(collection(db, "withdraw_requests"), where("status", "in", ["pendente", "em_analise"]));
    const querySnapshot = await getDocs(q);

    pendingWithdrawalsContainer.innerHTML = '';
    if (querySnapshot.empty) {
        pendingWithdrawalsContainer.innerHTML = `<p class="text-gray-500 text-sm">Nenhum saque pendente.</p>`;
        return;
    }

    querySnapshot.forEach(doc => {
        const request = doc.data();
        const statusClass = request.status === 'em_analise' ? 'text-yellow-400' : 'text-blue-400';
        const requestEl = document.createElement('div');
        requestEl.className = 'bg-gray-700 p-2 rounded-lg text-sm flex justify-between items-center';
        requestEl.innerHTML = `
            <div>
                <p class="font-semibold">${request.userName}</p>
                <p class="text-xs ${statusClass}">${request.status.replace('_', ' ')}: ${formatCurrency(request.amount)}</p>
            </div>
            <div class="space-x-2">
                <button data-id="${doc.id}" class="approve-withdrawal-btn bg-green-600 px-2 py-1 text-xs rounded hover:bg-green-700">Concluir</button>
                <button data-id="${doc.id}" data-uid="${request.uid}" data-amount="${request.amount}" class="deny-request-btn bg-red-600 px-2 py-1 text-xs rounded hover:bg-red-700">Recusar</button>
            </div>
        `;
        pendingWithdrawalsContainer.appendChild(requestEl);
    });

    document.querySelectorAll('.approve-withdrawal-btn').forEach(btn => btn.addEventListener('click', (e) => approveWithdrawal(e.target.dataset.id)));
    document.querySelectorAll('.deny-request-btn').forEach(btn => btn.addEventListener('click', (e) => denyRequest('withdraw_requests', e.target.dataset.id, e.target.dataset.uid, e.target.dataset.amount)));
}

/**
 * Aprova um pedido de depósito: credita o saldo do utilizador e apaga o pedido.
 */
async function approveDeposit(event) {
    const { id, uid, amount } = event.target.dataset;
    if (confirm(`Aprovar depósito de ${formatCurrency(amount)} para este utilizador?`)) {
        try {
            // Credita o saldo do utilizador
            await updateDoc(doc(db, 'users', uid), { balanceBRL: increment(parseFloat(amount)) });
            // Apaga o pedido da lista de pendentes
            await deleteDoc(doc(db, 'deposit_requests', id));
            // Recarrega as listas
            loadPendingDeposits();
            loadUsersData();
        } catch (error) {
            console.error("Erro ao aprovar depósito:", error);
            alert("Erro ao aprovar depósito.");
        }
    }
}

/**
 * Marca um pedido de saque como concluído.
 */
async function approveWithdrawal(requestId) {
     if (confirm(`Marcar este saque como concluído?`)) {
        try {
            await updateDoc(doc(db, 'withdraw_requests', requestId), { status: 'concluido' });
            loadPendingWithdrawals();
        } catch (error) {
            console.error("Erro ao concluir saque:", error);
            alert("Erro ao concluir saque.");
        }
     }
}

/**
 * Recusa um pedido e, se for um saque, devolve o saldo ao utilizador.
 */
async function denyRequest(collectionName, requestId, uid = null, amount = null) {
    if (confirm("Tem a certeza que deseja recusar este pedido?")) {
        try {
            // Se for um saque, devolve o dinheiro ao utilizador
            if (collectionName === 'withdraw_requests' && uid && amount) {
                await updateDoc(doc(db, 'users', uid), { balanceBRL: increment(parseFloat(amount)) });
            }
            await deleteDoc(doc(db, collectionName, requestId));
            // Recarrega as listas
            loadPendingDeposits();
            loadPendingWithdrawals();
            loadUsersData();
        } catch (error) {
            console.error("Erro ao recusar pedido:", error);
            alert("Erro ao recusar pedido.");
        }
    }
}

// ===================================================================================
// GUARDA DE SEGURANÇA E INICIALIZAÇÃO
// ===================================================================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            console.log("Acesso de administrador concedido.");
            loadUsersData();
            loadPlatformSettings();
            loadPendingDeposits(); // Carrega os depósitos pendentes
            loadPendingWithdrawals(); // Carrega os saques pendentes
        } else {
            console.warn("Acesso negado. O utilizador não é administrador.");
            window.location.href = '../app/index.html';
        }
    } else {
        console.warn("Acesso negado. Nenhum utilizador autenticado.");
        window.location.href = '../app/index.html#login';
    }
});

// ... (O resto do código, como os Event Listeners para os formulários, permanece o mesmo) ...
logoutBtn.addEventListener('click', () => { /* ... */ });
settingsForm.addEventListener('submit', async (e) => { /* ... */ });
announcementForm.addEventListener('submit', async (e) => { /* ... */ });

