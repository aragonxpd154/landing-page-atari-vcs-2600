/* BREAKOUT — inspirado em Breakout (Atari, 1978). */
(function () {
  'use strict';
  var U = Atari.util;

  var CORES = ['#d84a4a', '#d8782f', '#c48a2a', '#c8c83c', '#48a848', '#4a5ad8'];
  var VALORES = [7, 7, 4, 4, 1, 1];

  Atari.register({
    id: 'breakout',
    title: 'BREAKOUT',
    publisher: 'ATARI',
    year: 1978,
    color: '#d8782f',
    cartColor: '#c8c83c',
    summary: 'Derrube o muro tijolo por tijolo. A versão de fliperama foi criada por Nolan Bushnell e Steve Bristow e chegou ao 2600 em 1978.',
    controls: '← → ou A D movem a raquete · Espaço lança a bola · mouse/dedo também funcionam',
    controlsShort: ['A D OU SETAS MOVEM A RAQUETE', 'ESPACO LANCA A BOLA'],

    create: function (api) {
      var W = api.W, H = api.H;
      var ESQ = 8, DIR = W - 8, TOPO = 22;
      var COLS = 16, LINHAS = 6;
      var BW = (DIR - ESQ) / COLS, BH = 7, Y0 = 50;
      var raquete = { x: W / 2 - 16, y: H - 20, w: 32, h: 4 };
      var bola = { x: 0, y: 0, w: 4, h: 4, vx: 0, vy: 0, presa: true };
      var tijolos = [];
      var vidas = 5, nivel = 1, toques = 0, velocidade = 2;
      var encolheu = false, velBonusLaranja = false, velBonusVermelho = false;

      function montarMuro() {
        tijolos = [];
        for (var l = 0; l < LINHAS; l++) {
          for (var c = 0; c < COLS; c++) {
            tijolos.push({ x: ESQ + c * BW, y: Y0 + l * BH, w: BW - 1, h: BH - 1, linha: l, vivo: true });
          }
        }
      }
      function prender() {
        bola.presa = true;
        toques = 0;
        velocidade = 2 + (nivel - 1) * 0.3;
        velBonusLaranja = velBonusVermelho = false;
      }
      montarMuro();
      prender();

      function lancar() {
        bola.presa = false;
        var ang = api.rand(-0.6, 0.6);
        bola.vx = Math.sin(ang) * velocidade;
        bola.vy = -Math.cos(ang) * velocidade;
      }

      function ajustarVelocidade(v) {
        velocidade = Math.max(velocidade, v);
        var atual = Math.hypot(bola.vx, bola.vy) || 1;
        bola.vx = (bola.vx / atual) * velocidade;
        bola.vy = (bola.vy / atual) * velocidade;
      }

      function bateuTijolo() {
        for (var i = 0; i < tijolos.length; i++) {
          var t = tijolos[i];
          if (t.vivo && U.colide(bola, t)) {
            t.vivo = false;
            api.addScore(VALORES[t.linha]);
            api.som.bipe(200 + (LINHAS - t.linha) * 90, 0.06, 'square', 0.16);
            toques++;
            if (toques === 4) ajustarVelocidade(velocidade + 0.5);
            if (toques === 12) ajustarVelocidade(velocidade + 0.5);
            if (t.linha <= 1 && !velBonusVermelho) { velBonusVermelho = true; ajustarVelocidade(velocidade + 0.6); }
            else if (t.linha <= 3 && !velBonusLaranja) { velBonusLaranja = true; ajustarVelocidade(velocidade + 0.4); }
            return true;
          }
        }
        return false;
      }

      return {
        update: function (inp) {
          var vel = 5;
          if (inp.left) raquete.x -= vel;
          else if (inp.right) raquete.x += vel;
          else if (inp.pointer.active) {
            var alvo = inp.pointer.x - raquete.w / 2;
            raquete.x += U.clamp(alvo - raquete.x, -8, 8);
          }
          raquete.x = U.clamp(raquete.x, ESQ, DIR - raquete.w);

          if (bola.presa) {
            bola.x = raquete.x + raquete.w / 2 - 2;
            bola.y = raquete.y - bola.h - 1;
            if (inp.pressed.fire || (inp.pointer.down && inp.pointer.y < H)) lancar();
            return;
          }

          // dois sub-passos por quadro: movimento em X e Y separados
          for (var s = 0; s < 2; s++) {
            bola.x += bola.vx / 2;
            if (bola.x < ESQ) { bola.x = ESQ; bola.vx = Math.abs(bola.vx); api.som.bipe(330, 0.03, 'square', 0.08); }
            if (bola.x + bola.w > DIR) { bola.x = DIR - bola.w; bola.vx = -Math.abs(bola.vx); api.som.bipe(330, 0.03, 'square', 0.08); }
            if (bateuTijolo()) { bola.x -= bola.vx / 2; bola.vx = -bola.vx; }

            bola.y += bola.vy / 2;
            if (bola.y < TOPO) {
              bola.y = TOPO; bola.vy = Math.abs(bola.vy);
              api.som.bipe(330, 0.03, 'square', 0.08);
              if (!encolheu) { encolheu = true; raquete.w = 20; raquete.x += 6; }
            }
            if (bateuTijolo()) { bola.y -= bola.vy / 2; bola.vy = -bola.vy; }

            if (bola.vy > 0 && U.colide(bola, raquete) && bola.y + bola.h - bola.vy <= raquete.y + 2) {
              var rel = U.clamp((bola.x + bola.w / 2 - (raquete.x + raquete.w / 2)) / (raquete.w / 2), -1, 1);
              var ang = rel * 1.05;
              var v = Math.hypot(bola.vx, bola.vy);
              bola.vx = Math.sin(ang) * v;
              bola.vy = -Math.cos(ang) * v;
              bola.y = raquete.y - bola.h;
              api.som.bipe(160, 0.05, 'square', 0.15);
            }
          }

          if (bola.y > H) {
            vidas--;
            api.som.bipe(180, 0.4, 'sawtooth', 0.15, 60);
            if (vidas <= 0) { api.gameOver('FIM DE JOGO'); return; }
            prender();
          }

          if (tijolos.every(function (t) { return !t.vivo; })) {
            nivel++;
            encolheu = false;
            raquete.w = 32;
            montarMuro();
            prender();
            api.som.bipe(523, 0.1, 'square', 0.15);
            api.som.bipe(784, 0.2, 'square', 0.12);
          }
        },

        draw: function (ctx) {
          ctx.fillStyle = '#0b0b10';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#8a8a8a';
          ctx.fillRect(0, TOPO - 6, W, 6);
          ctx.fillRect(0, TOPO - 6, ESQ, H);
          ctx.fillRect(DIR, TOPO - 6, W - DIR, H);
          // faixas coloridas nas laterais, como no original
          for (var l = 0; l < LINHAS; l++) {
            ctx.fillStyle = CORES[l];
            ctx.fillRect(0, Y0 + l * BH, ESQ, BH);
            ctx.fillRect(DIR, Y0 + l * BH, W - DIR, BH);
          }
          ctx.fillStyle = '#4a5ad8';
          ctx.fillRect(0, raquete.y - 2, ESQ, 8);
          ctx.fillRect(DIR, raquete.y - 2, W - DIR, 8);

          api.texto(ctx, String(api.getScore()), 12, 3, 2, '#c8c8c8');
          api.texto(ctx, 'NIVEL ' + nivel, W / 2, 5, 1, '#6b6f78', 'center');
          for (var v = 0; v < vidas; v++) {
            ctx.fillStyle = '#c8c8c8';
            ctx.fillRect(W - 14 - v * 9, 6, 6, 4);
          }

          for (var i = 0; i < tijolos.length; i++) {
            var t = tijolos[i];
            if (!t.vivo) continue;
            ctx.fillStyle = CORES[t.linha];
            ctx.fillRect(Math.round(t.x), t.y, Math.round(t.w), t.h);
          }
          ctx.fillStyle = '#d84a4a';
          ctx.fillRect(Math.round(raquete.x), raquete.y, raquete.w, raquete.h);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(bola.x), Math.round(bola.y), bola.w, bola.h);
          if (bola.presa && Math.floor(api.quadro / 25) % 2 === 0) {
            api.texto(ctx, 'ESPACO PARA LANCAR', W / 2, 150, 1, '#ffd23f', 'center');
          }
        }
      };
    }
  });
})();
