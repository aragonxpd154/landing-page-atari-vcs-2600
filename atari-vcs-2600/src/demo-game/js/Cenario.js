function Cenario(riverRaid) {
  'use strict';
  this.listaMapas = [];
  this.listaMapas.push(mapa01);
  this.mapaAtual = 0;
  this.posicao = 0;
  this.riverRaid = riverRaid;
  this.colunasPorTela = mapa01[0].length;
  Cenario.largura = Math.floor(riverRaid.canvas.width / this.colunasPorTela);
  riverRaid.canvas.height =
    Math.floor(riverRaid.canvas.height / Cenario.largura) * Cenario.largura;
  riverRaid.canvas.width =
    Math.floor(riverRaid.canvas.width / Cenario.largura) * Cenario.largura;
  this.linhasPorTela = Math.floor(riverRaid.canvas.height / Cenario.largura);
  this.totalLinhasMatriz = mapa01.length;
}

Cenario.todosMapas = [mapa01];

// Preta
Cenario.agua = 0;

// Branco
Cenario.terra = 1;

// Vermelho
Cenario.ponte = 2;

// Verde
Cenario.inimigoParado = 3;

// Azul
Cenario.inimigoMovel = 4;

// Cinza
Cenario.posto = 5;
