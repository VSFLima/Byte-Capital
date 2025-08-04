// ===================================================================================
// ARQUIVO: main.js
// RESPONSABILIDADE: Orquestrar toda a aplicação do cliente, incluindo roteamento,
// renderização de páginas, gestão de dados e funcionalidades White Label.
// ===================================================================================

// Importações dos nossos módulos e do Firebase
import { auth, db } from './config.js';
import { registerUser, loginUser, logoutUser, listenToAuthChanges } from './auth.js';
import { doc, onSnapshot, updateDoc, increment, getDoc, getDocs, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===================================================================================
// ESTADO GLOBAL E ELEMENTOS DO DOM
// ===================================================================================

const rootContainer = document.getElementById('root');
const loginRegisterContainer = document.getElementById('page-login-register');
const appShellContainer = document.getElementById('app-shell');
const mainHeader = document.getElementById('main-header');
const mainContent = document.getElementById('app-main-content');
const bottomNav = document.getElementById('bottom-nav');

let currentUser = null;
let userData = {};
let platformSettings = {};
let activeChart = null;
let userDataUnsubscribe = null;
let platformSettingsUnsubscribe = null;

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
            console.warn("Documento de configurações não encontrado. Usando valores padrão.");
            platformSettings = {
                siteName: "Byte Capital",
                logoSvg: `<svg width="100" height="100" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="#FFD600" d="M403.5 512l108.5-108.5 108.5 108.5-108.5 108.5z"/><path fill="#FFD600" d="M285 512l108.5-108.5L502 512l-108.5 108.5z"/><path fill="#FFD600" d="M739 512L630.5 403.5 522 512l108.5 108.5z"/><path fill="#FFD600" d="M512 204.8l108.5 108.5-108.5 108.5-108.5-108.5z"/><path fill="#FFD600" d="M512 819.2L403.5 710.7l108.5-108.5 108.5 108.5z"/></svg>`,
                mainBgColor: "#000000", cardBgColor: "#1A1A1A", primaryColor: "#00E676",
                highlightColor: "#FFD600", primaryTextColor: "#FFFFFF", secondaryTextColor: "#757575",
                whatsappLink: "#", telegramLink: "#"
            };
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
    const path = window.location.hash.slice(1) || (currentUser ? 'dashboard' : 'login');
    
    if (!currentUser && !['login', 'register'].includes(path)) {
        window.location.hash = 'login';
        return;
    }

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const activePage = document.getElementById(`page-${path}`);
    if (activePage) {
        activePage.classList.add('active');
    }

    switch (path) {
        case 'login': renderLogin(); break;
        case 'register': renderRegister(); break;
        case 'dashboard': renderDashboard(); break;
        case 'operations': renderOperations(); break;
        case 'support': renderSupport(); break;
        case 'indications': renderIndications(); break;
        case 'profile': renderProfile(); break;
        case 'notifications': renderNotifications(); break;
    }

    if (currentUser) {
        updateNavLinks(path);
        renderHeader();
    }
};

// ===================================================================================
// FUNÇÕES DE RENDERIZAÇÃO E LÓGICA DE UI
// ===================================================================================

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

function showAuthPages() {
    loginRegisterContainer.classList.remove('hidden');
    appShellContainer.classList.add('hidden');
}

function showAppShell() {
    loginRegisterContainer.classList.add('hidden');
    appShellContainer.classList.remove('hidden');
}

