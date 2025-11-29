 // ARQUIVO: script.js

// Função para trocar o modo (Normal vs Reverso)
function alternarModo() {
    let checkbox = document.getElementById('switchModo');
    let divPreco = document.getElementById('grupoPrecoVenda');
    let divMargem = document.getElementById('grupoMargemDesejada');
    let inputPreco = document.getElementById('precoVenda');

    if (checkbox.checked) {
        // Modo Reverso: Esconde Preço, Mostra Margem Desejada
        divPreco.style.display = 'none';
        divMargem.style.display = 'block';
        inputPreco.value = ""; // Limpa o preço para não confundir
    } else {
        // Modo Normal: Mostra Preço, Esconde Margem Desejada
        divPreco.style.display = 'block';
        divMargem.style.display = 'none';
    }
}

function pegarValores() {
    return {
        taxaShopeePorc: parseFloat(document.getElementById('cfgTaxaPorcentagem').value) || 0,
        taxaShopeeFixa: parseFloat(document.getElementById('cfgTaxaFixa').value) || 0,
        impostoPorc: parseFloat(document.getElementById('cfgImpostos').value) || 0,
        custo: parseFloat(document.getElementById('custoProduto').value) || 0,
        insumos: parseFloat(document.getElementById('insumos').value) || 0,
        // Pegamos os dois, mas vamos usar apenas um dependendo do modo
        vendaInput: parseFloat(document.getElementById('precoVenda').value) || 0,
        margemDesejada: parseFloat(document.getElementById('margemDesejada').value) || 0,
        nome: document.getElementById('nomeProduto').value || "Produto Sem Nome",
        modoReverso: document.getElementById('switchModo').checked
    };
}

function calcular() {
    let v = pegarValores();
    let precoVendaFinal = 0;
    let custoTotal = v.custo + v.insumos;

    // --- A LÓGICA MÁGICA ---
    if (v.modoReverso) {
        // CÁLCULO REVERSO: Queremos descobrir o Preço de Venda
        // Fórmula: Preço = (CustoTotal + TaxaFixa) / (1 - (TaxaShopee% + Imposto% + MargemDesejada%))
        
        let somaPorcentagens = (v.taxaShopeePorc + v.impostoPorc + v.margemDesejada) / 100;
        
        // Evitar divisão por zero ou negativa (se as taxas passarem de 100%)
        if (somaPorcentagens >= 1) {
            alert("As taxas + margem ultrapassam 100%. Impossível calcular!");
            return null;
        }

        precoVendaFinal = (custoTotal + v.taxaShopeeFixa) / (1 - somaPorcentagens);
    } else {
        // CÁLCULO NORMAL: Já temos o preço
        precoVendaFinal = v.vendaInput;
    }

    // Com o Preço de Venda definido (seja digitado ou calculado), fazemos o resto normal
    let valorTaxaShopee = (precoVendaFinal * (v.taxaShopeePorc / 100)) + v.taxaShopeeFixa;
    let valorImpostos = precoVendaFinal * (v.impostoPorc / 100);
    let lucroLiquido = precoVendaFinal - custoTotal - valorTaxaShopee - valorImpostos;
    
    let margem = 0;
    if (precoVendaFinal > 0) margem = (lucroLiquido / precoVendaFinal) * 100;

    // Atualiza a tela
    const formatoMoeda = {style: 'currency', currency: 'BRL'};
    document.getElementById('resTaxas').innerText = valorTaxaShopee.toLocaleString('pt-BR', formatoMoeda);
    document.getElementById('resImpostos').innerText = valorImpostos.toLocaleString('pt-BR', formatoMoeda);
    document.getElementById('resLucro').innerText = lucroLiquido.toLocaleString('pt-BR', formatoMoeda);
    document.getElementById('resMargem').innerText = margem.toFixed(2) + '%';
    
    // Se estivermos no modo reverso, mostramos o preço sugerido num lugar visível?
    // Truque: Vamos preencher o input de Preço (mesmo ele estando oculto) para salvar na tabela depois
    document.getElementById('precoVenda').value = precoVendaFinal.toFixed(2);

    return { ...v, custoTotal, venda: precoVendaFinal, valorTaxaShopee, valorImpostos, lucroLiquido, margem };
}

function salvar() {
    let dados = calcular();
    if (!dados || dados.venda <= 0) { alert("Valor inválido para salvar!"); return; }

    let tabela = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    let novaLinha = tabela.insertRow();
    
    const fmt = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', minimumFractionDigits: 2});

    novaLinha.insertCell(0).innerText = dados.nome;
    novaLinha.insertCell(1).innerText = fmt(dados.custoTotal);
    // Destacar o preço de venda em azul se foi calculado automaticamente
    let celulaVenda = novaLinha.insertCell(2);
    celulaVenda.innerText = fmt(dados.venda);
    if(dados.modoReverso) celulaVenda.style.color = "blue"; 

    novaLinha.insertCell(3).innerText = fmt(dados.valorTaxaShopee + dados.valorImpostos);
    
    let cellLucro = novaLinha.insertCell(4);
    cellLucro.innerText = fmt(dados.lucroLiquido);
    cellLucro.style.color = dados.lucroLiquido >= 0 ? "green" : "red";
    cellLucro.style.fontWeight = "bold";

    novaLinha.insertCell(5).innerText = dados.margem.toFixed(2).replace('.', ',') + '%';
}

function limparTabela() {
    if(confirm("Tem certeza que deseja apagar todo o histórico?")) {
        document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0].innerHTML = "";
    }
}

function exportarExcel() {
    let tabela = document.getElementById("tabelaHistorico");
    let linhas = tabela.rows;
    let csv = [];

    for (let i = 0; i < linhas.length; i++) {
        let linha = [], colunas = linhas[i].cells;
        for (let j = 0; j < colunas.length; j++) {
            linha.push(colunas[j].innerText);
        }
        csv.push(linha.join(";"));
    }

    let csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    let downloadLink = document.createElement("a");
    downloadLink.download = "Relatorio_Shopee.csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}