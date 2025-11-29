 // ARQUIVO: script.js

// --- 1. INICIALIZAÇÃO ---
let listaHistorico = JSON.parse(localStorage.getItem('shopee_db')) || [];

window.onload = function() {
    carregarConfig();   // Carrega taxas
    carregarTema();     // Carrega tema (Dark/Light)
    renderizarTabela(); // Carrega produtos
};

// --- 2. GERENCIAMENTO DE TEMA ---
function alternarTema() {
    let html = document.documentElement;
    let temaAtual = html.getAttribute('data-theme');
    let btnIcon = document.getElementById('iconTema');
    
    if (temaAtual === 'dark') {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('shopee_theme', 'light');
        btnIcon.innerText = '🌙';
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('shopee_theme', 'dark');
        btnIcon.innerText = '☀️';
    }
}

function carregarTema() {
    let temaSalvo = localStorage.getItem('shopee_theme');
    let btnIcon = document.getElementById('iconTema');
    
    if (temaSalvo === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if(btnIcon) btnIcon.innerText = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        if(btnIcon) btnIcon.innerText = '🌙';
    }
}

// --- 3. CONFIGURAÇÕES ---
function salvarConfig() {
    let config = {
        taxaPorc: document.getElementById('cfgTaxaPorcentagem').value,
        taxaFixa: document.getElementById('cfgTaxaFixa').value,
        impostos: document.getElementById('cfgImpostos').value,
        antecipa: document.getElementById('cfgAntecipa').value
    };
    localStorage.setItem('shopee_config', JSON.stringify(config));
    calcular(); 
}

function carregarConfig() {
    let configSalva = JSON.parse(localStorage.getItem('shopee_config'));
    if (configSalva) {
        document.getElementById('cfgTaxaPorcentagem').value = configSalva.taxaPorc;
        document.getElementById('cfgTaxaFixa').value = configSalva.taxaFixa;
        document.getElementById('cfgImpostos').value = configSalva.impostos;
        document.getElementById('cfgAntecipa').value = configSalva.antecipa;
    }
}

function toggleConfig() {
    let box = document.getElementById('boxConfiguracoes');
    let btn = document.getElementById('btnConfig');
    if (box.style.display === 'none') {
        box.style.display = 'flex';
        btn.classList.add('rotate');
    } else {
        box.style.display = 'none';
        btn.classList.remove('rotate');
    }
}

// --- 4. FORMATAÇÃO E INPUTS ---
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

// --- 5. CÁLCULO ---
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
        if (denominador <= 0) return null;
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

    const fmt = {style: 'currency', currency: 'BRL'};
    document.getElementById('resTaxas').innerText = totalTaxas.toLocaleString('pt-BR', fmt);
    document.getElementById('resImpostos').innerText = valorImpostos.toLocaleString('pt-BR', fmt);
    document.getElementById('resLucro').innerText = lucroLiquido.toLocaleString('pt-BR', fmt);
    document.getElementById('resMargem').innerText = margem.toFixed(2) + '%';
    
    if (v.modoReverso) {
        let inputPreco = document.getElementById('precoVenda');
        // Só atualiza o input visual se o usuário não estiver digitando lá agora (pra não bugar)
        if (document.activeElement !== inputPreco) {
            inputPreco.value = precoVendaFinal.toFixed(2).replace('.', '');
            formatarMoedaInput(inputPreco);
        }
    }

    return { ...v, custoTotal, venda: precoVendaFinal, totalTaxas, lucroLiquido, margem };
}

// --- 6. TABELA E AÇÕES ---

function salvar() {
    let dados = calcular();
    if (!dados || dados.venda <= 0) { alert("Cálculo inválido!"); return; }
    
    // 1. Salva na lista e memória
    listaHistorico.push(dados);
    atualizarMemoria();
    renderizarTabela();

    // 2. LIMPAR CAMPOS APÓS SALVAR (A Nova Funcionalidade)
    document.getElementById('nomeProduto').value = "";
    document.getElementById('custoProduto').value = "";
    document.getElementById('insumos').value = "";
    document.getElementById('precoVenda').value = "";
    
    // 3. Reseta também o painel de resultados para R$ 0,00
    const fmtZero = "R$ 0,00";
    document.getElementById('resTaxas').innerText = fmtZero;
    document.getElementById('resImpostos').innerText = fmtZero;
    document.getElementById('resLucro').innerText = fmtZero;
    document.getElementById('resMargem').innerText = "0%";

    // 4. Coloca o cursor de volta no campo Nome para digitar o próximo
    document.getElementById('nomeProduto').focus();
}

function excluirItem(index) {
    listaHistorico.splice(index, 1);
    atualizarMemoria();
    renderizarTabela();
}

