 // ARQUIVO: script.js

function pegarValores() {
    return {
        taxaShopeePorc: parseFloat(document.getElementById('cfgTaxaPorcentagem').value) || 0,
        taxaShopeeFixa: parseFloat(document.getElementById('cfgTaxaFixa').value) || 0,
        impostoPorc: parseFloat(document.getElementById('cfgImpostos').value) || 0,
        custo: parseFloat(document.getElementById('custoProduto').value) || 0,
        insumos: parseFloat(document.getElementById('insumos').value) || 0,
        venda: parseFloat(document.getElementById('precoVenda').value) || 0,
        nome: document.getElementById('nomeProduto').value || "Produto Sem Nome"
    };
}

function calcular() {
    let v = pegarValores();
    
    let valorTaxaShopee = (v.venda * (v.taxaShopeePorc / 100)) + v.taxaShopeeFixa;
    let valorImpostos = v.venda * (v.impostoPorc / 100);
    let custoTotal = v.custo + v.insumos;
    let lucroLiquido = v.venda - custoTotal - valorTaxaShopee - valorImpostos;
    
    let margem = 0;
    if (v.venda > 0) margem = (lucroLiquido / v.venda) * 100;

    // Atualiza a tela
    const formatoMoeda = {style: 'currency', currency: 'BRL'};
    document.getElementById('resTaxas').innerText = valorTaxaShopee.toLocaleString('pt-BR', formatoMoeda);
    document.getElementById('resImpostos').innerText = valorImpostos.toLocaleString('pt-BR', formatoMoeda);
    document.getElementById('resLucro').innerText = lucroLiquido.toLocaleString('pt-BR', formatoMoeda);
    document.getElementById('resMargem').innerText = margem.toFixed(2) + '%';

    return { ...v, custoTotal, valorTaxaShopee, valorImpostos, lucroLiquido, margem };
}

function salvar() {
    let dados = calcular();
    if (dados.venda <= 0) { alert("Insira um preço de venda!"); return; }

    let tabela = document.getElementById('tabelaHistorico').getElementsByTagName('tbody')[0];
    let novaLinha = tabela.insertRow();
    
    const fmt = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', minimumFractionDigits: 2});

    novaLinha.insertCell(0).innerText = dados.nome;
    novaLinha.insertCell(1).innerText = fmt(dados.custoTotal);
    novaLinha.insertCell(2).innerText = fmt(dados.venda);
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