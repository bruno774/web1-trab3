/**
 * Aplicação Principal - Galeria de Moedas
 * Gerencia a interface e interações do usuário com updates em tempo real via Realtime Database (evento 'value')
 */

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA1ctJr7gXGrv580EnEiJaBIvp9Jx-iKO0",
    //authDomain: "app-lab3-web3.firebaseapp.com",
    projectId: "app-lab3-web3",
    //storageBucket: "app-lab3-web3.firebasestorage.app",
    // URL do Realtime Database adicionada
    databaseURL: "https://app-lab3-web3-default-rtdb.firebaseio.com/",
    messagingSenderId: "973910677266",
    appId: "1:973910677266:web:78231daeddd4d17a5b05cb"
};

// Inicializar Firebase (Firebase compat global)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Instanciar serviço de moedas
const moedaService = new MoedaService(db);

// Estado da aplicação
let moedas = [];
let moedasFiltradas = [];
let moedasPorEditar = null;
let categoriaAtiva = 'todas';
let unsubscribe = null; // Função para desinscrever do listener em tempo real

// Elementos do DOM
const formAdicionar = document.getElementById('formAdicionar');
const gridMoedas = document.getElementById('gridMoedas');
const loading = document.getElementById('loading');
const feedback = document.getElementById('feedback');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = document.getElementById('btnText');
const spinner = document.getElementById('spinner');
const mensagemVazia = document.getElementById('mensagemVazia');
const btnFiltros = document.querySelectorAll('.categoria-filter');
const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
const formEditar = document.getElementById('formEditar');
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');

/**
 * Inicializa a aplicação
 */
function init() {
    configurarListenerTempoReal();
    adicionarEventListeners();
}

/**
 * Configura listener em tempo real com Realtime Database (evento 'value')
 */
function configurarListenerTempoReal() {
    try {
        loading.style.display = 'flex';

        // Usar subscribeToItems que utiliza listener 'value' do Realtime Database
        unsubscribe = moedaService.subscribeToItems(
            (moedasCarregadas) => {
                // Callback quando dados mudam
                moedas = moedasCarregadas;
                // Aplicar filtro atualmente ativo (preserva seleção do usuário)
                if (categoriaAtiva === 'todas') {
                    moedasFiltradas = moedas;
                } else {
                    moedasFiltradas = moedas.filter((m) => m.categoria === categoriaAtiva);
                }
                renderizarGrid();
                loading.style.display = 'none';
                console.log('✅ Listener ativo - Moedas atualizadas em tempo real:', moedas.length);
            },
            (erro) => {
                // Callback de erro
                mostrarFeedback('Erro ao conectar com banco de dados: ' + erro.message, 'danger');
                loading.style.display = 'none';
            }
        );
    } catch (error) {
        mostrarFeedback('Erro ao configurar atualizações em tempo real: ' + error.message, 'danger');
        loading.style.display = 'none';
    }
}

/**
 * Renderiza o grid de moedas
 */
function renderizarGrid() {
    gridMoedas.innerHTML = '';

    if (moedasFiltradas.length === 0) {
        mensagemVazia.classList.remove('d-none');
        return;
    }

    mensagemVazia.classList.add('d-none');

    moedasFiltradas.forEach((moeda) => {
        const card = criarCard(moeda);
        gridMoedas.appendChild(card);
    });
}

/**
 * Cria um card de moeda
 * @param {Item} moeda
 * @returns {HTMLElement}
 */
function criarCard(moeda) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

    const card = document.createElement('div');
    card.className = 'coin-card';

    card.innerHTML = `
        <div class="coin-card-img-wrapper">
            <img src="${moeda.imagem}" alt="${moeda.titulo}" onerror="this.src='https://via.placeholder.com/400?text=Imagem+Indisponível'">
            <span class="coin-card-badge">${moeda.categoria}</span>
        </div>
        <div class="coin-card-body">
            <h5 class="coin-card-title">${moeda.titulo}</h5>
            <p class="coin-card-description">${moeda.descricao}</p>
            <div class="coin-specs">
                <div class="coin-spec">
                    <span class="coin-spec-label">Ano:</span>
                    <span class="coin-spec-value">${moeda.fabricacao}</span>
                </div>
                <div class="coin-spec">
                    <span class="coin-spec-label">Peso:</span>
                    <span class="coin-spec-value">${moeda.gramatura}g</span>
                </div>
            </div>
            <div class="coin-card-actions">
                <button class="btn-editar" data-id="${moeda.id}">✏️ Editar</button>
                <button class="btn-remover" data-id="${moeda.id}">🗑️ Remover</button>
            </div>
        </div>
    `;

    col.appendChild(card);

    // Adicionar event listeners aos botões do card
    const btnEditar = card.querySelector('.btn-editar');
    const btnRemover = card.querySelector('.btn-remover');

    btnEditar.addEventListener('click', () => abrirModalEdicao(moeda));
    btnRemover.addEventListener('click', () => removerMoeda(moeda.id));

    return col;
}