function editarItem(index) {
    let dados = listaHistorico[index];
    document.getElementById('nomeProduto').value = dados.nome;
    
    function setInputMoeda(id, valorNumerico) {
        let input = document.getElementById(id);
        input.value = valorNumerico.toFixed(2).replace('.', '');
        formatarMoedaInput(input);
    }
    setInputMoeda('custoProduto', dados.custo);
    setInputMoeda('insumos', dados.insumos);
    setInputMoeda('precoVenda', dados.venda);
    
    // Recalcula para mostrar os números no painel
    calcular();
    
    // Remove da lista para evitar duplicidade ao salvar de novo
    excluirItem(index);
}

function limparTabela() {
    if(confirm("Apagar tudo?")) {
        listaHistorico = [];
        atualizarMemoria();
        renderizarTabela();
    }
}

function atualizarMemoria() {
    localStorage.setItem('shopee_db', JSON.stringify(listaHistorico));
}

function renderizarTabela() {
    let tbody = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ""; 
    const fmtDinheiro = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    listaHistorico.forEach((item, index) => {
        let novaLinha = tbody.insertRow();
        novaLinha.insertCell(0).innerText = item.nome;
        novaLinha.insertCell(1).innerText = fmtDinheiro(item.custoTotal);
        let celVenda = novaLinha.insertCell(2);
        celVenda.innerText = fmtDinheiro(item.venda);
        if(item.modoReverso) celVenda.style.color = "#007bff"; 
        
        novaLinha.insertCell(3).innerText = fmtDinheiro(item.totalTaxas);
        
        let celLucro = novaLinha.insertCell(4);
        celLucro.innerText = fmtDinheiro(item.lucroLiquido);
        celLucro.style.color = item.lucroLiquido >= 0 ? "green" : "red";
        celLucro.style.fontWeight = "bold";
        
        novaLinha.insertCell(5).innerText = item.margem.toFixed(2).replace('.', ',') + '%';
        
        let celAcoes = novaLinha.insertCell(6);
        celAcoes.innerHTML = `
            <button class="btn-small btn-edit" onclick="editarItem(${index})">✏️</button>
            <button class="btn-small btn-delete" onclick="excluirItem(${index})">🗑️</button>
        `;
    });
}

// --- 7. EXPORTAR E RESTAURAR ---
function exportarExcel() {
    let csv = [];
    csv.push("Produto;Custo Total;Venda;Taxas;Lucro;Margem");
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

function importarBackup(input) {
    let arquivo = input.files[0];
    if (!arquivo) return;
    let leitor = new FileReader();
    leitor.onload = function(e) {
        let texto = e.target.result;
        let linhas = texto.split('\n');
        let itensImportados = 0;
        for (let i = 1; i < linhas.length; i++) {
            let linha = linhas[i].trim();
            if (linha) {
                let colunas = linha.split(';');
                if (colunas.length >= 6) {
                    let nome = colunas[0];
                    let custoTotal = converterMoeda(colunas[1]); 
                    let venda = converterMoeda(colunas[2]);
                    
                    let taxaShopeePorc = parseFloat(document.getElementById('cfgTaxaPorcentagem').value) || 0;
                    let taxaShopeeFixa = parseFloat(document.getElementById('cfgTaxaFixa').value) || 0;
                    let impostoPorc = parseFloat(document.getElementById('cfgImpostos').value) || 0;
                    let antecipaPorc = parseFloat(document.getElementById('cfgAntecipa').value) || 0;

                    let precoVendaFinal = venda;
                    let valorTaxaShopee = (precoVendaFinal * (taxaShopeePorc / 100)) + taxaShopeeFixa;
                    let valorImpostos = precoVendaFinal * (impostoPorc / 100);
                    let valorAntecipa = precoVendaFinal * (antecipaPorc / 100);
                    let totalTaxas = valorTaxaShopee + valorImpostos + valorAntecipa;
                    let lucroLiquido = precoVendaFinal - custoTotal - totalTaxas;
                    let margem = 0;
                    if (precoVendaFinal > 0) margem = (lucroLiquido / precoVendaFinal) * 100;

                    let novoItem = {
                        nome: nome, custo: custoTotal, insumos: 0, custoTotal: custoTotal,
                        venda: precoVendaFinal, totalTaxas: totalTaxas, lucroLiquido: lucroLiquido,
                        margem: margem, modoReverso: false
                    };
                    listaHistorico.push(novoItem);
                    itensImportados++;
                }
            }
        }
        if (itensImportados > 0) {
            atualizarMemoria(); renderizarTabela(); alert(itensImportados + " restaurados!");
        }
        input.value = ""; 
    };
    leitor.readAsText(arquivo);
}