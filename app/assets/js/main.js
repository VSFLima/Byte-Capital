// ===================================================================================
// ARQUIVO: main.js
// RESPONSABILIDADE: Orquestrar toda a aplicação do cliente.
// VERSÃO: v8 - Final, Corrigida e Completa
// ===================================================================================

import { auth, db } from './config.js';
import { registerUser, loginUser, logoutUser, listenToAuthChanges } from './auth.js';
import { doc, onSnapshot, updateDoc, increment, getDoc, setDoc, serverTimestamp, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===================================================================================
// ESTADO GLOBAL E ELEMENTOS DO DOM
// ===================================================================================

const loginRegisterContainer = document.getElementById('page-login-register');
const appShellContainer = document.getElementById('app-shell');
const mainHeader = document.getElementById('main-header');

let currentUser = null;
let userData = {};
let platformSettings = {};
let userDataUnsubscribe = null;
let platformSettingsUnsubscribe = null;
let btccPrice = 1.00;

// ===================================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===================================================================================

async function initializeApp() {
    await loadPlatformSettings();
    listenToAuthChanges(handleAuthStateChange);
}

async function loadPlatformSettings() {
    const settingsRef = doc(db, 'settings', 'platform');
    platformSettingsUnsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            platformSettings = doc.data();
        } else {
            platformSettings = { siteName: "Byte Capital", logoSvg: `<svg width="100" height="100" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="#FFD600" d="M403.5 512l108.5-108.5 108.5 108.5-108.5 108.5z"/><path fill="#FFD600" d="M285 512l108.5-108.5L502 512l-108.5 108.5z"/><path fill="#FFD600" d="M739 512L630.5 403.5 522 512l108.5 108.5z"/><path fill="#FFD600" d="M512 204.8l108.5 108.5-108.5 108.5-108.5-108.5z"/><path fill="#FFD600" d="M512 819.2L403.5 710.7l108.5-108.5 108.5 108.5z"/></svg>`, mainBgColor: "#000000", cardBgColor: "#1A1A1A", primaryColor: "#00E676", highlightColor: "#FFD600", primaryTextColor: "#FFFFFF", secondaryTextColor: "#757575" };
        }
        applyPlatformSettings();
    });
}

function applyPlatformSettings() {
    document.title = platformSettings.siteName || "Byte Capital";
    const root = document.documentElement;
    root.style.setProperty('--cor-fundo-principal', platformSettings.mainBgColor || '#000000');
    root.style.setProperty('--cor-fundo-cartao', platformSettings.cardBgColor || '#1A1A1A');
    root.style.setProperty('--cor-primaria', platformSettings.primaryColor || '#00E676');
    root.style.setProperty('--cor-destaque', platformSettings.highlightColor || '#FFD600');
    root.style.setProperty('--cor-texto-principal', platformSettings.primaryTextColor || '#FFFFFF');
    root.style.setProperty('--cor-texto-secundario', platformSettings.secondaryTextColor || '#757575');
}

// ===================================================================================
// ROTEADOR E GESTÃO DE ESTADO
// ===================================================================================

function handleAuthStateChange(user) {
    if (user) {
        currentUser = user;
        listenToUserData(user.uid);
    } else {
        currentUser = null;
        if (userDataUnsubscribe) userDataUnsubscribe();
        userData = {};
        showAuthPages();
        router();
    }
}

function listenToUserData(uid) {
    const userDocRef = doc(db, 'users', uid);
    userDataUnsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            userData = doc.data();
            showAppShell();
            router();
        } else {
            logoutUser();
        }
    });
}

const router = () => {
    const pathWithParams = window.location.hash.slice(1) || (currentUser ? 'dashboard' : 'login');
    const path = pathWithParams.split('?')[0];

    if (!currentUser && !['login', 'register'].includes(path)) {
        window.location.hash = 'login';
        return;
    }
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const activePage = document.getElementById(`page-${path}`);
    if (activePage) activePage.classList.add('active');

    switch (path) {
        case 'login': renderLogin(); break;
        case 'register': renderRegister(); break;
        case 'dashboard': renderDashboard(); break;
        case 'wallet': renderWallet(); break;
        case 'support': renderSupport(); break;
        case 'indications': renderIndications(); break;
        case 'profile': renderProfile(); break;
        case 'notifications': renderNotifications(); break;
        case 'deposit': renderDeposit(); break;
        case 'withdraw': renderWithdraw(); break;
    }
    if (currentUser) {
        updateNavLinks(path);
        renderHeader();
    }
};

