  // ARQUIVO: script.js

// 1. CARREGAR DADOS AO INICIAR
// Tenta pegar a lista salva. Se não tiver nada, cria uma lista vazia.
let listaHistorico = JSON.parse(localStorage.getItem('shopee_db')) || [];

// Assim que a página carrega, desenha a tabela com o que tiver na memória
window.onload = function() {
    renderizarTabela();
};

// --- CONFIGURAÇÕES VISUAIS ---
function toggleConfig() {
    let box = document.getElementById('boxConfiguracoes');
    let btn = document.getElementById('btnConfig');
    if (box.style.display === 'none') {
        box.style.display = 'flex';
        btn.style.color = "#ee4d2d";
        btn.style.transform = "rotate(90deg)";
    } else {
        box.style.display = 'none';
        btn.style.color = "#777";
        btn.style.transform = "rotate(0deg)";
    }
}

function alternarModo() {
    let checkbox = document.getElementById('switchModo');
    let divPreco = document.getElementById('grupoPrecoVenda');
    let divMargem = document.getElementById('grupoMargemDesejada');
    
    if (checkbox.checked) {
        divPreco.style.display = 'none';
        divMargem.style.display = 'block';
    } else {
        divPreco.style.display = 'block';
        divMargem.style.display = 'none';
    }
}

// --- MÁSCARAS E CONVERSÃO ---
function formatarMoedaInput(input) {
    let valor = input.value.replace(/\D/g, "");
    valor = (valor / 100).toFixed(2) + "";
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    input.value = "R$ " + valor;
}

function converterMoeda(valorString) {
    if (!valorString) return 0;
    let limpo = valorString.replace("R$", "").replace(/\./g, "").replace(",", ".");
    return parseFloat(limpo) || 0;
}

// --- CÁLCULOS ---
function pegarValores() {
    let taxaShopeePorc = parseFloat(document.getElementById('cfgTaxaPorcentagem').value) || 0;
    let taxaShopeeFixa = parseFloat(document.getElementById('cfgTaxaFixa').value) || 0;
    let impostoPorc = parseFloat(document.getElementById('cfgImpostos').value) || 0;
    let antecipaPorc = parseFloat(document.getElementById('cfgAntecipa').value) || 0;

    let custo = converterMoeda(document.getElementById('custoProduto').value);
    let insumos = converterMoeda(document.getElementById('insumos').value);
    let vendaInput = converterMoeda(document.getElementById('precoVenda').value);
    let margemDesejada = parseFloat(document.getElementById('margemDesejada').value) || 0;

    return {
        taxaShopeePorc, taxaShopeeFixa, impostoPorc, antecipaPorc,
        custo, insumos, vendaInput, margemDesejada,
        nome: document.getElementById('nomeProduto').value || "Produto Sem Nome",
        modoReverso: document.getElementById('switchModo').checked
    };
}

function calcular() {
    let v = pegarValores();
    let precoVendaFinal = 0;
    let custoTotal = v.custo + v.insumos;
    let somaPorcentagens = (v.taxaShopeePorc + v.impostoPorc + v.antecipaPorc) / 100;

    if (v.modoReverso) {
        let denominador = 1 - (somaPorcentagens + (v.margemDesejada / 100));
        if (denominador <= 0) { alert("Taxas impossíveis!"); return null; }
        precoVendaFinal = (custoTotal + v.taxaShopeeFixa) / denominador;
    } else {
        precoVendaFinal = v.vendaInput;
    }

    let valorTaxaShopee = (precoVendaFinal * (v.taxaShopeePorc / 100)) + v.taxaShopeeFixa;
    let valorImpostos = precoVendaFinal * (v.impostoPorc / 100);
    let valorAntecipa = precoVendaFinal * (v.antecipaPorc / 100);
    let totalTaxas = valorTaxaShopee + valorImpostos + valorAntecipa;

    let lucroLiquido = precoVendaFinal - custoTotal - totalTaxas;
    let margem = 0;
    if (precoVendaFinal > 0) margem = (lucroLiquido / precoVendaFinal) * 100;

    // Atualiza a tela
    const fmt = {style: 'currency', currency: 'BRL'};
    document.getElementById('resTaxas').innerText = totalTaxas.toLocaleString('pt-BR', fmt);
    document.getElementById('resImpostos').innerText = valorImpostos.toLocaleString('pt-BR', fmt);
    document.getElementById('resLucro').innerText = lucroLiquido.toLocaleString('pt-BR', fmt);
    document.getElementById('resMargem').innerText = margem.toFixed(2) + '%';
    
    if (v.modoReverso) {
        let inputPreco = document.getElementById('precoVenda');
        inputPreco.value = precoVendaFinal.toFixed(2).replace('.', '');
        formatarMoedaInput(inputPreco);
    }

    // Retorna o objeto completo com os resultados
    return { ...v, custoTotal, venda: precoVendaFinal, totalTaxas, lucroLiquido, margem };
}

