// =========================================================================
// 1. CONFIGURAÇÕES INICIAIS E MÓDULOS FIREBASE
// =========================================================================
//#region [1] FIREBASE CONFIG & IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    serverTimestamp, 
    doc, 
    setDoc, 
    getDoc,
    query,
    where,
    writeBatch,
    arrayUnion,
    arrayRemove,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { 
    getStorage, 
    ref, 
    uploadString, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpC48HP55sttgPheThE1PUiQeoKV-Hn-s",
    authDomain: "tabuadafacil-ed9de.firebaseapp.com",
    projectId: "tabuadafacil-ed9de",
    storageBucket: "tabuadafacil-ed9de.firebasestorage.app",
    messagingSenderId: "541054057671",
    appId: "1:541054057671:web:66cf7fa31605aeb45812e2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
//#endregion


// =========================================================================
// 2. CONSTANTES, VARIÁVEIS GLOBAIS E ESTRUTURAS DE DADOS
// =========================================================================
//#region [2] ESTADOS GLOBAIS E CATÁLOGOS
const AVATARES_TABY = {
    padrao: 'icon144.png',
    mago: 'tabyMago512.png',
    astronauta: 'tabyAstronauta512.png',
    guerreira: 'tabyGuerreira512.png',
    rainha: 'tabyRainha512.png',
    rei: 'tabyRei512.png'
};

const CATALOGO_TABY = [
    { id: 'padrao',     nome: 'Robô',       img: 'icon144.png',           premium: false },
    { id: 'mago',       nome: 'Mago',       img: 'tabyMago512.png',       premium: false },
    { id: 'astronauta', nome: 'Astronauta', img: 'tabyAstronauta512.png', premium: true },
    { id: 'guerreira',  nome: 'Guerreira',  img: 'tabyGuerreira512.png',  premium: true },
    { id: 'rainha',     nome: 'Rainha',     img: 'tabyRainha512.png',     premium: true },
    { id: 'rei',        nome: 'Rei',        img: 'tabyRei512.png',        premium: true }
];

let tempoInicioSessao = Date.now();
let avisoPausaExibido = false;
let tipoJogoSelecionado = 'treino'; // Unificado para 'treino'
let operacoesSelecionadas = ['multiplicacao'];
let filaOperacoesJogo = [];
let usuarioAtualLogado = null;
let dadosRanking = [];
let dadosRankingTempo = [];
let respostaCorretaGlobal = 0;
let perguntaAtual = 1, totalPerguntas = 10, acertos = 0, erros = 0;
let opcoesAtuaisJogo = [];
let intervaloCronometro = null;
let tempoInicioMillis = 0;
let tempoRelampagoGlobalUltimo = 0;
let somAtivado = true;
let iniciandoJogoTrava = false;

let tipoTabuadaEstudo = 'multiplicacao';
let eventoInstalacao = null;
let respondendoTravado = false;
let somElementoGlobal = new Audio();

window.skinFormSelecionada = 'padrao';
window.perfilEmEdicaoId = null;
window.tempFotoBase64Personalizada = null;
let perfilParaExcluirTemp = null;

let inicioTempoQuestao = 0;
let fator1Atual = 0;
let fator2Atual = 0;
let dadosTrilhaUsuario = { maestriaContas: {} };
let faseAtualTrilha = null;

const mapaIds = { 
    multiplicacao: 'btn-op-mult', 
    divisao: 'btn-op-div', 
    adicao: 'btn-op-add', 
    subtracao: 'btn-op-sub', 
    insano: 'btn-op-insano' 
};

const SKINS_TABY = {
    'padrao': '🤖',
    'mago': '🧙‍♂️',
    'astronauta': '👨‍🚀',
    'guerreira': '⚔️',
    'rainha': '👑',
    'rei': '🤴'
};

const FASES_TRILHA = [
    { 
        id: '1', 
        titulo: "Mercúrio: Aquece-Cérebro", 
        icone: "🔥",
        lottie: "https://lottie.host/9e477610-8640-42b7-a36a-20fa94bfd0a5/1G3pP13L1l.json",
        ops: ["adicao", "subtracao"],
        curiosidade: "Mercúrio é o planeta mais próximo do Sol! Apesar de ser super quente de dia, à noite faz até -180°C porque não tem atmosfera para segurar o calor!"
    },
    { 
        id: '2', 
        titulo: "Vênus: O Dobro Magnético", 
        icone: "🌕",
        lottie: "https://lottie.host/1b590054-942b-4fa8-b220-d326ef6df4a5/N5M64r9M0g.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [2],
        curiosidade: "Vênus é o planeta mais quente do Sistema Solar e gira ao contrário! Lá, o Sol nasce no oeste e se põe no leste."
    },
    { 
        id: '3', 
        titulo: "Terra: O Triplo da Vida", 
        icone: "🌍",
        lottie: "https://lottie.host/d6b8ef3a-d66a-493e-9080-60b6bbbbd011/Q8Y3yOqM1k.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [3],
        curiosidade: "A Terra é o único lugar conhecido com água líquida e vida! Mais de 70% da superfície é coberta por oceanos."
    },
    { 
        id: '4', 
        titulo: "Cometa Halley: Desafio Veloz", 
        icone: "☄️",
        lottie: "https://lottie.host/67bc9581-81d3-46fb-a037-12497d51921f/Cq6N0Jp5p9.json",
        boss: true, 
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [2, 3],
        curiosidade: "Cometas são 'bolas de neve sujas' de gelo e poeira. O famoso Cometa Halley passa perto da Terra só a cada 75 anos!"
    },
    { 
        id: '5', 
        titulo: "Marte: O Quadrado Vermelho", 
        icone: "🔴",
        lottie: "https://lottie.host/1b590054-942b-4fa8-b220-d326ef6df4a5/N5M64r9M0g.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [4],
        curiosidade: "Marte é vermelho por causa do óxido de ferro (ferrugem). Ele abriga o Monte Olimpo, o maior vulcão do Sistema Solar!"
    },
    { 
        id: '6', 
        titulo: "Estação Estelar 5", 
        icone: "🛰️",
        lottie: "https://lottie.host/f88bfa2e-2e00-47b2-8488-82a1739c4a8f/eT7I0R2vS7.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [5],
        curiosidade: "A Estação Espacial viaja a 28.000 km/h! Astronautas dão a volta na Terra a cada 90 minutos e veem 16 por do sol por dia."
    },
    { 
        id: '7', 
        titulo: "Cinturão de Asteroides", 
        icone: "🪨",
        lottie: "https://lottie.host/9e477610-8640-42b7-a36a-20fa94bfd0a5/1G3pP13L1l.json",
        boss: true, 
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [2, 3, 4, 5],
        curiosidade: "Guarda milhões de rochas espaciais que sobraram da formação do Sistema Solar há 4.6 bilhões de anos!"
    },
    { 
        id: '8', 
        titulo: "Júpiter: Gigante do 6 e 7", 
        icone: "🟠",
        lottie: "https://lottie.host/1b590054-942b-4fa8-b220-d326ef6df4a5/N5M64r9M0g.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [6, 7],
        curiosidade: "É tão gigantesco que caberiam 1.300 Terras dentro dele! A Grande Mancha Vermelha é uma tempestade maior que a Terra."
    },
    { 
        id: '9', 
        titulo: "Saturno: Os Anéis do 8 e 9", 
        icone: "🪐",
        lottie: "https://lottie.host/9d81643c-671e-4518-a6d1-80bb01ffbb1e/qTfI13TfL8.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [8, 9],
        curiosidade: "Seus anéis são feitos de gelo e rocha. Saturno é tão leve que flutuaria em uma banheira gigante de água!"
    },
    { 
        id: '10', 
        titulo: "Sonda Europa: Portal do 10", 
        icone: "🧊",
        lottie: "https://lottie.host/f88bfa2e-2e00-47b2-8488-82a1739c4a8f/eT7I0R2vS7.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [10],
        curiosidade: "Europa é uma lua congelada de Júpiter. Abaixo do gelo, cientistas acreditam que existe um oceano líquido gigante!"
    },
    { 
        id: '11', 
        titulo: "Urano: Tempestade Gelada", 
        icone: "🔵",
        lottie: "https://lottie.host/1b590054-942b-4fa8-b220-d326ef6df4a5/N5M64r9M0g.json",
        ops: ["multiplicacao", "divisao"], 
        filtroTabuada: [6, 7, 8, 9],
        curiosidade: "Urano gira totalmente 'deitado' de lado! Seus ventos congelantes ultrapassam 900 km/h."
    },
    { 
        id: '12', 
        titulo: "Netuno: Ventos de Mestre", 
        icone: "❄️",
        lottie: "https://lottie.host/1b590054-942b-4fa8-b220-d326ef6df4a5/N5M64r9M0g.json",
        ops: ["multiplicacao", "divisao", "adicao", "subtracao"],
        curiosidade: "É o planeta mais distante do Sol! Ocorrem lá os ventos mais rápidos do Sistema Solar, a quase 2.100 km/h."
    },
    { 
        id: '13', 
        titulo: "Agulheiro de Minhoca", 
        icone: "🌀",
        lottie: "https://lottie.host/8133efb1-7a2e-4b6e-b353-d14d24177651/B2D0t7U5aX.json",
        boss: true, 
        ops: ["multiplicacao", "divisao", "adicao", "subtracao"],
        curiosidade: "São atalhos teóricos no espaço-tempo que permitiriam viajar milhões de anos-luz em apenas alguns segundos!"
    },
    { 
        id: '14', 
        titulo: "Núcleo Solar: Fusão de Energia", 
        icone: "☀️",
        lottie: "https://lottie.host/21142bc1-19d2-4e44-8fa7-889d81d2e5a2/F5p3qO7G1n.json",
        boss: true, 
        ops: ["multiplicacao", "divisao", "adicao", "subtracao"],
        curiosidade: "O Sol contém 99,8% de toda a massa do Sistema Solar! No núcleo, a temperatura chega a 15 milhões de graus Celsius!"
    },
    { 
        id: '15', 
        titulo: "Nébula Alpha: Expressões", 
        icone: "💎",
        lottie: "https://lottie.host/a9807567-2703-4903-b0f1-46014e38e1b3/R0P6yL2M1l.json",
        especial: true, 
        expressao: true, 
        ops: ["expressao"],
        curiosidade: "Nébulas são nuvens gigantes de gás e poeira no espaço onde nascem novas estrelas. É o berço do universo!"
    }
];

const listaCuriosidades = [
    "🏺 Há mais de 4.000 anos, os babilônios já registravam tabuadas em tábuas de argila!",
    "📐 Na Europa, a tabuada é conhecida tradicionalmente como 'Tabela de Pitágoras'.",
    "📜 Na China Antiga, estudantes aprendiam a tabuada gravada em tiras de bambu.",
    "✍️ A palavra 'tabuada' vem do latim *tabula* (tábua).",
    "🧠 O cérebro treina conexões neurais ao praticar cálculo mental rápido todos os dias.",
    "🔢 O número zero (0) foi inventado na Índia e revolucionou toda a matemática mundial.",
    "🐝 As abelhas constroem seus favos em formato hexagonal porque essa é a forma geométrica mais eficiente em uso de cera e espaço.",
    "🍕 A famosa proporção áurea (número de ouro, 1,618) aparece em conchas, galáxias e até no formato de fatias de pizza.",
    "⏱️ O símbolo do infinito (∞) foi criado pelo matemático John Wallis em 1655.",
    "🎲 O matemático Blaise Pascal inventou a roleta e ajudou a criar a teoria das probabilidades tentando resolver um jogo de dados.",
    "🌍 Se você dobrar uma folha de papel comum 42 vezes ao meio, a espessura dela chegará até a Lua!",
    "🔢 Os algarismos que usamos hoje (1, 2, 3...) são chamados de indo-arábicos, mas foram popularizados na Europa por Fibonacci.",
    "🧩 O Cubo de Rubik é o brinquedo mais vendido do mundo, com mais de 350 milhões de unidades comercializadas.",
    "📐 A palavra 'geometria' significa literalmente 'medida da Terra' em grego antigo.",
    "⚡ Os romanos não tinham um símbolo numérico para representar o zero.",
    "🔍 O número 9 tem uma simetria mágica: qualquer múltiplo de 9, quando somado seus algarismos individualmente, sempre resulta em 9.",
    "🚀 O computador que levou o homem à Lua (Apollo 11) tinha menos poder de processamento do que um relógio smartwatch atual.",
    "📊 A estatística moderna nasceu de estudos sobre jogos de azar e apostas no século XVII.",
    "📏 O metro foi definido originalmente em 1791 como a dezmilionésima parte da distância entre o Pólo Norte e a Linha do Equador.",
    "💡 Pitágoras fundou uma sociedade secreta filosófica e matemática onde o feijão era proibido por motivos místicos.",
    "⭐ Existem mais estrelas no universo observável do que grãos de areia em todas as praias da Terra.",
    "🔢 O número 7 é consistentemente votado em pesquisas globais como o número favorito da humanidade.",
    "🌀 O padrão de crescimento dos girassóis e pinhas segue rigorosamente a Sequência de Fibonacci.",
    "🏛️ Os antigos egípcios usavam frações baseadas apenas em somas de unitárias (como 1/2, 1/3).",
    "🏆 O prêmio Nobel não possui uma categoria de Matemática; a maior honra da área é a Medalha Fields."
];

const listaDicas = [
    "Regra do Zero: Qualquer número multiplicado por zero dá zero!",
    "Regra do Um: Todo número multiplicado por 1 continua igual.",
    "Truque do 9: Na tabuada do 9, a soma dos dois dígitos do resultado é sempre 9!",
    "O Inverso: Se 6 × 7 = 42, então 42 ÷ 6 = 7!",
    "Dominar a tabuada reduz o esforço mental em provas e concursos.",
    "Multiplicar por 5: Basta multiplicar por 10 e dividir por 2 (Ex: 8 × 5 = 80 ÷ 2 = 40).",
    "Multiplicar por 11 (1 a 9): Repita o algarismo no meio (Ex: 4 × 11 = 44).",
    "Soma Rápida por 9 ou 19: Some 10 ou 20 e subtraia 1 (Ex: 34 + 9 = 34 + 10 - 1 = 43).",
    "Subtração por Compensação: Para subtrair 9, subtraia 10 e depois some 1.",
    "Tabuada do 4: Basta dobrar o número duas vezes seguidas (Ex: 6 × 4 = o dobro de 6 é 12, o dobro de 12 é 24).",
    "Tabuada do 12: Multiplique por 10 e some o dobro do mesmo número (Ex: 7 × 12 = 70 + 14 = 84).",
    "Estimativa: Sempre estime o resultado antes de calcular para evitar erros grosseiros.",
    "Treino Diário: Fazer 5 minutos de cálculo mental por dia melhora a agilidade.",
    "Quadrados terminados em 5: Multiplique o primeiro pelo sucessor e coloque 25 no final (Ex: 35² = 3×4 = 1225).",
    "Regra de Divisão por 4: Divida o número por 2 duas vezes consecutivas.",
    "Ordem das Parcelas: Agrupe somas que dão dezenas redondas (ex: 7 + 8 + 3 = 7 + 3 + 8 = 18).",
    "Multiplicar por 15: Multiplique por 10 e some a metade desse valor (Ex: 6 × 15 = 60 + 30 = 90).",
    "Prova Real: Inverta a operação para conferir os resultados.",
    "Porcentagem Fácil: Para achar 10%, desloque a vírgula uma casa para a esquerda.",
    "Achar 50%: Divida o número diretamente por 2.",
    "Achar 25%: Divida o número por 4.",
    "No Jogo Relâmpago: Não fique travado em uma conta difícil; elimine as alternativas óbvias.",
    "Memória de Longo Prazo: Praticar diariamente fixa a tabuada na memória.",
    "Visualização: Imagine quantidades físicas ao aprender multiplicação.",
    "Confiança: O erro faz parte do aprendizado; cada erro corrigido fortalece o cérebro!"
];

const explicacoesTaby = {
    relampago: {
        titulo: "Modo Relâmpago ⚡",
        texto: "Neste modo o tempo conta! Responda o mais rápido que puder. Cada erro adiciona <b>+3 segundos de penalidade</b> no seu tempo final. Fique atento e conquiste o topo do Ranking Mundial por operação!"
    },
    treino: {
        titulo: "Modo Treino Livre 📊",
        texto: "Ideal para praticar no seu tempo! Aqui não há pressão de relógio. Você pode escolher uma ou mais operações simultâneas para exercitar o cérebro e somar acertos no Ranking Geral."
    },
    insano: {
        titulo: "Modo Insano 🔥",
        texto: "O desafio definitivo! São 12 questões misturando <b>Multiplicação, Divisão, Adição e Subtração</b>. Apenas para quem domina todas as tabuadas!"
    },
    trilha: {
        titulo: "Trilha Espacial 🚀",
        texto: "Viaje pelos planetas e <b>garanta a memorização completa da tabuada!</b> Nosso algoritmo inteligente analisa seus acertos e velocidade, exigindo <b>85% de Maestria</b> para liberar o próximo nível. Dessa forma, ao concluir a jornada, <b>seu raciocínio estará rápido e a tabuada gravada para sempre na memória!</b> 🧠⚡"
    },
    ranking: {
        titulo: "Como funciona o Ranking? 🏆",
        texto: "No <b>Ranking Treino</b>, o foco é a quantidade de <b>questões resolvidas</b> e <b>acertos</b>. No <b>Ranking Relâmpago</b>, o que vale é o seu <b>menor tempo</b> em cada operação individual ou no Geral!"
    },
    estudo: {
        titulo: "📚 Modo Estudo (Tabuadas de 1 a 10)",
        texto: "Aqui você pode consultar a tabuada completa das 4 operações (Adição, Subtração, Multiplicação e Divisão). Escolha o número de 1 a 10 para ver a lista completa e tirar suas dúvidas!"
    },
    tabuada: {
        titulo: "📚 Modo Estudo (Tabuadas de 1 a 10)",
        texto: "Aqui você pode consultar a tabuada completa das 4 operações (Adição, Subtração, Multiplicação e Divisão). Escolha o número de 1 a 10 para ver a lista completa e tirar suas dúvidas!"
    }
};

const TABYS_PADRAO = [
    { id: "taby_padrao", url: "icon-512.png", nome: "Robô" },
    { id: "taby_astronauta", url: "tabyAstronauta512.png", nome: "Astronauta" },
    { id: "taby_guerreira", url: "tabyGuerreira512.png", nome: "Guerreira" },
    { id: "taby_mago", url: "tabyMago512.png", nome: "Mago" },
    { id: "taby_rainha", url: "tabyRainha512.png", nome: "Rainha" },
    { id: "taby_rei", url: "tabyRei512.png", nome: "Rei" }
];

window.galeriaFotosUsuario = []; 
window.avatarSelecionadoAtual = "taby_padrao"; 
window.cropperInstancia = null;
window.planoSelecionadoKey = 'pro_trimestral';
window.tipoExclusaoAtual = 'perfil'; 
window.tipoRankingAtual = 'treino';

let instanciaGraficoPrecisao = null;
let instanciaGraficoVolume = null;
let timerTransicaoQuestao = null;
//#endregion


// =========================================================================
// 3. AUTENTICAÇÃO, REGISTRO E CONTROLE DE SESSÃO
// =========================================================================
//#region [3] AUTENTICAÇÃO E SESSÃO
onAuthStateChanged(auth, async (user) => {
    const headerTopo = document.querySelector('.header-topo-global');
    const telaAuth = document.getElementById('tela-autenticacao');

    if (user) {
        usuarioAtualLogado = user;
        if (headerTopo) headerTopo.classList.remove('oculto');
        if (telaAuth) {
            telaAuth.style.display = 'none';
            telaAuth.classList.add('oculto');
        }

        let primeiroNome = 'JOGADOR';
        if (user.displayName) {
            primeiroNome = user.displayName.trim().split(' ')[0].toUpperCase();
        }

        const fotoGoogle = user.photoURL || null;
        
        if (typeof window.carregarOuCriarPerfilPrincipal === 'function') {
            window.carregarOuCriarPerfilPrincipal(user.uid, primeiroNome, user.email, fotoGoogle);
        }

        window.irParaPainelJogo();
    } else {
        usuarioAtualLogado = null;
        localStorage.removeItem('tabuada_perfil_selecionado');
        localStorage.removeItem('perfil_ativo_id');
        if (headerTopo) headerTopo.classList.add('oculto');
        window.mudarTela('tela-autenticacao');
    }
});

window.carregarOuCriarPerfilPrincipal = function(uid, nome, email, fotoUrl) {
    let perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    let perfilAtivo = perfisLocais.find(p => p.uid === uid || p.id === uid || p.perfilId === uid);

    if (!perfilAtivo) {
        perfilAtivo = {
            id: 'perfil_' + uid,
            perfilId: 'perfil_' + uid,
            uid: uid,
            nome: nome || 'JOGADOR',
            email: email || '',
            fotoUrl: fotoUrl || 'icon144.png',
            skin: 'padrao',
            plano: 'gratis'
        };
        perfisLocais.push(perfilAtivo);
        localStorage.setItem('usuario_perfis', JSON.stringify(perfisLocais));
    }

    localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfilAtivo));
    localStorage.setItem('perfil_ativo_id', perfilAtivo.perfilId || perfilAtivo.id);

    if (typeof window.atualizarHeaderPerfilAtivo === 'function') {
        window.atualizarHeaderPerfilAtivo();
    }
};

window.fazerLoginGoogle = async function() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        let primeiroNome = 'JOGADOR';
        if (user.displayName) {
            primeiroNome = user.displayName.trim().split(' ')[0].toUpperCase();
        }
        if (primeiroNome.length > 10) {
            primeiroNome = primeiroNome.substring(0, 10);
        }

        const fotoGoogle = user.photoURL || null;
        window.carregarOuCriarPerfilPrincipal(user.uid, primeiroNome, user.email, fotoGoogle);
        window.mudarTela('tela-painel-jogo');
    } catch (error) {
        console.error("Erro no login com Google:", error);
        alert("Falha ao entrar com o Google.");
    }
};

window.fazerLoginFirebase = function() {
    tocarSom('clique');
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();
    
    if (!email || !senha) return alert("Preencha e-mail e senha!");

    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            window.irParaPainelJogo();
        })
        .catch(() => alert("E-mail ou senha incorretos!"));
};

window.realizarCadastroFirebase = async function() {
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value.trim();
    let nick = document.getElementById('cad-nick').value.trim().toUpperCase() || 'JOGADOR';

    if (nick.length > 15) {
        nick = nick.substring(0, 15);
    }

    if (!email || !senha) {
        alert("Preencha e-mail e senha!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        await updateProfile(user, { displayName: nick });
        window.carregarOuCriarPerfilPrincipal(user.uid, nick, email);
        window.mudarTela('tela-painel-jogo');
    } catch (error) {
        console.error("Erro no cadastro:", error);
        alert("Erro ao cadastrar: " + error.message);
    }
};

window.alternarFormularios = function(alvo) {
    tocarSom('clique');
    const formLogin = document.getElementById('form-login');
    const formCad = document.getElementById('form-cadastro');
    if (formLogin) formLogin.classList.toggle('oculto', alvo === 'cadastro');
    if (formCad) formCad.classList.toggle('oculto', alvo !== 'cadastro');
};

window.sairDaConta = function() {
    tocarSom('clique');
    signOut(auth);
};

async function reautenticarResponsavel(senhaDigitada = null) {
    const user = auth.currentUser;
    if (!user) throw new Error("Sessão expirada. Faça login novamente.");

    const providerId = user.providerData[0]?.providerId;

    if (providerId === 'google.com') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } else if (providerId === 'password') {
        if (!senhaDigitada) {
            throw new Error("Digite a senha da sua conta para autorizar.");
        }
        const credential = EmailAuthProvider.credential(user.email, senhaDigitada);
        await reauthenticateWithCredential(user, credential);
    }
}
//#endregion