// ===================================================================================
// FUNÇÕES DE RENDERIZAÇÃO E LÓGICA DE UI
// ===================================================================================

const formatCurrency = (value, currency = 'BRLC') => {
    if (currency === 'BRLC') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }
    return `${(value || 0).toFixed(2)} BTCC`;
};

function showAuthPages() {
    loginRegisterContainer.classList.remove('hidden');
    appShellContainer.classList.add('hidden');
}

function showAppShell() {
    loginRegisterContainer.classList.add('hidden');
    appShellContainer.classList.remove('hidden');
}

function renderHeader() {
    const adminButton = userData.role === 'admin' ? `<a href="../admin/dashboard.html" class="bg-purple-600 px-3 py-2 rounded-lg text-xs font-bold">Painel Admin</a>` : '';
    mainHeader.innerHTML = `
        <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8">${platformSettings.logoSvg || ''}</div>
                <span class="font-bold text-lg">${platformSettings.siteName || ''}</span>
            </div>
            <div class="flex items-center space-x-2">
                ${adminButton}
                <a href="#notifications" class="p-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </a>
            </div>
        </div>`;
}

function renderLogin() {
    const page = document.getElementById('page-login');
    page.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen">
            <div class="w-full max-w-sm p-8 space-y-6">
                <div class="w-20 h-20 mx-auto">${platformSettings.logoSvg || ''}</div>
                <h1 class="text-2xl font-bold text-center">${platformSettings.siteName || ''}</h1>
                <form id="login-form" class="space-y-4">
                    <input type="email" id="email" placeholder="Email" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="password" id="password" placeholder="Senha" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <button type="submit" class="w-full py-3 text-lg font-bold text-black bg-[var(--cor-destaque)] rounded-lg">Entrar</button>
                    <p class="text-sm text-center">Não tem conta? <a href="#register" class="font-medium text-[var(--cor-destaque)]">Registe-se</a></p>
                    <p id="form-error" class="text-red-500 text-sm text-center h-4"></p>
                </form>
            </div>
        </div>`;
    page.querySelector('#login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const errorP = page.querySelector('#form-error');
        errorP.textContent = '';
        try { await loginUser(e.target.email.value, e.target.password.value); } 
        catch (error) { errorP.textContent = 'Email ou senha inválidos.'; }
    });
}

function renderRegister() {
    const page = document.getElementById('page-register');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const refCode = params.get('ref') || '';

    page.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen">
            <div class="w-full max-w-sm p-8 space-y-6">
                <h1 class="text-2xl font-bold text-center">Criar Conta</h1>
                <form id="register-form" class="space-y-4">
                    <input type="text" id="name" placeholder="Nome completo" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="email" id="email" placeholder="Email" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="tel" id="phone" placeholder="WhatsApp" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="password" id="password" placeholder="Senha" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="text" id="ref-code" value="${refCode}" placeholder="Código de Convite (Opcional)" class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <button type="submit" class="w-full py-3 text-lg font-bold text-black bg-[var(--cor-destaque)] rounded-lg">Criar conta</button>
                    <p class="text-sm text-center">Já tem conta? <a href="#login" class="font-medium text-[var(--cor-destaque)]">Login</a></p>
                    <p id="form-error" class="text-red-500 text-sm text-center h-4"></p>
                </form>
            </div>
        </div>`;
    page.querySelector('#register-form').addEventListener('submit', async e => {
        e.preventDefault();
        const errorP = page.querySelector('#form-error');
        errorP.textContent = '';
        try { 
            await registerUser(
                e.target.name.value, 
                e.target.email.value, 
                e.target.password.value, 
                e.target.phone.value,
                e.target['ref-code'].value
            ); 
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                errorP.textContent = 'Este email já está em uso.';
            } else {
                errorP.textContent = 'Erro ao criar conta. Tente novamente.';
            }
        }
    });
}

