function Cenario(riverRaid) {
  ('use strict');
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

  Cenario.todosMapas = [mapa01];
  Cenario.agua = 0; //Preto
  Cenario.terra = 1; //Branco
  Cenario.ponte = 2; //Vermelho
  Cenario.inimigoParado = 3; //Verde
  Cenario.inimigoMovel = 4; //Azul
  Cenario.posto = 5; //Cinza

  this.desenhar = function (ctx) {
    for (var ym = 0; ym < this.linhasPorTela; ym++) {
      for (var xm = 0; xm < this.colunasPorTela; xm++) {
        switch (this.getPosicaoMapa(xm, ym)) {
          case Cenario.terra:
            ctx.fillStyle = '#33AA33';
            ctx.fillRect(
              this.matrizParaPixelX(xm),
              this.matrizParaPixelY(ym, true),
              Cenario.largura,
              Cenario.largura
            );
            break;
        }
      }
    }
  };

  this.matrizParaPixelX = function (mx) {
    return Math.floor(mx * Cenario.largura);
  };

  this.matrizParaPixelX = function (mx) {
    return Math.floor(mx * Cenario.largura);
  };
  this.matrizParaPixelY = function (my, calcDif) {
    var dif = 0;
    if (calcDif) {
      dif = this.posicao - Math.floor(this.posicao);
    }
    return (
      (this.linhasPorTela - 1 - my) * Cenario.largura + dif * Cenario.largura
    );
  };

  this.getPosicaoMapa = function (x, y) {
    var mapa = Math.floor((this.posicao + y) / this.totalLinhasMatriz);
    var sobra = Math.floor(this.posicao + y) % this.totalLinhasMatriz;
    if (mapa >= this.listaMapas.length) {
      this.incluirNovoMapa();
    }
    return this.listaMapas[mapa][sobra][x];
  };

  this.incluirNovoMapa = function () {
    var n = Math.floor(Math.random() * Cenario.todosMapas.length);
    var proximoMapa = Cenario.todosMapas[n];
    this.listaMapas.push(proximoMapa);
  };
}
