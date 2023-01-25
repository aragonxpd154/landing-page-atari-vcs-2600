//Recuperando referência dos objetos no documento
var canvas = document.getElementById('tela');
var ctx = canvas.getContext('2d');

function RiverRaid(canvasID) {
  'use strict';
  this.canvas = document.getElementById(canvasID);
  this.jogador = new Jogador(
    'img/aviao.png',
    this.canvas.width / 2 - 5,
    this.canvas.height - this.canvas.height / 4,
    this
  );
  this.ctx = this.canvas.getContext('2d');
  this.temporizador = null;
  this.emPausa = true;
  this.gameOver = false;
  this.cenario = new Cenario(this);
  this.desenharTudo = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.jogador.desenhar(this.ctx);
    this.cenario.desenhar(this.ctx);
  };
  this.desenharTudo();

  this.pressinarTecla = function (evt) {
    switch (evt.keyCode) {
      case RiverRaid.teclaEsquerda:
        this.jogador.setMoverEsquerda(true);
        if (this.emPausa) {
          this.pausar();
        }
        evt.preventDefault();
        break;
      case RiverRaid.teclaDireita:
        this.jogador.setMoverDireita(true);
        if (this.emPausa) {
          this.pausar();
        }
        evt.preventDefault();
        break;
      case RiverRaid.teclaCima:
        this.jogador.setAcelerar(true);
        if (this.emPausa) {
          this.pausar();
        }
        evt.preventDefault();
        break;
      case RiverRaid.teclaBaixo:
        this.jogador.setFrear(true);
        if (this.emPausa) {
          this.pausar();
        }
        evt.preventDefault();
        break;
      case RiverRaid.teclaTiro:
        this.jogador.setAtirar(true);
        if (this.emPausa) {
          this.pausar();
        }
        evt.preventDefault();
        break;
    }
  };
  this.liberarTecla = function (evt) {
    switch (evt.keyCode) {
      case RiverRaid.teclaEsquerda:
        this.jogador.setMoverEsquerda(false);
        evt.preventDefault();
        break;
      case RiverRaid.teclaDireita:
        this.jogador.setMoverDireita(false);
        evt.preventDefault();
        break;
      case RiverRaid.teclaCima:
        this.jogador.setAcelerar(false);
        evt.preventDefault();
        break;
      case RiverRaid.teclaBaixo:
        this.jogador.setFrear(false);
        evt.preventDefault();
        break;
      case RiverRaid.teclaTiro:
        this.jogador.setAtirar(false);
        evt.preventDefault();
        break;
    } //Fim do switch
  };
} // Fim do construtor

RiverRaid.desenharTudo = function () {
  RiverRaid.instancia.desenharTudo();
};

RiverRaid.teclaEsquerda = 65; // A
RiverRaid.teclaDireita = 68; // D
RiverRaid.teclaCima = 87; // W
RiverRaid.teclaBaixo = 83; // S
RiverRaid.teclaTiro = 71; // G

RiverRaid.instancia = new RiverRaid('tela');

document.onkeydown = function (evt) {
  'use strict';
  RiverRaid.instancia.pressinarTecla(evt);
};

document.onkeyup = function (evt) {
  'user strict';
  RiverRaid.instancia.liberarTecla(evt);
};