function renderDashboard() {
    const page = document.getElementById('page-dashboard');
    const investmentPrograms = [
        { name: 'Bitcoin', symbol: 'BTC', status: 'Aguardando Investimento', icon: 'btc' },
        { name: 'Ethereum', symbol: 'ETH', status: 'Aguardando Investimento', icon: 'eth' },
        { name: 'Solana', symbol: 'SOL', status: 'Aguardando Investimento', icon: 'sol' },
    ];
    
    page.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-4 gap-4 text-center">
                <a href="#indications" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg><span class="text-xs">Indicações</span></a>
                <a href="#wallet" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg><span class="text-xs">Carteira</span></a>
                <a href="#support" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span class="text-xs">Suporte</span></a>
                <a href="#profile" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg><span class="text-xs">Perfil</span></a>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-4">
                <div class="flex justify-between">
                    <div><p class="text-sm text-[var(--cor-texto-secundario)]">Saldo (BRLC)</p><p class="text-2xl font-bold">${formatCurrency(userData.saldoBRLC, 'BRLC')}</p></div>
                    <div><p class="text-sm text-[var(--cor-texto-secundario)]">Saldo (BTCC)</p><p class="text-2xl font-bold">${formatCurrency(userData.saldoBTCC, 'BTCC')}</p></div>
                </div>
                <div><p class="text-sm text-[var(--cor-texto-secundario)]">Total investido</p><p class="text-2xl font-bold">${formatCurrency(0)}</p></div>
                <div class="grid grid-cols-2 gap-4 pt-2">
                    <a href="#deposit" class="w-full py-3 rounded-lg font-semibold text-center bg-gradient-to-r from-[var(--cor-primaria)] to-green-400">Depositar</a>
                    <a href="#withdraw" class="w-full py-3 rounded-lg font-semibold text-center bg-gray-700">Sacar</a>
                </div>
            </div>
            <div class="flex space-x-4 border-b border-[var(--cor-borda)]"><button class="tab-link active py-2">Todos</button><button class="tab-link py-2">Cripto</button></div>
            <div class="space-y-3">
                ${investmentPrograms.map(p => `
                    <div class="bg-[var(--cor-fundo-cartao)] p-4 rounded-2xl flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <img src="./assets/images/crypto/${p.icon}.svg" class="w-10 h-10" alt="${p.name} logo">
                            <div><p class="font-bold">${p.name}</p><p class="text-xs text-[var(--cor-texto-secundario)]">${p.status}</p></div>
                        </div>
                        <button data-asset="${p.name}" class="invest-btn bg-[var(--cor-primaria)] px-6 py-2 rounded-lg font-semibold text-sm">Investir</button>
                    </div>`).join('')}
            </div>
        </div>`;
    page.querySelectorAll('.invest-btn').forEach(btn => btn.addEventListener('click', () => renderInvestmentModal(btn.dataset.asset)));
}

function renderInvestmentModal(assetName) {
    const modal = document.createElement('div');
    modal.id = 'investment-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[var(--cor-fundo-cartao)] p-6 rounded-2xl w-11/12 max-w-sm space-y-4 relative">
            <button id="close-modal-btn" class="absolute top-4 right-4 text-2xl text-gray-500">&times;</button>
            <h2 class="text-xl font-bold text-center">Investir em ${assetName}</h2>
            <div class="grid grid-cols-3 gap-2">
                <button class="value-btn bg-gray-700 py-2 rounded-lg">50 BTCC</button>
                <button class="value-btn bg-gray-700 py-2 rounded-lg">100 BTCC</button>
                <button class="value-btn bg-gray-700 py-2 rounded-lg">200 BTCC</button>
            </div>
            <input type="number" id="invest-amount" placeholder="Digite o valor em BTCC" class="w-full px-4 py-3 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
            <p class="text-xs text-[var(--cor-texto-secundario)]">Saldo BTCC disponível: ${userData.saldoBTCC.toFixed(2)}</p>
            <button id="invest-now-btn" class="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[var(--cor-primaria)] to-green-400">Investir Agora</button>
            <p id="modal-error" class="text-red-500 text-sm text-center h-4"></p>
        </div>`;
    document.body.appendChild(modal);
    
    const closeModal = () => modal.remove();
    const investAmountInput = modal.querySelector('#invest-amount');
    
    modal.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modal.querySelectorAll('.value-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            investAmountInput.value = btn.textContent.replace(' BTCC', '');
        });
    });

    modal.querySelector('#invest-now-btn').addEventListener('click', async () => {
        const amount = parseFloat(investAmountInput.value);
        const errorP = modal.querySelector('#modal-error');
        errorP.textContent = '';
        if (isNaN(amount) || amount <= 0) {
            errorP.textContent = "Valor inválido.";
            return;
        }
        if (userData.saldoBTCC < amount) {
            errorP.innerHTML = `Saldo BTCC insuficiente. <a href="#wallet" id="go-to-wallet" class="underline">Converter</a>`;
            modal.querySelector('#go-to-wallet').addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
                window.location.hash = 'wallet';
            });
            return;
        }
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                saldoBTCC: increment(-amount)
            });
            alert(`Investimento de ${formatCurrency(amount, 'BTCC')} em ${assetName} realizado com sucesso!`);
            closeModal();
        } catch (error) {
            console.error("Erro ao investir:", error);
            errorP.textContent = "Erro ao processar o investimento.";
        }
    });
}

