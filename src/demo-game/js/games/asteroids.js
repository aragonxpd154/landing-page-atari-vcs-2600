/* ASTEROIDES — inspirado em Asteroids (versão Atari 2600, 1981). */
(function () {
  'use strict';

  var CORES_ROCHA = ['#e8a85a', '#a8e85a', '#5ac8e8', '#e85a9a', '#d8d8d8', '#e8e85a'];
  var RAIOS = [22, 12, 6];
  var PONTOS = [20, 50, 100];

  Atari.register({
    id: 'asteroids',
    title: 'ASTEROIDES',
    publisher: 'ATARI',
    year: 1981,
    color: '#a8e85a',
    cartColor: '#a8e85a',
    summary: 'Homenagem a Asteroids: gire a nave, acelere e destrua as rochas antes que elas destruam você. Foi um dos cartuchos mais vendidos do 2600.',
    controls: '← → giram · ↑ acelera · Espaço atira · ↓ hiperespaço',
    controlsShort: ['SETAS GIRAM E ACELERAM', 'ESPACO ATIRA   BAIXO HIPERESPACO'],
    tapToFire: true,

    create: function (api) {
      var W = api.W, H = api.H;
      var nave, tiros = [], rochas = [], particulas = [];
      var vidas = 3, onda = 0, proximaVida = 5000;
      var esperaOnda = 0, timerMotor = 0, batida = 0, timerBatida = 0;

      function novaNave() {
        nave = { x: W / 2, y: H / 2, vx: 0, vy: 0, ang: -Math.PI / 2, inv: 120, morta: 0, acel: false, hiper: 0 };
      }
      novaNave();

      function novaRocha(x, y, tam, vel) {
        var n = 9 + Math.floor(Math.random() * 3);
        var forma = [];
        for (var i = 0; i < n; i++) forma.push(0.7 + Math.random() * 0.35);
        var a = Math.random() * Math.PI * 2;
        var v = (vel || 0.5) + Math.random() * 0.6 + tam * 0.25;
        rochas.push({
          x: x, y: y, tam: tam, r: RAIOS[tam], forma: forma,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          rot: 0, vrot: (Math.random() - 0.5) * 0.04,
          cor: CORES_ROCHA[Math.floor(Math.random() * CORES_ROCHA.length)]
        });
      }

      function novaOnda() {
        onda++;
        var n = Math.min(3 + onda, 10);
        for (var i = 0; i < n; i++) {
          // nasce longe do centro (onde está a nave)
          var x, y;
          do {
            x = Math.random() * W;
            y = Math.random() * H;
          } while (Math.hypot(x - nave.x, y - nave.y) < 80);
          novaRocha(x, y, 0, 0.3 + onda * 0.05);
        }
      }
      novaOnda();

      function envolver(o) {
        if (o.x < 0) o.x += W; else if (o.x >= W) o.x -= W;
        if (o.y < 0) o.y += H; else if (o.y >= H) o.y -= H;
      }

      function distEnvolvida(a, b) {
        var dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
        if (dx > W / 2) dx = W - dx;
        if (dy > H / 2) dy = H - dy;
        return Math.hypot(dx, dy);
      }

      function quebrar(i) {
        var r = rochas[i];
        rochas.splice(i, 1);
        api.addScore(PONTOS[r.tam]);
        Atari.util.explosao(particulas, r.x, r.y, [r.cor, '#ffffff'], 8 + (2 - r.tam) * 4, 1.6);
        api.som.chiado(0.15 + (2 - r.tam) * 0.15, 0.35, 900 + r.tam * 900);
        if (r.tam < 2) {
          novaRocha(r.x, r.y, r.tam + 1, 0.6 + onda * 0.05);
          novaRocha(r.x, r.y, r.tam + 1, 0.6 + onda * 0.05);
        }
        if (api.getScore() >= proximaVida) {
          vidas++;
          proximaVida += 5000;
          api.som.bipe(1046, 0.3, 'square', 0.12);
        }
      }

      function explodirNave() {
        Atari.util.explosao(particulas, nave.x, nave.y, ['#ffffff', '#ffd23f', '#e85a5a'], 30, 2.2);
        api.som.chiado(1.0, 0.45, 1200);
        vidas--;
        nave.morta = 100;
        if (vidas <= 0) api.gameOver('FIM DE JOGO');
      }

      function centroLivre() {
        for (var i = 0; i < rochas.length; i++) {
          if (Math.hypot(rochas[i].x - W / 2, rochas[i].y - H / 2) < rochas[i].r + 40) return false;
        }
        return true;
      }

      return {
        update: function (inp) {
          Atari.util.atualizarParticulas(particulas);
          var i, j;

          for (i = 0; i < rochas.length; i++) {
            var r = rochas[i];
            r.x += r.vx; r.y += r.vy; r.rot += r.vrot;
            envolver(r);
          }

          // "batida" de fundo que acelera conforme restam menos rochas
          if (--timerBatida <= 0) {
            timerBatida = Math.max(18, 60 - (onda * 4) - Math.max(0, 12 - rochas.length) * 2);
            api.som.bipe(batida ? 55 : 62, 0.09, 'square', 0.14);
            batida ^= 1;
          }

          if (nave.morta > 0) {
            nave.morta--;
            if (nave.morta <= 1) {
              if (centroLivre()) { novaNave(); } else { nave.morta = 2; }
            }
          } else if (nave.hiper > 0) {
            if (--nave.hiper === 0) {
              nave.x = Math.random() * W;
              nave.y = Math.random() * H;
              nave.vx = nave.vy = 0;
              nave.inv = 20;
            }
          } else {
            if (inp.left) nave.ang -= 0.075;
            if (inp.right) nave.ang += 0.075;
            nave.acel = inp.up;
            if (inp.up) {
              nave.vx += Math.cos(nave.ang) * 0.09;
              nave.vy += Math.sin(nave.ang) * 0.09;
              if (--timerMotor <= 0) { api.som.chiado(0.12, 0.12, 500); timerMotor = 7; }
            }
            var v = Math.hypot(nave.vx, nave.vy);
            if (v > 3.6) { nave.vx *= 3.6 / v; nave.vy *= 3.6 / v; }
            nave.vx *= 0.992; nave.vy *= 0.992;
            nave.x += nave.vx; nave.y += nave.vy;
            envolver(nave);
            if (nave.inv > 0) nave.inv--;

            if (inp.pressed.fire && tiros.length < 4) {
              tiros.push({
                x: nave.x + Math.cos(nave.ang) * 8, y: nave.y + Math.sin(nave.ang) * 8,
                vx: Math.cos(nave.ang) * 4.6 + nave.vx, vy: Math.sin(nave.ang) * 4.6 + nave.vy, vida: 48
              });
              api.som.bipe(880, 0.07, 'square', 0.1, 220);
            }
            if (inp.pressed.down) {
              nave.hiper = 30;
              api.som.bipe(200, 0.4, 'sine', 0.12, 1600);
            }

            if (nave.inv === 0 && nave.hiper === 0) {
              for (i = 0; i < rochas.length; i++) {
                if (distEnvolvida(nave, rochas[i]) < rochas[i].r * 0.85 + 5) {
                  quebrar(i);
                  explodirNave();
                  break;
                }
              }
            }
          }

          for (i = tiros.length - 1; i >= 0; i--) {
            var t = tiros[i];
            t.x += t.vx; t.y += t.vy;
            envolver(t);
            if (--t.vida <= 0) { tiros.splice(i, 1); continue; }
            for (j = rochas.length - 1; j >= 0; j--) {
              if (distEnvolvida(t, rochas[j]) < rochas[j].r * 0.9) {
                quebrar(j);
                tiros.splice(i, 1);
                break;
              }
            }
          }

          if (rochas.length === 0) {
            if (esperaOnda === 0) esperaOnda = 90;
            else if (--esperaOnda === 0) novaOnda();
          }
        },

        draw: function (ctx) {
          ctx.fillStyle = '#04040a';
          ctx.fillRect(0, 0, W, H);
          ctx.lineWidth = 1.2;
          ctx.lineJoin = 'round';

          var i, k;
          for (i = 0; i < rochas.length; i++) {
            var r = rochas[i];
            ctx.strokeStyle = r.cor;
            // desenha também as cópias que atravessam as bordas
            for (var ox = -1; ox <= 1; ox++) {
              for (var oy = -1; oy <= 1; oy++) {
                var cx = r.x + ox * W, cy = r.y + oy * H;
                if (cx < -r.r || cx > W + r.r || cy < -r.r || cy > H + r.r) continue;
                ctx.beginPath();
                for (k = 0; k < r.forma.length; k++) {
                  var a = r.rot + (k / r.forma.length) * Math.PI * 2;
                  var px = cx + Math.cos(a) * r.r * r.forma[k];
                  var py = cy + Math.sin(a) * r.r * r.forma[k];
                  if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
              }
            }
          }

          ctx.fillStyle = '#ffffff';
          for (i = 0; i < tiros.length; i++) ctx.fillRect(Math.round(tiros[i].x) - 1, Math.round(tiros[i].y) - 1, 2, 2);

          var visivel = nave.morta === 0 && nave.hiper === 0 && (nave.inv === 0 || Math.floor(nave.inv / 4) % 2 === 0);
          if (visivel) desenharNave(ctx, nave.x, nave.y, nave.ang, nave.acel && api.quadro % 4 < 2);

          Atari.util.desenharParticulas(ctx, particulas);

          api.texto(ctx, String(api.getScore()), 8, 6, 2, '#ffffff');
          for (i = 0; i < vidas - 1; i++) desenharNave(ctx, W - 12 - i * 12, 12, -Math.PI / 2, false, 0.7);
          if (rochas.length === 0 && esperaOnda > 0) {
            api.texto(ctx, 'ONDA ' + (onda + 1), W / 2, H / 2 - 6, 2, '#a8e85a', 'center');
          }
        }
      };

      function desenharNave(ctx, x, y, ang, chama, escala) {
        var s = escala || 1;
        var c = Math.cos(ang), sn = Math.sin(ang);
        function p(px, py) { return [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s]; }
        var nariz = p(9, 0), ae = p(-6, -6), ad = p(-6, 6), tras = p(-3, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(nariz[0], nariz[1]);
        ctx.lineTo(ae[0], ae[1]);
        ctx.lineTo(tras[0], tras[1]);
        ctx.lineTo(ad[0], ad[1]);
        ctx.closePath();
        ctx.stroke();
        if (chama) {
          var f1 = p(-4, -3), f2 = p(-11, 0), f3 = p(-4, 3);
          ctx.strokeStyle = '#ffa020';
          ctx.beginPath();
          ctx.moveTo(f1[0], f1[1]);
          ctx.lineTo(f2[0], f2[1]);
          ctx.lineTo(f3[0], f3[1]);
          ctx.stroke();
        }
      }
    }
  });
})();