// =========================================================================
// 4. GERENCIAMENTO DE PERFIL, GALERIA E AVATARES
// =========================================================================
//#region [4] PERFIS, GALERIA E AVATARES

window.obterPlanoAtivo = function() {
    const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
    const planoSalvo = localStorage.getItem('usuario_plano') || perfilAtivo.plano || 'gratis';
    return planoSalvo.toLowerCase();
};

window.definirPlanoAtivo = function(novoPlano) {
    const planoTratado = (novoPlano || 'gratis').toLowerCase();
    
    localStorage.setItem('usuario_plano', planoTratado);
    
    let perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
    perfilAtivo.plano = planoTratado;
    localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfilAtivo));

    window.sincronizarInterfaceGlobalPlano();
};

window.sincronizarInterfaceGlobalPlano = function() {
    let plano = 'free';
    if (typeof window.obterPlanoAtivo === 'function') {
        plano = window.obterPlanoAtivo();
    } else {
        const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
        plano = localStorage.getItem('usuario_plano') || perfilAtivo.plano || 'free';
    }
    plano = String(plano).toLowerCase().trim();

    const ehPago = (plano === 'pro' || plano === 'premium');

    const elTopo = document.getElementById('badge-status-pro-topo') || document.querySelector('.badge-status-pro-topo');
    if (elTopo) {
        if (ehPago) {
            const icone = (plano === 'pro') ? '💎' : '👑';
            elTopo.innerHTML = `${icone} PLANO ${plano.toUpperCase()}`;
            elTopo.style.borderColor = (plano === 'pro') ? '#38bdf8' : '#ffd700';
            elTopo.style.color = (plano === 'pro') ? '#38bdf8' : '#ffd700';
            elTopo.style.background = (plano === 'pro') ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 215, 0, 0.15)';
        } else {
            elTopo.innerHTML = '⚡ SEJA PRO';
            elTopo.style.borderColor = '#38bdf8';
            elTopo.style.color = '#38bdf8';
            elTopo.style.background = 'rgba(56, 189, 248, 0.15)';
        }
    }

    const elIconeVida = document.getElementById('icone-vida-hud');
    const elContadorVidas = document.getElementById('contador-vidas-texto');
    const saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);

    if (elContadorVidas && elIconeVida) {
        if (ehPago) {
            elIconeVida.innerText = (plano === 'pro') ? '💎' : '👑';
            elContadorVidas.innerText = '∞';
        } else {
            elIconeVida.innerText = '❤️';
            elContadorVidas.innerText = saldoVidas;
        }
    }

    const btnVideo = document.getElementById('btn-assistir-ad-vidas');
    const btnRelatorio = document.getElementById('btn-abrir-relatorio');
    const elTimer = document.getElementById('display-timer-vidas');

    if (ehPago) {
        if (btnVideo) btnVideo.style.display = 'none';
        if (elTimer) elTimer.style.display = 'none';
        if (btnRelatorio) btnRelatorio.style.display = 'inline-flex';
    } else {
        if (btnVideo) btnVideo.style.display = 'inline-flex';
        if (elTimer) elTimer.style.display = (saldoVidas < 5) ? 'inline-flex' : 'none';
        if (btnRelatorio) btnRelatorio.style.display = 'none';
    }

    const elPlanoModal = document.getElementById('display-plano-conta');
    if (elPlanoModal) {
        elPlanoModal.innerText = ehPago ? plano.toUpperCase() : 'FREE';
        elPlanoModal.style.borderColor = ehPago ? (plano === 'pro' ? '#38bdf8' : '#ffd700') : '#94a3b8';
        elPlanoModal.style.color = ehPago ? (plano === 'pro' ? '#38bdf8' : '#ffd700') : '#94a3b8';
        elPlanoModal.style.background = ehPago ? (plano === 'pro' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 215, 0, 0.15)') : 'rgba(148, 163, 184, 0.15)';
    }

    if (typeof window.atualizarHUDVidasPartida === 'function') {
        window.atualizarHUDVidasPartida();
    }
};

window.atualizarHeaderPerfilAtivo = function() {
    const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
    const imgHeader = document.getElementById('header-foto-perfil');

    if (perfilAtivo && imgHeader) {
        const fotoUrl = perfilAtivo.fotoUrlPersonalizada || perfilAtivo.fotoUrl || 'icon144.png';
        imgHeader.src = fotoUrl;
    }
};

window.abrirEdicaoPerfil = async function() {
    if (typeof window.tocarSom === 'function') {
        window.tocarSom('clique');
    }

    const modalForm = document.getElementById('form-perfil-modal');
    const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};

    let planoAtual = 'free';
    if (typeof window.obterPlanoAtivo === 'function') {
        planoAtual = window.obterPlanoAtivo();
    } else {
        planoAtual = localStorage.getItem('usuario_plano') || perfilAtivo.plano || 'free';
    }
    planoAtual = String(planoAtual).toLowerCase();

    const inputNome = document.getElementById('input-nome-perfil');
    if (inputNome) inputNome.value = perfilAtivo.nome || '';

    const elEmail = document.getElementById('display-email-conta');
    if (elEmail) {
        const user = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;
        elEmail.innerText = (user && user.email) ? user.email : (perfilAtivo.email || 'Conta Local');
    }

    const elPlanoModal = document.getElementById('display-plano-conta');
    if (elPlanoModal) {
        const ehPago = (planoAtual === 'pro' || planoAtual === 'premium');
        elPlanoModal.innerText = ehPago ? planoAtual.toUpperCase() : 'FREE';
        elPlanoModal.style.borderColor = ehPago ? (planoAtual === 'pro' ? '#38bdf8' : '#ffd700') : '#94a3b8';
        elPlanoModal.style.color = ehPago ? (planoAtual === 'pro' ? '#38bdf8' : '#ffd700') : '#94a3b8';
        elPlanoModal.style.background = ehPago ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)';
    }

    if (modalForm) {
        modalForm.classList.remove('oculto');
        modalForm.style.display = 'block';
    }

    if (typeof window.renderizarGaleriaPerfil === 'function') {
        window.renderizarGaleriaPerfil();
    }
};

window.fecharEdicaoPerfil = function() {
    const modalForm = document.getElementById('form-perfil-modal');
    if (modalForm) {
        modalForm.classList.add('oculto');
        modalForm.style.display = 'none';
    }

    const modalPerfis = document.getElementById('tela-selecao-perfis');
    if (modalPerfis) {
        modalPerfis.classList.add('oculto');
        modalPerfis.style.display = 'none';
    }
};

window.salvarPerfil = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const inputNome = document.getElementById('input-nome-perfil');
    if (!inputNome) return;

    const nomeFormatado = inputNome.value.trim();
    if (!nomeFormatado) {
        alert("Por favor, digite um nome válido.");
        return;
    }

    let perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
    let perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];

    if (!perfilAtivo.perfilId && !perfilAtivo.id) {
        perfilAtivo.perfilId = 'perf_' + Date.now();
    }
    const idAtual = perfilAtivo.perfilId || perfilAtivo.id;

    perfilAtivo.perfilId = idAtual;
    perfilAtivo.nome = nomeFormatado;

    try {
        if (window.avatarSelecionadoAtual) {
            perfilAtivo.fotoUrl = window.avatarSelecionadoAtual;
            perfilAtivo.fotoUrlPersonalizada = window.avatarSelecionadoAtual;
            perfilAtivo.skin = 'personalizada';
        }

        const index = perfisLocais.findIndex(p => (p.perfilId || p.id) === idAtual);
        if (index !== -1) {
            perfisLocais[index] = Object.assign({}, perfisLocais[index], perfilAtivo);
        } else {
            perfisLocais.push(perfilAtivo);
        }

        localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfilAtivo));
        localStorage.setItem('usuario_perfis', JSON.stringify(perfisLocais));

        if (perfilAtivo.uid) {
            localStorage.setItem(`tabuada_perfil_${perfilAtivo.uid}`, JSON.stringify(perfilAtivo));
        }

        if (typeof window.atualizarInterfacePerfil === 'function') {
            window.atualizarInterfacePerfil(perfilAtivo);
        }
        if (typeof window.atualizarHeaderPerfilAtivo === 'function') {
            window.atualizarHeaderPerfilAtivo();
        }
        if (typeof window.atualizarNomeEAvatarInterface === 'function') {
            window.atualizarNomeEAvatarInterface();
        }
        if (typeof window.tocarSom === 'function') {
            window.tocarSom('conquista');
        }

        window.fecharEdicaoPerfil();

    } catch (err) {
        console.error("Erro ao salvar perfil:", err);
        alert("Erro ao salvar perfil localmente.");
    }
};

window.atualizarInterfacePerfil = function(perfil) {
    if (!perfil) return;

    window.nomeUsuarioAtual = perfil.nome || 'JOGADOR';

    const elNomeInicial = document.getElementById('display-nome-inicial');
    if (elNomeInicial) {
        elNomeInicial.innerText = perfil.nome || 'JOGADOR';
    }

    const elFotoHeader = document.getElementById('header-foto-perfil');
    const elAvatarEmoji = document.getElementById('header-avatar-mini');

    const skinAtual = perfil.skin || 'padrao';
    const fotoFinal = perfil.fotoUrlPersonalizada || perfil.fotoUrl || AVATARES_TABY[skinAtual] || AVATARES_TABY.padrao;

    window.avatarSelecionadoAtual = fotoFinal;

    if (elFotoHeader) {
        elFotoHeader.src = fotoFinal;
        elFotoHeader.style.display = 'block';
        elFotoHeader.style.backgroundImage = 'none';
        elFotoHeader.onerror = function() {
            this.src = AVATARES_TABY[skinAtual] || AVATARES_TABY.padrao;
            this.onerror = null;
        };
        
        if (elAvatarEmoji) {
            elAvatarEmoji.style.display = 'none';
        }
    }
};

window.atualizarNomeEAvatarInterface = function() {
    const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
    const nomeExibicao = perfilAtivo.nome || 'Estudante';

    const elNomeInicial = document.getElementById('display-nome-inicial');
    if (elNomeInicial) elNomeInicial.innerText = nomeExibicao;

    const elNomeRelatorio = document.getElementById('relatorio-nome-usuario');
    if (elNomeRelatorio) elNomeRelatorio.innerText = nomeExibicao;
};

window.atualizarSkinsGlobais = function(perfil) {
    if (!perfil) {
        const perfilStr = localStorage.getItem('tabuada_perfil_ativo');
        if (perfilStr) perfil = JSON.parse(perfilStr);
    }
    if (!perfil) return;

    const fotoUsuario = perfil.fotoUrlPersonalizada || perfil.fotoUrl || AVATARES_TABY[perfil.skin] || AVATARES_TABY.padrao;

    const imgHeader = document.getElementById('header-foto-perfil');
    if (imgHeader) {
        imgHeader.src = fotoUsuario;
        imgHeader.style.display = 'block';
    }

    const imgRelatorio = document.getElementById('relatorio-foto-perfil');
    if (imgRelatorio) {
        imgRelatorio.src = fotoUsuario;
    }

    const imgPainelDicas = document.querySelector('.painel-taby-img') || document.getElementById('img-taby-boas-vindas');
    if (imgPainelDicas) {
        imgPainelDicas.src = 'icon144.png';
    }
};

window.abrirTelaSelecaoPerfis = function() {
    const modalPerfis = document.getElementById('tela-selecao-perfis');
    if (!modalPerfis) return;

    if (typeof window.fecharPaywall === 'function') {
        window.fecharPaywall();
    }

    modalPerfis.style.display = 'flex';
    modalPerfis.classList.remove('oculto');

    const headerQuemVaiJogar = modalPerfis.querySelector('.header-perfis');
    const gridPerfis = document.getElementById('container-grid-perfis');
    const formPerfilModal = document.getElementById('form-perfil-modal');

    if (headerQuemVaiJogar) headerQuemVaiJogar.style.display = 'block';
    
    if (formPerfilModal) {
        formPerfilModal.style.display = 'none';
        formPerfilModal.classList.add('oculto');
    }

    if (gridPerfis) {
        gridPerfis.style.display = 'grid';
        gridPerfis.style.visibility = 'visible';
        gridPerfis.classList.remove('oculto');
        
        window.renderizarPerfis();
    }
};

window.tentarAdicionarNovoPerfil = function() {
    let perfis = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    const planoAtual = window.obterPlanoAtivo();

    if (planoAtual !== 'premium' && perfis.length >= 1) {
        if (document.getElementById('modal-paywall-planos')) {
            document.getElementById('modal-paywall-planos').style.display = 'flex';
            if (window.alternarAbaPaywall) {
                window.alternarAbaPaywall('familia');
            }
        }
        return;
    }

    if (perfis.length >= 3) {
        alert('O Plano PREMIUM Família permite até 3 perfis individuais.');
        return;
    }

    window.perfilEmEdicaoId = null;
    const titForm = document.getElementById('titulo-form-perfil');
    const inputNome = document.getElementById('input-nome-perfil');
    const formModal = document.getElementById('form-perfil-modal');
    const gridPerfis = document.getElementById('container-grid-perfis');

    if (titForm) titForm.innerText = 'Criar Novo Perfil';
    if (inputNome) inputNome.value = '';
    window.selecionarSkinForm('padrao');

    if (gridPerfis) gridPerfis.style.display = 'none';

    if (formModal) {
        formModal.style.display = 'block';
        formModal.classList.remove('oculto');
    }
};

window.fecharModalPerfil = function() {
    const modalPerfis = document.getElementById('tela-selecao-perfis');
    if (modalPerfis) modalPerfis.style.display = 'none';

    const formPerfilModal = document.getElementById('form-perfil-modal');
    if (formPerfilModal) formPerfilModal.style.display = 'none';

    const gridPerfis = document.getElementById('container-grid-perfis');
    if (gridPerfis) gridPerfis.style.display = 'grid';
};

window.renderizarPerfis = function() {
    const container = document.getElementById('container-grid-perfis');
    if (!container) return;
    container.style.display = 'grid';

    let perfis = JSON.parse(localStorage.getItem('usuario_perfis')) || [
        { id: 'perfil_1', perfilId: 'perfil_1', nome: 'Jogador 1', skin: 'padrao' }
    ];

    let htmlCompleto = '';

    perfis.forEach(perfil => {
        const iconSkin = SKINS_TABY[perfil.skin] || '🤖';
        const nomeTratado = (perfil.nome || 'Jogador').replace(/'/g, "\\'");
        const skinTratada = perfil.skin || 'padrao';
        const idUnico = perfil.perfilId || perfil.id;

        htmlCompleto += `
            <div class="card-perfil-item" onclick="window.selecionarPerfilAtivo('${idUnico}')" style="position: relative;">
                <button type="button" 
                        class="btn-editar-perfil-futurista" 
                        onclick="event.stopPropagation(); event.preventDefault(); window.abrirFormEditarPerfil('${idUnico}', '${nomeTratado}', '${skinTratada}');" 
                        title="Editar Perfil">
                    ✏️
                </button>
                <button type="button" 
                        class="btn-excluir-perfil-futurista" 
                        onclick="event.stopPropagation(); event.preventDefault(); window.solicitarExclusaoPerfil('${idUnico}', '${nomeTratado}');" 
                        title="Excluir Perfil" style="position: absolute; top: 5px; left: 5px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">
                    🗑️
                </button>
                <div class="avatar-circulo">${iconSkin}</div>
                <span class="nome-perfil">${perfil.nome}</span>
            </div>
        `;
    });

    htmlCompleto += `
        <div class="card-perfil-item card-perfil-add" onclick="window.tentarAdicionarNovoPerfil()">
            <div class="avatar-circulo" style="border-style: dashed; border-color: #ffd700;">
                <span class="icon-add">+</span>
            </div>
            <span class="nome-perfil" style="color: #ffd700;">Novo Perfil</span>
        </div>
    `;

    container.innerHTML = htmlCompleto;
};

window.selecionarPerfilAtivo = function(idPerfil) {
    if (typeof tocarSom === 'function') tocarSom('clique');

    let perfis = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    const perfilEncontrado = perfis.find(p => p.id === idPerfil || p.perfilId === idPerfil);

    if (perfilEncontrado) {
        localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfilEncontrado));
        localStorage.setItem('perfil_ativo_id', perfilEncontrado.perfilId || perfilEncontrado.id);
    } else {
        localStorage.setItem('perfil_ativo_id', idPerfil);
    }

    localStorage.setItem('tabuada_perfil_selecionado', 'true');

    const telaPerfis = document.getElementById('tela-selecao-perfis');
    if (telaPerfis) {
        telaPerfis.style.display = 'none';
        telaPerfis.classList.add('oculto');
    }

    window.atualizarHeaderPerfilAtivo();
    window.irParaPainelJogo();
};

window.abrirFormEditarPerfil = function(idPerfil, nomeAtual, skinAtual) {
    tocarSom('clique');

    let perfis = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    const perfil = perfis.find(p => p.id === idPerfil || p.perfilId === idPerfil);

    window.perfilEmEdicaoId = idPerfil;

    const formModal = document.getElementById('form-perfil-modal');
    const titForm = document.getElementById('titulo-form-perfil');
    const inputNome = document.getElementById('input-nome-perfil');

    if (titForm) titForm.innerText = 'Editar Perfil';
    if (inputNome) inputNome.value = nomeAtual || (perfil ? perfil.nome : '');

    const skinParaSelecionar = skinAtual || (perfil ? perfil.skin : 'padrao');
    window.selecionarSkinForm(skinParaSelecionar);

    if (formModal) {
        formModal.style.display = 'block';
        formModal.classList.remove('oculto');
    }
    if (typeof window.renderizarGaleriaPerfil === 'function') {
        window.renderizarGaleriaPerfil();
    }
};

window.uploadFotoPerfilEditar = function(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxTam = 250;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxTam) {
                    height = Math.round((height * maxTam) / width);
                    width = maxTam;
                }
            } else {
                if (height > maxTam) {
                    width = Math.round((width * maxTam) / height);
                    height = maxTam;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const fotoComprimidaBase64 = canvas.toDataURL('image/jpeg', 0.8);
            window.tempFotoBase64Personalizada = fotoComprimidaBase64;
            
            const elPreview = document.getElementById('form-foto-preview');
            if (elPreview) elPreview.src = fotoComprimidaBase64;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(arquivo);
};

window.selecionarSkinForm = function(skinKey, imgSrc, el) {
    const perfilStr = localStorage.getItem('tabuada_perfil_ativo');
    const perfil = perfilStr ? JSON.parse(perfilStr) : {};
    const planoAtivo = window.obterPlanoAtivo();

    const tabyObj = CATALOGO_TABY.find(t => t.id === skinKey);

    if (tabyObj && tabyObj.premium && planoAtivo === 'gratis') {
        if (typeof window.abrirPaywall === 'function') {
            window.abrirPaywall('Esta fantasia é exclusiva para assinantes PRO/PREMIUM!');
        } else if (typeof window.abrirTelaCheckoutPremium === 'function') {
            window.abrirTelaCheckoutPremium();
        } else {
            alert('Recurso exclusivo do Plano PRO/PREMIUM!');
        }
        return;
    }

    window.skinFormSelecionada = skinKey || 'padrao';

    document.querySelectorAll('#seletor-skins-taby .skin-item, .skin-item').forEach(item => {
        const atrb = item.getAttribute('data-skin');
        if (item === el || atrb === skinKey) {
            item.classList.add('active');
            item.style.border = '2px solid #38bdf8';
            item.style.background = 'rgba(56, 189, 248, 0.2)';
        } else {
            item.classList.remove('active');
            item.style.border = '1px solid #334155';
            item.style.background = '#1e293b';
        }
    });

    const elPreview = document.getElementById('form-foto-preview');
    if (elPreview && !window.tempFotoBase64Personalizada) {
        elPreview.src = imgSrc || AVATARES_TABY[skinKey] || AVATARES_TABY.padrao;
    }
};

window.solicitarAdicionarFoto = function(event) {
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }

    const qtdFotos = Array.isArray(window.galeriaFotosUsuario) ? window.galeriaFotosUsuario.length : 0;

    if (qtdFotos >= 6) {
        if (typeof window.exibirBalaoLimiteFotos === 'function') {
            window.exibirBalaoLimiteFotos();
        } else {
            alert("⚠️ Limite de 6 fotos atingido! Exclua uma foto para adicionar outra.");
        }
        return;
    }

    const inputUpload = document.getElementById("input-upload-galeria");
    if (inputUpload) {
        inputUpload.click();
    } else {
        console.warn("Input #input-upload-galeria não encontrado.");
    }
};

window.exibirBalaoLimiteFotos = function() {
    const balao = document.getElementById("balao-aviso-limite");
    if (!balao) return;

    balao.classList.remove("oculto");
    balao.classList.add("exibir");

    if (window.timeoutBalaoLimite) {
        clearTimeout(window.timeoutBalaoLimite);
    }

    window.timeoutBalaoLimite = setTimeout(() => {
        balao.classList.remove("exibir");
        setTimeout(() => balao.classList.add("oculto"), 300);
    }, 4000);
};

window.renderizarGaleriaPerfil = function() {
    const grid = document.getElementById("grid-galeria-avatares");
    const btnAdd = document.getElementById("btn-card-add-foto");
    const contador = document.getElementById("contador-fotos-galeria");
    const avisoLimite = document.getElementById("aviso-limite-fotos");

    if (!grid) return;

    const qtdFotos = window.galeriaFotosUsuario ? window.galeriaFotosUsuario.length : 0;
    if (contador) contador.innerText = `${qtdFotos}/6 fotos`;

    grid.innerHTML = "";
    if (btnAdd) grid.appendChild(btnAdd);

    if (btnAdd) {
        if (qtdFotos >= 6) {
            btnAdd.classList.add("desabilitado");
            if (avisoLimite) avisoLimite.classList.remove("oculto");
        } else {
            btnAdd.classList.remove("desabilitado");
            if (avisoLimite) avisoLimite.classList.add("oculto");
        }
    }

    if (Array.isArray(window.galeriaFotosUsuario)) {
        window.galeriaFotosUsuario.forEach((fotoUrl, index) => {
            const slot = document.createElement("div");
            slot.className = `card-avatar-slot is-custom ${window.avatarSelecionadoAtual === fotoUrl ? 'selecionado' : ''}`;
            slot.onclick = () => window.selecionarAvatarSlot(fotoUrl, slot);

            slot.innerHTML = `
                <img src="${fotoUrl}" alt="Foto ${index + 1}">
                <button class="btn-deletar-foto-custom" onclick="event.stopPropagation(); window.excluirFotoGaleria(${index});" aria-label="Excluir Foto" title="Excluir Foto">✕</button>
            `;
            grid.appendChild(slot);
        });
    }

    if (typeof TABYS_PADRAO !== 'undefined' && Array.isArray(TABYS_PADRAO)) {
        TABYS_PADRAO.forEach(taby => {
            const slot = document.createElement("div");
            slot.className = `card-avatar-slot is-taby ${window.avatarSelecionadoAtual === taby.url ? 'selecionado' : ''}`;
            slot.onclick = () => window.selecionarAvatarSlot(taby.url, slot);

            slot.innerHTML = `
                <img src="${taby.url}" alt="${taby.nome}" onerror="this.onerror=null; this.src='icon144.png';">
            `;
            grid.appendChild(slot);
        });
    }
};