function renderWallet() {
    const page = document.getElementById('page-operations'); // A página de operações agora é a carteira
    page.innerHTML = `<div class="space-y-6">
        <h1 class="text-2xl font-bold">Carteira / Exchange</h1>
        <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-4">
            <h2 class="font-bold">Converter Moedas</h2>
            <div>
                <label class="text-sm text-[var(--cor-texto-secundario)]">De BRLC para BTCC</label>
                <div class="flex items-center mt-1"><input type="number" id="brlc-to-btcc" placeholder="0.00" class="w-full p-2 bg-gray-700 rounded-l-lg"><button id="convert-to-btcc" class="bg-[var(--cor-primaria)] p-2 rounded-r-lg font-semibold">Converter</button></div>
            </div>
            <div>
                <label class="text-sm text-[var(--cor-texto-secundario)]">De BTCC para BRLC</label>
                <div class="flex items-center mt-1"><input type="number" id="btcc-to-brlc" placeholder="0.00" class="w-full p-2 bg-gray-700 rounded-l-lg"><button id="convert-to-brlc" class="bg-[var(--cor-primaria)] p-2 rounded-r-lg font-semibold">Converter</button></div>
            </div>
        </div>
    </div>`;

    page.querySelector('#convert-to-btcc').addEventListener('click', async () => {
        const amount = parseFloat(page.querySelector('#brlc-to-btcc').value);
        if(isNaN(amount) || amount <= 0 || userData.saldoBRLC < amount) {
            alert("Valor inválido ou saldo BRLC insuficiente.");
            return;
        }
        await updateDoc(doc(db, 'users', currentUser.uid), {
            saldoBRLC: increment(-amount),
            saldoBTCC: increment(amount) // Conversão 1:1
        });
        alert("Conversão realizada com sucesso!");
    });
    page.querySelector('#convert-to-brlc').addEventListener('click', async () => {
        const amount = parseFloat(page.querySelector('#btcc-to-brlc').value);
        if(isNaN(amount) || amount <= 0 || userData.saldoBTCC < amount) {
            alert("Valor inválido ou saldo BTCC insuficiente.");
            return;
        }
        await updateDoc(doc(db, 'users', currentUser.uid), {
            saldoBTCC: increment(-amount),
            saldoBRLC: increment(amount) // Conversão 1:1
        });
        alert("Conversão realizada com sucesso!");
    });
}

function renderSupport() {
    const page = document.getElementById('page-support');
    page.innerHTML = `
        <div class="space-y-6 text-center">
            <h1 class="text-2xl font-bold">Suporte</h1>
            <p class="text-[var(--cor-texto-secundario)]">Precisa de ajuda? Entre em contacto com a nossa equipa através do Telegram.</p>
            <a href="${platformSettings.telegramLink || '#'}" target="_blank" class="inline-block w-full max-w-xs py-3 rounded-lg font-semibold bg-[var(--cor-primaria)]">Contactar Suporte</a>
        </div>`;
}

