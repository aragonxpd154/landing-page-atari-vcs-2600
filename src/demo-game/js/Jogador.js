function Jogador(nomeArq, inicioX, posicaoY, riverRaid) {
  'use strict';
  this.imagem = new Image();
  this.imagem.src = nomeArq;
  this.imagem.onload = RiverRaid.desenharTudo;
  this.x = inicioX;
  this.y = posicaoY;
  this.esquerda = false;
  this.direita = false;
  this.acelerar = false;
  this.frear = false;
  this.atirar = false;
  this.velocidade = 1;
  this.riverRaid = riverRaid;
  this.desenhar = function (ctx) {
    ctx.drawImage(
      this.imagem,
      this.x,
      this.y,
      Jogador.largura,
      Jogador.largura
    );
  };
  this.setMoverEsquerda = function (booleano) {
    this.esquerda = booleano;
    if (this.esquerda) {
      this.direita = false;
    }
  };
  this.setMoverDireita = function (booleano) {
    this.direita = booleano;
    if (this.direita) {
      this.esquerda = false;
    }
  };
  this.setAcelerar = function (booleano) {
    this.acelerar = booleano;
    if (this.acelerar) {
      this.frear = false;
    }
  };
  this.setFrear = function (booleano) {
    this.frear = booleano;
    if (this.frear) {
      this.acelerar = false;
    }
  };
  this.setAtirar = function (booleano) {
    this.atirar = booleano;
  };
} //Fim do construtor
Jogador.largura = 20;