window.selecionarAvatarSlot = function(url, elemento) {
    window.avatarSelecionadoAtual = url;
    window.avatarSelecionadoTemp = url;

    document.querySelectorAll("#grid-galeria-avatares .card-avatar-slot").forEach(el => {
        el.classList.remove("selecionado");
    });

    if (elemento) elemento.classList.add("selecionado");
};

window.selecionarAvatarTaby = window.selecionarAvatarSlot;

window.excluirFotoGaleria = function(index) {
    if (confirm("Deseja realmente excluir esta foto da sua galeria?")) {
        const fotoRemovida = window.galeriaFotosUsuario[index];
        window.galeriaFotosUsuario.splice(index, 1);
        
        try {
            localStorage.setItem('tabuada_galeria_fotos', JSON.stringify(window.galeriaFotosUsuario));
        } catch (e) {
            console.error("Erro ao atualizar galeria no localStorage:", e);
        }

        if (window.avatarSelecionadoAtual === fotoRemovida) {
            window.avatarSelecionadoAtual = (typeof TABYS_PADRAO !== 'undefined' && TABYS_PADRAO[0]) ? TABYS_PADRAO[0].url : 'icon144.png';
        }
        
        window.renderizarGaleriaPerfil();
    }
};

window.carregarFotoParaAjuste = function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (typeof Cropper === 'undefined') {
        alert("A biblioteca de ajuste de imagem ainda está carregando ou não foi encontrada no HTML. Certifique-se de carregar o Cropper.js.");
        return;
    }

    const file = files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        let modal = document.getElementById("modal-corte-foto");
        
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modal-corte-foto";
            document.body.appendChild(modal);
        }

        modal.className = "";
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100vw";
        modal.style.height = "100vh";
        modal.style.background = "rgba(7, 10, 18, 0.95)";
        modal.style.backdropFilter = "blur(8px)";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "999999";
        modal.style.padding = "16px";
        modal.style.boxSizing = "border-box";

        modal.innerHTML = `
            <div style="width: 100%; max-width: 380px; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 20px; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 0 25px rgba(56, 189, 248, 0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                    <h4 style="margin: 0; color: #38bdf8; font-size: 15px; font-weight: 800;">✂️ Ajustar Foto de Perfil</h4>
                    <button onclick="window.fecharModalCorte()" style="background: rgba(255,255,255,0.1); border: none; color: #94a3b8; width: 28px; height: 28px; min-width: 28px; min-height: 28px; aspect-ratio: 1 / 1; flex-shrink: 0; border-radius: 50%; cursor: pointer; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1;">✕</button>
                </div>
                <div style="width: 100%; height: 50vh; max-height: 320px; min-height: 200px; overflow: hidden; position: relative; background: #000; border-radius: 12px;">
                    <img id="img-crop-target" src="${e.target.result}" style="max-width: 100%; max-height: 100%; display: block;">
                </div>
                <div style="display: flex; gap: 10px; width: 100%; margin-top: 4px;">
                    <button onclick="window.fecharModalCorte()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: #cbd5e1; font-weight: 800; font-size: 13px; cursor: pointer;">
                        CANCELAR
                    </button>
                    <button onclick="window.confirmarCorteFoto()" style="flex: 1.5; padding: 12px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 1.5px solid #38bdf8; border-radius: 12px; color: #fff; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);">
                        SALVAR FOTO 🚀
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove("oculto");

        if (window.cropperInstancia) {
            window.cropperInstancia.destroy();
        }

        const imgTarget = document.getElementById("img-crop-target");
        window.cropperInstancia = new Cropper(imgTarget, {
            aspectRatio: 1, 
            viewMode: 1, 
            autoCropArea: 0.85, 
            responsive: true,
            restore: true,
            guides: false,
            center: true,
            highlight: false,
            background: false,
            dragMode: 'move', 
            ready: function () {
                const cropperViewBox = this.cropper.cropBox.querySelector('.cropper-view-box');
                const cropperFace = this.cropper.cropBox.querySelector('.cropper-face');
                if (cropperViewBox) {
                    cropperViewBox.style.borderRadius = '50%';
                    cropperViewBox.style.outline = '2px solid #38bdf8';
                }
                if (cropperFace) {
                    cropperFace.style.borderRadius = '50%';
                }
            }
        });
    };

    reader.readAsDataURL(file);
    event.target.value = ""; 
};

window.confirmarCorteFoto = async function() {
    const btnSalvar = document.querySelector("#modal-corte-foto button[onclick*='confirmarCorteFoto']");
    const textoOriginalBtn = btnSalvar ? btnSalvar.innerText : "SALVAR FOTO 🚀";

    try {
        if (!window.cropperInstancia) {
            window.fecharModalCorte();
            return;
        }

        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.innerText = "ENVIANDO... ⏳";
            btnSalvar.style.opacity = "0.7";
        }

        const canvasOriginal = window.cropperInstancia.getCroppedCanvas({
            width: 300,
            height: 300,
            fillColor: '#0f172a',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        if (!canvasOriginal) {
            alert("Não foi possível processar a imagem.");
            return;
        }

        const canvasFinal = document.createElement('canvas');
        canvasFinal.width = 300;
        canvasFinal.height = 300;
        const ctx = canvasFinal.getContext('2d');

        ctx.beginPath();
        ctx.arc(150, 150, 150, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(canvasOriginal, 0, 0, 300, 300);

        const fotoBase64 = canvasFinal.toDataURL("image/jpeg", 0.85);

        const user = auth.currentUser;
        const userId = user ? user.uid : 'anonimo';
        const perfilAtivoObj = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
        const perfilId = perfilAtivoObj.perfilId || perfilAtivoObj.id || 'perfil';

        const caminhoStorage = `perfis/${userId}/${perfilId}_${Date.now()}.jpg`;
        const storageRef = ref(storage, caminhoStorage);

        await uploadString(storageRef, fotoBase64, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);

        if (!Array.isArray(window.galeriaFotosUsuario)) {
            window.galeriaFotosUsuario = [];
        }

        if (!window.galeriaFotosUsuario.includes(downloadURL)) {
            window.galeriaFotosUsuario.unshift(downloadURL);
            if (window.galeriaFotosUsuario.length > 6) {
                window.galeriaFotosUsuario.pop();
            }
        }

        localStorage.setItem('tabuada_galeria_fotos', JSON.stringify(window.galeriaFotosUsuario));

        if (perfilId) {
            const perfilDocRef = doc(db, "perfis_usuarios", perfilId);
            await setDoc(perfilDocRef, {
                fotoUrl: downloadURL,
                galeriaFotos: arrayUnion(downloadURL)
            }, { merge: true });
        }

        window.avatarSelecionadoAtual = downloadURL;
        
        let perfil = perfilAtivoObj;
        perfil.fotoUrl = downloadURL;
        localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfil));

        const elPreview = document.getElementById('form-foto-preview');
        if (elPreview) elPreview.src = downloadURL;

        if (typeof window.renderizarGaleriaPerfil === 'function') {
            window.renderizarGaleriaPerfil();
        }
        if (typeof window.atualizarHeaderPerfilAtivo === 'function') {
            window.atualizarHeaderPerfilAtivo();
        }
        if (typeof window.atualizarNomeEAvatarInterface === 'function') {
            window.atualizarNomeEAvatarInterface();
        }
        if (typeof tocarSom === 'function') {
            tocarSom('acerto');
        }

    } catch (erro) {
        console.error("Erro ao enviar foto para a nuvem:", erro);
        alert("Falha ao salvar a imagem na nuvem. Verifique a conexão.");
    } finally {
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerText = textoOriginalBtn;
            btnSalvar.style.opacity = "1";
        }
        window.fecharModalCorte();
    }
};

window.fecharModalCorte = function() {
    if (window.cropperInstancia) {
        try {
            window.cropperInstancia.destroy();
        } catch (e) {
            console.warn("Erro ao destruir cropper:", e);
        }
        window.cropperInstancia = null;
    }

    const modal = document.getElementById("modal-corte-foto");
    if (modal) {
        modal.classList.add("oculto");
        modal.style.display = "none";
        modal.remove();
    }
};

window.rolarCarrosselAvatares = function(direcao) {
    const track = document.getElementById("grid-galeria-avatares");
    if (!track) return;

    const distancia = 180 * direcao;
    track.scrollBy({ left: distancia, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById("grid-galeria-avatares");
    if (!track) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    track.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => { isDown = false; });
    track.addEventListener('mouseup', () => { isDown = false; });

    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 2;
        track.scrollLeft = scrollLeft - walk;
    });
});

function garantirPerfilIdUnico(perfil) {
    if (!perfil) return null;
    if (perfil.perfilId) return perfil;

    const novoPerfilId = 'prf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    perfil.perfilId = novoPerfilId;
    perfil.id = novoPerfilId;

    localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfil));
    return perfil;
}

window.sincronizarGaleriaEModePerfil = function(perfilId) {
    if (!perfilId) return;

    const perfilRef = doc(db, "perfis_usuarios", perfilId);

    onSnapshot(perfilRef, (docSnap) => {
        if (docSnap.exists()) {
            const dados = docSnap.data();

            if (dados.fotoUrl) {
                window.avatarSelecionadoAtual = dados.fotoUrl;
                
                const elPreview = document.getElementById('form-foto-preview');
                const elAvatarTopo = document.getElementById('avatar-usuario-topo');
                if (elPreview) elPreview.src = dados.fotoUrl;
                if (elAvatarTopo) elAvatarTopo.src = dados.fotoUrl;
            }

            if (Array.isArray(dados.galeriaFotos)) {
                window.galeriaFotosUsuario = dados.galeriaFotos;
                
                localStorage.setItem('tabuada_galeria_fotos', JSON.stringify(dados.galeriaFotos));

                if (typeof window.renderizarGaleriaPerfil === 'function') {
                    window.renderizarGaleriaPerfil();
                }
            }
        }
    });
};

window.removerFotoGaleria = async function(urlFoto) {
    const perfilAtivoObj = JSON.parse(localStorage.getItem('tabuada_perfil_ativo')) || {};
    const perfilId = perfilAtivoObj.perfilId || perfilAtivoObj.id;

    if (perfilId && urlFoto) {
        try {
            const perfilDocRef = doc(db, "perfis_usuarios", perfilId);
            await setDoc(perfilDocRef, {
                galeriaFotos: arrayRemove(urlFoto)
            }, { merge: true });
        } catch (err) {
            console.error("Erro ao remover foto do Firestore:", err);
        }
    }
};
//#endregion

// =========================================================================
// 5. NAVEGAÇÃO E PAINEL INICIAL DO JOGO
// =========================================================================
//#region [5] NAVEGAÇÃO E PAINEL INICIAL

window.mudarTela = function(idTela) {
    if (typeof window.tocarSom === 'function') {
        window.tocarSom('clique');
    }

    // Esconde todas as telas
    document.querySelectorAll('.tela, .app-content-area > div').forEach(t => {
        t.classList.remove('ativo');
        t.classList.add('oculto');
        t.style.display = 'none';
    });

    const telaPerfis = document.getElementById('tela-selecao-perfis');
    if (telaPerfis && idTela !== 'tela-selecao-perfis') {
        telaPerfis.classList.add('oculto');
        telaPerfis.style.display = 'none';
    }

    // Exibe a tela alvo com o estilo correspondente
    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.classList.remove('oculto');
        telaAlvo.classList.add('ativo');
        
        if (idTela === 'tela-jogo' || idTela === 'tela-pre-jogo' || idTela === 'tela-painel-jogo') {
            telaAlvo.style.display = 'flex';
            telaAlvo.style.flexDirection = 'column';
        } else {
            telaAlvo.style.display = 'block';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sincronizarBottomNav(idTela);
};

function sincronizarBottomNav(idTela) {
    const botoesNav = document.querySelectorAll('.bottom-nav-app .btn-nav-item');
    if (!botoesNav || botoesNav.length === 0) return;

    botoesNav.forEach(b => b.classList.remove('ativo'));

    if (idTela === 'tela-painel-jogo') {
        botoesNav[0]?.classList.add('ativo');
    } else if (idTela === 'tela-trilha') {
        botoesNav[1]?.classList.add('ativo');
    } else if (idTela === 'tela-aprender' || idTela === 'tela-visualizar-tabuadas') {
        botoesNav[2]?.classList.add('ativo');
    } else if (idTela === 'tela-ranking') {
        botoesNav[3]?.classList.add('ativo');
    }
}

window.voltarParaInicial = function() {
    window.irParaPainelJogo();
};

window.irParaPainelJogo = function(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    window.mudarTela('tela-painel-jogo');
    
    if (typeof window.atualizarHeaderPerfilAtivo === 'function') window.atualizarHeaderPerfilAtivo();
    if (typeof carregarCuriosidadesDiarias === 'function') carregarCuriosidadesDiarias();
    if (typeof atualizarMinhasPosicoesRanking === 'function') atualizarMinhasPosicoesRanking();
    if (typeof window.sincronizarInterfaceGlobalPlano === 'function') {
        window.sincronizarInterfaceGlobalPlano();
    }
    if (typeof window.atualizarOfensivaUsuario === 'function') {
        window.atualizarOfensivaUsuario();
    }
    if (typeof verificarTempoSessao === 'function') verificarTempoSessao();
};

window.mostrarTelaAprender = function(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    window.mudarTela('tela-aprender');
};

function carregarCuriosidadesDiarias() {
    const containerPainel = document.getElementById('painel-dica-taby');
    if (!containerPainel) return;
    
    const diaDoAno = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    let idxCur = diaDoAno % listaCuriosidades.length;
    let idxDic = diaDoAno % listaDicas.length;

    containerPainel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="color: #e2e8f0; font-size: 12px;"><strong style="color: #38bdf8;">💡 Curiosidade:</strong> ${listaCuriosidades[idxCur]}</div>
            <hr style="border: none; border-top: 1px dashed rgba(56, 189, 248, 0.25); margin: 3px 0;">
            <div style="color: #e2e8f0; font-size: 12px;"><strong style="color: #4ade80;">🎯 Dica:</strong> ${listaDicas[idxDic]}</div>
        </div>
    `;
}

function verificarTempoSessao() {
    if (avisoPausaExibido) return;

    const tempoDecorridoMs = Date.now() - tempoInicioSessao;
    const vinteMinutosMs = 20 * 60 * 1000;

    if (tempoDecorridoMs >= vinteMinutosMs) {
        avisoPausaExibido = true;
        exibirAvisoPausaTaby();
    }
}