async function renderIndications() {
    const page = document.getElementById('page-indications');
    const nextLevel = "Bronze";
    const currentAffiliates = userData.indicados ? userData.indicados.length : 0;
    const requiredAffiliates = 10;
    const progress = (currentAffiliates / requiredAffiliates) * 100;

    let referredListHTML = '<p class="text-sm text-[var(--cor-texto-secundario)]">Ainda não tem convidados.</p>';
    if (userData.indicados && userData.indicados.length > 0) {
        referredListHTML = userData.indicados.map(ref => `
            <div class="flex justify-between items-center text-sm">
                <span>${ref.username}</span>
                <span class="${ref.hasInvested ? 'text-green-400' : 'text-yellow-400'}">${ref.hasInvested ? 'Ativo' : 'Pendente'}</span>
            </div>
        `).join('');
    }

    page.innerHTML = `
        <div class="space-y-6">
            <h1 class="text-2xl font-bold">Programa de Indicações</h1>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-4">
                <h2 class="font-bold">Plano de Carreira</h2>
                <p class="text-sm">Patamar Atual: <span class="font-bold text-[var(--cor-destaque)]">${userData.patamar || 'Iniciante'}</span></p>
                <div>
                    <div class="flex justify-between text-xs mb-1">
                        <span>Progresso para ${nextLevel}</span>
                        <span>${currentAffiliates} / ${requiredAffiliates}</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2.5">
                        <div class="bg-[var(--cor-primaria)] h-2.5 rounded-full" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-4 rounded-2xl">
                <p class="text-sm text-[var(--cor-texto-secundario)] mb-2">O seu link de indicação</p>
                <div class="flex items-center bg-gray-900 p-2 rounded-lg">
                    <input id="ref-link-input" type="text" readonly value="${window.location.origin}${window.location.pathname}#register?ref=${currentUser.uid}" class="bg-transparent w-full text-white focus:outline-none text-sm">
                    <button id="copy-link-btn" class="bg-[var(--cor-primaria)] px-4 py-1.5 rounded-md font-semibold text-sm">Copiar</button>
                </div>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-2">
                <h2 class="font-bold">Os seus Convidados</h2>
                ${referredListHTML}
            </div>
        </div>`;
    
    page.querySelector('#copy-link-btn').addEventListener('click', (e) => {
        const input = page.querySelector('#ref-link-input');
        input.select();
        document.execCommand('copy');
        e.target.textContent = 'Copiado!';
        setTimeout(() => { e.target.textContent = 'Copiar'; }, 2000);
    });
}

