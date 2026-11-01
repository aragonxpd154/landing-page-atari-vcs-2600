/* INVASORES — inspirado em Space Invaders (versão Atari 2600, 1980).
   Os sprites dos alienígenas são desenhos originais deste projeto. */
(function () {
  'use strict';
  var U = Atari.util;

  var ALIENS = [
    { pontos: 30, cor: '#e85ad8', quadros: [
      ['...##...', '..####..', '.##..##.', '###..###', '.######.', '..#..#..', '.#....#.'],
      ['...##...', '..####..', '.##..##.', '###..###', '.######.', '..#..#..', '..#..#..']
    ] },
    { pontos: 20, cor: '#5ad8e8', quadros: [
      ['..####..', '.#.##.#.', '########', '##.##.##', '.######.', '#.#..#.#', '#......#'],
      ['..####..', '.#.##.#.', '########', '##.##.##', '.######.', '.#.##.#.', '..#..#..']
    ] },
    { pontos: 10, cor: '#e8d85a', quadros: [
      ['...####...', '..#....#..', '.########.', '#.#.##.#.#', '.########.', '..#.#.#.#.', '.#.#.#.#..'],
      ['...####...', '..#....#..', '.########.', '#.#.##.#.#', '.########.', '.#.#.#.#..', '..#.#.#.#.']
    ] }
  ];
  var TIPO_LINHA = [0, 1, 1, 2, 2];
  var CANHAO = ['.....#.....', '....###....', '....###....', '.#########.', '###########', '###########'];
  var DISCO = ['....######....', '..##########..', '.##.##.##.##.#', '##############', '..###....###..'];
  var ESCUDO = ['..#######..', '.#########.', '###########', '###########', '###########', '####...####', '###.....###', '###.....###'];
  var EXPLOSAO = ['#..#..#.', '.#.#.#..', '..#.#..#', '##.#.##.', '..#.#...', '.#.#.#..', '#..#..#.'];
  var MARCHA = [98, 87, 78, 73];

  Atari.register({
    id: 'invaders',
    title: 'INVASORES',
    publisher: 'ATARI',
    year: 1980,
    color: '#5ad8e8',
    cartColor: '#5ad8e8',
    summary: 'Homenagem a Space Invaders: o primeiro jogo licenciado de fliperama no 2600, que dobrou as vendas do console em 1980.',
    controls: '← → ou A D movem o canhão · Espaço atira · P pausa',
    controlsShort: ['A D OU SETAS MOVEM O CANHAO', 'ESPACO ATIRA'],
    tapToFire: true,

    create: function (api) {
      var W = api.W, H = api.H;
      var CHAO = H - 12;
      var jogador = { x: W / 2 - 11, y: CHAO - 14, w: 22, h: 12, morto: 0 };
      var tiro = null;
      var tirosAliens = [];
      var aliens = [];
      var escudos = [];
      var explosoes = [];
      var particulas = [];
      var disco = null, timerDisco = 900;
      var vidas = 3, onda = 1;
      var dir = 1, descer = false, timerPasso = 0, quadroAnim = 0, notaMarcha = 0;
      var timerTiroAlien = 60;
      var vidaExtraDada = false;

      function montarOnda() {
        aliens = [];
        var y0 = 36 + Math.min(onda - 1, 5) * 7;
        for (var l = 0; l < 5; l++) {
          var tipo = TIPO_LINHA[l];
          var larg = ALIENS[tipo].quadros[0][0].length * 2;
          for (var c = 0; c < 9; c++) {
            aliens.push({
              x: 34 + c * 26 + (20 - larg) / 2, y: y0 + l * 18,
              w: larg, h: 14, tipo: tipo, vivo: true, col: c
            });
          }
        }
        dir = 1; descer = false; timerPasso = 0;
        tirosAliens = [];
        tiro = null;
        montarEscudos();
      }

      function montarEscudos() {
        escudos = [];
        for (var i = 0; i < 4; i++) {
          var bx = Math.round((W * (i + 1)) / 5 - 11);
          var by = CHAO - 50;
          for (var ly = 0; ly < ESCUDO.length; ly++) {
            for (var lx = 0; lx < ESCUDO[ly].length; lx++) {
              if (ESCUDO[ly][lx] === '#') escudos.push({ x: bx + lx * 2, y: by + ly * 2, w: 2, h: 2 });
            }
          }
        }
      }
      montarOnda();

      function vivos() {
        var n = 0;
        for (var i = 0; i < aliens.length; i++) if (aliens[i].vivo) n++;
        return n;
      }

      function erodirEscudo(r, raio) {
        var atingiu = false;
        for (var i = escudos.length - 1; i >= 0; i--) {
          if (U.colide(r, escudos[i])) {
            atingiu = true;
            var cx = escudos[i].x, cy = escudos[i].y;
            for (var j = escudos.length - 1; j >= 0; j--) {
              var e = escudos[j];
              if (Math.abs(e.x - cx) <= raio && Math.abs(e.y - cy) <= raio && Math.random() < 0.7) escudos.splice(j, 1);
            }
            break;
          }
        }
        return atingiu;
      }

      function passoFormacao() {
        var restantes = vivos();
        var intervalo = 1 + Math.floor(restantes * 0.6);
        if (++timerPasso < intervalo) return;
        timerPasso = 0;
        quadroAnim ^= 1;
        api.som.bipe(MARCHA[notaMarcha], 0.08, 'square', 0.18);
        notaMarcha = (notaMarcha + 1) % 4;

        var i, a;
        if (descer) {
          for (i = 0; i < aliens.length; i++) aliens[i].y += 8;
          descer = false;
          dir = -dir;
        } else {
          var passo = 3 + (restantes < 5 ? 1 : 0);
          for (i = 0; i < aliens.length; i++) aliens[i].x += passo * dir;
          for (i = 0; i < aliens.length; i++) {
            a = aliens[i];
            if (!a.vivo) continue;
            if ((dir > 0 && a.x + a.w > W - 6) || (dir < 0 && a.x < 6)) { descer = true; break; }
          }
        }
        for (i = 0; i < aliens.length; i++) {
          a = aliens[i];
          if (!a.vivo) continue;
          // alienígenas "comem" os escudos por onde passam
          for (var j = escudos.length - 1; j >= 0; j--) if (U.colide(a, escudos[j])) escudos.splice(j, 1);
          if (a.y + a.h >= jogador.y) {
            vidas = 0;
            api.gameOver('INVADIRAM A TERRA!');
            return;
          }
        }
      }

      function alienAtira() {
        var maxTiros = Math.min(2 + onda, 5);
        if (tirosAliens.length >= maxTiros) return;
        // o alienígena mais baixo de uma coluna aleatória
        var porColuna = {};
        for (var i = 0; i < aliens.length; i++) {
          var a = aliens[i];
          if (a.vivo && (!porColuna[a.col] || a.y > porColuna[a.col].y)) porColuna[a.col] = a;
        }
        var cols = Object.keys(porColuna);
        if (!cols.length) return;
        // metade das vezes mira na coluna mais próxima do jogador
        var escolhido;
        if (Math.random() < 0.45) {
          var melhor = Infinity;
          cols.forEach(function (c) {
            var d = Math.abs(porColuna[c].x - jogador.x);
            if (d < melhor) { melhor = d; escolhido = porColuna[c]; }
          });
        } else {
          escolhido = porColuna[cols[Math.floor(Math.random() * cols.length)]];
        }
        tirosAliens.push({ x: escolhido.x + escolhido.w / 2 - 1, y: escolhido.y + escolhido.h, w: 2, h: 6, vel: 1.6 + onda * 0.15 });
      }

      function perderVida() {
        vidas--;
        jogador.morto = 90;
        U.explosao(particulas, jogador.x + 11, jogador.y + 6, ['#7cf05a', '#ffffff', '#ffd23f'], 26, 2.4);
        api.som.chiado(0.8, 0.4, 1400);
        tirosAliens = [];
        if (vidas <= 0) api.gameOver('FIM DE JOGO');
      }

      return {
        update: function (inp) {
          U.atualizarParticulas(particulas);
          for (var e = explosoes.length - 1; e >= 0; e--) if (--explosoes[e].t <= 0) explosoes.splice(e, 1);

          if (jogador.morto > 0) {
            jogador.morto--;
            return;
          }

          if (inp.left) jogador.x -= 2;
          if (inp.right) jogador.x += 2;
          jogador.x = U.clamp(jogador.x, 4, W - 4 - jogador.w);

          if (inp.pressed.fire && !tiro) {
            tiro = { x: jogador.x + 10, y: jogador.y - 6, w: 2, h: 6 };
            api.som.bipe(1200, 0.08, 'square', 0.12, 300);
          }

          passoFormacao();
          if (api.getScore() >= 1500 && !vidaExtraDada) {
            vidaExtraDada = true;
            vidas++;
            api.som.bipe(1046, 0.25, 'square', 0.12);
          }

          // tiro do jogador
          var i;
          if (tiro) {
            tiro.y -= 5;
            if (tiro.y < 14) tiro = null;
            else if (erodirEscudo(tiro, 3)) tiro = null;
            else {
              for (i = 0; i < aliens.length; i++) {
                var a = aliens[i];
                if (a.vivo && U.colide(tiro, a)) {
                  a.vivo = false;
                  api.addScore(ALIENS[a.tipo].pontos);
                  explosoes.push({ x: a.x + a.w / 2 - 8, y: a.y, t: 14, cor: ALIENS[a.tipo].cor });
                  api.som.chiado(0.2, 0.25, 3000);
                  tiro = null;
                  break;
                }
              }
              if (tiro && disco && U.colide(tiro, disco)) {
                var p = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
                api.addScore(p);
                U.explosao(particulas, disco.x + 14, disco.y + 5, ['#ff4848', '#ffffff'], 20, 2);
                disco.valor = p;
                disco.morto = 60;
                api.som.bipe(880, 0.3, 'square', 0.15, 220);
                tiro = null;
              }
              if (tiro) {
                for (i = tirosAliens.length - 1; i >= 0; i--) {
                  if (U.colide(tiro, tirosAliens[i])) { tirosAliens.splice(i, 1); tiro = null; break; }
                }
              }
            }
          }

          // tiros dos alienígenas
          if (--timerTiroAlien <= 0) {
            alienAtira();
            timerTiroAlien = Math.max(14, 55 - onda * 5 - (45 - vivos()) * 0.5);
          }
          for (i = tirosAliens.length - 1; i >= 0; i--) {
            var t = tirosAliens[i];
            t.y += t.vel;
            if (t.y > CHAO) { tirosAliens.splice(i, 1); continue; }
            if (erodirEscudo(t, 3)) { tirosAliens.splice(i, 1); continue; }
            if (U.colide(t, jogador)) { tirosAliens.splice(i, 1); perderVida(); return; }
          }

          // disco voador
          if (disco) {
            if (disco.morto) {
              if (--disco.morto <= 0) disco = null;
            } else {
              disco.x += disco.vx;
              if (api.quadro % 8 === 0) api.som.bipe(disco.vx > 0 ? 600 : 520, 0.07, 'sine', 0.06, 700);
              if (disco.x < -40 || disco.x > W + 40) disco = null;
            }
          } else if (--timerDisco <= 0) {
            var daEsquerda = Math.random() < 0.5;
            disco = { x: daEsquerda ? -28 : W, y: 18, w: 28, h: 10, vx: daEsquerda ? 1.1 : -1.1, morto: 0 };
            timerDisco = api.randInt(900, 1500);
          }

          if (vivos() === 0) {
            onda++;
            api.som.bipe(523, 0.1, 'square', 0.15);
            api.som.bipe(659, 0.1, 'square', 0.12);
            api.som.bipe(784, 0.25, 'square', 0.1);
            montarOnda();
          }
        },

        draw: function (ctx) {
          ctx.fillStyle = '#05050c';
          ctx.fillRect(0, 0, W, H);
          // estrelas fixas de fundo
          ctx.fillStyle = '#26263a';
          for (var s = 0; s < 40; s++) ctx.fillRect((s * 97) % W, 20 + ((s * 53) % (H - 40)), 1, 1);

          api.texto(ctx, String(api.getScore()), 8, 4, 2, '#ffffff');
          api.texto(ctx, 'ONDA ' + onda, W / 2, 6, 1, '#6b6f78', 'center');
          for (var v = 0; v < vidas - 1; v++) api.sprite(ctx, CANHAO, W - 20 - v * 16, 4, 1, '#7cf05a');

          var i;
          for (i = 0; i < aliens.length; i++) {
            var a = aliens[i];
            if (!a.vivo) continue;
            var def = ALIENS[a.tipo];
            api.sprite(ctx, def.quadros[quadroAnim], a.x, a.y, 2, def.cor);
          }
          for (i = 0; i < explosoes.length; i++) {
            api.sprite(ctx, EXPLOSAO, explosoes[i].x, explosoes[i].y, 2, explosoes[i].cor);
          }

          ctx.fillStyle = '#7cf05a';
          for (i = 0; i < escudos.length; i++) ctx.fillRect(escudos[i].x, escudos[i].y, 2, 2);

          if (disco) {
            if (disco.morto) api.texto(ctx, String(disco.valor), disco.x + 14, disco.y + 2, 1, '#ff4848', 'center');
            else api.sprite(ctx, DISCO, disco.x, disco.y, 2, '#ff4848');
          }

          if (jogador.morto === 0 || (jogador.morto < 40 && Math.floor(jogador.morto / 5) % 2 === 0)) {
            api.sprite(ctx, CANHAO, jogador.x, jogador.y, 2, '#7cf05a');
          }

          ctx.fillStyle = '#ffffff';
          if (tiro) ctx.fillRect(tiro.x, Math.round(tiro.y), tiro.w, tiro.h);
          ctx.fillStyle = '#ffd23f';
          for (i = 0; i < tirosAliens.length; i++) {
            var t = tirosAliens[i];
            var zig = Math.floor(t.y / 3) % 2 ? 1 : -1;
            ctx.fillRect(Math.round(t.x), Math.round(t.y), 2, 2);
            ctx.fillRect(Math.round(t.x + zig), Math.round(t.y + 2), 2, 2);
            ctx.fillRect(Math.round(t.x), Math.round(t.y + 4), 2, 2);
          }

          U.desenharParticulas(ctx, particulas);
          ctx.fillStyle = '#7cf05a';
          ctx.fillRect(0, CHAO, W, 2);
        }
      };
    }
  });
})();