function exibirAvisoPausaTaby() {
    tocarSom('clique');
    
    const modal = document.createElement('div');
    modal.id = 'modal-pausa-taby';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(7, 10, 18, 0.85);
        backdrop-filter: blur(8px);
        display: flex; justify-content: center; align-items: center;
        z-index: 9999; padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div class="card-painel-container" style="max-width: 360px; text-align: center; border-color: #38bdf8; animation: fadeInSlide 0.3s ease;">
            <img src="taby.png" style="width: 70px; height: 70px; margin-bottom: 10px; filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.8));" onerror="this.onerror=null; this.src='icon144.png';">
            <h3 style="color: #38bdf8; font-size: 18px; margin-bottom: 8px; font-weight: 800;">Hora do Descanso! 🧠⚡</h3>
            <p style="color: #e2e8f0; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
                Você já está praticando há <b>20 minutos</b>! Que dedicação incrível! 🚀<br><br>
                Fazer uma pausa de 5 a 10 minutos ajuda seu cérebro a fixar a tabuada na memória de longo prazo.
            </p>
            <button onclick="window.fecharModalPausaTaby()" class="btn-comecar-desafio" style="margin: 0; padding: 12px;">
                Beleza, Taby! Vou descansar ☕
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

window.fecharModalPausaTaby = function() {
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');
    const modal = document.getElementById('modal-pausa-taby');
    if (modal) modal.remove();
};

window.mostrarAjudaTaby = function(chave) {
    if (typeof window.tocarSom === 'function') {
        window.tocarSom('clique');
    }

    const info = explicacoesTaby[chave];
    if (!info) return;

    const modalExistente = document.getElementById('modal-ajuda-taby');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-ajuda-taby';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(7, 10, 18, 0.85);
        backdrop-filter: blur(8px);
        display: flex; justify-content: center; align-items: center;
        z-index: 9999; padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div class="card-painel-container" style="max-width: 380px; text-align: center; border-color: #38bdf8; animation: popInModal 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <img src="taby.png" 
                 onerror="this.onerror=null; this.src='icon144.png';" 
                 class="taby-animado" 
                 style="width: 80px; height: 80px; margin-bottom: 12px; cursor: pointer; object-fit: contain;">
            
            <h3 style="color: #38bdf8; font-size: 19px; margin-bottom: 10px; font-weight: 800;">${info.titulo}</h3>
            <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin-bottom: 18px; text-align: left; background: rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                ${info.texto}
            </p>
            <button onclick="window.fecharModalAjudaTaby()" class="btn-comecar-desafio" style="margin: 0; padding: 12px 24px; font-size: 14px; width: 100%;">
                Entendi, Taby! 👍
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

window.fecharModalAjudaTaby = function() {
    tocarSom('clique');
    const modal = document.getElementById('modal-ajuda-taby');
    if (modal) modal.remove();
};

window.atualizarOfensivaUsuario = function() {
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    let ultimaData = localStorage.getItem('usuario_ofensiva_data');
    let diasOfensiva = parseInt(localStorage.getItem('usuario_ofensiva_dias') || '1', 10);

    if (ultimaData) {
        const dataAtual = new Date();
        const dataAnterior = new Date(ultimaData.split('/').reverse().join('-'));
        const diffDias = Math.floor((dataAtual - dataAnterior) / (1000 * 60 * 60 * 24));

        if (diffDias === 1) {
            diasOfensiva += 1;
            localStorage.setItem('usuario_ofensiva_dias', diasOfensiva.toString());
            localStorage.setItem('usuario_ofensiva_data', hojeStr);
        } else if (diffDias > 1) {
            diasOfensiva = 1;
            localStorage.setItem('usuario_ofensiva_dias', '1');
            localStorage.setItem('usuario_ofensiva_data', hojeStr);
        }
    } else {
        localStorage.setItem('usuario_ofensiva_data', hojeStr);
    }

    const elDisplay = document.getElementById('display-ofensiva-dias');
    if (elDisplay) elDisplay.innerText = diasOfensiva;
};
//#endregion


// =========================================================================
// 6. TRILHA DE APRENDIZADO ESPACIAL
// =========================================================================
//#region [6] TRILHA DE APRENDIZADO ESPACIAL
window.fecharBalaoTabyTrilha = function() {
    tocarSom('clique');
    const balao = document.getElementById('balao-taby-trilha');
    if (balao) {
        balao.classList.add('oculto');
        balao.style.display = 'none';
    }
};

function calcularMaestriaFase(fase) {
    if (!dadosTrilhaUsuario) dadosTrilhaUsuario = {};
    if (!dadosTrilhaUsuario.progressoFasesTrilha) dadosTrilhaUsuario.progressoFasesTrilha = {};

    const porcentagemSalva = dadosTrilhaUsuario.progressoFasesTrilha[fase.id];

    if (porcentagemSalva === undefined || porcentagemSalva === null) {
        return 0;
    }

    return Math.min(100, Math.max(0, parseInt(porcentagemSalva) || 0));
}

window.mostrarTelaTrilha = async function() {
    tocarSom('clique');
    window.mudarTela('tela-trilha');

    const elNomeBalao = document.getElementById('nome-aluno-taby-trilha');
    const nomeAluno = usuarioAtualLogado ? (usuarioAtualLogado.displayName || "Comandante") : "Comandante";

    const balao = document.getElementById('balao-taby-trilha');
    if (balao) {
        balao.className = "balao-taby-container-ui";
        balao.innerHTML = `
            <div style="display: flex; align-items: center; gap: 14px; position: relative;">
                <img src="taby.png" onerror="this.onerror=null; this.src='icon144.png';" class="taby-flutuante-trilha" alt="Taby Robô">
                
                <div style="flex: 1; text-align: left;">
                    <div style="color: #38bdf8; font-size: 15px; font-weight: 900; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
                        <span>🚀 Preparado, <strong id="nome-aluno-taby-trilha" style="color: #fff;">${nomeAluno}</strong>?</span>
                    </div>
                    <p style="color: #e2e8f0; font-size: 13px; line-height: 1.45; margin: 0; font-weight: 600;">
                        Conquiste <b style="color: #4ade80;">85% de Maestria</b> nos planetas para avançar e <b style="color: #fbbf24;">gravar a tabuada na memória para sempre!</b> 🧠⚡
                    </p>
                </div>

                <button onclick="window.fecharBalaoTabyTrilha()" style="background: rgba(255,255,255,0.1); border: none; color: #94a3b8; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center; position: absolute; top: -4px; right: -4px;">✕</button>
            </div>
        `;
        balao.classList.remove('oculto');
        balao.style.display = 'block';
    }

    if (usuarioAtualLogado) {
        try {
            const userRef = doc(db, "trilha_usuarios", usuarioAtualLogado.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                dadosTrilhaUsuario = docSnap.data();
            }
        } catch (erro) {
            console.error("Erro ao carregar dados da trilha:", erro);
        }
    }

    renderizarMapaTrilha();
};

function renderizarMapaTrilha() {
    const container = document.getElementById('mapa-trilha-container');
    if (!container) return;

    let html = "";
    let faseAnteriorDominada = true; 
    
    const planoSalvo = window.obterPlanoAtivo();
    const ehUsuarioPremium = (planoSalvo === 'pro' || planoSalvo === 'premium') || 
                            (typeof dadosTrilhaUsuario !== 'undefined' && dadosTrilhaUsuario?.ehPremium || false);

    FASES_TRILHA.forEach((fase, idx) => {
        let numeroPlanetaOuFase = idx + 1;
        let ehBloqueadoPorPlano = (!ehUsuarioPremium && numeroPlanetaOuFase > 3);

        let maestriaReal = (typeof calcularMaestriaFase === 'function') ? calcularMaestriaFase(fase) : 0;
        let concluida = (maestriaReal >= 85);
        let liberada = faseAnteriorDominada && !ehBloqueadoPorPlano;

        if (!concluida) faseAnteriorDominada = false;

        let maestriaExibida = liberada ? maestriaReal : 0;
        let conteudoIcone = "";

        if (concluida) {
            conteudoIcone = `<span style="font-size: 34px;" class="anim-flutuar">⭐</span>`;
        } else if (ehBloqueadoPorPlano) {
            conteudoIcone = `<span style="font-size: 32px;">👑</span>`;
        } else if (!liberada) {
            conteudoIcone = `<span style="font-size: 30px;">🔒</span>`;
        } else {
            conteudoIcone = `<span style="font-size: 34px;" class="anim-flutuar">${fase.icone || '🪐'}</span>`;
        }
        
        let corBorda = concluida ? '#10b981' : (ehBloqueadoPorPlano ? '#f59e0b' : (liberada ? '#38bdf8' : '#475569'));
        let corFundoBtn = concluida ? 'radial-gradient(circle, #064e3b 0%, #022c22 100%)' 
                         : (liberada ? 'radial-gradient(circle, #0c4a6e 0%, #082f49 100%)' : '#0f172a');

        let alinhamento = (idx % 2 === 0) ? "align-self: flex-start; margin-left: 8%;" : "align-self: flex-end; margin-right: 8%;";

        let acaoClique = ehBloqueadoPorPlano 
            ? `window.abrirTelaCheckoutPremium()` 
            : `iniciarEtapaTrilha('${fase.id}', ${liberada})`;

        let classeAnimaSol = (fase.id === '14' && liberada) ? 'anim-sol-pulsante' : '';

        html += `
            <div style="display: flex; flex-direction: column; align-items: center; width: 230px; ${alinhamento} margin-bottom: 26px; position: relative;">
                
                <button onclick="${acaoClique}" class="${classeAnimaSol}" style="width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; background: ${corFundoBtn}; border: 3px solid ${corBorda}; color: #fff; box-shadow: 0 0 20px ${corBorda}55, inset 0 0 10px rgba(255,255,255,0.1); position: relative; z-index: 2; overflow: hidden;">
                    ${conteudoIcone}
                </button>
                
                <span style="font-size: 13.5px; font-weight: 900; margin-top: 8px; text-align: center; color: #f8fafc; text-shadow: 0 0 10px rgba(0,0,0,0.9);">
                    ${fase.titulo}
                </span>
                
                <div style="width: 100%; background: rgba(15, 23, 42, 0.9); border-radius: 12px; height: 11px; margin-top: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); box-shadow: inset 0 0 6px rgba(0,0,0,0.6);">
                    <div style="width: ${maestriaExibida}%; background: linear-gradient(90deg, #38bdf8, #2ecc71, #a855f7); height: 100%; transition: width 0.6s ease; border-radius: 12px;"></div>
                </div>

            </div>
        `;
    });

    container.innerHTML = html;
}

window.iniciarEtapaTrilha = function(faseId, liberada) {
    if (typeof tocarSom === 'function') tocarSom('clique');
    
    if (!liberada) {
        alert("🔒 Nível Bloqueado! Complete o planeta anterior para liberar.");
        return;
    }

    const faseObj = FASES_TRILHA.find(f => f.id === String(faseId));
    if (!faseObj) return;

    let curiosidadesVistas = JSON.parse(localStorage.getItem('tabuada_curiosidades_vistas')) || [];

    if (!curiosidadesVistas.includes(String(faseId))) {
        window.abrirModalCuriosidadeEspacial(faseObj);
    } else {
        window.confirmarEIniciarFaseReal(faseObj);
    }
};

window.abrirModalCuriosidadeEspacial = function(faseObj) {
    const modalExistente = document.getElementById('modal-curiosidade-trilha');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-curiosidade-trilha';
    modal.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100vw; 
        height: 100vh;
        background: rgba(7, 10, 18, 0.88); 
        backdrop-filter: blur(8px);
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 99999; 
        padding: 16px; 
        box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="width: 330px; max-width: 90vw; border: 1.5px solid #38bdf8; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; padding: 18px; text-align: center; box-shadow: 0 0 30px rgba(56, 189, 248, 0.35); box-sizing: border-box; margin: auto;">
            <div style="font-size: 42px; margin-bottom: 4px;" class="anim-flutuar">
                ${faseObj.icone || '🪐'}
            </div>
            
            <span style="background: rgba(56, 189, 248, 0.18); color: #38bdf8; padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; display: inline-block; margin-bottom: 6px;">
                DESCOBERTA ASTRONÔMICA 🛰️
            </span>

            <h3 style="color: #fff; font-size: 16px; margin: 4px 0 10px 0; font-weight: 900;">
                ${faseObj.titulo}
            </h3>

            <p style="color: #e2e8f0; font-size: 12px; line-height: 1.5; margin-bottom: 16px; background: rgba(255,255,255,0.04); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); text-align: left;">
                🤖 <b style="color: #38bdf8;">Taby Diz:</b> "${faseObj.curiosidade}"
            </p>

            <button onclick="window.marcarCuriosidadeEIniciar('${faseObj.id}')" style="width: 100%; padding: 12px; font-size: 12.5px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 1.5px solid #38bdf8; border-radius: 14px; color: #fff; font-weight: 900; cursor: pointer; box-shadow: 0 0 15px rgba(56, 189, 248, 0.35); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                VAMOS CONQUISTAR JUNTOS! 🚀
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

window.marcarCuriosidadeEIniciar = function(faseId) {
    let curiosidadesVistas = JSON.parse(localStorage.getItem('tabuada_curiosidades_vistas')) || [];
    if (!curiosidadesVistas.includes(String(faseId))) {
        curiosidadesVistas.push(String(faseId));
        localStorage.setItem('tabuada_curiosidades_vistas', JSON.stringify(curiosidadesVistas));
    }

    const modal = document.getElementById('modal-curiosidade-trilha');
    if (modal) modal.remove();

    const faseObj = FASES_TRILHA.find(f => f.id === String(faseId));
    window.confirmarEIniciarFaseReal(faseObj);
};

window.confirmarEIniciarFaseReal = function(faseObj) {
    if (typeof consumirVidaParaEntrar === 'function') {
        if (!consumirVidaParaEntrar()) return;
    }

    faseAtualTrilha = faseObj || FASES_TRILHA[0];
    tipoJogoSelecionado = 'trilha';
    operacoesSelecionadas = faseAtualTrilha.ops || ['multiplicacao'];
    
    if (typeof prepararFilaOperacoes === 'function') prepararFilaOperacoes();
    if (typeof executarCarregamentoJogoReal === 'function') executarCarregamentoJogoReal();
};

window.continuarTrilhaMesmoPlaneta = function() {
    tocarSom('clique');
    if (faseAtualTrilha) {
        if (typeof consumirVidaParaEntrar === 'function') {
            if (!consumirVidaParaEntrar()) {
                return;
            }
        }
        tipoJogoSelecionado = 'trilha';
        operacoesSelecionadas = faseAtualTrilha.ops || ['multiplicacao'];
        prepararFilaOperacoes();
        
        executarCarregamentoJogoReal();
    } else {
        window.mostrarTelaTrilha();
    }
};

window.abrirDiarioDeBordoTaby = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');

    let curiosidadesVistas = JSON.parse(localStorage.getItem('tabuada_curiosidades_vistas')) || [];
    let totalFases = (typeof FASES_TRILHA !== 'undefined') ? FASES_TRILHA.length : 15;
    let descobertasFeitas = curiosidadesVistas.length;
    let porcentagemConcluida = Math.round((descobertasFeitas / totalFases) * 100);

    const modalExistente = document.getElementById('modal-diario-bordo');
    if (modalExistente) modalExistente.remove();

    let listaHtml = "";

    FASES_TRILHA.forEach(fase => {
        const desbloc = curiosidadesVistas.includes(String(fase.id));
        
        listaHtml += `
            <div style="background: rgba(255,255,255,0.04); border: 1px solid ${desbloc ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}; padding: 8px 10px; border-radius: 10px; margin-bottom: 6px; text-align: left; box-sizing: border-box;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 15px;">${desbloc ? (fase.icone || '🪐') : '🔒'}</span>
                        <strong style="color: ${desbloc ? '#f8fafc' : '#64748b'}; font-size: 12px;">${fase.titulo}</strong>
                    </div>
                    ${desbloc ? '<span style="background: rgba(16,185,129,0.2); color: #34d399; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;">DESBLOQUEADO</span>' : ''}
                </div>
                <p style="color: ${desbloc ? '#cbd5e1' : '#64748b'}; font-size: 11px; margin: 0; line-height: 1.35;">
                    ${desbloc ? fase.curiosidade : '<i style="color: #475569;">Explore este destino na Trilha para revelar a curiosidade!</i>'}
                </p>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.id = 'modal-diario-bordo';
    modal.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100vw; 
        height: 100vh;
        background: rgba(7, 10, 18, 0.88); 
        backdrop-filter: blur(6px);
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 99999; 
        padding: 16px; 
        box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div id="caixa-diario-conteudo" style="width: 330px; max-width: 90vw; height: 450px; max-height: 80vh; border: 1.5px solid #10b981; background: #0f172a; border-radius: 20px; padding: 14px; display: flex; flex-direction: column; box-shadow: 0 0 30px rgba(16,185,129,0.3); box-sizing: border-box; margin: auto;">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px; flex-shrink: 0;">
                <h3 style="color: #6ee7b7; font-size: 14px; margin: 0 0 4px 0; font-weight: 900; display: flex; align-items: center; gap: 8px;">
                    <div class="anim-flutuar" style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 5px #34d399);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            <path d="M12 6h4"></path>
                            <path d="M12 10h4"></path>
                        </svg>
                    </div>
                    <span>Diário de Bordo do Taby</span>
                </h3>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <span style="color: #94a3b8; font-size: 10.5px; font-weight: 700;">Progresso:</span>
                    <span style="color: #34d399; font-size: 10.5px; font-weight: 900;">${descobertasFeitas} / ${totalFases} (${porcentagemConcluida}%)</span>
                </div>
                
                <div style="width: 100%; background: rgba(255,255,255,0.1); height: 5px; border-radius: 8px; margin-top: 4px; overflow: hidden;">
                    <div style="width: ${porcentagemConcluida}%; background: linear-gradient(90deg, #10b981, #34d399); height: 100%; transition: width 0.4s ease;"></div>
                </div>
            </div>

            <div style="overflow-y: auto; flex: 1 1 auto; min-height: 0; padding-right: 4px;" class="container-trilha-scroll">
                ${listaHtml}
            </div>

            <button onclick="document.getElementById('modal-diario-bordo').remove()" style="margin-top: 10px; width: 100%; padding: 9px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: #f8fafc; font-weight: 800; font-size: 11.5px; cursor: pointer; flex-shrink: 0; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                FECHAR DIÁRIO 🚀
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};
//#endregion


// =========================================================================
// 7. MECÂNICA DE JOGO, GERADOR DE OPÇÕES E CRONÔMETRO
// =========================================================================
//#region [7] MECÂNICA DE JOGO, GERADOR E CRONÔMETRO

window.verificarSeEhPro = function() {
    const plano = window.obterPlanoAtivo();
    return (plano === 'pro' || plano === 'premium');
};

window.atualizarHUDVidasPartida = function() {
    const ehPro = window.verificarSeEhPro();
    const plano = window.obterPlanoAtivo();
    const saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);
    
    const seletores = [
        '#gameplay-hearts-partida',
        '#gameplay-hearts-trilha',
        '.gameplay-hearts-partida',
        '#contador-vidas-trilha'
    ];

    seletores.forEach(seletor => {
        const elementos = document.querySelectorAll(seletor);
        elementos.forEach(el => {
            if (!el) return;
            
            if (ehPro) {
                const icone = (plano === 'pro') ? '💎' : '👑';
                el.className = `status-item hud-vida-futurista ${plano}`;
                el.innerHTML = `
                    <span class="icone-vida-glow">${icone}</span>
                    <span class="valor-vida">∞</span>
                `;
            } else {
                const classeCritica = saldoVidas <= 1 ? 'critico' : '';
                el.className = `status-item hud-vida-futurista ${classeCritica}`;
                el.setAttribute('title', `${saldoVidas} Vidas Disponíveis`);
                el.innerHTML = `
                    <span class="icone-vida-glow pulse">❤️</span>
                    <span class="valor-vida">${saldoVidas}</span>
                `;
            }
        });
    });
};

function atualizarBotoesOperacaoVisual() {
    // 1. Limpa a classe de seleção de TODOS os botões no DOM
    const todosBotoesOp = document.querySelectorAll('.btn-op-redesign, .btn-insano-destaque, #btn-op-mult, #btn-op-div, #btn-op-add, #btn-op-sub, #btn-op-insano');
    todosBotoesOp.forEach(btn => btn.classList.remove('selecionado', 'ativo'));

    // 2. Aplica a classe selecionado apenas para quem estiver no array
    operacoesSelecionadas.forEach(op => {
        const idBtn = mapaIds[op];
        const el = document.getElementById(idBtn);
        if (el) el.classList.add('selecionado');
    });
}

function iniciarCronometro() {
    tempoInicioMillis = Date.now();
    const elCron = document.getElementById('cronometro-jogo');
    const elCont = document.getElementById('container-cronometro');
    if (elCron) elCron.innerText = "0:00.0";
    if (elCont) {
        elCont.classList.remove('oculto');
        elCont.style.display = 'inline-flex';
    }
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = setInterval(() => {
        let ms = Date.now() - tempoInicioMillis;
        let seg = Math.floor(ms / 1000);
        let min = Math.floor(seg / 60);
        let dec = Math.floor((ms % 1000) / 100);
        if (elCron) elCron.innerText = `${min}:${(seg % 60).toString().padStart(2, '0')}.${dec}`;
    }, 100);
}

function pararCronometro() {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = null;
    const elCont = document.getElementById('container-cronometro');
    if (elCont) {
        elCont.classList.add('oculto');
        elCont.style.display = 'none';
    }
}

function gerarOpcoesInteligentes(num1, num2, resultadoCorreto, operacao) {
    const opcoes = new Set();
    opcoes.add(resultadoCorreto);
    let tentativas = 0;

    while (opcoes.size < 4 && tentativas < 30) {
        tentativas++;
        let opcaoFalsa = resultadoCorreto;
        const tipoErro = opcoes.size;

        if (operacao === 'multiplicacao') {
            if (tipoErro === 1) opcaoFalsa = num1 + num2;
            else if (tipoErro === 2) opcaoFalsa = resultadoCorreto + (Math.random() < 0.5 ? 1 : -1);
            else opcaoFalsa = num1 * Math.max(1, num2 + (Math.random() < 0.5 ? 2 : -2));
        } else if (operacao === 'adicao') {
            if (tipoErro === 1) opcaoFalsa = resultadoCorreto + 1;
            else if (tipoErro === 2) opcaoFalsa = resultadoCorreto - 1;
            else opcaoFalsa = resultadoCorreto + (Math.random() < 0.5 ? 2 : -2);
        } else if (operacao === 'subtracao') {
            if (tipoErro === 1) opcaoFalsa = num1 + num2;
            else if (tipoErro === 2) opcaoFalsa = resultadoCorreto + 1;
            else opcaoFalsa = Math.max(0, resultadoCorreto - 1);
        } else if (operacao === 'divisao') {
            if (tipoErro === 1) opcaoFalsa = resultadoCorreto + 1;
            else if (tipoErro === 2) opcaoFalsa = Math.max(1, resultadoCorreto - 1);
            else opcaoFalsa = resultadoCorreto + 2;
        }

        if (opcaoFalsa >= 0 && opcaoFalsa !== resultadoCorreto) {
            opcoes.add(opcaoFalsa);
        }
    }

    let delta = 1;
    while (opcoes.size < 4) {
        let alt = resultadoCorreto + delta;
        if (!opcoes.has(alt) && alt >= 0) {
            opcoes.add(alt);
        }
        delta = delta > 0 ? -delta : -delta + 1;
    }

    return Array.from(opcoes).sort(() => Math.random() - 0.5);
}

window.iniciarJogo = function() {
    if (iniciandoJogoTrava) return;
    iniciandoJogoTrava = true;
    setTimeout(() => { iniciandoJogoTrava = false; }, 800);

    tocarSom('clique');
    if (!usuarioAtualLogado) {
        alert("Entre na conta para jogar!");
        window.irParaPainelJogo();
        return;
    }

    if (typeof consumirVidaParaEntrar === 'function') {
        if (!window.verificarSeEhPro() && !consumirVidaParaEntrar()) {
            return;
        }
    }

    prepararFilaOperacoes();

    if (tipoJogoSelecionado === 'treino' || operacoesSelecionadas.includes('insano')) {
        executarCarregamentoJogoReal();
    } else {
        window.mudarTela('tela-pre-jogo');
        const btnInic = document.getElementById('btn-iniciar-desafio-real');
        const boxCont = document.getElementById('box-contador-regressivo');
        if (btnInic) btnInic.classList.remove('oculto');
        if (boxCont) boxCont.classList.add('oculto');
    }
};

function prepararFilaOperacoes() {
    filaOperacoesJogo = [];

    if (!operacoesSelecionadas || !Array.isArray(operacoesSelecionadas) || operacoesSelecionadas.length === 0) {
        operacoesSelecionadas = ['multiplicacao'];
    }

    if (operacoesSelecionadas.includes('insano')) {
        const ops = ['multiplicacao', 'divisao', 'adicao', 'subtracao'];
        totalPerguntas = 12;

        ops.forEach(op => {
            for (let i = 0; i < 3; i++) {
                filaOperacoesJogo.push(op);
            }
        });
    } else if (tipoJogoSelecionado === 'trilha') {
        totalPerguntas = 20;
        const qtdOps = Math.max(1, operacoesSelecionadas.length);
        const repeticoesPorOp = Math.ceil(20 / qtdOps);

        operacoesSelecionadas.forEach(op => {
            for (let i = 0; i < repeticoesPorOp; i++) {
                filaOperacoesJogo.push(op);
            }
        });

        filaOperacoesJogo = filaOperacoesJogo.slice(0, 20);
    } else {
        const qtdOps = Math.max(1, operacoesSelecionadas.length);
        let repeticoes = 10;

        if (tipoJogoSelecionado === 'treino') {
            if (qtdOps === 2) repeticoes = 5;
            else if (qtdOps === 3) repeticoes = 4;
            else if (qtdOps === 4) repeticoes = 3;
        }

        totalPerguntas = qtdOps * repeticoes;

        operacoesSelecionadas.forEach(op => {
            for (let i = 0; i < repeticoes; i++) {
                filaOperacoesJogo.push(op);
            }
        });
    }

    filaOperacoesJogo.sort(() => Math.random() - 0.5);
}

window.comecarDesafioEfetivo = function() {
    tocarSom('clique');
    const btnInic = document.getElementById('btn-iniciar-desafio-real');
    const boxContador = document.getElementById('box-contador-regressivo');
    if (btnInic) btnInic.classList.add('oculto');
    if (boxContador) boxContador.classList.remove('oculto');
    
    let count = 3;
    if (boxContador) boxContador.innerText = count;
    tocarSom('contagem'); 

    let timerCount = setInterval(() => {
        count--;
        if (count > 0) {
            if (boxContador) boxContador.innerText = count;
            tocarSom('contagem'); 
        } else if (count === 0) {
            if (boxContador) boxContador.innerText = "JÁ! 🚀";
            tocarSom('ja'); 
        } else {
            clearInterval(timerCount);
            if (boxContador) boxContador.classList.add('oculto');
            executarCarregamentoJogoReal();
        }
    }, 1000);
};

// =========================================================================
// FLUXO DE ENTRADA E RENDERIZAÇÃO DA PERGUNTA
// =========================================================================
function executarCarregamentoJogoReal() {
    if (timerTransicaoQuestao) clearTimeout(timerTransicaoQuestao);
    
    perguntaAtual = 1;
    acertos = 0;
    erros = 0;
    respondendoTravado = false;

    // Exibição imediata do container de jogo
    window.mudarTela('tela-jogo');
    
    if (typeof window.atualizarHUDVidasPartida === 'function') {
        window.atualizarHUDVidasPartida();
    }

    const elContCronometro = document.getElementById('container-cronometro');
    if (tipoJogoSelecionado === 'relampago') {
        if (elContCronometro) {
            elContCronometro.classList.remove('oculto');
            elContCronometro.style.display = 'inline-flex';
        }
        iniciarCronometro();
    } else {
        pararCronometro();
        if (elContCronometro) {
            elContCronometro.classList.add('oculto');
            elContCronometro.style.display = 'none';
        }
    }

    setTimeout(() => {
        gerarPergunta();
    }, 50);
}

function gerarPergunta() {
    const elCont = document.getElementById('contador-perguntas');
    if (elCont) elCont.innerText = `${perguntaAtual}/${totalPerguntas}`;
    
    for (let i = 0; i < 4; i++) {
        let btn = document.getElementById(`alt-${i}`);
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('incorreto', 'correto');
            btn.className = "btn-resposta-futurista";
        }
    }

    respondendoTravado = false;
    inicioTempoQuestao = Date.now();

    if (!filaOperacoesJogo || filaOperacoesJogo.length === 0) {
        prepararFilaOperacoes();
    }

    const opAtual = filaOperacoesJogo[perguntaAtual - 1] || 'multiplicacao';

    let n1 = Math.floor(Math.random() * 9) + 2;
    let n2 = Math.floor(Math.random() * 9) + 2;

    if (tipoJogoSelecionado === 'trilha' && faseAtualTrilha?.filtroTabuada) {
        let listaTabuadas = faseAtualTrilha.filtroTabuada;
        n1 = listaTabuadas[Math.floor(Math.random() * listaTabuadas.length)];
        
        let pioresContas = [];
        if (!dadosTrilhaUsuario) dadosTrilhaUsuario = {};
        if (!dadosTrilhaUsuario.maestriaContas) dadosTrilhaUsuario.maestriaContas = {};
        
        let maestriaMap = dadosTrilhaUsuario.maestriaContas;

        for (let i = 1; i <= 10; i++) {
            let chave = `${n1}x${i}`;
            let score = maestriaMap[chave] || 0;
            if (score < 85) pioresContas.push(i);
        }

        if (pioresContas.length > 0 && Math.random() < 0.8) {
            n2 = pioresContas[Math.floor(Math.random() * pioresContas.length)];
        } else {
            n2 = Math.floor(Math.random() * 10) + 1;
        }
    }

    let simbolo = '×';
    if (opAtual === 'multiplicacao') {
        respostaCorretaGlobal = n1 * n2;
        simbolo = '×';
    } else if (opAtual === 'adicao') {
        respostaCorretaGlobal = n1 + n2;
        simbolo = '+';
    } else if (opAtual === 'subtracao') {
        if (n1 < n2) [n1, n2] = [n2, n1];
        respostaCorretaGlobal = n1 - n2;
        simbolo = '-';
    } else if (opAtual === 'divisao') {
        respostaCorretaGlobal = n1;
        n1 = respostaCorretaGlobal * n2;
        simbolo = '÷';
    }

    fator1Atual = n1;
    fator2Atual = n2;

    const elF1 = document.getElementById('fator1');
    const elF2 = document.getElementById('fator2');
    const elSinal = document.getElementById('sinal-operacao');

    if (elF1) elF1.innerText = n1;
    if (elF2) elF2.innerText = n2;
    if (elSinal) elSinal.innerText = simbolo;

    opcoesAtuaisJogo = gerarOpcoesInteligentes(n1, n2, respostaCorretaGlobal, opAtual);
    for (let i = 0; i < 4; i++) {
        const elAlt = document.getElementById(`alt-${i}`);
        if (elAlt) elAlt.innerText = opcoesAtuaisJogo[i];
    }
}

window.verificarEscolha = function(indice) {
    if (respondendoTravado) return;
    respondendoTravado = true;

    if (timerTransicaoQuestao) clearTimeout(timerTransicaoQuestao);

    let semVidasDerrota = false;

    try {
        const tempoGastoMs = Date.now() - inicioTempoQuestao;

        tocarSom('clique');
        const btnEscolhido = document.getElementById(`alt-${indice}`);
        const valor = parseInt(btnEscolhido ? btnEscolhido.innerText : '-1');

        for (let i = 0; i < 4; i++) {
            const btn = document.getElementById(`alt-${i}`);
            if (btn) btn.disabled = true;
        }

        const acertou = (valor === respostaCorretaGlobal);
        const chaveConta = `${fator1Atual}x${fator2Atual}`;
        
        if (!dadosTrilhaUsuario) dadosTrilhaUsuario = {};
        if (!dadosTrilhaUsuario.maestriaContas) dadosTrilhaUsuario.maestriaContas = {};
        let scoreAtual = dadosTrilhaUsuario.maestriaContas[chaveConta] || 0;

        if (acertou) {
            acertos++;
            if (btnEscolhido) btnEscolhido.classList.add('correto');
            tocarSom('acerto');

            if (tempoGastoMs <= 1500) scoreAtual += 25;
            else if (tempoGastoMs <= 3500) scoreAtual += 15;
            else scoreAtual += 5;

            if (scoreAtual > 100) scoreAtual = 100;
        } else {
            erros++;
            if (btnEscolhido) btnEscolhido.classList.add('incorreto');
            tocarSom('erro');

            scoreAtual = Math.max(0, scoreAtual - 20);

            for (let i = 0; i < 4; i++) {
                const btn = document.getElementById(`alt-${i}`);
                if (btn && parseInt(btn.innerText) === respostaCorretaGlobal) {
                    btn.classList.add('correto');
                }
            }

            if (!window.verificarSeEhPro()) {
                let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);
                saldoVidas = Math.max(0, saldoVidas - 1);
                localStorage.setItem('usuario_vidas', saldoVidas.toString());

                if (saldoVidas === 0 && !localStorage.getItem('usuario_proxima_vida_timestamp')) {
                    const proximoTempo = Date.now() + TEMPO_REGENERACAO_MS;
                    localStorage.setItem('usuario_proxima_vida_timestamp', proximoTempo.toString());
                }

                window.atualizarHUDVidasPartida();

                if (saldoVidas <= 0) {
                    semVidasDerrota = true;
                }
            }
        }

        dadosTrilhaUsuario.maestriaContas[chaveConta] = scoreAtual;

    } catch (e) {
        console.error("Erro ao processar resposta:", e);
    }

    timerTransicaoQuestao = setTimeout(() => {
        try {
            if (semVidasDerrota) {
                if (typeof window.exibirModalVidasEsgotadasTaby === 'function') {
                    window.exibirModalVidasEsgotadasTaby();
                } else if (typeof window.abrirPaywall === 'function') {
                    window.abrirPaywall();
                } else {
                    alert("Suas vidas acabaram! Faça upgrade para o Plano PRO para jogar com vidas ilimitadas.");
                    window.irParaPainelJogo();
                }
                return;
            }

            perguntaAtual++;
            if (perguntaAtual > totalPerguntas) {
                finalizarJogo();
            } else {
                gerarPergunta();
            }
        } catch (erro) {
            console.error("Erro na transição de questão:", erro);
            respondendoTravado = false;
            if (perguntaAtual <= totalPerguntas) {
                gerarPergunta();
            } else {
                window.irParaPainelJogo();
            }
        }
    }, 600);
};

window.continuarJogando = function() {
    tocarSom('clique');
    window.iniciarJogo();
};

window.confirmarSaidaJogo = function() {
    tocarSom('clique');
    if (confirm("Deseja mesmo sair?")) window.irParaPainelJogo();
};
//#endregion


// =========================================================================
// 8. FINALIZAÇÃO E REGISTRO DE ESTATÍSTICAS NO FIRESTORE
// =========================================================================
//#region [8] FINALIZAÇÃO E REGISTRO NO FIRESTORE
async function finalizarJogo() {
    let porcentagemAcertos = Math.round((acertos / totalPerguntas) * 100);

    try {
        if (typeof window.salvarEstatisticasPartida === 'function') {
            window.salvarEstatisticasPartida(acertos, totalPerguntas, operacoesSelecionadas);
        }
    } catch (e) {
        console.warn("Erro ao salvar estatísticas da partida local:", e);
    }

    const ehPago = window.verificarSeEhPro();

    let ganhouVidaBonus = false;
    let limiteDiarioAtingido = false;

    if (!ehPago && porcentagemAcertos >= 90) {
        const dataHojeStr = new Date().toLocaleDateString('pt-BR');
        let dataSalva = localStorage.getItem('usuario_vidas_data_bonus');
        let contagemHoje = parseInt(localStorage.getItem('usuario_vidas_bonus_hoje') || '0', 10);

        if (dataSalva !== dataHojeStr) {
            contagemHoje = 0;
            localStorage.setItem('usuario_vidas_data_bonus', dataHojeStr);
        }

        if (contagemHoje < 2) {
            let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);
            saldoVidas += 1;
            localStorage.setItem('usuario_vidas', saldoVidas.toString());
            
            contagemHoje += 1;
            localStorage.setItem('usuario_vidas_bonus_hoje', contagemHoje.toString());

            if (typeof window.atualizarInterfaceVidas === 'function') {
                window.atualizarInterfaceVidas();
            }
            ganhouVidaBonus = true;
        } else {
            limiteDiarioAtingido = true;
        }
    }

    if (tipoJogoSelecionado === 'trilha') {
        pararCronometro();

        const faseObj = faseAtualTrilha || FASES_TRILHA[0];
        
        if (!dadosTrilhaUsuario) dadosTrilhaUsuario = {};
        if (!dadosTrilhaUsuario.progressoFasesTrilha) dadosTrilhaUsuario.progressoFasesTrilha = {};

        let maestriaAtual = dadosTrilhaUsuario.progressoFasesTrilha[faseObj.id] || 0;
        
        let ganhoMaestria = 0;
        if (porcentagemAcertos === 100) {
            ganhoMaestria = 25;
        } else if (porcentagemAcertos >= 85) {
            ganhoMaestria = 15;
        } else if (porcentagemAcertos >= 70) {
            ganhoMaestria = 10;
        } else if (porcentagemAcertos >= 50) {
            ganhoMaestria = 5;
        }

        let maestriaNova = Math.min(100, maestriaAtual + ganhoMaestria);

        dadosTrilhaUsuario.progressoFasesTrilha[faseObj.id] = maestriaNova;

        if (usuarioAtualLogado) {
            setDoc(doc(db, "trilha_usuarios", usuarioAtualLogado.uid), {
                uid: usuarioAtualLogado.uid,
                progressoFasesTrilha: dadosTrilhaUsuario.progressoFasesTrilha,
                ultimaAtualizacao: serverTimestamp()
            }, { merge: true }).catch(e => console.warn("Erro ao salvar trilha no Firestore:", e));
        }

        localStorage.setItem('tabuada_trilha_progresso', JSON.stringify(dadosTrilhaUsuario));

        window.AdsManager.exibirIntersticial(function() {
            window.mudarTela('tela-final-trilha');
        });

        const elNotaVal = document.getElementById('trilha-nota-val');
        const elPrecVal = document.getElementById('trilha-precisao-val');
        if (elNotaVal) elNotaVal.innerText = `${acertos}/${totalPerguntas}`;
        if (elPrecVal) elPrecVal.innerText = `${porcentagemAcertos}%`;

        const elTitRes = document.getElementById('trilha-titulo-resultado');
        const elDiag = document.getElementById('box-diagnostico-trilha');

        if (maestriaNova >= 85) {
            tocarSom('vitoria');
            if (typeof dispararConfetesConquista === 'function') dispararConfetesConquista();
            
            if (faseObj.boss) {
                if (elTitRes) elTitRes.innerText = "Taby Diz: Chefão Derrotado! 🤖⚡";
                if (elDiag) elDiag.innerText = `🤖 "Espetacular! Você venceu o ${faseObj.titulo} com ${maestriaNova}% de Maestria e liberou o próximo setor da galáxia!"`;
            } else {
                if (elTitRes) elTitRes.innerText = "Taby Diz: Planeta Dominado! 🪐🚀";
                if (elDiag) elDiag.innerText = `🤖 "Incrível! Você atingiu ${maestriaNova}% de Maestria e liberou a próxima etapa!"`;
            }
        } else {
            if (elTitRes) elTitRes.innerText = "Taby Diz: Bom Progresso! 💪";
            if (elDiag) elDiag.innerText = `🤖 "Seu nível de Maestria neste nível subiu para ${maestriaNova}%. Continue praticando para alcançar 85% e avançar na Trilha!"`;
        }
        return;
    }

    pararCronometro();
    
    window.AdsManager.exibirIntersticial(function() {
        window.mudarTela('tela-final');
    });

    let tempoFim = Date.now();
    let tempoReal = ((tempoFim - tempoInicioMillis) / 1000);
    let tempoRelampagoAjustado = Math.max(tempoReal + (erros * 3), 1).toFixed(1);
    tempoRelampagoGlobalUltimo = tempoRelampagoAjustado;

    const perfilStrAtivo = localStorage.getItem('tabuada_perfil_ativo');
    const perfilAtivoObj = perfilStrAtivo ? JSON.parse(perfilStrAtivo) : null;
    const perfilIdAtivo = perfilAtivoObj ? (perfilAtivoObj.perfilId || perfilAtivoObj.id) : (localStorage.getItem('perfil_ativo_id') || 'perfil_1');

    const nomeNick = perfilAtivoObj ? perfilAtivoObj.nome : (usuarioAtualLogado ? (usuarioAtualLogado.displayName || "ALUNO") : "ALUNO");
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const operacaoSalvar = operacoesSelecionadas.length === 1 ? operacoesSelecionadas[0] : (operacoesSelecionadas.includes('insano') ? 'insano' : 'multiplicacao');

    const elTituloFeedback = document.getElementById('titulo-feedback-final');
    const elSubtituloFeedback = document.getElementById('subtitulo-feedback-final');

    if (elTituloFeedback && elSubtituloFeedback) {
        if (porcentagemAcertos >= 80) {
            elTituloFeedback.innerText = "Mandou Bem! 🎉🚀";
            elSubtituloFeedback.innerText = "Rodada concluída com sucesso!";
        } else if (porcentagemAcertos >= 50) {
            elTituloFeedback.innerText = "Bom Esforço! 💪✨";
            elSubtituloFeedback.innerText = "Você está no caminho, continue treinando!";
        } else {
            elTituloFeedback.innerText = "Não Desista! 🧠⚡";
            elSubtituloFeedback.innerText = "A prática leva à perfeição. Vamos tentar de novo?";
        }
    }

    const elNotaFin = document.getElementById('nota-final');
    const elPctFin = document.getElementById('display-porcentagem-final');
    const elBadgeVida = document.getElementById('badge-vida-ganha');

    if (elNotaFin) elNotaFin.innerText = `${acertos}/${totalPerguntas}`;
    if (elPctFin) elPctFin.innerText = `${porcentagemAcertos}%`;

    if (elBadgeVida) {
        if (!ehPago) {
            if (ganhouVidaBonus) {
                elBadgeVida.innerText = " (💖 +1 Vida Ganha!)";
                elBadgeVida.classList.remove('oculto');
                elBadgeVida.style.display = 'inline';
            } else if (limiteDiarioAtingido) {
                elBadgeVida.innerText = " (Máx. bônus diário de vidas atingido 🎬)";
                elBadgeVida.classList.remove('oculto');
                elBadgeVida.style.display = 'inline';
            } else {
                elBadgeVida.innerText = "";
                elBadgeVida.classList.add('oculto');
                elBadgeVida.style.display = 'none';
            }
        } else {
            elBadgeVida.innerText = "";
            elBadgeVida.classList.add('oculto');
            elBadgeVida.style.display = 'none';
        }
    }

    const displayTempoFinal = document.getElementById('display-tempo-final');
    const btnCompartilharTempo = document.getElementById('btn-compartilhar-tempo');
    const msgEnvio = document.getElementById('mensagem-envio');

    if (tipoJogoSelecionado === 'relampago') {
        if (displayTempoFinal) {
            displayTempoFinal.innerText = `⏱️ Tempo Total: ${tempoRelampagoAjustado}s`;
            displayTempoFinal.classList.remove('oculto');
        }
        
        if (btnCompartilharTempo) {
            btnCompartilharTempo.classList.remove('oculto');
            btnCompartilharTempo.style.display = 'flex';
        }

        const tempoAtualNum = parseFloat(tempoRelampagoAjustado);

        if (msgEnvio) {
            msgEnvio.innerText = "Taby está salvando seu tempo no ranking...";
            msgEnvio.style.color = "#38bdf8";
        }
        
        addDoc(collection(db, "ranking_tempo"), {
            userId: usuarioAtualLogado ? usuarioAtualLogado.uid : 'anonimo',
            perfilId: perfilIdAtivo,
            nome: nomeNick, 
            acertos: acertos, 
            erros: erros, 
            totalQuestoes: totalPerguntas,
            porcentagem: porcentagemAcertos,
            tempoSegundos: tempoAtualNum, 
            tempoMs: Math.round(tempoAtualNum * 1000),
            operacao: operacaoSalvar, 
            modoJogo: 'relampago',
            data: dataHoje, 
            timestamp: serverTimestamp()
        }).then(() => {
            if (msgEnvio) {
                msgEnvio.innerText = "Tempo salvo com sucesso no Ranking Relâmpago! ⚡";
                msgEnvio.style.color = "#22c55e";
            }
            atualizarMinhasPosicoesRanking();
        }).catch(err => {
            console.error("Erro ao salvar no ranking relâmpago:", err);
            if (msgEnvio) {
                msgEnvio.innerText = "Erro ao salvar pontuação no servidor.";
                msgEnvio.style.color = "#ef4444";
            }
        });

    } else {
        if (displayTempoFinal) displayTempoFinal.classList.add('oculto');
        
        if (btnCompartilharTempo) {
            btnCompartilharTempo.classList.add('oculto');
            btnCompartilharTempo.style.display = 'none';
        }

        addDoc(collection(db, "ranking"), {
            userId: usuarioAtualLogado ? usuarioAtualLogado.uid : 'anonimo',
            perfilId: perfilIdAtivo,
            nome: nomeNick, 
            acertos: acertos, 
            pontos: acertos,
            erros: erros, 
            totalQuestoes: totalPerguntas, 
            porcentagem: porcentagemAcertos,
            operacao: operacaoSalvar,
            tempoSegundos: parseFloat(tempoReal.toFixed(1)),
            modoJogo: tipoJogoSelecionado,
            data: dataHoje, 
            timestamp: serverTimestamp()
        }).then(() => {
            if (msgEnvio) {
                msgEnvio.innerText = "Resultados salvos no Ranking! ✅";
                msgEnvio.style.color = "#27ae60";
            }
            atualizarMinhasPosicoesRanking();
            verificarTempoSessao();
        });
    }
}


// =========================================================================
// 9. RANKINGS, FILTROS E TABELAS DE PONTUAÇÃO
// =========================================================================
//#region [9] RANKINGS E FILTROS
window.mostrarRanking = function() {
    tocarSom('clique');
    window.mudarTela('tela-ranking');
    window.mudarTipoRanking();
};

window.selecionarAbaRanking = function(tipo) {
    if (typeof tocarSom === 'function') tocarSom('clique');
    
    window.tipoRankingAtual = tipo;

    const elTipoHidden = document.getElementById('tipo-ranking');
    if (elTipoHidden) elTipoHidden.value = tipo;

    const btnTreino = document.getElementById('btn-aba-treino');
    const btnRelampago = document.getElementById('btn-aba-relampago');
    const elFiltroOp = document.getElementById('filtro-operacoes-relampago');

    if (btnTreino && btnRelampago) {
        btnTreino.classList.toggle('ativo', tipo === 'treino');
        btnRelampago.classList.toggle('ativo', tipo === 'relampago');
    }

    if (tipo === 'relampago') {
        if (elFiltroOp) elFiltroOp.style.display = 'block';
        window.carregarRankingRelampago();
    } else {
        if (elFiltroOp) elFiltroOp.style.display = 'none';
        window.carregarRankingTreino();
    }
};

window.mudarTipoRanking = function() {
    const elTipo = document.getElementById('tipo-ranking');
    const tipoDesejado = elTipo ? elTipo.value : (window.tipoRankingAtual || 'treino');
    window.selecionarAbaRanking(tipoDesejado);
};

window.aplicarFiltro = function() {
    window.mudarTipoRanking();
};

function obterDataCorteFiltro() {
    const elFiltroTempo = document.getElementById('filtro-tempo');
    const valor = elFiltroTempo ? elFiltroTempo.value : 'sempre';
    const agora = Date.now();

    if (valor === 'hoje') {
        const inicioHoje = new Date();
        inicioHoje.setHours(0,0,0,0);
        return inicioHoje.getTime();
    } else if (valor === '3dias') {
        return agora - (3 * 24 * 60 * 60 * 1000);
    } else if (valor === '1mes') {
        return agora - (30 * 24 * 60 * 60 * 1000);
    }
    return 0;
}

function atualizarMinhasPosicoesRanking() {
    if (!usuarioAtualLogado) {
        const elR1 = document.getElementById('rank-treino-display');
        const elR2 = document.getElementById('rank-relampago-display');
        if (elR1) elR1.innerText = "(#-)";
        if (elR2) elR2.innerText = "(#-)";
        return;
    }

    const perfilAtivoLocal = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
    const perfilIdAtivo = perfilAtivoLocal ? (perfilAtivoLocal.perfilId || perfilAtivoLocal.id) : localStorage.getItem('perfil_ativo_id');

    getDocs(collection(db, "ranking")).then(snap => {
        dadosRanking = [];
        snap.forEach(doc => dadosRanking.push(doc.data()));

        const totais = {};
        dadosRanking.forEach(j => {
            let idChave = j.perfilId || String(j.nome).trim().toUpperCase();
            if (idChave) {
                if (!totais[idChave]) totais[idChave] = { acertos: 0, total: 0 };
                totais[idChave].acertos += parseInt(j.pontos !== undefined ? j.pontos : j.acertos) || 0;
                totais[idChave].total += parseInt(j.totalQuestoes) || 10;
            }
        });

        let rankingCalculado = Object.keys(totais).map(id => {
            let a = totais[id].acertos;
            let t = totais[id].total;
            let pct = t > 0 ? Math.round((a / t) * 100) : 0;
            return { id, acertos: a, total: t, pct };
        }).sort((a,b) => b.acertos - a.acertos || b.pct - a.pct);

        const posTreino = rankingCalculado.findIndex(p => p.id === perfilIdAtivo);
        const elR1 = document.getElementById('rank-treino-display');
        if (elR1) elR1.innerText = posTreino !== -1 ? `#${posTreino + 1}` : "Sem Rank";
    });

    getDocs(collection(db, "ranking_tempo")).then(snap => {
        dadosRankingTempo = [];
        snap.forEach(doc => dadosRankingTempo.push(doc.data()));

        const melhoresTempos = {};
        dadosRankingTempo.forEach(j => {
            let idChave = j.perfilId || String(j.nome).trim().toUpperCase();
            let t = parseFloat(j.tempoSegundos || (j.tempoMs ? j.tempoMs / 1000 : 999999));
            if (idChave && !isNaN(t)) {
                if (!melhoresTempos[idChave] || t < melhoresTempos[idChave].tempo) {
                    melhoresTempos[idChave] = { tempo: t };
                }
            }
        });

        let reg = Object.entries(melhoresTempos).map(([id, d]) => ({ id, tempo: d.tempo }));
        reg.sort((a,b) => a.tempo - b.tempo);
        
        const posRelampago = reg.findIndex(j => j.id === perfilIdAtivo);
        const elR2 = document.getElementById('rank-relampago-display');
        if (elR2) elR2.innerText = posRelampago !== -1 ? `#${posRelampago + 1}` : "Sem Rank";
    });
}

window.carregarRankingTreino = function() {
    const elList = document.getElementById('lista-ranking');
    if (elList) elList.innerHTML = "<p style='text-align:center;'>Carregando ranking...</p>";

    const perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    const perfilAtivoLocal = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
    const dataCorte = obterDataCorteFiltro();

    getDocs(collection(db, "ranking")).then(snap => {
        let listaBruta = [];
        
        snap.forEach(doc => {
            const data = doc.data();
            
            let timeDoc = Date.now();
            if (data.timestamp) {
                if (typeof data.timestamp.toDate === 'function') {
                    timeDoc = data.timestamp.toDate().getTime();
                } else if (typeof data.timestamp === 'number') {
                    timeDoc = data.timestamp;
                } else if (typeof data.timestamp === 'string') {
                    timeDoc = new Date(data.timestamp).getTime() || Date.now();
                }
            }

            if (timeDoc >= dataCorte || dataCorte === 0) {
                listaBruta.push({ ...data, docId: doc.id });
            }
        });

        if (listaBruta.length === 0) {
            if (elList) elList.innerHTML = "<p style='text-align:center; color: #cbd5e1;'>Nenhum registro encontrado para este período.</p>";
            return;
        }

        const mapaJogadores = {};

        listaBruta.forEach(item => {
            const nomeOriginal = String(item.nome || item.nickname || 'Jogador').trim();
            if (!nomeOriginal) return;

            const idChave = (item.perfilId || item.userId || ('user_' + nomeOriginal.toLowerCase())).trim();

            const perfilEncontrado = perfisLocais.find(p => (p.perfilId || p.id) === idChave);
            const nomeExibicao = perfilEncontrado ? perfilEncontrado.nome : nomeOriginal;

            const acertosPartida = parseInt(item.acertos !== undefined ? item.acertos : (item.pontos || 0)) || 0;
            const questoesPartida = parseInt(item.totalQuestoes) || 10;

            if (!mapaJogadores[idChave]) {
                mapaJogadores[idChave] = {
                    perfilId: idChave,
                    nomeExibicao: nomeExibicao,
                    pontos: acertosPartida,
                    totalQuestoes: questoesPartida
                };
            } else {
                mapaJogadores[idChave].pontos += acertosPartida;
                mapaJogadores[idChave].totalQuestoes += questoesPartida;
                if (nomeExibicao !== 'Jogador') {
                    mapaJogadores[idChave].nomeExibicao = nomeExibicao;
                }
            }
        });

        const listaConsolidada = Object.values(mapaJogadores);
        listaConsolidada.sort((a, b) => b.pontos - a.pontos || b.totalQuestoes - a.totalQuestoes);

        renderizarListaRankingGeral(
            listaConsolidada, 
            perfilAtivoLocal ? (perfilAtivoLocal.perfilId || perfilAtivoLocal.id) : null, 
            'treino'
        );

    }).catch(err => {
        console.error("Erro ao carregar ranking de treino:", err);
        if (elList) elList.innerHTML = "<p style='text-align:center; color:#ef4444;'>Erro ao carregar ranking do banco.</p>";
    });
};

window.carregarRankingRelampago = function() {
    const elList = document.getElementById('lista-ranking');
    if (elList) elList.innerHTML = "<p style='text-align:center;'>Carregando ranking...</p>";

    const elSelectOp = document.getElementById('select-op-relampago');
    const opSelecionada = elSelectOp ? elSelectOp.value.toLowerCase().trim() : 'geral';

    const perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    const perfilAtivoLocal = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
    const dataCorte = obterDataCorteFiltro();

    function categorizarOperacao(opStr) {
        const op = String(opStr || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (op.includes('mult') || op.includes('x')) return 'multiplicacao';
        if (op.includes('div')) return 'divisao';
        if (op.includes('adic') || op.includes('som') || op.includes('add')) return 'adicao';
        if (op.includes('sub')) return 'subtracao';
        if (op.includes('insan')) return 'insano';
        return op || 'geral';
    }

    getDocs(collection(db, "ranking_tempo")).then(snap => {
        let listaBruta = [];
        snap.forEach(doc => {
            const data = doc.data();
            let timeDoc = Date.now();
            if (data.timestamp) {
                if (typeof data.timestamp.toDate === 'function') {
                    timeDoc = data.timestamp.toDate().getTime();
                } else if (typeof data.timestamp === 'number') {
                    timeDoc = data.timestamp;
                }
            }

            if (timeDoc >= dataCorte || dataCorte === 0) {
                const opCategoria = categorizarOperacao(data.operacao);
                if (opSelecionada === 'geral' || opCategoria === opSelecionada) {
                    listaBruta.push({ ...data, docId: doc.id });
                }
            }
        });

        if (listaBruta.length === 0) {
            if (elList) elList.innerHTML = "<p style='text-align:center; color: #cbd5e1;'>Nenhum tempo registrado para este filtro.</p>";
            return;
        }

        const mapaMelhoresTempos = {};

        listaBruta.forEach(item => {
            const opCategoria = categorizarOperacao(item.operacao);
            const idUnico = (item.perfilId || item.userId || ('user_' + String(item.nome || '').trim().toLowerCase())).trim();

            const perfilLocal = perfisLocais.find(p => (p.perfilId || p.id) === idUnico);
            const nomeAtualizado = perfilLocal ? perfilLocal.nome : (item.nome || 'Jogador');

            let tempoEmMs = 999999;
            if (item.tempoMs !== undefined && !isNaN(item.tempoMs)) {
                tempoEmMs = parseFloat(item.tempoMs);
            } else if (item.tempoSegundos !== undefined && !isNaN(item.tempoSegundos)) {
                tempoEmMs = Math.round(parseFloat(item.tempoSegundos) * 1000);
            }

            const chaveDeduplicacao = (opSelecionada === 'geral') ? `${idUnico}_${opCategoria}` : idUnico;

            if (!mapaMelhoresTempos[chaveDeduplicacao] || tempoEmMs < mapaMelhoresTempos[chaveDeduplicacao].tempoMs) {
                mapaMelhoresTempos[chaveDeduplicacao] = { 
                    ...item, 
                    perfilId: idUnico,
                    nomeExibicao: nomeAtualizado,
                    operacao: opCategoria,
                    tempoMs: tempoEmMs 
                };
            }
        });

        const listaConsolidada = Object.values(mapaMelhoresTempos);
        listaConsolidada.sort((a, b) => a.tempoMs - b.tempoMs);

        renderizarListaRankingGeral(
            listaConsolidada, 
            perfilAtivoLocal ? (perfilAtivoLocal.perfilId || perfilAtivoLocal.id) : null, 
            'relampago',
            opSelecionada
        );

    }).catch(err => {
        console.error("Erro ao carregar ranking relâmpago:", err);
        if (elList) elList.innerHTML = "<p style='text-align:center; color:#ef4444;'>Erro ao carregar ranking.</p>";
    });
};

function renderizarListaRankingGeral(lista, perfilAtivoId, tipoRanking, opSelecionada = 'geral') {
    const elList = document.getElementById('lista-ranking');
    if (!elList) return;

    if (!lista || lista.length === 0) {
        elList.innerHTML = "<p style='text-align:center; color: #cbd5e1;'>Nenhum registro encontrado.</p>";
        return;
    }

    const mapaNomesOps = {
        multiplicacao: '✖️ Multiplicação',
        divisao: '➗ Divisão',
        adicao: '➕ Adição',
        subtracao: '➖ Subtração',
        insano: '🔥 Modo Insano'
    };

    let html = '';
    lista.slice(0, 50).forEach((item, index) => {
        const posicao = index + 1;
        const ePerfilAtivo = perfilAtivoId && (item.perfilId === perfilAtivoId || item.userId === perfilAtivoId);
        
        let valorExibido = '';
        let subtituloDetalhe = '';

        if (tipoRanking === 'relampago') {
            const seg = (item.tempoMs / 1000).toFixed(1);
            valorExibido = `${seg}s`;

            if (opSelecionada === 'geral') {
                const opChave = String(item.operacao || '').toLowerCase().trim();
                const opNomeFormatado = mapaNomesOps[opChave] || '⚡ Relâmpago';
                
                subtituloDetalhe = `
                    <span style="font-size: 11px; color: #38bdf8; font-weight: 700; margin-top: 2px; display: block;">
                        ${opNomeFormatado}
                    </span>
                `;
            }
        } else {
            valorExibido = `${item.pontos} pts`;
            subtituloDetalhe = `
                <span style="font-size: 11px; color: #38bdf8; font-weight: 600; margin-top: 2px; display: block;">
                    🎯 ${item.pontos} acertos de ${item.totalQuestoes} questões
                </span>
            `;
        }

        html += `
            <div class="item-ranking-card ${ePerfilAtivo ? 'destaque-perfil-ativo' : ''}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; margin-bottom: 8px; background: ${ePerfilAtivo ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)'}; border: ${ePerfilAtivo ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)'}; border-radius: 14px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 900; color: ${posicao <= 3 ? '#f1c40f' : '#cbd5e1'}; font-size: 16px; min-width: 28px;">#${posicao}</span>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                        <strong style="color: #fff; font-size: 14px; font-weight: 800;">
                            ${item.nomeExibicao} ${ePerfilAtivo ? '⭐' : ''}
                        </strong>
                        ${subtituloDetalhe}
                    </div>
                </div>
                <span style="font-weight: 900; color: #38bdf8; font-size: 16px; margin-left: 10px; flex-shrink: 0;">${valorExibido}</span>
            </div>
        `;
    });

    elList.innerHTML = html;
}
//#endregion


// =========================================================================
// 10. SISTEMA DE VIDAS, MONETIZAÇÃO E PAYWALL
// =========================================================================
//#region [10] VIDAS, REGENERAÇÃO E PAYWALL
const TEMPO_REGENERACAO_MS = 60 * 60 * 1000;
let intervaloTimerVida = null;

function verificarERegenerarVidas() {
    if (window.verificarSeEhPro()) return;

    const dataHojeStr = new Date().toLocaleDateString('pt-BR');
    let ultimaDataReset = localStorage.getItem('usuario_data_reset_vidas');

    if (ultimaDataReset !== dataHojeStr) {
        localStorage.setItem('usuario_vidas', '5');
        localStorage.setItem('usuario_data_reset_vidas', dataHojeStr);
        localStorage.removeItem('usuario_proxima_vida_timestamp');
        if (typeof window.atualizarInterfaceVidas === 'function') window.atualizarInterfaceVidas();
        return;
    }

    let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);
    let proximaVidaTimestamp = parseInt(localStorage.getItem('usuario_proxima_vida_timestamp') || '0', 10);
    const agora = Date.now();

    if (saldoVidas > 0) {
        localStorage.removeItem('usuario_proxima_vida_timestamp');
        return;
    }

    if (saldoVidas === 0 && proximaVidaTimestamp && agora >= proximaVidaTimestamp) {
        saldoVidas = 1;
        localStorage.setItem('usuario_vidas', saldoVidas.toString());
        localStorage.removeItem('usuario_proxima_vida_timestamp');

        if (typeof window.atualizarInterfaceVidas === 'function') {
            window.atualizarInterfaceVidas();
        }
    }
}

function atualizarDisplayTimerVidas() {
    const elTimer = document.getElementById('display-timer-vidas');
    const elTimerModal = document.getElementById('tempo-restante-modal-sem-vidas');

    let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);
    if (window.verificarSeEhPro() || saldoVidas > 0) {
        if (elTimer) elTimer.style.display = 'none';
        return;
    }

    let proximaVidaTimestamp = parseInt(localStorage.getItem('usuario_proxima_vida_timestamp') || '0', 10);
    const agora = Date.now();

    if (!proximaVidaTimestamp) return;

    const tempoRestanteMs = proximaVidaTimestamp - agora;

    if (tempoRestanteMs > 0) {
        const minutos = Math.floor(tempoRestanteMs / 60000);
        const segundos = Math.floor((tempoRestanteMs % 60000) / 1000);

        const minStr = String(minutos).padStart(2, '0');
        const segStr = String(segundos).padStart(2, '0');

        const tempoFormatado = `${minStr}:${segStr}`;

        if (elTimer) {
            elTimer.innerHTML = `<span style="font-size: 11px;">⏳</span> ${tempoFormatado}`;
            elTimer.style.display = 'inline-flex';
        }

        if (elTimerModal) {
            elTimerModal.innerText = tempoFormatado;
        }
    } else {
        verificarERegenerarVidas();
    }
}

(function iniciarLoopTimerVidas() {
    if (intervaloTimerVida) clearInterval(intervaloTimerVida);
    intervaloTimerVida = setInterval(() => {
        verificarERegenerarVidas();
        atualizarDisplayTimerVidas();
    }, 1000);
})();

window.consumirVidaParaEntrar = function() {
    if (window.verificarSeEhPro()) return true;

    let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);

    if (saldoVidas <= 0) {
        if (typeof window.exibirModalVidasEsgotadasTaby === 'function') {
            window.exibirModalVidasEsgotadasTaby();
        } else if (typeof window.abrirTelaCheckoutPremium === 'function') {
            window.abrirTelaCheckoutPremium();
        } else {
            alert("⚠️ Vidas esgotadas! Aguarde o tempo de regeneração ou assista a um vídeo.");
        }
        return false;
    }

    saldoVidas -= 1;
    localStorage.setItem('usuario_vidas', saldoVidas.toString());

    if (saldoVidas === 0) {
        const proximoTempo = Date.now() + TEMPO_REGENERACAO_MS;
        localStorage.setItem('usuario_proxima_vida_timestamp', proximoTempo.toString());
    }

    if (typeof window.atualizarInterfaceVidas === 'function') {
        window.atualizarInterfaceVidas();
    }

    return true;
};