function renderProfile() {
    const page = document.getElementById('page-profile');
    page.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">A minha Conta</h1>
                <button id="logout-btn" class="bg-red-600 px-4 py-2 rounded-lg font-semibold text-sm">Sair</button>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-3">
                <h2 class="font-bold">Informações Pessoais</h2>
                <p class="text-sm"><span class="text-[var(--cor-texto-secundario)]">Nome:</span> ${userData.name}</p>
                <p class="text-sm"><span class="text-[var(--cor-texto-secundario)]">Username:</span> ${userData.username || 'N/A'}</p>
                <p class="text-sm"><span class="text-[var(--cor-texto-secundario)]">Email:</span> ${userData.email}</p>
            </div>
            <div id="kyc-section" class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-3">
                <h2 class="font-bold">Validação de Documento</h2>
                ${userData.cpf ? `
                    <p class="text-green-400">✓ CPF validado: ${userData.cpf}</p>
                ` : `
                    <p class="text-xs text-[var(--cor-texto-secundario)]">Para realizar saques, precisa de validar o seu CPF.</p>
                    <form id="cpf-form">
                        <input type="text" id="cpf-name-input" placeholder="O seu nome completo" required class="w-full px-4 py-3 mt-2 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
                        <input type="text" id="cpf-input" placeholder="Digite seu CPF (apenas números)" required class="w-full mt-2 px-4 py-3 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
                        <button type="submit" class="mt-2 w-full py-2 rounded-lg font-semibold bg-[var(--cor-primaria)]">Validar CPF</button>
                    </form>
                `}
            </div>
        </div>`;
    page.querySelector('#logout-btn').addEventListener('click', logoutUser);
    if (!userData.cpf) {
        page.querySelector('#cpf-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = page.querySelector('#cpf-name-input').value;
            const cpf = page.querySelector('#cpf-input').value;
            renderCpfConfirmationModal(name, cpf);
        });
    }
}

function renderCpfConfirmationModal(name, cpf) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[var(--cor-fundo-cartao)] p-6 rounded-2xl w-11/12 max-w-sm space-y-4">
            <h2 class="text-xl font-bold text-center">Confirmar Dados</h2>
            <p class="text-sm text-center text-[var(--cor-texto-secundario)]">Confirme se os seus dados estão corretos. Após a confirmação, não poderão ser alterados.</p>
            <div>
                <p><span class="font-semibold">Nome:</span> ${name}</p>
                <p><span class="font-semibold">CPF:</span> ${cpf}</p>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-2">
                <button id="cancel-cpf-btn" class="w-full py-2 rounded-lg font-semibold bg-gray-700">Corrigir</button>
                <button id="confirm-cpf-btn" class="w-full py-2 rounded-lg font-semibold bg-[var(--cor-primaria)]">Confirmar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#cancel-cpf-btn').addEventListener('click', closeModal);
    modal.querySelector('#confirm-cpf-btn').addEventListener('click', async () => {
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                cpf: cpf,
                nomeCompletoVerificado: name
            });
            alert("CPF validado e vinculado à sua conta com sucesso!");
            closeModal();
        } catch (error) {
            console.error("Erro ao guardar CPF:", error);
            alert("Ocorreu um erro. Tente novamente.");
        }
    });
}

function renderNotifications() {
    const page = document.getElementById('page-notifications');
    page.innerHTML = `<div class="space-y-6"><h1 class="text-2xl font-bold">Notificações</h1><p class="text-center text-[var(--cor-texto-secundario)]">Nenhuma notificação nova.</p></div>`;
}

function renderDeposit() {
    const page = document.getElementById('page-deposit');
    page.innerHTML = `<div class="space-y-6">
        <h1 class="text-2xl font-bold">Realizar Depósito</h1>
        <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-4">
            <p class="text-center text-[var(--cor-texto-secundario)]">Para depositar, faça um PIX para a chave abaixo e clique em "Já Paguei".</p>
            <div class="text-center bg-gray-900 p-3 rounded-lg">
                <p class="font-mono text-[var(--cor-destaque)]">${platformSettings.pixKey || 'Chave não configurada'}</p>
            </div>
            <form id="deposit-form">
                <input type="number" id="deposit-amount" placeholder="Valor do depósito (ex: 100.00)" required class="w-full px-4 py-3 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
                <button type="submit" class="mt-4 w-full py-3 rounded-lg font-semibold bg-[var(--cor-primaria)]">Já Paguei</button>
            </form>
            <p id="deposit-message" class="text-center text-sm h-4"></p>
        </div>
    </div>`;
    page.querySelector('#deposit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(page.querySelector('#deposit-amount').value);
        const messageP = page.querySelector('#deposit-message');
        if (isNaN(amount) || amount <= 0) {
            messageP.textContent = "Por favor, insira um valor válido.";
            return;
        }
        try {
            await addDoc(collection(db, 'deposit_requests'), {
                uid: currentUser.uid,
                userName: userData.name,
                amount: amount,
                status: 'pendente',
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'users', currentUser.uid), {
                pendingBalanceBRL: increment(amount)
            });
            messageP.textContent = "Pedido de depósito enviado! Aguarde a aprovação.";
            messageP.classList.add('text-green-400');
        } catch (error) {
            console.error("Erro ao criar pedido de depósito:", error);
            messageP.textContent = "Erro ao enviar o pedido.";
        }
    });
}

function renderWithdraw() {
    const page = document.getElementById('page-withdraw');
    page.innerHTML = `<div class="space-y-6">
        <h1 class="text-2xl font-bold">Sacar</h1>
        <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-4">
            <p class="text-sm text-[var(--cor-texto-secundario)]">Saldo disponível para saque</p>
            <p class="text-3xl font-bold">${formatCurrency(userData.saldoBRLC, 'BRLC')}</p>
            <form id="withdraw-form">
                <input type="number" id="withdraw-amount" placeholder="Valor do saque" required class="w-full px-4 py-3 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
                <button type="submit" class="mt-4 w-full py-3 rounded-lg font-semibold bg-[var(--cor-primaria)]">Solicitar Saque</button>
            </form>
            <p id="withdraw-message" class="text-center text-sm h-4"></p>
        </div>
    </div>`;
    
    page.querySelector('#withdraw-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(page.querySelector('#withdraw-amount').value);
        const messageP = page.querySelector('#withdraw-message');
        if (isNaN(amount) || amount <= 0) {
            messageP.textContent = "Valor inválido.";
            return;
        }
        if (userData.saldoBRLC < amount) {
            messageP.textContent = "Saldo insuficiente.";
            return;
        }
        try {
            await addDoc(collection(db, 'withdraw_requests'), {
                uid: currentUser.uid,
                userName: userData.name,
                amount: amount,
                status: 'pendente',
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'users', currentUser.uid), {
                saldoBRLC: increment(-amount)
            });
            messageP.textContent = "Pedido de saque enviado com sucesso!";
            messageP.classList.add('text-green-400');
        } catch (error) {
            console.error("Erro ao criar pedido de saque:", error);
            messageP.textContent = "Erro ao enviar o pedido.";
        }
    });
}

function updateNavLinks(currentPath) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const isActive = link.getAttribute('href').substring(1) === currentPath;
        link.classList.toggle('active', isActive);
    });
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', initializeApp);

