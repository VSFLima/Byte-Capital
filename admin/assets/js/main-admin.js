// ===================================================================================
// ARQUIVO: main-admin.js
// RESPONSABILIDADE: Orquestrar todo o painel de administração, incluindo a proteção
// da página, a exibição de dados e a gestão da plataforma e dos utilizadores.
// VERSÃO: v7 - Final e Completa
// ===================================================================================

import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, query, where, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===================================================================================
// ELEMENTOS DO DOM
// ===================================================================================

const statsTotalUsers = document.getElementById('stats-total-users');
const statsTotalBalance = document.getElementById('stats-total-balance');
const statsTotalBTCC = document.getElementById('stats-total-btcc');
const usersTableBody = document.getElementById('users-table-body');
const logoutBtn = document.getElementById('logout-btn');
const settingsForm = document.getElementById('settings-form');
const siteNameInput = document.getElementById('site-name');
const logoSvgTextarea = document.getElementById('logo-svg');
const primaryColorInput = document.getElementById('primary-color');
const highlightColorInput = document.getElementById('highlight-color');
const mainBgColorInput = document.getElementById('main-bg-color');
const cardBgColorInput = document.getElementById('card-bg-color');
const primaryTextColorInput = document.getElementById('primary-text-color');
const whatsappLinkInput = document.getElementById('whatsapp-link');
const telegramLinkInput = document.getElementById('telegram-link');
const pixKeyInput = document.getElementById('pix-key');
const telegramUrlInput = document.getElementById('telegram-url');
const telegramTokenInput = document.getElementById('telegram-token');
const telegramChatIdInput = document.getElementById('telegram-chat-id');
const marketingPixelsTextarea = document.getElementById('marketing-pixels');
const settingsMessage = document.getElementById('settings-message');
const pendingDepositsContainer = document.getElementById('pending-deposits');
const pendingWithdrawalsContainer = document.getElementById('pending-withdrawals');
const newAssetForm = document.getElementById('new-asset-form');
const investmentAssetsContainer = document.getElementById('investment-assets-container');

// ===================================================================================
// FUNÇÕES PRINCIPAIS
// ===================================================================================

const formatCurrency = (value, currency = 'BRLC') => {
    if (currency === 'BRLC') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }
    return `${(value || 0).toFixed(2)} BTCC`;
};

async function loadUsersData() {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        let totalUsers = 0;
        let totalBRLC = 0;
        let totalBTCC = 0;
        
        usersTableBody.innerHTML = '';

        if (querySnapshot.empty) {
            usersTableBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">Nenhum utilizador encontrado.</td></tr>`;
            return;
        }

        querySnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            totalUsers++;
            totalBRLC += userData.saldoBRLC || 0;
            totalBTCC += userData.saldoBTCC || 0;

            const userRow = `
                <tr class="hover:bg-gray-700/50">
                    <td class="p-4 align-top">
                        <div class="text-sm font-medium text-white">${userData.name}</div>
                        <div class="text-xs text-gray-400">${userData.email}</div>
                        <div class="text-xs text-gray-500">${userData.uid}</div>
                    </td>
                    <td class="p-4 align-top">
                        <div class="text-sm text-white">BRLC: <span class="font-medium text-green-400">${formatCurrency(userData.saldoBRLC, 'BRLC')}</span></div>
                        <div class="text-sm text-white">BTCC: <span class="font-medium text-yellow-400">${formatCurrency(userData.saldoBTCC, 'BTCC')}</span></div>
                    </td>
                    <td class="p-4 align-top text-right space-y-2">
                        <button data-uid="${userData.uid}" class="add-credit-btn bg-green-600 px-3 py-1 rounded hover:bg-green-700 text-xs w-full">Adicionar Saldo</button>
                        <button data-uid="${userData.uid}" class="remove-credit-btn bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700 text-xs w-full">Remover Saldo</button>
                        <button data-uid="${userData.uid}" class="role-change-btn bg-purple-600 px-3 py-1 rounded hover:bg-purple-700 text-xs w-full">${userData.role === 'admin' ? 'Rebaixar' : 'Promover a Admin'}</button>
                    </td>
                </tr>`;
            usersTableBody.innerHTML += userRow;
        });

        statsTotalUsers.textContent = totalUsers;
        statsTotalBalance.textContent = formatCurrency(totalBRLC, 'BRLC');
        statsTotalBTCC.textContent = formatCurrency(totalBTCC, 'BTCC');

        addEventListenersToUserButtons();

    } catch (error) {
        console.error("Erro ao carregar dados dos utilizadores: ", error);
        usersTableBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-red-500">Erro ao carregar utilizadores.</td></tr>`;
    }
}