window.atualizarInterfaceVidas = function() {
    const plano = window.obterPlanoAtivo();
    const ehPago = window.verificarSeEhPro();

    const btnVideo = document.getElementById('btn-assistir-ad-vidas');
    const btnRelatorio = document.getElementById('btn-abrir-relatorio');

    if (ehPago) {
        if (btnVideo) btnVideo.style.display = 'none';
        if (btnRelatorio) btnRelatorio.style.display = 'inline-flex';
    } else {
        if (btnVideo) btnVideo.style.display = 'inline-flex';
        if (btnRelatorio) btnRelatorio.style.display = 'none';
    }

    const badgeTopo = document.getElementById('badge-plano-topo');
    if (badgeTopo) {
        if (ehPago) {
            badgeTopo.style.display = 'inline-flex';
            badgeTopo.innerText = (plano === 'pro') ? 'PRO 💎' : 'PREMIUM 👑';
            badgeTopo.className = `badge-plano-topo badge-estilo-${plano}`;
        } else {
            badgeTopo.style.display = 'none';
        }
    }

    window.atualizarHUDVidasPartida();

    if (typeof window.atualizarEstadoBotoesModo === 'function') {
        window.atualizarEstadoBotoesModo();
    }
};

window.atualizarEstadoBotoesModo = function() {
    const ehPago = window.verificarSeEhPro();

    const btnTrilha = document.getElementById('btn-modo-trilha');
    const btnTreino = document.getElementById('btn-modo-treino');
    const btnRelampago = document.getElementById('btn-modo-relampago');
    const btnTabuadas = document.getElementById('btn-consultar-tabuadas') || document.querySelector('.btn-consultar-tabuadas');

    const desativarBotao = (el) => {
        if (!el) return;
        el.disabled = true;
        el.classList.add('modo-desativado');
        el.style.opacity = '0.4';
        el.style.filter = 'grayscale(80%)';
        el.style.pointerEvents = 'none';
        el.style.cursor = 'not-allowed';
    };

    const ativarBotao = (el) => {
        if (!el) return;
        el.disabled = false;
        el.classList.remove('modo-desativado');
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
    };

    if (btnTabuadas) {
        ativarBotao(btnTabuadas);
    }

    if (ehPago) {
        [btnTreino, btnRelampago, btnTrilha].forEach(ativarBotao);
        return;
    }

    let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '5', 10);

    if (saldoVidas > 0) {
        [btnTreino, btnRelampago, btnTrilha].forEach(ativarBotao);
    } else {
        [btnTreino, btnRelampago, btnTrilha].forEach(desativarBotao);
    }
};

