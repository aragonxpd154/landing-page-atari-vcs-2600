/* FREEWAY — inspirado em Freeway (Activision, 1981). Atravesse a galinha pela rodovia! */
(function () {
  'use strict';
  var U = Atari.util;

  var GALINHA = [
    '....##..',
    '...####.',
    '...#.##.',
    '#..####.',
    '#######.',
    '.######.',
    '..####..',
    '..#..#..'
  ];
  var CORES_CARRO = ['#e85a5a', '#5a8ae8', '#e8c85a', '#5ae8a0', '#e85ad0', '#e8e8e8', '#e8925a', '#9a5ae8'];
  var VELOCIDADES = [1.1, 1.5, 2.0, 2.6, 3.2, 3.2, 2.6, 2.0, 1.5, 1.1];

  Atari.register({
    id: 'freeway',
    title: 'FREEWAY',
    publisher: 'ACTIVISION',
    year: 1981,
    color: '#f0e050',
    cartColor: '#f0e050',
    summary: 'Homenagem a Freeway, de David Crane: atravesse sua galinha por dez faixas de trânsito antes que o tempo acabe — e vença a galinha da CPU.',
    controls: '↑ ↓ ou W S movem a galinha · faça o máximo de travessias em 2min16s',
    controlsShort: ['W S OU SETAS MOVEM A GALINHA', 'ATRAVESSE MAIS VEZES QUE A CPU'],

    create: function (api) {
      var W = api.W, H = api.H;
      var TOPO = 32, FAIXA = 17, NF = 10;
      var BASE = TOPO + FAIXA * NF; // 202
      var TEMPO_TOTAL = 136 * 60;
      var tempo = TEMPO_TOTAL;
      var faixas = [];
      var jog = { x: 92, y: BASE + 2, atordoada: 0, pontos: 0, cor: '#f0e050' };
      var cpu = { x: 214, y: BASE + 2, atordoada: 0, pontos: 0, cor: '#f0a050', espera: 0 };

      for (var f = 0; f < NF; f++) {
        var dir = f < 5 ? -1 : 1;
        var carros = [];
        var qtd = 2 + (f % 3 === 0 ? 1 : 0);
        var espaco = (W + 60) / qtd;
        for (var c = 0; c < qtd; c++) {
          var caminhao = Math.random() < 0.22;
          carros.push({
            x: c * espaco + Math.random() * espaco * 0.4,
            w: caminhao ? 30 : 17,
            caminhao: caminhao,
            cor: CORES_CARRO[(f * 3 + c) % CORES_CARRO.length]
          });
        }
        faixas.push({ y: TOPO + f * FAIXA, dir: dir, vel: VELOCIDADES[f] * 0.75, carros: carros });
      }

      function caixa(g) { return { x: g.x + 3, y: g.y + 3, w: 10, h: 11 }; }

      function carroCaixa(fx, car) {
        return { x: car.x, y: fx.y + (car.caminhao ? 2 : 3), w: car.w, h: car.caminhao ? 13 : 11 };
      }

      function moverGalinha(g, dy) {
        if (g.atordoada > 0) {
          g.atordoada--;
          if (g.atordoada > 16) g.y = Math.min(BASE + 2, g.y + 1.2); // empurrada para trás
          return;
        }
        g.y += dy;
        g.y = Math.min(g.y, BASE + 2);
        if (g.y < TOPO - 16) {
          g.pontos++;
          g.y = BASE + 2;
          if (g === jog) {
            api.setScore(jog.pontos);
            api.som.bipe(660, 0.08, 'square', 0.15);
            api.som.bipe(990, 0.15, 'square', 0.12);
          }
        }
        var cx = caixa(g);
        for (var i = 0; i < faixas.length; i++) {
          var fx = faixas[i];
          if (cx.y + cx.h < fx.y || cx.y > fx.y + FAIXA) continue;
          for (var j = 0; j < fx.carros.length; j++) {
            if (U.colide(cx, carroCaixa(fx, fx.carros[j]))) {
              g.atordoada = 36;
              if (g === jog) {
                api.som.bipe(1400, 0.06, 'square', 0.15, 700);
                api.som.bipe(900, 0.12, 'square', 0.12, 1500);
              }
              return;
            }
          }
        }
      }

      // CPU: existe carro que vai cruzar a coluna da galinha na faixa [y0, y1] nos próximos T quadros?
      function perigo(cx, y0, y1, T) {
        var fator = 1 + (1 - tempo / TEMPO_TOTAL) * 0.25;
        for (var i = 0; i < faixas.length; i++) {
          var fx = faixas[i];
          if (y1 < fx.y + 2 || y0 > fx.y + FAIXA - 2) continue;
          var vel = fx.vel * fator;
          for (var j = 0; j < fx.carros.length; j++) {
            var car = fx.carros[j];
            var passou = fx.dir > 0 ? car.x > cx.x + cx.w + 2 : car.x + car.w < cx.x - 2;
            if (passou) continue;
            var frente = fx.dir > 0 ? cx.x - 2 - (car.x + car.w) : car.x - (cx.x + cx.w + 2);
            if (frente / vel < T) return true;
          }
        }
        return false;
      }

      // CPU: sobe quando o caminho está livre, recua se for ser atropelada
      function decidirCpu() {
        if (cpu.espera > 0) { cpu.espera--; return 0; }
        var cx = caixa(cpu);
        if (!perigo(cx, cx.y - 15, cx.y + cx.h, 17)) return -1.2;
        if (perigo(cx, cx.y, cx.y + cx.h, 8)) {
          return perigo(cx, cx.y + 4, cx.y + cx.h + 10, 10) ? -1.2 : 1.2;
        }
        if (Math.random() < 0.01) cpu.espera = 12; // pequena hesitação "humana"
        return 0;
      }

      return {
        update: function (inp) {
          var fator = 1 + (1 - tempo / TEMPO_TOTAL) * 0.25;
          for (var i = 0; i < faixas.length; i++) {
            var fx = faixas[i];
            for (var j = 0; j < fx.carros.length; j++) {
              var car = fx.carros[j];
              car.x += fx.vel * fx.dir * fator;
              if (fx.dir > 0 && car.x > W + 10) car.x = -car.w - 10 - Math.random() * 30;
              if (fx.dir < 0 && car.x + car.w < -10) car.x = W + 10 + Math.random() * 30;
            }
          }
          var dy = 0;
          if (inp.up) dy = -1.2;
          else if (inp.down) dy = 1.2;
          moverGalinha(jog, dy);
          moverGalinha(cpu, decidirCpu());

          if (api.quadro % 30 === 0 && (inp.up || inp.down) && jog.atordoada === 0) api.som.bipe(120, 0.03, 'square', 0.06);

          if (--tempo <= 0) {
            var msg = jog.pontos > cpu.pontos ? 'VOCE VENCEU!' : jog.pontos < cpu.pontos ? 'A CPU VENCEU' : 'EMPATE!';
            api.gameOver(msg);
          }
        },

        draw: function (ctx) {
          // grama e calçadas
          ctx.fillStyle = '#3c3c3c';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#a8a8a8';
          ctx.fillRect(0, TOPO - 14, W, 14);
          ctx.fillRect(0, BASE, W, 16);
          ctx.fillStyle = '#5a5a5a';
          ctx.fillRect(0, TOPO, W, BASE - TOPO);
          // marcações
          for (var f = 1; f < NF; f++) {
            var y = TOPO + f * FAIXA - 1;
            if (f === 5) {
              ctx.fillStyle = '#e8c840';
              ctx.fillRect(0, y - 1, W, 1);
              ctx.fillRect(0, y + 1, W, 1);
            } else {
              ctx.fillStyle = '#c8c8c8';
              for (var x = 0; x < W; x += 16) ctx.fillRect(x, y, 8, 1);
            }
          }
          // carros
          for (var i = 0; i < faixas.length; i++) {
            var fx = faixas[i];
            for (var j = 0; j < fx.carros.length; j++) desenharCarro(ctx, fx, fx.carros[j]);
          }
          desenharGalinha(ctx, jog);
          desenharGalinha(ctx, cpu);

          // placar
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(0, 0, W, TOPO - 14);
          api.texto(ctx, String(jog.pontos), jog.x + 8, 3, 2, jog.cor, 'center');
          api.texto(ctx, String(cpu.pontos), cpu.x + 8, 3, 2, cpu.cor, 'center');
          api.texto(ctx, 'VOCE', jog.x - 28, 6, 1, jog.cor, 'right');
          api.texto(ctx, 'CPU', cpu.x + 44, 6, 1, cpu.cor);
          var seg = Math.ceil(tempo / 60);
          var txt = Math.floor(seg / 60) + ':' + ('0' + (seg % 60)).slice(-2);
          api.texto(ctx, txt, W / 2, 6, 1, seg <= 10 && api.quadro % 30 < 15 ? '#ff0021' : '#ffffff', 'center');
          // barra de tempo
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(0, BASE + 16, W, H - BASE - 16);
          ctx.fillStyle = '#f0e050';
          ctx.fillRect(8, BASE + 24, Math.round((W - 16) * (tempo / TEMPO_TOTAL)), 4);
        }
      };

      function desenharCarro(ctx, fx, car) {
        var x = Math.round(car.x), y = fx.y;
        var frente = fx.dir > 0;
        if (car.caminhao) {
          ctx.fillStyle = '#d8d8d8';
          ctx.fillRect(frente ? x : x + 8, y + 2, 22, 12);
          ctx.fillStyle = car.cor;
          ctx.fillRect(frente ? x + 23 : x, y + 4, 7, 10);
          ctx.fillStyle = '#202020';
          ctx.fillRect(frente ? x + 27 : x + 1, y + 5, 2, 4);
          ctx.fillRect(x + 3, y + 13, 4, 2);
          ctx.fillRect(x + 22, y + 13, 4, 2);
        } else {
          ctx.fillStyle = car.cor;
          ctx.fillRect(x, y + 5, 17, 7);
          ctx.fillRect(x + 4, y + 3, 9, 3);
          ctx.fillStyle = '#202020';
          ctx.fillRect(frente ? x + 9 : x + 5, y + 4, 3, 2);
          ctx.fillRect(x + 2, y + 12, 4, 2);
          ctx.fillRect(x + 11, y + 12, 4, 2);
        }
      }

      function desenharGalinha(ctx, g) {
        if (g.atordoada > 0 && Math.floor(g.atordoada / 3) % 2 === 0) return;
        api.sprite(ctx, GALINHA, g.x, Math.round(g.y), 2, g.cor);
        ctx.fillStyle = '#e85a2a';
        ctx.fillRect(g.x + 14, Math.round(g.y) + 4, 2, 2); // bico
        ctx.fillRect(g.x + 8, Math.round(g.y), 2, 2); // crista
      }
    }
  });
})();