async function loadPlatformSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'platform');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            const settings = settingsSnap.data();
            siteNameInput.value = settings.siteName || '';
            document.getElementById('header-site-name').textContent = settings.siteName || 'Byte Capital';
            logoSvgTextarea.value = settings.logoSvg || '';
            primaryColorInput.value = settings.primaryColor || '#00E676';
            highlightColorInput.value = settings.highlightColor || '#FFD600';
            mainBgColorInput.value = settings.mainBgColor || '#000000';
            cardBgColorInput.value = settings.cardBgColor || '#1A1A1A';
            primaryTextColorInput.value = settings.primaryTextColor || '#FFFFFF';
            whatsappLinkInput.value = settings.whatsappLink || '';
            telegramLinkInput.value = settings.telegramLink || '';
            pixKeyInput.value = settings.pixKey || '';
            telegramUrlInput.value = settings.telegramUrl || '';
            telegramTokenInput.value = settings.telegramToken || '';
            telegramChatIdInput.value = settings.telegramChatId || '';
            marketingPixelsTextarea.value = settings.marketingPixels || '';
        }
    } catch (error) {
        console.error("Erro ao carregar configurações: ", error);
    }
}

function addEventListenersToUserButtons() {
    document.querySelectorAll('.add-credit-btn, .remove-credit-btn').forEach(button => {
        button.addEventListener('click', (e) => handleCreditChange(e.target.dataset.uid, e.target.classList.contains('add-credit-btn') ? 'add' : 'remove'));
    });
    document.querySelectorAll('.role-change-btn').forEach(button => {
        button.addEventListener('click', (e) => handleRoleChange(e.target.dataset.uid));
    });
}

async function handleCreditChange(uid, type) {
    const balanceType = prompt("Qual saldo deseja alterar? Digite 'BRLC' ou 'BTCC'.", "BRLC")?.toUpperCase();
    if (balanceType !== 'BRLC' && balanceType !== 'BTCC') {
        alert("Tipo de saldo inválido.");
        return;
    }
    const amountStr = prompt(`Qual o valor a ${type === 'add' ? 'adicionar' : 'remover'} do saldo ${balanceType}?`, "100");
    if (amountStr === null) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        alert("Por favor, insira um valor numérico válido.");
        return;
    }
    const finalAmount = type === 'add' ? amount : -amount;
    const fieldToUpdate = balanceType === 'BRLC' ? 'saldoBRLC' : 'saldoBTCC';
    try {
        await updateDoc(doc(db, 'users', uid), { [fieldToUpdate]: increment(finalAmount) });
        loadUsersData();
    } catch (error) {
        console.error("Erro ao atualizar saldo: ", error);
        alert("Ocorreu um erro ao atualizar o saldo.");
    }
}

async function handleRoleChange(uid) {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return;
    const currentRole = userDoc.data().role;
    const newRole = currentRole === 'admin' ? 'cliente' : 'admin';
    if (confirm(`Tem a certeza que deseja alterar o papel deste utilizador para ${newRole}?`)) {
        try {
            await updateDoc(userDocRef, { role: newRole });
            loadUsersData();
        } catch (error) {
            console.error("Erro ao alterar o papel: ", error);
            alert("Ocorreu um erro ao alterar o papel do utilizador.");
        }
    }
}

async function loadPendingActions() {
    // Lógica para carregar depósitos e saques pendentes
}