function renderHeader() {
    const adminButton = userData.role === 'admin' ? `<a href="../admin/dashboard.html" class="bg-purple-600 p-2 rounded-lg text-xs font-bold">Painel Admin</a>` : '';
    mainHeader.innerHTML = `
        <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8">${platformSettings.logoSvg || ''}</div>
                <span class="font-bold text-lg">${platformSettings.siteName || ''}</span>
            </div>
            <div class="flex items-center space-x-2">
                ${adminButton || ''}
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
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const errorP = document.getElementById('form-error');
        errorP.textContent = '';
        try { await loginUser(e.target.email.value, e.target.password.value); } 
        catch (error) { errorP.textContent = 'Email ou senha inválidos.'; }
    });
}

function renderRegister() {
    const page = document.getElementById('page-register');
    page.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen">
            <div class="w-full max-w-sm p-8 space-y-6">
                <h1 class="text-2xl font-bold text-center">Criar Conta</h1>
                <form id="register-form" class="space-y-4">
                    <input type="text" id="name" placeholder="Nome completo" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="email" id="email" placeholder="Email" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="tel" id="phone" placeholder="WhatsApp" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <input type="password" id="password" placeholder="Senha" required class="w-full px-4 py-3 text-white bg-[var(--cor-fundo-cartao)] border border-[var(--cor-borda)] rounded-lg">
                    <button type="submit" class="w-full py-3 text-lg font-bold text-black bg-[var(--cor-destaque)] rounded-lg">Criar conta</button>
                    <p class="text-sm text-center">Já tem conta? <a href="#login" class="font-medium text-[var(--cor-destaque)]">Login</a></p>
                    <p id="form-error" class="text-red-500 text-sm text-center h-4"></p>
                </form>
            </div>
        </div>`;
    document.getElementById('register-form').addEventListener('submit', async e => {
        e.preventDefault();
        const errorP = document.getElementById('form-error');
        errorP.textContent = '';
        try { await registerUser(e.target.name.value, e.target.email.value, e.target.password.value, e.target.phone.value); } 
        catch (error) { errorP.textContent = 'Erro ao criar conta. Tente novamente.'; }
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
                <a href="#operations" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg><span class="text-xs">Operações</span></a>
                <a href="#support" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span class="text-xs">Suporte</span></a>
                <a href="#profile" class="flex flex-col items-center space-y-1 text-[var(--cor-texto-secundario)]"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg><span class="text-xs">Perfil</span></a>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-4">
                <div class="flex justify-between">
                    <div><p class="text-sm text-[var(--cor-texto-secundario)]">Saldo</p><p class="text-2xl font-bold">${formatCurrency(userData.balanceBRL)}</p></div>
                    <div><p class="text-sm text-[var(--cor-texto-secundario)]">Saldo para saque</p><p class="text-2xl font-bold">${formatCurrency(userData.balanceBRL)}</p></div>
                </div>
                <div><p class="text-sm text-[var(--cor-texto-secundario)]">Total investido</p><p class="text-2xl font-bold">${formatCurrency(0)}</p></div>
                <div class="grid grid-cols-2 gap-4 pt-2">
                    <button class="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[var(--cor-primaria)] to-green-400">Depositar</button>
                    <button class="w-full py-3 rounded-lg font-semibold bg-gray-700">Sacar</button>
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
    document.querySelectorAll('.invest-btn').forEach(btn => btn.addEventListener('click', () => renderInvestmentModal(btn.dataset.asset)));
}

function renderInvestmentModal(assetName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[var(--cor-fundo-cartao)] p-6 rounded-2xl w-11/12 max-w-sm space-y-4">
            <h2 class="text-xl font-bold text-center">Investir em ${assetName}</h2>
            <div class="grid grid-cols-3 gap-2">
                <button class="value-btn bg-gray-700 py-2 rounded-lg">R$ 50</button>
                <button class="value-btn bg-gray-700 py-2 rounded-lg">R$ 100</button>
                <button class="value-btn bg-gray-700 py-2 rounded-lg">R$ 200</button>
            </div>
            <input type="number" id="invest-amount" placeholder="Digite o valor aqui" class="w-full px-4 py-3 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
            <p class="text-xs text-[var(--cor-texto-secundario)]">Valor mínimo permitido: R$ 10,00</p>
            <button class="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[var(--cor-primaria)] to-green-400">Investir Agora</button>
            <button id="close-modal-btn" class="w-full py-2 text-center text-sm text-[var(--cor-texto-secundario)]">Cancelar</button>
        </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#close-modal-btn').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.value-btn').forEach(btn => btn.addEventListener('click', () => {
        document.getElementById('invest-amount').value = btn.textContent.replace('R$ ', '');
    }));
}