// --- GERENCIAMENTO DA TABELA E MEMÓRIA ---

function salvar() {
    let dados = calcular();
    if (!dados || dados.venda <= 0) { alert("Cálculo inválido!"); return; }

    // 1. Adiciona o novo cálculo na lista da memória
    listaHistorico.push(dados);
    
    // 2. Salva no navegador
    atualizarMemoria();

    // 3. Redesenha a tabela
    renderizarTabela();
}

function excluirItem(index) {
    // Remove o item da lista baseado na posição (index)
    listaHistorico.splice(index, 1);
    atualizarMemoria();
    renderizarTabela();
}

function editarItem(index) {
    let dados = listaHistorico[index];

    // Joga os valores de volta para os inputs
    document.getElementById('nomeProduto').value = dados.nome;
    
    // Função auxiliar para preencher inputs de moeda
    function setInputMoeda(id, valorNumerico) {
        let input = document.getElementById(id);
        input.value = valorNumerico.toFixed(2).replace('.', '');
        formatarMoedaInput(input);
    }

    setInputMoeda('custoProduto', dados.custo); // Custo original
    setInputMoeda('insumos', dados.insumos);    // Insumos originais
    setInputMoeda('precoVenda', dados.venda);   // Preço Venda

    // Remove da lista (para o usuário salvar de novo depois de editar)
    excluirItem(index);
}

function limparTabela() {
    if(confirm("Apagar todo o histórico salvo?")) {
        listaHistorico = []; // Zera a lista
        atualizarMemoria();  // Salva vazio
        renderizarTabela();  // Limpa tela
    }
}

// FUNÇÃO MÁGICA: Grava a lista no navegador
function atualizarMemoria() {
    localStorage.setItem('shopee_db', JSON.stringify(listaHistorico));
}

// FUNÇÃO MÁGICA 2: Lê a lista e cria o HTML
function renderizarTabela() {
    let tbody = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ""; // Limpa a tabela atual para redesenhar do zero

    const fmtDinheiro = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    // Para cada item na lista, cria uma linha
    listaHistorico.forEach((item, index) => {
        let novaLinha = tbody.insertRow();

        novaLinha.insertCell(0).innerText = item.nome;
        novaLinha.insertCell(1).innerText = fmtDinheiro(item.custoTotal);
        
        let celVenda = novaLinha.insertCell(2);
        celVenda.innerText = fmtDinheiro(item.venda);
        if(item.modoReverso) celVenda.style.color = "blue";

        novaLinha.insertCell(3).innerText = fmtDinheiro(item.totalTaxas);
        
        let celLucro = novaLinha.insertCell(4);
        celLucro.innerText = fmtDinheiro(item.lucroLiquido);
        celLucro.style.color = item.lucroLiquido >= 0 ? "green" : "red";
        celLucro.style.fontWeight = "bold";

        novaLinha.insertCell(5).innerText = item.margem.toFixed(2).replace('.', ',') + '%';

        // Botões de Ação (passamos o index para saber qual apagar/editar)
        let celAcoes = novaLinha.insertCell(6);
        celAcoes.innerHTML = `
            <button class="btn-small btn-edit" onclick="editarItem(${index})">✏️</button>
            <button class="btn-small btn-delete" onclick="excluirItem(${index})">🗑️</button>
        `;
    });
}

function exportarExcel() {
    let csv = [];
    // Cabeçalho
    csv.push("Produto;Custo Total;Venda;Taxas;Lucro;Margem");

    // Dados
    listaHistorico.forEach(item => {
        let linha = [
            item.nome,
            item.custoTotal.toFixed(2).replace('.', ','),
            item.venda.toFixed(2).replace('.', ','),
            item.totalTaxas.toFixed(2).replace('.', ','),
            item.lucroLiquido.toFixed(2).replace('.', ','),
            item.margem.toFixed(2).replace('.', ',') + '%'
        ];
        csv.push(linha.join(";"));
    });

    let csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(csvFile);
    link.download = "Shopee_Historico.csv";
    link.click();
}