window.abrirTelaCheckoutPremium = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');
    const paywall = document.getElementById('modal-paywall-planos');
    if (paywall) {
        paywall.classList.remove('oculto');
        paywall.style.display = 'flex';
    }
};

window.fecharPaywall = function() {
    if (typeof window.tocarSom === 'function') {
        tocarSom('clique');
    }
    const paywall = document.getElementById('modal-paywall-planos');
    if (paywall) {
        paywall.classList.add('oculto');
        paywall.style.display = 'none';
    }
};

const modalPaywall = document.getElementById('modal-paywall-planos');
if (modalPaywall) {
    modalPaywall.classList.add('oculto');
    modalPaywall.style.display = 'none';

    modalPaywall.addEventListener('click', (e) => {
        if (e.target === modalPaywall) {
            window.fecharPaywall();
        }
    });
}

window.processarPagamento = function(tipoPlano) {
    if (typeof tocarSom === 'function') tocarSom('conquista');
    
    let planoNome = 'Plano PRO 💎';
    let valor = 'R$ 9,90';
    let ehPro = tipoPlano && tipoPlano.startsWith('pro_');

    if (tipoPlano === 'pro_mensal') {
        planoNome = 'Plano PRO Mensal 💎';
        valor = 'R$ 9,90';
    } else if (tipoPlano === 'pro_trimestral') {
        planoNome = 'Plano PRO Trimestral 💎';
        valor = 'R$ 24,90';
    } else if (tipoPlano === 'pro_semestral') {
        planoNome = 'Plano PRO Semestral 💎';
        valor = 'R$ 34,90';
    } else if (tipoPlano === 'fam_mensal') {
        planoNome = 'PREMIUM Família Mensal 👑';
        valor = 'R$ 14,90';
    } else if (tipoPlano === 'fam_trimestral') {
        planoNome = 'PREMIUM Família Trimestral 👑';
        valor = 'R$ 32,90';
    } else if (tipoPlano === 'fam_semestral') {
        planoNome = 'PREMIUM Família Semestral 👑';
        valor = 'R$ 49,90';
    }

    const confirmou = confirm(
        `[ MODO DE TESTES ]\n\n` +
        `Você selecionou o ${planoNome} (${valor}).\n` +
        `Deseja simular a aprovação do pagamento agora?`
    );

    if (confirmou) {
        const dataAgora = Date.now();
        localStorage.setItem('usuario_data_assinatura', dataAgora.toString());

        if (ehPro) {
            window.definirPlanoAtivo('pro');
            if (typeof dadosTrilhaUsuario !== 'undefined') {
                dadosTrilhaUsuario.plano = 'pro';
                dadosTrilhaUsuario.ehPremium = true;
            }

            alert(`🎉 Pagamento do ${planoNome} aprovado com sucesso!\n\nVidas ilimitadas e acesso total à Trilha liberados!`);
        } else {
            window.definirPlanoAtivo('premium');

            if (typeof dadosTrilhaUsuario !== 'undefined') {
                dadosTrilhaUsuario.plano = 'premium';
                dadosTrilhaUsuario.ehPremium = true;
            }

            alert(`🎉 Pagamento do ${planoNome} aprovado com sucesso!\n\nAté 3 perfis individuais e recursos de família liberados!`);
        }

        window.fecharPaywall();

        if (typeof window.sincronizarInterfaceGlobalPlano === 'function') {
            window.sincronizarInterfaceGlobalPlano();
        }
        if (typeof renderizarMapaTrilha === 'function') {
            renderizarMapaTrilha();
        }
        if (typeof atualizarVisibilidadePainelPais === 'function') {
            atualizarVisibilidadePainelPais();
        }
    }
};

window.assistirAnuncioPorVida = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');

    const concederVidaEAtualizarUI = function() {
        let saldoVidas = parseInt(localStorage.getItem('usuario_vidas') || '0', 10);
        saldoVidas += 1;
        localStorage.setItem('usuario_vidas', saldoVidas.toString());
        
        if (typeof window.sincronizarInterfaceGlobalPlano === 'function') {
            window.sincronizarInterfaceGlobalPlano();
        } else if (typeof window.atualizarInterfaceVidas === 'function') {
            window.atualizarInterfaceVidas();
        }

        if (typeof tocarSom === 'function') {
            tocarSom('conquista');
        }

        alert("🎉 Parabéns! Você assistiu ao vídeo e ganhou +1 Vida! ❤️");
    };

    if (window.AdsManager && typeof window.AdsManager.exibirRecompensado === 'function') {
        window.AdsManager.exibirRecompensado(
            concederVidaEAtualizarUI,
            function() {
                console.log("Anúncio premiado não concluído ou indisponível.");
            }
        );
    } else {
        concederVidaEAtualizarUI();
    }
};

window.exibirModalVidasEsgotadasTaby = function() {
    if (typeof tocarSom === 'function') tocarSom('erro');

    const modalExistente = document.getElementById('modal-vidas-esgotadas');
    if (modalExistente) modalExistente.remove();

    const proximaVidaTimestamp = parseInt(localStorage.getItem('usuario_proxima_vida_timestamp') || '0', 10);
    const agora = Date.now();
    let tempoRestanteTexto = "15:00";

    if (proximaVidaTimestamp > agora) {
        const ms = proximaVidaTimestamp - agora;
        const min = Math.floor(ms / 60000);
        const seg = Math.floor((ms % 60000) / 1000);
        tempoRestanteTexto = `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    }

    const modal = document.createElement('div');
    modal.id = 'modal-vidas-esgotadas';
    modal.className = 'paywall-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(7, 10, 18, 0.92);
        backdrop-filter: blur(10px);
        display: flex; justify-content: center; align-items: center;
        z-index: 99999; padding: 16px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="position: relative; width: 380px; max-width: 92vw; background: #0f172a; border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 24px; padding: 24px 18px 20px 18px; box-sizing: border-box; color: #fff; text-align: center; box-shadow: 0 0 30px rgba(239, 68, 68, 0.25), 0 20px 50px rgba(0, 0, 0, 0.9); display: flex; flex-direction: column; align-items: center; gap: 14px;">
            <button onclick="document.getElementById('modal-vidas-esgotadas').remove()" aria-label="Fechar" style="position: absolute; top: 12px; right: 14px; background: transparent; border: none; color: #94a3b8; font-size: 18px; font-weight: 800; cursor: pointer; padding: 4px 8px; line-height: 1; transition: color 0.2s ease;">
                ✕
            </button>

            <img src="taby.png" onerror="this.onerror=null; this.src='icon144.png';" style="width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.6)); margin-top: 4px;">
            
            <h3 style="color: #ef4444; font-size: 19px; margin: 0; font-weight: 900; text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);">
                Ops! Suas Vidas Acabaram 💔
            </h3>
            
            <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 12px 14px; width: 100%; box-sizing: border-box;">
                <p style="color: #cbd5e1; font-size: 12.5px; line-height: 1.4; margin: 0 0 4px 0;">
                    Sua dedicação é incrível! Próxima vida grátis em: 
                    <span>⏳</span>
                    <b id="tempo-restante-modal-sem-vidas" style="color: #fde047; font-family: monospace; font-size: 14px; font-weight: 900; text-shadow: 0 0 8px rgba(234, 179, 8, 0.6);">${tempoRestanteTexto}</b>
                </p>
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">Escolha como deseja continuar:</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                <button onclick="document.getElementById('modal-vidas-esgotadas').remove(); window.assistirAnuncioPorVida();" style="width: 100%; min-height: 46px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.4) 100%); border: 1.5px solid #10b981; border-radius: 14px; color: #34d399; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);">
                    <span>🎬</span>
                    <span>Assistir Vídeo (+1 Vida Grátis)</span>
                </button>

                <button onclick="document.getElementById('modal-vidas-esgotadas').remove(); window.abrirTelaCheckoutPremium();" style="width: 100%; min-height: 46px; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); border: 1.5px solid #fbbf24; border-radius: 14px; color: #ffffff; font-size: 12px; font-weight: 900; letter-spacing: 0.3px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 0 14px rgba(245, 158, 11, 0.4);">
                    <span>👑</span>
                    <span>SEJA PRO/PREMIUM (VIDAS ILIMITADAS)</span>
                </button>

                <button onclick="document.getElementById('modal-vidas-esgotadas').remove();" style="background: transparent; border: none; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px; text-decoration: underline; text-underline-offset: 4px;">
                    Aguardar tempo de regeneração
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

window.abrirTelaGerenciarPlano = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');

    const modalExistente = document.getElementById('modal-gerenciar-plano');
    if (modalExistente) modalExistente.remove();

    const planoAtual = window.obterPlanoAtivo();
    const dataAssinaturaStr = localStorage.getItem('usuario_data_assinatura');
    let diasRestantes = 0;
    let dataValidadeTexto = "Sua conta é Gratuita";

    if (planoAtual === 'pro' || planoAtual === 'premium') {
        const dataInicio = dataAssinaturaStr ? parseInt(dataAssinaturaStr, 10) : Date.now();
        const diasTotais = (planoAtual === 'pro' ? 90 : 180);
        const dataFim = dataInicio + (diasTotais * 24 * 60 * 60 * 1000);
        const msRestantes = dataFim - Date.now();

        diasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)));
        const dataFimObj = new Date(dataFim);
        dataValidadeTexto = `Válido até ${dataFimObj.toLocaleDateString('pt-BR')}`;
    }

    let badgePlano = `<span style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 12px;">GRÁTIS 🔓</span>`;
    if (planoAtual === 'pro') {
        badgePlano = `<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 12px;">PRO 💎</span>`;
    } else if (planoAtual === 'premium') {
        badgePlano = `<span style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid #fbbf24; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 12px;">PREMIUM FAMÍLIA 👑</span>`;
    }

    const modal = document.createElement('div');
    modal.id = 'modal-gerenciar-plano';
    modal.className = 'paywall-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(7, 10, 18, 0.92);
        backdrop-filter: blur(10px);
        display: flex; justify-content: center; align-items: center;
        z-index: 99999; padding: 16px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="width: 380px; max-width: 92vw; max-height: 88vh; overflow-y: auto; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 24px; padding: 20px; box-sizing: border-box; color: #fff; box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 900; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                    💳 Meu Plano
                </h3>
                <button onclick="document.getElementById('modal-gerenciar-plano').remove()" style="background: rgba(255,255,255,0.1); border: none; color: #94a3b8; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-weight: 800; font-size: 14px;">✕</button>
            </div>

            <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 16px; margin-bottom: 18px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 12px; color: #94a3b8; font-weight: 700;">Status da Assinatura:</span>
                    ${badgePlano}
                </div>

                ${(planoAtual === 'pro' || planoAtual === 'premium') ? `
                    <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px;">
                        <span style="font-size: 32px; font-weight: 900; color: #4ade80;">${diasRestantes}</span>
                        <span style="font-size: 14px; color: #cbd5e1; font-weight: 700;">dias restantes</span>
                    </div>
                    <div style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">📅 ${dataValidadeTexto}</div>
                ` : `
                    <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0 12px 0; line-height: 1.4;">
                        Você está no plano <b>Grátis</b>. Assine o PRO ou PREMIUM para ter <b>vidas ilimitadas</b> e liberar todos os níveis da Trilha Espacial!
                    </p>
                    <button onclick="document.getElementById('modal-gerenciar-plano').remove(); window.abrirTelaCheckoutPremium();" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 1px solid #38bdf8; border-radius: 12px; color: #fff; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);">
                        ⚡ VIRAR PRO / PREMIUM AGORA
                    </button>
                `}
            </div>

            <div style="margin-bottom: 18px; text-align: left;">
                <h4 style="font-size: 14px; color: #38bdf8; margin: 0 0 10px 0; font-weight: 800;">📊 Tabela de Preços e Planos</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #fff; font-size: 13px;">💎 PRO Trimestral</strong>
                            <div style="font-size: 11px; color: #94a3b8;">Vidas ilimitadas • 1 Perfil</div>
                        </div>
                        <span style="font-weight: 900; color: #38bdf8; font-size: 14px;">R$ 24,90</span>
                    </div>

                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #fff; font-size: 13px;">👑 PREMIUM Família Trimestral</strong>
                            <div style="font-size: 11px; color: #94a3b8;">Até 3 Perfis • Relatórios dos Pais</div>
                        </div>
                        <span style="font-weight: 900; color: #fbbf24; font-size: 14px;">R$ 32,90</span>
                    </div>
                </div>
            </div>

            <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 14px; text-align: left; margin-bottom: 16px;">
                <div style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>🎁 CLUBE DE OFERTAS & CUPONS</span>
                </div>
                <p style="font-size: 11.5px; color: #cbd5e1; margin: 0; line-height: 1.45;">
                    Novas ofertas promocionais, cupons de desconto para renovação e pacotes para escolas estarão disponíveis diretamente nesta tela! Fique atento às notificações do Taby! 🤖✨
                </p>
            </div>

            <button onclick="document.getElementById('modal-gerenciar-plano').remove(); window.abrirTelaCheckoutPremium();" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; color: #f8fafc; font-weight: 800; font-size: 12.5px; cursor: pointer;">
                VER TODOS OS PLANOS E RENOVAÇÕES
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

window.alternarAbaPaywall = function(aba) {
    const btns = document.querySelectorAll('.tab-paywall-btn');
    const conteudoPro = document.getElementById('conteudo-aba-pro');
    const conteudoFam = document.getElementById('conteudo-aba-familia');

    btns.forEach(b => b.classList.remove('active'));

    if (aba === 'pro') {
        if (btns[0]) btns[0].classList.add('active');
        if (conteudoPro) conteudoPro.style.display = 'block';
        if (conteudoFam) conteudoFam.style.display = 'none';
        
        const cardDefault = conteudoPro ? conteudoPro.querySelector('.destaque-recomendado') : null;
        if (cardDefault) window.selecionarDuracao(cardDefault, 'pro_trimestral', '24,90');
    } else {
        if (btns[1]) btns[1].classList.add('active');
        if (conteudoPro) conteudoPro.style.display = 'none';
        if (conteudoFam) conteudoFam.style.display = 'block';

        const cardDefault = conteudoFam ? conteudoFam.querySelector('.destaque-recomendado') : null;
        if (cardDefault) window.selecionarDuracao(cardDefault, 'fam_trimestral', '32,90');
    }
};

window.selecionarDuracao = function(element, chavePlano, valorFormatado) {
    if (!element) return;
    const containerPai = element.closest('#conteudo-aba-pro, #conteudo-aba-familia');
    if (containerPai) {
        containerPai.querySelectorAll('.card-duracao').forEach(c => c.classList.remove('selecionado'));
    }

    element.classList.add('selecionado');
    window.planoSelecionadoKey = chavePlano;

    const btnConfirmar = document.getElementById('btn-paywall-confirmar');
    if (btnConfirmar) {
        btnConfirmar.innerHTML = `ASSINAR AGORA POR R$ ${valorFormatado} 🚀`;
    }
};

window.processarPagamentoSelecionado = function() {
    window.processarPagamento(window.planoSelecionadoKey);
};

window.abrirModalComparativo = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');
    const modalComp = document.getElementById('modal-comparativo-planos');
    if (modalComp) modalComp.style.display = 'flex';
};

window.fecharModalComparativo = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');
    const modalComp = document.getElementById('modal-comparativo-planos');
    if (modalComp) modalComp.style.display = 'none';
};