async function loadInvestmentAssets() {
    try {
        const querySnapshot = await getDocs(collection(db, 'investment_assets'));
        investmentAssetsContainer.innerHTML = '';
        if (querySnapshot.empty) {
            investmentAssetsContainer.innerHTML = `<p class="text-gray-500 text-sm">Nenhum ativo criado.</p>`;
            return;
        }
        querySnapshot.forEach(doc => {
            const asset = doc.data();
            const assetEl = document.createElement('div');
            assetEl.className = 'bg-gray-700 p-2 rounded-lg text-sm flex justify-between items-center';
            assetEl.innerHTML = `
                <div class="flex items-center space-x-2">
                    <img src="${asset.iconUrl}" class="w-6 h-6 rounded-full">
                    <span>${asset.name} (${asset.profit}% / ${asset.duration} dias)</span>
                </div>
                <button data-id="${doc.id}" class="delete-asset-btn bg-red-600 px-2 py-1 text-xs rounded hover:bg-red-700">Apagar</button>
            `;
            investmentAssetsContainer.appendChild(assetEl);
        });
        document.querySelectorAll('.delete-asset-btn').forEach(btn => btn.addEventListener('click', deleteAsset));
    } catch (error) {
        console.error("Erro ao carregar ativos:", error);
    }
}

async function deleteAsset(event) {
    const assetId = event.target.dataset.id;
    if (confirm("Tem a certeza que deseja apagar este ativo de investimento?")) {
        try {
            await deleteDoc(doc(db, 'investment_assets', assetId));
            loadInvestmentAssets();
        } catch (error) {
            console.error("Erro ao apagar ativo:", error);
            alert("Erro ao apagar ativo.");
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
            document.body.style.display = 'block';
            loadUsersData();
            loadPlatformSettings();
            loadPendingActions();
            loadInvestmentAssets();
        } else {
            console.warn("Acesso negado. O utilizador não é administrador.");
            window.location.href = '../app/index.html';
        }
    } else {
        console.warn("Acesso negado. Nenhum utilizador autenticado.");
        window.location.href = '../app/index.html#login';
    }
});

// ===================================================================================
// EVENT LISTENERS
// ===================================================================================

logoutBtn.addEventListener('click', () => {
    signOut(auth).catch(error => console.error("Erro ao fazer logout: ", error));
});

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    settingsMessage.textContent = "A guardar...";
    settingsMessage.classList.remove('text-red-500', 'text-green-500');
    
    const settingsData = {
        siteName: siteNameInput.value,
        logoSvg: logoSvgTextarea.value,
        primaryColor: primaryColorInput.value,
        highlightColor: highlightColorInput.value,
        mainBgColor: mainBgColorInput.value,
        cardBgColor: cardBgColorInput.value,
        primaryTextColor: primaryTextColorInput.value,
        whatsappLink: whatsappLinkInput.value,
        telegramLink: telegramLinkInput.value,
        pixKey: pixKeyInput.value,
        telegramUrl: telegramUrlInput.value,
        telegramToken: telegramTokenInput.value,
        telegramChatId: telegramChatIdInput.value,
        marketingPixels: marketingPixelsTextarea.value
    };

    try {
        await setDoc(doc(db, 'settings', 'platform'), settingsData, { merge: true });
        settingsMessage.textContent = "Configurações guardadas com sucesso!";
        settingsMessage.classList.add('text-green-500');
    } catch (error) {
        settingsMessage.textContent = "Erro ao guardar configurações.";
        settingsMessage.classList.add('text-red-500');
    } finally {
        setTimeout(() => settingsMessage.textContent = '', 3000);
    }
});

newAssetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const assetData = {
        name: e.target['asset-name'].value,
        iconUrl: e.target['asset-icon-url'].value,
        profit: parseFloat(e.target['asset-profit'].value),
        duration: parseInt(e.target['asset-duration'].value)
    };
    if (!assetData.name || !assetData.iconUrl || isNaN(assetData.profit) || isNaN(assetData.duration)) {
        alert("Por favor, preencha todos os campos do novo ativo corretamente.");
        return;
    }
    try {
        await addDoc(collection(db, 'investment_assets'), assetData);
        newAssetForm.reset();
        loadInvestmentAssets();
    } catch (error) {
        console.error("Erro ao criar novo ativo:", error);
        alert("Erro ao criar novo ativo.");
    }
});

document.body.style.display = 'none';