function renderOperations() {
    const page = document.getElementById('page-operations');
    page.innerHTML = `<div class="space-y-6">
        <h1 class="text-2xl font-bold">Operações</h1>
        <div class="bg-[var(--cor-fundo-cartao)] p-4 rounded-2xl">
            <canvas id="operations-chart"></canvas>
        </div>
        <div class="text-center text-[var(--cor-texto-secundario)]">Nenhuma operação encontrada.</div>
    </div>`;
    renderOperationsChart();
}

function renderOperationsChart() {
    const ctx = document.getElementById('operations-chart').getContext('2d');
    if (activeChart) activeChart.destroy();
    activeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Performance', data: [100, 120, 110, 140, 130, 150],
                borderColor: 'var(--cor-primaria)', tension: 0.4,
            }]
        },
        options: { plugins: { legend: { display: false } } }
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

function renderIndications() {
    const page = document.getElementById('page-indications');
    page.innerHTML = `
        <div class="space-y-6">
            <h1 class="text-2xl font-bold">Programa de Indicações</h1>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl text-center space-y-2">
                <p class="text-lg">Convide amigos e ganhe <span class="font-bold text-[var(--cor-destaque)]">R$ 20,00</span> por cada indicação!</p>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl">
                <div class="flex justify-between items-center">
                    <div><p class="text-sm text-[var(--cor-texto-secundario)]">Carteira de Comissão</p><p class="text-2xl font-bold">${formatCurrency(userData.referralBalance)}</p></div>
                    <button class="font-semibold text-[var(--cor-primaria)]">Sacar</button>
                </div>
            </div>
             <div class="bg-[var(--cor-fundo-cartao)] p-4 rounded-2xl">
                <p class="text-sm text-[var(--cor-texto-secundario)] mb-2">O seu link de indicação</p>
                <div class="flex items-center bg-gray-900 p-2 rounded-lg">
                    <input type="text" readonly value="${window.location.origin}${window.location.pathname}#register?ref=${currentUser.uid}" class="bg-transparent w-full text-white focus:outline-none text-sm">
                    <button class="bg-[var(--cor-primaria)] px-4 py-1.5 rounded-md font-semibold text-sm">Copiar</button>
                </div>
            </div>
        </div>`;
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
                <p class="text-sm"><span class="text-[var(--cor-texto-secundario)]">Email:</span> ${userData.email}</p>
                <p class="text-sm"><span class="text-[var(--cor-texto-secundario)]">Chave Pix:</span> ${userData.pixInfo ? 'Cadastrada' : 'Não informada'}</p>
            </div>
            <div class="bg-[var(--cor-fundo-cartao)] p-5 rounded-2xl space-y-3">
                <h2 class="font-bold">Cadastrar CPF</h2>
                <p class="text-xs text-[var(--cor-texto-secundario)]">Para receber os seus pagamentos, precisamos do seu CPF como chave PIX.</p>
                <input type="text" placeholder="Digite seu CPF (apenas números)" class="w-full px-4 py-3 text-white bg-gray-700 border border-[var(--cor-borda)] rounded-lg">
                <button class="w-full py-2 rounded-lg font-semibold bg-[var(--cor-primaria)]">Validar CPF</button>
            </div>
        </div>`;
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
}

function renderNotifications() {
    const page = document.getElementById('page-notifications');
    page.innerHTML = `<div class="space-y-6"><h1 class="text-2xl font-bold">Notificações</h1><p class="text-center text-[var(--cor-texto-secundario)]">Nenhuma notificação nova.</p></div>`;
}

function updateNavLinks(currentPath) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const isActive = link.getAttribute('href').substring(1) === currentPath;
        link.classList.toggle('active', isActive);
    });
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', initializeApp);