window.fecharModalComparativoEVoltarAosPlanos = function() {
    if (typeof tocarSom === 'function') tocarSom('clique');
    
    const comp = document.getElementById('modal-comparativo-planos');
    if (comp) comp.style.display = 'none';
    
    const paywall = document.getElementById('modal-paywall-planos');
    if (paywall) paywall.style.display = 'flex';
};

window.abrirModalPaywallComFoco = function(aba) {
    if (typeof tocarSom === 'function') tocarSom('clique');
    const paywall = document.getElementById('modal-paywall-planos');
    if (paywall) {
        paywall.style.display = 'flex';
        window.alternarAbaPaywall(aba || 'pro');
    }
};

window.atualizarVisibilidadePainelPais = function() {
    const planoAtual = window.obterPlanoAtivo();
    const ehPremiumFamilia = planoAtual === 'premium' || localStorage.getItem('usuario_is_premium_familia') === 'true';

    const btnPainelPais = document.getElementById('btn-painel-pais');
    if (btnPainelPais) {
        btnPainelPais.style.display = ehPremiumFamilia ? 'inline-flex' : 'none';
    }
};

window.atualizarIndicadoresPlanoUsuario = function() {
    window.sincronizarInterfaceGlobalPlano();
};
//#endregion

// =========================================================================
// 11. RELATÓRIO PEDAGÓGICO E CHART.JS
// =========================================================================
//#region [11] RELATÓRIO PEDAGÓGICO
window.abrirModalRelatorio = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');
    
    const modal = document.getElementById('modal-relatorio');
    if (modal) {
        modal.classList.remove('oculto', 'display-none');
        modal.style.display = 'flex';
        
        if (typeof window.carregarEstatisticasReaisRelatorio === 'function') {
            window.carregarEstatisticasReaisRelatorio();
        }
    }
};

window.atualizarCabecalhoRelatorioLimpo = function() {
    const perfilStr = localStorage.getItem('tabuada_perfil_ativo');
    let perfil = null;
    
    try {
        perfil = perfilStr ? JSON.parse(perfilStr) : null;
    } catch (e) {
        perfil = null;
    }

    const nomeAtivo = (perfil && perfil.nome) ? perfil.nome : 'JOGADOR';

    let fotoAtiva = 'icon144.png';
    if (perfil) {
        if (perfil.fotoUrlPersonalizada || perfil.fotoUrl) {
            fotoAtiva = perfil.fotoUrlPersonalizada || perfil.fotoUrl;
        } else if (perfil.skin && typeof AVATARES_TABY !== 'undefined' && AVATARES_TABY[perfil.skin]) {
            fotoAtiva = AVATARES_TABY[perfil.skin];
        }
    }

    const elNomeModal = document.getElementById('relatorio-nome-usuario');
    const elFotoModal = document.getElementById('relatorio-foto-perfil');

    if (elNomeModal) elNomeModal.innerText = nomeAtivo;

    if (elFotoModal) {
        elFotoModal.src = fotoAtiva;
        elFotoModal.onerror = function() {
            this.src = 'icon144.png';
            this.onerror = null;
        };
    }
};

window.carregarEstatisticasReaisRelatorio = function() {
    try {
        const perfilStr = localStorage.getItem('tabuada_perfil_ativo');
        let perfil = perfilStr ? JSON.parse(perfilStr) : null;
        
        const perfilIdAtivo = perfil ? (perfil.perfilId || perfil.id) : localStorage.getItem('perfil_ativo_id');
        const userIdAtual = (auth && auth.currentUser) ? auth.currentUser.uid : (perfil ? perfil.uid : null);
        const nomePerfilNorm = perfil && perfil.nome ? String(perfil.nome).trim().toUpperCase() : 'JOGADOR';

        let totalQuestoesGeral = 0;
        let totalAcertosGeral = 0;
        let tempoTotalMsGeral = 0;
        let contagemTempoPartidas = 0;

        const opsAcumulado = {
            multiplicacao: { acertos: 0, total: 0 },
            divisao:       { acertos: 0, total: 0 },
            adicao:        { acertos: 0, total: 0 },
            subtracao:     { acertos: 0, total: 0 }
        };

        const pertenceAoPerfil = (data) => {
            if (!data) return false;
            if (perfilIdAtivo && data.perfilId === perfilIdAtivo) return true;
            if (userIdAtual && data.userId === userIdAtual) return true;
            if (data.nome && String(data.nome).trim().toUpperCase() === nomePerfilNorm) return true;
            return false;
        };

        if (typeof getDocs === 'function' && typeof collection === 'function' && db) {
            Promise.all([
                getDocs(collection(db, "ranking")),
                getDocs(collection(db, "ranking_tempo"))
            ]).then(([snapRanking, snapTempo]) => {
                
                snapRanking.forEach(docSnap => {
                    const data = docSnap.data();
                    if (pertenceAoPerfil(data)) {
                        const qTot = parseInt(data.totalQuestoes) || 10;
                        const qAce = parseInt(data.acertos !== undefined ? data.acertos : (data.pontos || 0)) || 0;

                        totalQuestoesGeral += qTot;
                        totalAcertosGeral += qAce;

                        let opValida = data.operacao && opsAcumulado[data.operacao] ? data.operacao : 'multiplicacao';
                        opsAcumulado[opValida].total += qTot;
                        opsAcumulado[opValida].acertos += qAce;
                    }
                });

                snapTempo.forEach(docSnap => {
                    const data = docSnap.data();
                    if (pertenceAoPerfil(data)) {
                        const qTot = parseInt(data.totalQuestoes) || 10;
                        const qAce = parseInt(data.acertos) || 0;
                        let tSeg = parseFloat(data.tempoSegundos || (data.tempoMs ? data.tempoMs / 1000 : 0));

                        totalQuestoesGeral += qTot;
                        totalAcertosGeral += qAce;

                        if (!isNaN(tSeg) && tSeg > 0) {
                            tempoTotalMsGeral += (tSeg * 1000);
                            contagemTempoPartidas += qTot;
                        }

                        let opNorm = String(data.operacao || '').toLowerCase().trim();
                        if (opNorm.includes('mult') || opNorm.includes('x')) opNorm = 'multiplicacao';
                        else if (opNorm.includes('div')) opNorm = 'divisao';
                        else if (opNorm.includes('adic') || opNorm.includes('add')) opNorm = 'adicao';
                        else if (opNorm.includes('sub')) opNorm = 'subtracao';
                        else opNorm = 'multiplicacao';

                        opsAcumulado[opNorm].total += qTot;
                        opsAcumulado[opNorm].acertos += qAce;
                    }
                });

                atualizarDOMRelatorio();

            }).catch(e => {
                console.warn("Erro ao buscar documentos no Firebase:", e);
                atualizarDOMRelatorio();
            });
        } else {
            atualizarDOMRelatorio();
        }

        function atualizarDOMRelatorio() {
            const elTotalQtd = document.getElementById('relatorio-total-questoes');
            if (elTotalQtd) elTotalQtd.innerText = totalQuestoesGeral;

            const precisaoGeral = totalQuestoesGeral > 0 ? Math.round((totalAcertosGeral / totalQuestoesGeral) * 100) : 0;
            const elPrecisao = document.getElementById('relatorio-precisao');
            if (elPrecisao) elPrecisao.innerText = `${precisaoGeral}%`;

            const elMediaTempo = document.getElementById('relatorio-media-tempo');
            if (elMediaTempo) {
                elMediaTempo.innerText = (contagemTempoPartidas > 0 && tempoTotalMsGeral > 0)
                    ? `${(tempoTotalMsGeral / contagemTempoPartidas / 1000).toFixed(1)}s`
                    : "--s";
            }

            let planetasDominados = 0;
            try {
                const trilhaStr = localStorage.getItem('tabuada_trilha_progresso');
                const trilhaDados = trilhaStr ? JSON.parse(trilhaStr) : (window.dadosTrilhaUsuario || {});
                const prog = trilhaDados.progressoFasesTrilha || {};
                planetasDominados = Object.values(prog).filter(v => parseInt(v) >= 85).length;
            } catch (e) {}
            const elPlanetas = document.getElementById('relatorio-planetas');
            if (elPlanetas) elPlanetas.innerText = `${planetasDominados} / 15`;

            const ops = ['multiplicacao', 'divisao', 'adicao', 'subtracao'];
            const mapSufixos = { multiplicacao: 'mult', divisao: 'div', adicao: 'add', subtracao: 'sub' };

            ops.forEach(op => {
                const suf = mapSufixos[op];
                const dataOp = opsAcumulado[op];
                const tot = dataOp.total;
                const ace = dataOp.acertos;
                const pct = tot > 0 ? Math.round((ace / tot) * 100) : 0;

                const elQtd = document.getElementById(`qtd-${suf}`);
                if (elQtd) elQtd.innerText = tot;

                const elPct = document.getElementById(`percentual-${op}`);
                if (elPct) elPct.innerText = `${pct}%`;

                const elBadge = document.getElementById(`badge-status-${suf}`);
                if (elBadge) {
                    if (tot === 0) {
                        elBadge.innerText = "Sem Dados";
                        elBadge.className = "badge-status status-neutro";
                    } else if (pct >= 85) {
                        elBadge.innerText = "Muito Bom";
                        elBadge.className = "badge-status status-muito-bom";
                    } else if (pct >= 70) {
                        elBadge.innerText = "Quase Bom";
                        elBadge.className = "badge-status status-quase-bom";
                    } else {
                        elBadge.innerText = "Precisa Melhorar";
                        elBadge.className = "badge-status status-melhorar";
                    }
                }

                const elTend = document.getElementById(`tendencia-${suf}`);
                if (elTend) {
                    if (tot === 0) elTend.innerText = "➖";
                    else if (pct >= 80) elTend.innerHTML = "<span style='color:#10b981;'>▲ Evoluindo</span>";
                    else if (pct >= 60) elTend.innerHTML = "<span style='color:#f59e0b;'>► Estável</span>";
                    else elTend.innerHTML = "<span style='color:#ef4444;'>▼ Em Queda</span>";
                }
            });

            const elAnalise = document.getElementById('texto-analise-taby');
            if (elAnalise) {
                if (totalQuestoesGeral === 0) {
                    elAnalise.innerText = "Nenhuma partida registrada ainda no histórico deste perfil. Complete um desafio para iniciar a análise!";
                } else if (precisaoGeral >= 85) {
                    elAnalise.innerText = "Excelente desempenho global! O aluno demonstra ótima retenção e agilidade de raciocínio.";
                } else {
                    elAnalise.innerText = "Bom progresso geral! Pratique no Modo Estudo para reforçar os pontos com menor aproveitamento.";
                }
            }
        }

    } catch (e) {
        console.error("Erro ao sincronizar relatório:", e);
    }
};

window.fecharModalRelatorio = function() {
    const modal = document.getElementById('modal-relatorio');
    if (modal) modal.style.display = 'none';
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');
};

window.alternarAbaRelatorio = function(aba) {
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');

    const btnStats = document.getElementById('aba-btn-stats');
    const btnEvolucao = document.getElementById('aba-btn-evolucao');
    const btnVinculo = document.getElementById('aba-btn-vinculo');

    const abaStats = document.getElementById('conteudo-aba-stats');
    const abaEvolucao = document.getElementById('conteudo-aba-evolucao');
    const abaVinculo = document.getElementById('conteudo-aba-vinculo');

    [btnStats, btnEvolucao, btnVinculo].forEach(btn => {
        if (btn) btn.classList.remove('ativo');
    });

    [abaStats, abaEvolucao, abaVinculo].forEach(div => {
        if (div) {
            div.style.display = 'none';
            div.classList.remove('ativo');
        }
    });

    if (aba === 'stats') {
        if (btnStats) btnStats.classList.add('ativo');
        if (abaStats) {
            abaStats.style.display = 'block';
            abaStats.classList.add('ativo');
        }
    } else if (aba === 'evolucao') {
        if (btnEvolucao) btnEvolucao.classList.add('ativo');
        if (abaEvolucao) {
            abaEvolucao.style.display = 'block';
            abaEvolucao.classList.add('ativo');
        }
        if (typeof window.atualizarGraficosEvolucao === 'function') {
            window.atualizarGraficosEvolucao();
        }
    } else if (aba === 'vinculo') {
        if (btnVinculo) btnVinculo.classList.add('ativo');
        if (abaVinculo) {
            abaVinculo.style.display = 'block';
            abaVinculo.classList.add('ativo');
        }
    }
};

if (typeof ChartDataLabels !== 'undefined' && typeof Chart !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.atualizarGraficosEvolucao = function() {
    if (typeof Chart === 'undefined') return;

    const filtroOp = document.getElementById('filtro-operacao-grafico')?.value || 'todos';
    const filtroPeriodo = document.getElementById('filtro-periodo-grafico')?.value || '7dias';

    const perfilStr = localStorage.getItem('tabuada_perfil_ativo');
    let perfil = perfilStr ? JSON.parse(perfilStr) : null;
    const perfilIdAtivo = perfil ? (perfil.perfilId || perfil.id) : localStorage.getItem('perfil_ativo_id');
    const userIdAtual = (auth && auth.currentUser) ? auth.currentUser.uid : (perfil ? perfil.uid : null);
    const nomePerfilNorm = perfil && perfil.nome ? String(perfil.nome).trim().toUpperCase() : 'JOGADOR';

    const diasQtd = filtroPeriodo === '7dias' ? 7 : 30;
    const labelsDatas = [];
    const mapaDias = {};

    const hoje = new Date();
    for (let i = diasQtd - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(hoje.getDate() - i);
        const chaveData = `${d.getDate()}/${d.getMonth() + 1}`;
        labelsDatas.push(chaveData);
        mapaDias[chaveData] = { acertos: 0, total: 0 };
    }

    const processarDocumentos = (snap) => {
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const pertence = (perfilIdAtivo && data.perfilId === perfilIdAtivo) ||
                             (userIdAtual && data.userId === userIdAtual) ||
                             (data.nome && String(data.nome).trim().toUpperCase() === nomePerfilNorm);

            if (pertence) {
                if (filtroOp !== 'todos' && data.operacao && data.operacao !== filtroOp) {
                    return;
                }

                let dataDoc = new Date();
                if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                    dataDoc = data.timestamp.toDate();
                } else if (data.data) {
                    const partes = String(data.data).split('/');
                    if (partes.length === 3) dataDoc = new Date(partes[2], partes[1] - 1, partes[0]);
                }

                const chaveDoc = `${dataDoc.getDate()}/${dataDoc.getMonth() + 1}`;
                if (mapaDias[chaveDoc]) {
                    mapaDias[chaveDoc].total += parseInt(data.totalQuestoes) || 10;
                    mapaDias[chaveDoc].acertos += parseInt(data.acertos !== undefined ? data.acertos : (data.pontos || 0)) || 0;
                }
            }
        });
    };

    if (typeof getDocs === 'function' && typeof collection === 'function' && db) {
        Promise.all([
            getDocs(collection(db, "ranking")),
            getDocs(collection(db, "ranking_tempo"))
        ]).then(([snapRanking, snapTempo]) => {
            processarDocumentos(snapRanking);
            processarDocumentos(snapTempo);
            renderizarCanvasGraficos();
        }).catch(e => {
            console.warn("Erro ao carregar dados do Firestore para os gráficos:", e);
            renderizarCanvasGraficos();
        });
    } else {
        renderizarCanvasGraficos();
    }

    function renderizarCanvasGraficos() {
        const dadosPrecisao = [];
        const dadosVolume = [];

        labelsDatas.forEach(dataKey => {
            const dia = mapaDias[dataKey];
            const acc = dia.total > 0 ? Math.round((dia.acertos / dia.total) * 100) : 0;
            dadosPrecisao.push(acc);
            dadosVolume.push(dia.total);
        });

        const ctxPrecisao = document.getElementById('graficoEvolucaoPrecisao')?.getContext('2d');
        if (ctxPrecisao) {
            if (instanciaGraficoPrecisao) instanciaGraficoPrecisao.destroy();

            instanciaGraficoPrecisao = new Chart(ctxPrecisao, {
                type: 'line',
                data: {
                    labels: labelsDatas,
                    datasets: [{
                        label: 'Precisão (%)',
                        data: dadosPrecisao,
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 5,
                        pointBackgroundColor: '#38bdf8'
                    }]
                },
                options: {
                    responsive: true,
                    layout: { padding: { top: 22, right: 10, left: 10 } },
                    scales: {
                        y: { min: 0, max: 110, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            align: 'top',
                            anchor: 'center',
                            offset: 4,
                            color: '#38bdf8',
                            font: { weight: 'bold', size: 11 },
                            formatter: (val) => val > 0 ? val + '%' : ''
                        }
                    }
                }
            });
        }

        const ctxVolume = document.getElementById('graficoVolumeQuestoes')?.getContext('2d');
        if (ctxVolume) {
            if (instanciaGraficoVolume) instanciaGraficoVolume.destroy();

            instanciaGraficoVolume = new Chart(ctxVolume, {
                type: 'bar',
                data: {
                    labels: labelsDatas,
                    datasets: [{
                        label: 'Questões Resolvidas',
                        data: dadosVolume,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    layout: { padding: { top: 22, right: 10, left: 10 } },
                    scales: {
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            align: 'end',
                            anchor: 'end',
                            offset: -2,
                            color: '#10b981',
                            font: { weight: 'bold', size: 12 },
                            formatter: (val) => val > 0 ? val : ''
                        }
                    }
                }
            });
        }
    }
};
//#endregion

// =========================================================================
// 12. MODO ESTUDO DE TABUADAS
// =========================================================================
//#region [12] MODO ESTUDO DE TABUADAS

window.abrirModoConsulta = function(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    window.mudarTela('tela-aprender');
};

window.mostrarTelaAprender = function(e) {
    window.abrirModoConsulta(e);
};

window.abrirTabuadas = function(tipo) {
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');
    
    window.tipoTabuadaEstudo = tipo;
    window.mudarTela('tela-visualizar-tabuadas');

    const elTit = document.getElementById('titulo-tipo-tabuada');
    const nomesOperacoes = {
        multiplicacao: 'MULTIPLICAÇÃO',
        divisao: 'DIVISÃO',
        adicao: 'ADIÇÃO',
        subtracao: 'SUBTRAÇÃO'
    };
    
    if (elTit) elTit.innerText = "Tabuada - " + (nomesOperacoes[tipo] || tipo.toUpperCase());

    const botoesNum = document.querySelectorAll('.grid-num-tabuada button, .btn-num-tabuada');
    botoesNum.forEach(btn => btn.classList.remove('selecionado'));

    const elRes = document.getElementById('resultado-lista-tabuada');
    if (elRes) {
        elRes.innerHTML = `
            <div style="text-align: center; padding: 25px 15px; color: #cbd5e1; font-size: 14px; background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(56, 189, 248, 0.2); border-radius: 16px; margin-top: 10px;">
                👆 <strong style="color: #38bdf8;">Toque em um número acima</strong> para carregar a tabuada.
            </div>
        `;
    }
};

