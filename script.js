 // ARQUIVO: script.js

// --- CONFIGURAÇÕES ---
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

// --- MÁSCARAS ---
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

// --- LÓGICA ---
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
    // Agora pegamos também a Taxa Acelera/Antecipa
    let taxaShopeePorc = parseFloat(document.getElementById('cfgTaxaPorcentagem').value) || 0;
    let taxaShopeeFixa = parseFloat(document.getElementById('cfgTaxaFixa').value) || 0;
    let impostoPorc = parseFloat(document.getElementById('cfgImpostos').value) || 0;
    let antecipaPorc = parseFloat(document.getElementById('cfgAntecipa').value) || 0; // NOVO

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

    // Soma de todas as porcentagens que saem do preço de venda
    let somaPorcentagens = (v.taxaShopeePorc + v.impostoPorc + v.antecipaPorc) / 100;

    if (v.modoReverso) {
        // No modo reverso, a margem também entra no denominador
        let denominador = 1 - (somaPorcentagens + (v.margemDesejada / 100));
        
        if (denominador <= 0) { alert("Taxas impossíveis! (Passou de 100%)"); return null; }
        
        precoVendaFinal = (custoTotal + v.taxaShopeeFixa) / denominador;
    } else {
        precoVendaFinal = v.vendaInput;
    }

    // Cálculos Individuais
    let valorTaxaShopee = (precoVendaFinal * (v.taxaShopeePorc / 100)) + v.taxaShopeeFixa;
    let valorImpostos = precoVendaFinal * (v.impostoPorc / 100);
    let valorAntecipa = precoVendaFinal * (v.antecipaPorc / 100); // Valor em Reais do Antecipa
    
    // Total de taxas para exibir
    let totalTaxas = valorTaxaShopee + valorImpostos + valorAntecipa;

    let lucroLiquido = precoVendaFinal - custoTotal - totalTaxas;
    
    let margem = 0;
    if (precoVendaFinal > 0) margem = (lucroLiquido / precoVendaFinal) * 100;

    // Atualiza a tela
    const fmt = {style: 'currency', currency: 'BRL'};
    document.getElementById('resTaxas').innerText = totalTaxas.toLocaleString('pt-BR', fmt);
    document.getElementById('resImpostos').innerText = valorImpostos.toLocaleString('pt-BR', fmt); // Mantive só imposto aqui, mas o total acima soma tudo
    document.getElementById('resLucro').innerText = lucroLiquido.toLocaleString('pt-BR', fmt);
    document.getElementById('resMargem').innerText = margem.toFixed(2) + '%';
    
    if (v.modoReverso) {
        let inputPreco = document.getElementById('precoVenda');
        inputPreco.value = precoVendaFinal.toFixed(2).replace('.', '');
        formatarMoedaInput(inputPreco);
    }

    return { ...v, custoTotal, venda: precoVendaFinal, totalTaxas, lucroLiquido, margem };
}

// --- TABELA ---
function salvar() {
    let dados = calcular();
    if (!dados || dados.venda <= 0) { alert("Cálculo inválido!"); return; }

    let tabela = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    let novaLinha = tabela.insertRow();
    const fmtDinheiro = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    novaLinha.insertCell(0).innerText = dados.nome;
    novaLinha.insertCell(1).innerText = fmtDinheiro(dados.custoTotal);
    let celVenda = novaLinha.insertCell(2);
    celVenda.innerText = fmtDinheiro(dados.venda);
    if(dados.modoReverso) celVenda.style.color = "blue";
    
    // Na coluna taxas, mostra a soma de tudo (Shopee + Imposto + Antecipa)
    novaLinha.insertCell(3).innerText = fmtDinheiro(dados.totalTaxas);
    
    let celLucro = novaLinha.insertCell(4);
    celLucro.innerText = fmtDinheiro(dados.lucroLiquido);
    celLucro.style.color = dados.lucroLiquido >= 0 ? "green" : "red";
    celLucro.style.fontWeight = "bold";

    novaLinha.insertCell(5).innerText = dados.margem.toFixed(2).replace('.', ',') + '%';
    
    let celAcoes = novaLinha.insertCell(6);
    celAcoes.innerHTML = `<button class="btn-small btn-edit" onclick="editarItem(this)">✏️</button><button class="btn-small btn-delete" onclick="excluirItem(this)">🗑️</button>`;
}

function excluirItem(botao) { botao.parentNode.parentNode.remove(); }

function editarItem(botao) {
    let linha = botao.parentNode.parentNode;
    let colunas = linha.getElementsByTagName('td');
    
    document.getElementById('nomeProduto').value = colunas[0].innerText;
    function restaurarInput(id, val) {
        let input = document.getElementById(id);
        input.value = val.replace(/\D/g, ""); 
        formatarMoedaInput(input);
    }
    restaurarInput('custoProduto', colunas[1].innerText);
    document.getElementById('insumos').value = "R$ 0,00"; // Simplificação
    restaurarInput('precoVenda', colunas[2].innerText);
    
    document.getElementById('switchModo').checked = false;
    alternarModo();
    linha.remove();
}

function limparTabela() {
    if(confirm("Apagar tudo?")) document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0].innerHTML = "";
}

function exportarExcel() {
    let tabela = document.getElementById("tabelaHistorico");
    let linhas = tabela.rows;
    let csv = [];
    for (let i = 0; i < linhas.length; i++) {
        let linha = [], colunas = linhas[i].cells;
        for (let j = 0; j < colunas.length - 1; j++) linha.push(colunas[j].innerText);
        csv.push(linha.join(";"));
    }
    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(new Blob([csv.join("\n")], {type: "text/csv"}));
    link.download = "Shopee_Calc.csv";
    link.click();
}