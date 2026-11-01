/* PONG — inspirado em Pong / Video Olympics (Atari, 1977). Você x CPU, 11 pontos. */
(function () {
  'use strict';
  var U = Atari.util;

  Atari.register({
    id: 'pong',
    title: 'PONG',
    publisher: 'ATARI',
    year: 1977,
    color: '#e4683c',
    cartColor: '#e4683c',
    summary: 'O jogo que começou tudo. Duas raquetes, uma bola e a primeira febre dos videogames — no 2600 ele veio no cartucho Video Olympics.',
    controls: '↑ ↓ ou W S movem a raquete · também dá para usar o mouse/dedo sobre a tela',
    controlsShort: ['W S OU SETAS MOVEM A RAQUETE', 'QUEM FIZER 11 PONTOS VENCE'],

    create: function (api) {
      var W = api.W, H = api.H;
      var TOPO = 24, BASE = H - 8;
      var VITORIA = 11;
      var jogador = { x: 14, y: H / 2 - 16, w: 5, h: 32 };
      var cpu = { x: W - 19, y: H / 2 - 16, w: 5, h: 32 };
      var bola = { x: W / 2, y: H / 2, w: 5, h: 5, vx: 0, vy: 0, vel: 0 };
      var placar = [0, 0];
      var espera = 60;
      var direcaoSaque = -1;
      var erroCpu = 0;

      function sacar() {
        bola.x = W / 2 - 2;
        bola.y = api.rand(TOPO + 30, BASE - 30);
        bola.vel = 2.4;
        var ang = api.rand(-0.5, 0.5);
        bola.vx = Math.cos(ang) * bola.vel * direcaoSaque;
        bola.vy = Math.sin(ang) * bola.vel;
        espera = 50;
      }
      sacar();

      function rebater(raquete, lado) {
        var centro = raquete.y + raquete.h / 2;
        var rel = U.clamp((bola.y + bola.h / 2 - centro) / (raquete.h / 2), -1, 1);
        var ang = rel * 1.0; // até ~57°
        bola.vel = Math.min(bola.vel + 0.25, 6);
        bola.vx = Math.cos(ang) * bola.vel * lado;
        bola.vy = Math.sin(ang) * bola.vel;
        erroCpu = api.rand(-14, 14);
        api.som.bipe(lado > 0 ? 460 : 520, 0.05, 'square', 0.18);
      }

      function ponto(quem) {
        placar[quem]++;
        api.setScore(placar[0]);
        api.som.bipe(quem === 0 ? 660 : 220, 0.25, 'square', 0.15, quem === 0 ? 990 : 110);
        direcaoSaque = quem === 0 ? 1 : -1;
        if (placar[quem] >= VITORIA) {
          api.gameOver(quem === 0 ? 'VOCE VENCEU!' : 'A CPU VENCEU');
          return;
        }
        sacar();
      }

      return {
        update: function (inp) {
          // Jogador: teclado tem prioridade, depois ponteiro
          var vel = 4;
          if (inp.up) jogador.y -= vel;
          else if (inp.down) jogador.y += vel;
          else if (inp.pointer.active) {
            var alvo = inp.pointer.y - jogador.h / 2;
            jogador.y += U.clamp(alvo - jogador.y, -6, 6);
          }
          jogador.y = U.clamp(jogador.y, TOPO, BASE - jogador.h);

          // CPU: acompanha a bola com velocidade limitada e um pouco de erro
          var alvoCpu = bola.vx > 0
            ? bola.y + bola.h / 2 - cpu.h / 2 + erroCpu
            : H / 2 - cpu.h / 2;
          var maxCpu = 2.3 + Math.min(placar[0], 8) * 0.12;
          cpu.y += U.clamp(alvoCpu - cpu.y, -maxCpu, maxCpu);
          cpu.y = U.clamp(cpu.y, TOPO, BASE - cpu.h);

          if (espera > 0) { espera--; return; }

          var antX = bola.x;
          bola.x += bola.vx;
          bola.y += bola.vy;

          if (bola.y < TOPO) { bola.y = TOPO; bola.vy = Math.abs(bola.vy); api.som.bipe(300, 0.03, 'square', 0.1); }
          if (bola.y + bola.h > BASE) { bola.y = BASE - bola.h; bola.vy = -Math.abs(bola.vy); api.som.bipe(300, 0.03, 'square', 0.1); }

          // colisão "varrida" para não atravessar a raquete em alta velocidade
          var faceJ = jogador.x + jogador.w;
          if (bola.vx < 0 && antX >= faceJ - 1 && bola.x <= faceJ &&
              bola.y + bola.h >= jogador.y && bola.y <= jogador.y + jogador.h) {
            bola.x = faceJ;
            rebater(jogador, 1);
          }
          var faceC = cpu.x;
          if (bola.vx > 0 && antX + bola.w <= faceC + 1 && bola.x + bola.w >= faceC &&
              bola.y + bola.h >= cpu.y && bola.y <= cpu.y + cpu.h) {
            bola.x = faceC - bola.w;
            rebater(cpu, -1);
          }

          if (bola.x + bola.w < 0) ponto(1);
          else if (bola.x > W) ponto(0);
        },

        draw: function (ctx) {
          ctx.fillStyle = '#0b0b10';
          ctx.fillRect(0, 0, W, H);
          // paredes
          ctx.fillStyle = '#c8c8c8';
          ctx.fillRect(0, TOPO - 4, W, 4);
          ctx.fillRect(0, BASE, W, 4);
          // rede
          for (var y = TOPO + 2; y < BASE; y += 10) ctx.fillRect(W / 2 - 1, y, 2, 5);
          // placar
          api.texto(ctx, String(placar[0]), W / 2 - 30, 28, 4, '#e4683c', 'right');
          api.texto(ctx, String(placar[1]), W / 2 + 30, 28, 4, '#5c9bf0', 'left');
          api.texto(ctx, 'VOCE', 8, 6, 1, '#e4683c');
          api.texto(ctx, 'CPU', W - 8, 6, 1, '#5c9bf0', 'right');
          api.texto(ctx, 'PRIMEIRO A 11', W / 2, 6, 1, '#6b6f78', 'center');
          // raquetes e bola
          ctx.fillStyle = '#e4683c';
          ctx.fillRect(jogador.x, Math.round(jogador.y), jogador.w, jogador.h);
          ctx.fillStyle = '#5c9bf0';
          ctx.fillRect(cpu.x, Math.round(cpu.y), cpu.w, cpu.h);
          if (espera === 0 || Math.floor(espera / 6) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(bola.x), Math.round(bola.y), bola.w, bola.h);
          }
        }
      };
    }
  });
})();