window.gerarListaTabuada = function(num, evt) {
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');

    const botoesNum = document.querySelectorAll('.grid-num-tabuada button, .btn-num-tabuada');
    botoesNum.forEach(btn => btn.classList.remove('ativo', 'selecionado'));

    let btnClicado = document.getElementById(`btn-num-${num}`);
    if (!btnClicado && evt && evt.currentTarget) {
        btnClicado = evt.currentTarget;
    }

    if (btnClicado) {
        btnClicado.classList.add('ativo');
    }

    const opAtual = window.tipoTabuadaEstudo || 'multiplicacao';

    let html = `<div class="lista-tabuada-1col">`;

    for (let i = 1; i <= 10; i++) {
        let operacaoTexto = "";
        
        if (opAtual === 'multiplicacao') {
            operacaoTexto = `${num} × ${i} = <b>${num * i}</b>`;
        } else if (opAtual === 'divisao') {
            operacaoTexto = `${num * i} ÷ ${num} = <b>${i}</b>`;
        } else if (opAtual === 'adicao') {
            operacaoTexto = `${num} + ${i} = <b>${num + i}</b>`;
        } else if (opAtual === 'subtracao') {
            operacaoTexto = `${num + i} - ${num} = <b>${i}</b>`;
        }

        html += `<div class="item-linha-tabuada-enxuta">${operacaoTexto}</div>`;
    }
    
    html += `</div>`;

    const elRes = document.getElementById('resultado-lista-tabuada');
    if (elRes) elRes.innerHTML = html;
};
//#endregion

// =========================================================================
// 13. SEGURANÇA E EXCLUSÃO DE PERFIS / CONTAS
// =========================================================================
//#region [13] SEGURANÇA E EXCLUSÃO
window.fecharModalExclusao = function() {
    perfilParaExcluirTemp = null;
    
    const idsModais = ['modal-confirmar-exclusao', 'modal-confirmar-exclusao-seguranca', 'modal-paywall-planos'];
    idsModais.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('oculto');
            modal.style.display = 'none';
        }
    });

    if (!auth.currentUser || !localStorage.getItem('tabuada_perfil_ativo')) {
        if (typeof window.mudarTela === 'function') {
            window.mudarTela('tela-autenticacao');
        }
    }
};

window.fecharModalSegurancaExclusao = function() {
    window.fecharModalExclusao();
};

window.confirmarExclusaoEfetivaPerfil = async function(idTarget = null) {
    const perfilTargetId = idTarget || (perfilParaExcluirTemp ? perfilParaExcluirTemp.perfilId : null);
    if (!perfilTargetId) return;

    const nomePerfil = perfilParaExcluirTemp ? perfilParaExcluirTemp.nomePerfil : "Perfil";
    const usuarioLogado = auth.currentUser;
    const userId = usuarioLogado ? usuarioLogado.uid : 'anonimo';

    try {
        const qRelampago = query(collection(db, "ranking_tempo"), where("perfilId", "==", perfilTargetId));
        const snapRelampago = await getDocs(qRelampago);
        const batch = writeBatch(db);

        snapRelampago.forEach((documento) => {
            const dados = documento.data();
            const refLixeira = doc(collection(db, "lixeira_ranking"));
            batch.set(refLixeira, {
                ...dados,
                deletadoEm: new Date(),
                deletadoPorUserId: userId,
                docOriginalId: documento.id
            });
            batch.delete(documento.ref);
        });

        const qRanking = query(collection(db, "ranking"), where("perfilId", "==", perfilTargetId));
        const snapRanking = await getDocs(qRanking);

        snapRanking.forEach((documento) => {
            const dados = documento.data();
            const refLixeira = doc(collection(db, "lixeira_ranking"));
            batch.set(refLixeira, {
                ...dados,
                deletadoEm: new Date(),
                deletadoPorUserId: userId,
                docOriginalId: documento.id
            });
            batch.delete(documento.ref);
        });

        const refLixeiraPerfil = doc(collection(db, "lixeira_perfis"));
        batch.set(refLixeiraPerfil, {
            perfilId: perfilTargetId,
            userId: userId,
            nome: nomePerfil,
            deletadoEm: new Date(),
            motivo: "Excluído pelo usuário via aplicativo"
        });

        await batch.commit();

        let perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
        perfisLocais = perfisLocais.filter(p => p.perfilId !== perfilTargetId && p.id !== perfilTargetId);
        localStorage.setItem('usuario_perfis', JSON.stringify(perfisLocais));

        const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
        if (perfilAtivo && (perfilAtivo.perfilId === perfilTargetId || perfilAtivo.id === perfilTargetId)) {
            if (perfisLocais.length > 0) {
                localStorage.setItem('tabuada_perfil_ativo', JSON.stringify(perfisLocais[0]));
                localStorage.setItem('perfil_ativo_id', perfisLocais[0].perfilId || perfisLocais[0].id);
            } else {
                localStorage.removeItem('tabuada_perfil_ativo');
                localStorage.removeItem('perfil_ativo_id');
            }
        }

        window.fecharModalExclusao();
        
        if (typeof window.renderizarPerfis === 'function') {
            window.renderizarPerfis();
        }

    } catch (error) {
        console.error("Erro ao mover perfil para a lixeira:", error);
        throw error;
    }
};

window.processarExclusaoPerfilComSeguranca = async function(perfilId, senhaDigitada = null) {
    try {
        await reautenticarResponsavel(senhaDigitada);
        await window.confirmarExclusaoEfetivaPerfil(perfilId);
        alert("Perfil excluído com sucesso!");
    } catch (error) {
        console.error("Erro ao validar exclusão de perfil:", error);
        alert("Falha na validação: " + (error.message || "Senha incorreta ou erro de autenticação."));
    }
};

window.processarExclusaoContaCompleta = async function(senhaDigitada, textoConfirmacao) {
    if (textoConfirmacao.toUpperCase() !== "EXCLUIR") {
        alert("Por favor, digite a palavra 'EXCLUIR' exatamente como solicitado para confirmar.");
        return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
        await reautenticarResponsavel(senhaDigitada);

        const userId = user.uid;
        const batch = writeBatch(db);

        const qRelampago = query(collection(db, "ranking_tempo"), where("userId", "==", userId));
        const snapRelampago = await getDocs(qRelampago);
        snapRelampago.forEach(docSnap => {
            const refLix = doc(collection(db, "lixeira_ranking"));
            batch.set(refLix, { ...docSnap.data(), deletadoEm: new Date(), docOriginalId: docSnap.id });
            batch.delete(docSnap.ref);
        });

        const refLixeiraConta = doc(collection(db, "lixeira_contas"), userId);
        batch.set(refLixeiraConta, {
            userId: userId,
            email: user.email,
            deletadoEm: new Date(),
            status: "AGENDADO_PARA_DELECAO_30_DIAS"
        });

        await batch.commit();
        localStorage.clear();

        await deleteUser(user);

        alert("Sua conta e todos os perfis associados foram excluídos.");
        window.mudarTela('tela-autenticacao');

    } catch (error) {
        console.error("Erro ao excluir conta:", error);
        alert("Erro na exclusão da conta: " + (error.message || "Verifique as credenciais e tente novamente."));
    }
};

window.solicitarRedefinicaoPIN = async function() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await reautenticarResponsavel();
        if (typeof window.abrirModalCriarNovoPIN === 'function') {
            window.abrirModalCriarNovoPIN();
        } else {
            alert("Autenticado com sucesso! Você pode redefinir o PIN agora.");
        }
    } catch (error) {
        alert("Falha na validação: Senha incorreta ou reautenticação não confirmada.");
    }
};

window.abrirModalConfirmacaoExclusao = function(tipo = 'perfil') {
    window.tipoExclusaoAtual = tipo;
    const modal = document.getElementById('modal-confirmar-exclusao-seguranca');
    const tit = document.getElementById('exclusao-titulo-modal');
    const sub = document.getElementById('exclusao-subtitulo-modal');
    const boxTexto = document.getElementById('container-campo-texto-exclusao');
    const inputSenha = document.getElementById('input-senha-reautenticacao');
    const inputTexto = document.getElementById('input-texto-confirmacao-exclusao');

    if (inputSenha) inputSenha.value = '';
    if (inputTexto) inputTexto.value = '';

    if (tipo === 'perfil') {
        if (tit) tit.innerText = "Excluir Perfil de Jogador";
        if (sub) sub.innerText = "Tem certeza? O histórico deste perfil será apagado.";
        if (boxTexto) boxTexto.style.display = 'none';
    } else {
        if (tit) tit.innerText = "Encerrar Conta Definitivamente";
        if (sub) sub.innerText = "Atenção: Todos os perfis e assinaturas desta conta serão removidos.";
        if (boxTexto) boxTexto.style.display = 'block';
    }

    if (modal) {
        modal.classList.remove('oculto');
        modal.style.display = 'flex';
    }
};

window.solicitarExclusaoPerfil = function() {
    const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
    const perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    
    if (perfisLocais.length <= 1) {
        alert("⚠️ Este é o seu único perfil. Para removê-lo, utilize a opção 'Excluir Conta'.");
        return;
    }
    
    if (perfilAtivo) {
        window.abrirModalConfirmacaoExclusao('perfil');
    }
};

window.atualizarVisibilidadeBotoesExclusao = function() {
    const btnExcluirPerfil = document.getElementById('btn-acao-excluir-perfil');
    const perfisLocais = JSON.parse(localStorage.getItem('usuario_perfis')) || [];
    const planoAtual = window.obterPlanoAtivo();
    
    const ehPlanoFamilia = planoAtual === 'premium' || perfisLocais.length > 1;

    if (btnExcluirPerfil) {
        btnExcluirPerfil.style.display = ehPlanoFamilia ? 'flex' : 'none';
    }
};
//#endregion


// =========================================================================
// 14. RECURSOS DE ÁUDIO, SONS E EFEITOS VISUAIS
// =========================================================================
//#region [14] ÁUDIO E EFEITOS

if (typeof window.somAtivado === 'undefined') {
    window.somAtivado = true;
}

if (typeof window.somElementoGlobal === 'undefined') {
    window.somElementoGlobal = new Audio();
}

window.tocarSom = function(tipo) {
    if (!window.somAtivado) return;
    
    let urlAudio = "";
    if (tipo === 'clique') urlAudio = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
    else if (tipo === 'acerto') urlAudio = "https://assets.mixkit.co/active_storage/sfx/947/947-preview.mp3";
    else if (tipo === 'erro') urlAudio = "https://assets.mixkit.co/active_storage/sfx/3090/3090-preview.mp3";
    else if (tipo === 'contagem') urlAudio = "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3"; 
    else if (tipo === 'ja') urlAudio = "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"; 
    else if (tipo === 'vitoria' || tipo === 'conquista') urlAudio = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3";

    if (urlAudio) {
        try {
            window.somElementoGlobal.pause();
            window.somElementoGlobal.currentTime = 0;
            window.somElementoGlobal.src = urlAudio;
            window.somElementoGlobal.volume = 0.4;
            window.somElementoGlobal.play().catch(() => {});
        } catch(e) {
            console.warn("Erro ao reproduzir áudio:", e);
        }
    }
};

window.toggleSom = function(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    window.somAtivado = !window.somAtivado;
    localStorage.setItem('tabuada_som_ativado', window.somAtivado);

    const btnSom = document.getElementById('btn-som-global') || document.querySelector('.btn-som-moderno');

    if (!window.somAtivado) {
        if (window.somElementoGlobal) {
            try {
                window.somElementoGlobal.pause();
                window.somElementoGlobal.currentTime = 0;
            } catch (err) {}
        }

        if (btnSom) {
            btnSom.classList.add('mutado');
            btnSom.setAttribute('aria-label', 'Ativar Som');
        }
    } else {
        if (btnSom) {
            btnSom.classList.remove('mutado');
            btnSom.setAttribute('aria-label', 'Desativar Som');
        }
        
        window.tocarSom('clique');
    }
};

function dispararConfetesConquista() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
            confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
        }, 250);
    }
}

window.compartilharApp = function() {
    window.tocarSom('clique');
    if (navigator.share) {
        navigator.share({ title: 'Tabuada Fácil 🚀', text: 'Venha praticar matemática e disputar o ranking comigo!', url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => alert("Link copiado para a área de transferência! 📋")).catch(() => alert("Copie o link da barra do navegador!"));
    }
};

window.compartilharTempoRelampago = async function() {
    window.tocarSom('clique');

    const elementoTelaFinal = document.getElementById('tela-final');
    const btnCompartilhar = document.getElementById('btn-compartilhar-tempo');

    if (!elementoTelaFinal) return;

    if (typeof html2canvas === 'function') {
        try {
            if (btnCompartilhar) btnCompartilhar.style.visibility = 'hidden';

            const canvas = await html2canvas(elementoTelaFinal, {
                backgroundColor: '#0f172a',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            if (btnCompartilhar) btnCompartilhar.style.visibility = 'visible';

            const imagemDataUrl = canvas.toDataURL('image/png');

            if (navigator.canShare && window.fetch) {
                try {
                    const res = await fetch(imagemDataUrl);
                    const blob = await res.blob();
                    const arquivoImagem = new File([blob], 'meu-recorde-tabuada.png', { type: 'image/png' });

                    if (navigator.canShare({ files: [arquivoImagem] })) {
                        await navigator.share({
                            title: 'Meu Recorde no Tabuada Fácil ⚡',
                            text: `Fiz ${acertos}/${totalPerguntas} em ${tempoRelampagoGlobalUltimo}s no Tabuada Fácil! Você consegue me vencer?`,
                            files: [arquivoImagem]
                        });
                        return;
                    }
                } catch (e) {
                    console.log("Compartilhamento de imagem não suportado...", e);
                }
            }

            fazerDownloadDireto(imagemDataUrl);
            return;

        } catch (erro) {
            console.error("Erro ao gerar imagem canvas:", erro);
            if (btnCompartilhar) btnCompartilhar.style.visibility = 'visible';
        }
    }

    const textoShare = `⚡ Fiz ${acertos}/${totalPerguntas} em ${tempoRelampagoGlobalUltimo}s no Tabuada Fácil! Desafie seu cérebro também: ${window.location.href}`;
    if (navigator.share) {
        navigator.share({ title: 'Meu Recorde ⚡', text: textoShare, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(textoShare).then(() => alert("Texto do recorde copiado! Cole nas suas redes sociais! 📋"));
    }
};

function fazerDownloadDireto(urlData) {
    const link = document.createElement('a');
    link.download = 'meu-recorde-tabuada-facil.png';
    link.href = urlData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
//#endregion


// =========================================================================
// 15. INICIALIZAÇÃO E EVENT LISTENERS DO DOM
// =========================================================================
//#region [15] INICIALIZAÇÃO E LISTENERS
window.addEventListener('beforeinstallprompt', e => { 
    e.preventDefault(); 
    eventoInstalacao = e; 
});

document.addEventListener('click', function(event) {
    const botaoClicado = event.target.closest('button, .btn, [role="button"]');
    const eBotaoSom = event.target.closest('#btn-som-global, #btn-toggle-som, [onclick*="toggleSom"], .btn-som-topo, .btn-som-moderno');

    if (botaoClicado && !eBotaoSom) {
        if (typeof window.tocarSom === 'function') {
            window.tocarSom('clique');
        }
    }

    const btnConsultar = event.target.closest('#btn-consultar-tabuadas, .btn-consultar-tabuadas, [onclick*="abrirModoConsulta"]');
    const eBotaoInfo = event.target.closest('.btn-info-ico');

    if (btnConsultar && !eBotaoInfo) {
        event.preventDefault();
        if (typeof window.abrirModoConsulta === 'function') {
            window.abrirModoConsulta(event);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.fecharModalExclusao();
    window.fecharPaywall();

    try {
        const galeriaSalva = localStorage.getItem('tabuada_galeria_fotos');
        if (galeriaSalva) {
            window.galeriaFotosUsuario = JSON.parse(galeriaSalva);
        }
    } catch (e) {
        console.warn("Erro ao carregar galeria salva:", e);
    }

    if (typeof window.renderizarGaleriaPerfil === 'function') {
        window.renderizarGaleriaPerfil();
    }
    
    const dispararAberturaPerfil = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (typeof window.tocarSom === 'function') window.tocarSom('clique');
        
        if (typeof window.abrirEdicaoPerfil === 'function') {
            window.abrirEdicaoPerfil();
        } else if (typeof window.abrirEdicaoPerfilUnico === 'function') {
            window.abrirEdicaoPerfilUnico();
        } else {
            const modal = document.getElementById('form-perfil-modal');
            if (modal) {
                modal.classList.remove('oculto');
                modal.style.display = 'block';
            }
        }

        if (typeof window.sincronizarInterfaceGlobalPlano === 'function') {
            window.sincronizarInterfaceGlobalPlano();
        }
    };

    document.addEventListener('click', (e) => {
        const elementoClicado = e.target.closest('#btn-perfil-header, #header-foto-perfil, .btn-perfil-avatar, .badge-editar-perfil, .icon-editar-perfil, [onclick*="abrirEdicaoPerfil"]');
        
        if (elementoClicado) {
            dispararAberturaPerfil(e);
        }
    });

    const btnSomGlobal = document.getElementById('btn-som-global') || document.querySelector('.btn-som-moderno');
    if (btnSomGlobal) {
        if (!window.somAtivado) {
            btnSomGlobal.classList.add('mutado');
        } else {
            btnSomGlobal.classList.remove('mutado');
        }
    }

    const btnRelatorio = document.getElementById('btn-abrir-relatorio');
    if (btnRelatorio) {
        btnRelatorio.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.tocarSom === 'function') window.tocarSom('clique');

            if (typeof window.abrirModalRelatorio === 'function') {
                window.abrirModalRelatorio();
            }
        });
    }

    const btnsCancelarModal = document.querySelectorAll('#btn-cancelar-exclusao, .btn-cancelar-modal, [onclick*="fecharModalExclusao"], [onclick*="fecharModalSegurancaExclusao"]');
    btnsCancelarModal.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.fecharModalExclusao();
        });
    });

    const btnConfirmar = document.getElementById('btn-executar-exclusao-final');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            const senha = document.getElementById('input-senha-reautenticacao')?.value || '';
            const texto = document.getElementById('input-texto-confirmacao-exclusao')?.value || '';
            const perfilAtivo = JSON.parse(localStorage.getItem('tabuada_perfil_ativo'));
            const perfilId = perfilAtivo ? (perfilAtivo.perfilId || perfilAtivo.id) : null;

            if (window.tipoExclusaoAtual === 'perfil') {
                if (!perfilId) return alert("Nenhum perfil ativo selecionado.");
                await window.processarExclusaoPerfilComSeguranca(perfilId, senha);
            } else {
                await window.processarExclusaoContaCompleta(senha, texto);
            }
            
            window.fecharModalSegurancaExclusao();
        });
    }

    if (typeof verificarERegenerarVidas === 'function') {
        verificarERegenerarVidas();
    }
    
    if (typeof window.sincronizarInterfaceGlobalPlano === 'function') {
        window.sincronizarInterfaceGlobalPlano();
    }

    if (typeof carregarCuriosidadesDiarias === 'function') {
        carregarCuriosidadesDiarias();
    }

    const perfilStr = localStorage.getItem('tabuada_perfil_ativo');
    if (perfilStr) {
        const perfilObj = JSON.parse(perfilStr);
        if (typeof window.atualizarInterfacePerfil === 'function') {
            window.atualizarInterfacePerfil(perfilObj);
        }
        if (typeof window.atualizarHeaderPerfilAtivo === 'function') {
            window.atualizarHeaderPerfilAtivo();
        }
    }
});
//#endregion


// =========================================================================
// 16. GERENCIADOR CENTRAL DE ANÚNCIOS (ADSENSE + ADMOB)
// =========================================================================
window.AdsManager = {
    isNativeApp: function() {
        return typeof window.AndroidApp !== 'undefined';
    },

    exibirIntersticial: function(callbackPosAnuncio) {
        if (this.isNativeApp()) {
            window.AndroidApp.mostrarIntersticialAdMob();
        }
        if (callbackPosAnuncio) callbackPosAnuncio();
    },

    exibirRecompensado: function(onSucesso, onFalha) {
        if (this.isNativeApp()) {
            window.onAnuncioRecompensadoConcluido = function() {
                if (onSucesso) onSucesso();
            };
            window.AndroidApp.mostrarRecompensadoAdMob();
        } else {
            this.simularAnuncioWeb(onSucesso);
        }
    },

    simularAnuncioWeb: function(onSucesso) {
        const modalExistente = document.getElementById('modal-simulacao-video');
        if (modalExistente) modalExistente.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-simulacao-video';
        modal.className = 'paywall-overlay';
        modal.style.zIndex = '20000';

        modal.innerHTML = `
            <div class="card-painel-container" style="max-width: 360px; text-align: center; border: 2px solid #10b981; background: #070a12; border-radius: 24px; padding: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #34d399; letter-spacing: 1px; margin-bottom: 8px;">🎬 ANÚNCIO PREMIADO</div>
                <h4 style="color: #fff; font-size: 16px; margin-bottom: 12px;">Assistindo vídeo para recarregar vida...</h4>
                
                <div style="width: 100%; background: rgba(255,255,255,0.1); height: 12px; border-radius: 10px; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(56,189,248,0.2);">
                    <div id="barra-progresso-video" style="width: 0%; height: 100%; background: linear-gradient(90deg, #10b981, #34d399); transition: width 0.1s;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        let progresso = 0;
        const intervalo = setInterval(() => {
            progresso += 2;
            const barra = document.getElementById('barra-progresso-video');
            if (barra) barra.style.width = progresso + '%';

            if (progresso >= 100) {
                clearInterval(intervalo);
                modal.remove();
                if (typeof onSucesso === 'function') onSucesso();
            }
        }, 100);
    }
};

// =========================================================================
// CONTROLE DE MODOS (TREINO / RELÂMPAGO) E MODO INSANO (PADRONIZADO)
// =========================================================================

window.selecionarOperacao = function(op) {
    if (typeof window.tocarSom === 'function') window.tocarSom('clique');

    if (op === 'insano') {
        operacoesSelecionadas = ['insano'];
    } else {
        operacoesSelecionadas = operacoesSelecionadas.filter(o => o !== 'insano');

        if (tipoJogoSelecionado === 'relampago') {
            operacoesSelecionadas = [op];
        } else {
            if (operacoesSelecionadas.includes(op)) {
                if (operacoesSelecionadas.length > 1) {
                    operacoesSelecionadas = operacoesSelecionadas.filter(item => item !== op);
                }
            } else {
                operacoesSelecionadas.push(op);
            }
        }
    }

    atualizarBotoesOperacaoVisual();
};

// Função do Modo Treino
window.selecionarModoTreino = function() {
    // 1. Atualiza os estados dos botões de modo
    document.getElementById('btn-modo-treino')?.classList.add('selecionado');
    document.getElementById('btn-modo-relampago')?.classList.remove('selecionado');

    // 2. CORREÇÃO: Esconde o Modo Insano no Modo Treino
    const btnInsano = document.getElementById('btn-op-insano');
    if (btnInsano) {
        btnInsano.classList.add('oculto'); // ou btnInsano.style.display = 'none';
    }
};

// Função do Modo Relâmpago
window.selecionarModoRelampago = function() {
    // 1. Atualiza os estados dos botões de modo
    document.getElementById('btn-modo-treino')?.classList.remove('selecionado');
    document.getElementById('btn-modo-relampago')?.classList.add('selecionado');

    // 2. Exibe o Modo Insano no Modo Relâmpago
    const btnInsano = document.getElementById('btn-op-insano');
    if (btnInsano) {
        btnInsano.classList.remove('oculto'); // ou btnInsano.style.display = 'block';
    }
};