/**
 * Abre o modal de edição
 * @param {Item} moeda
 */
function abrirModalEdicao(moeda) {
    moedasPorEditar = moeda;

    document.getElementById('editTitulo').value = moeda.titulo;
    document.getElementById('editDescricao').value = moeda.descricao;
    document.getElementById('editCategoria').value = moeda.categoria;
    document.getElementById('editFabricacao').value = moeda.fabricacao;
    document.getElementById('editGramatura').value = moeda.gramatura;
    document.getElementById('editImagem').value = moeda.imagem;

    modalEditar.show();
}

/**
 * Salva alterações da moeda
 */
async function salvarEdicao() {
    try {
        btnSalvarEdicao.disabled = true;
        btnSalvarEdicao.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvando...';

        const moedaAtualizada = new Item(
            document.getElementById('editTitulo').value,
            document.getElementById('editDescricao').value,
            document.getElementById('editCategoria').value,
            document.getElementById('editImagem').value,
            document.getElementById('editGramatura').value,
            document.getElementById('editFabricacao').value,
            moedasPorEditar.id
        );

        await moedaService.updateItem(moedasPorEditar.id, moedaAtualizada);

        mostrarFeedback('Moeda atualizada com sucesso!', 'success');
        modalEditar.hide();
    } catch (error) {
        mostrarFeedback('Erro ao atualizar: ' + error.message, 'danger');
    } finally {
        btnSalvarEdicao.disabled = false;
        btnSalvarEdicao.innerHTML = 'Salvar Alterações';
    }
}

/**
 * Remove uma moeda
 * @param {string} id
 */
async function removerMoeda(id) {
    if (confirm('Tem certeza que deseja remover esta moeda?')) {
        try {
            await moedaService.removeItem(id);
            mostrarFeedback('Moeda removida com sucesso!', 'success');
        } catch (error) {
            mostrarFeedback('Erro ao remover: ' + error.message, 'danger');
        }
    }
}

/**
 * Filtra moedas por categoria
 * @param {string} categoria
 */
function filtrarPorCategoria(categoria) {
    categoriaAtiva = categoria;

    // Atualizar botões ativos
    btnFiltros.forEach((btn) => {
        btn.classList.remove('active');
        if (btn.dataset.categoria === categoria) {
            btn.classList.add('active');
        }
    });

    // Filtrar moedas
    if (categoria === 'todas') {
        moedasFiltradas = moedas;
    } else {
        moedasFiltradas = moedas.filter((moeda) => moeda.categoria === categoria);
    }

    renderizarGrid();
}

/**
 * Adiciona uma nova moeda
 * @param {Event} e
 */
async function adicionarMoeda(e) {
    e.preventDefault();

    try {
        btnSubmit.disabled = true;
        spinner.classList.remove('d-none');
        btnText.textContent = 'Adicionando...';
        feedback.classList.add('d-none');

        const novaItem = new Item(
            document.getElementById('titulo').value,
            document.getElementById('descricao').value,
            document.getElementById('categoria').value,
            document.getElementById('imagem').value,
            document.getElementById('gramatura').value,
            document.getElementById('fabricacao').value
        );

        await moedaService.addItem(novaItem);

        mostrarFeedback('✅ Moeda adicionada com sucesso!', 'success');
        formAdicionar.reset();

        // Scroll suave para a galeria
        document.getElementById('galeria').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        mostrarFeedback('❌ Erro: ' + error.message, 'danger');
    } finally {
        btnSubmit.disabled = false;
        spinner.classList.add('d-none');
        btnText.textContent = 'Adicionar Moeda';
    }
}

/**
 * Mostra feedback visual
 * @param {string} mensagem
 * @param {string} tipo - 'success' ou 'danger'
 */
function mostrarFeedback(mensagem, tipo) {
    feedback.classList.remove('d-none', 'alert-success', 'alert-danger');
    feedback.classList.add(`alert-${tipo}`);
    feedback.textContent = mensagem;

    setTimeout(() => {
        feedback.classList.add('d-none');
    }, 4000);
}

/**
 * Adiciona event listeners
 */
function adicionarEventListeners() {
    // Formulário
    formAdicionar.addEventListener('submit', adicionarMoeda);

    // Filtros
    btnFiltros.forEach((btn) => {
        btn.addEventListener('click', () => {
            filtrarPorCategoria(btn.dataset.categoria);
        });
    });

    // Modal de edição
    btnSalvarEdicao.addEventListener('click', salvarEdicao);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
