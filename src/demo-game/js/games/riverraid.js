/* RIVER RAID — inspirado em River Raid (Activision, 1982), de Carol Shaw.
   Rio gerado proceduralmente (com semente), simétrico como no original:
   pontes funcionam como checkpoints, combustível acaba, inimigos se movem. */
(function () {
  'use strict';
  var U = Atari.util;

  var ROW = 4;          // altura de uma "linha" do mapa em pixels
  var SEC = 170;        // linhas por trecho (cada trecho termina numa ponte)
  var PLAY_H = 200;     // área de jogo; abaixo fica o painel
  var CX = 160;         // centro do rio
  var CANAL_PONTE = 26; // meia-largura do rio junto às pontes

  var AVIAO = ['......##......', '......##......', '......##......', '.....####.....', '...########...',
    '.############.', '##############', '......##......', '......##......', '.....####.....', '....######....'];
  var AVIAO_CURVA = ['......##......', '......##......', '......##......', '.....####.....', '....######....',
    '...########...', '..##########..', '......##......', '......##......', '.....####.....', '....######....'];
  var HELI = [
    ['#######.......', '...#..........', '#..####.......', '#######.##....', '#..########...', '....######....', '....#....#....', '...########...'],
    ['.......#######', '...#..........', '#..####.......', '#######.##....', '#..########...', '....######....', '....#....#....', '...########...']
  ];
  var NAVIO_CASCO = ['..................', '..................', '..................', '##################', '.################.', '..##############..'];
  var NAVIO_TOPO = ['.......##.........', '......####........', '...##########.....'];
  var JATO = ['..#.............', '..##.......##...', '################', '..##.......##...', '..#.............'];

  Atari.register({
    id: 'riverraid',
    title: 'RIVER RAID',
    publisher: 'ACTIVISION',
    year: 1982,
    color: '#f0e050',
    cartColor: '#5a8ae8',
    summary: 'Homenagem a River Raid, de Carol Shaw: voe sobre o rio, destrua pontes, navios e helicópteros — e não deixe o combustível acabar!',
    controls: '← → movem · ↑ acelera · ↓ freia · Espaço atira · passe sobre FUEL para abastecer',
    controlsShort: ['SETAS MOVEM   CIMA ACELERA   BAIXO FREIA', 'ESPACO ATIRA   PASSE SOBRE FUEL'],
    tapToFire: true,

    create: function (api) {
      var W = api.W, H = api.H;
      var PY = 158;          // topo do avião na tela
      var secoes = {};
      var entidades = [];
      var particulas = [];
      var camY = 0;
      var checkpoint = 0;
      var vidas = 4;
      var proximaVida = 10000;
      var aviao, tiro, combustivel, morto, avisoComb = 0;

      /* ---------------------- geração do rio ---------------------- */
      function gerarSecao(k) {
        var rng = U.semente(9137 + k * 7919);
        var linhas = new Array(SEC);
        var w = CANAL_PONTE, iw = 0, alvoW = CANAL_PONTE, alvoIW = 0, seg = 0;
        var maxW = Math.min(70 + k * 18, 140);
        for (var r = 0; r < SEC; r++) {
          if (r < 8 || r >= SEC - 42) {
            alvoW = CANAL_PONTE; alvoIW = 0;
          } else if (--seg <= 0) {
            seg = 8 + Math.floor(rng() * 20);
            alvoW = 34 + Math.floor(rng() * (maxW - 34));
            alvoIW = (alvoW >= 84 && rng() < 0.55) ? 16 + Math.floor(rng() * (alvoW - 64)) : 0;
          }
          w += U.clamp(alvoW - w, -4, 4);
          if (alvoIW > iw && iw === 0) iw = 8;
          else iw += U.clamp(alvoIW - iw, -4, 4);
          if (iw > w - 30) iw = Math.max(0, w - 30);
          if (iw < 8) iw = alvoIW > 0 && w - 30 >= 8 ? 8 : 0;
          linhas[r] = { w: w, iw: iw, ponte: r >= SEC - 14 && r < SEC - 11 };
        }
        secoes[k] = { linhas: linhas };

        if (k < checkpoint) return; // trechos já vencidos não recebem inimigos

        var base = k * SEC;
        // ponte no fim do trecho
        entidades.push({ tipo: 'ponte', wy: (base + SEC - 14) * ROW, x: CX - CANAL_PONTE, w: CANAL_PONTE * 2, h: 3 * ROW, secao: k });

        var ultima = 0;
        var densidade = Math.min(0.07 + k * 0.012, 0.13);
        var chanceMover = Math.min(0.3 + k * 0.1, 0.85);
        for (r = 18; r < SEC - 44; r++) {
          if (r - ultima < 7 || rng() > densidade) continue;
          var sorteio = rng();
          var tipo = sorteio < 0.34 ? 'navio' : sorteio < 0.64 ? 'heli' : sorteio < 0.88 ? 'fuel' : 'jato';
          var dims = { navio: [18, 6], heli: [14, 8], fuel: [11, 24], jato: [16, 5] }[tipo];
          var ew = dims[0], eh = dims[1];
          var wy = (base + r) * ROW;
          if (tipo === 'jato') {
            entidades.push({ tipo: tipo, wy: wy, x: rng() < 0.5 ? -ew : W, w: ew, h: eh, vx: 0, ativo: false });
            ultima = r;
            continue;
          }
          // intervalo de água livre em todas as linhas que a entidade ocupa
          var nLin = Math.ceil(eh / ROW) + 1;
          var lado = rng() < 0.5 ? -1 : 1;
          var a = -Infinity, b = Infinity;
          for (var q = 0; q < nLin; q++) {
            var ld = linhas[Math.min(r + q, SEC - 1)];
            var ca, cb;
            if (ld.iw > 0) {
              if (lado < 0) { ca = CX - ld.w; cb = CX - ld.iw; } else { ca = CX + ld.iw; cb = CX + ld.w; }
            } else { ca = CX - ld.w; cb = CX + ld.w; }
            a = Math.max(a, ca); b = Math.min(b, cb);
          }
          if (b - a < ew + 6) continue;
          var ex = a + 3 + rng() * (b - a - ew - 6);
          entidades.push({
            tipo: tipo, wy: wy, x: ex, w: ew, h: eh,
            vx: 0, mover: tipo !== 'fuel' && rng() < chanceMover, ativo: false,
            dirInicial: rng() < 0.5 ? -1 : 1
          });
          ultima = r;
        }
      }

      function linha(r) {
        if (r < 0) return { w: CANAL_PONTE, iw: 0, ponte: false };
        var k = Math.floor(r / SEC);
        if (!secoes[k]) gerarSecao(k);
        return secoes[k].linhas[r - k * SEC];
      }

      function agua(r, x) {
        var l = linha(r);
        var d = Math.abs(x - CX);
        return d < l.w && d >= l.iw;
      }

      /** Limites do canal de água que contém x na linha r (ou null). */
      function canal(r, x) {
        var l = linha(r);
        if (!agua(r, x)) return null;
        if (l.iw === 0) return [CX - l.w, CX + l.w];
        return x < CX ? [CX - l.w, CX - l.iw] : [CX + l.iw, CX + l.w];
      }

      function telaY(wy) { return PLAY_H - (wy - camY); } // converte y do mundo para a tela
      function topoTela(e) { return telaY(e.wy + e.h); }

      /* ------------------------ estado ------------------------ */
      function reiniciarTrecho() {
        secoes = {};
        entidades = [];
        tiro = null;
        var inicio = checkpoint * SEC * ROW;
        camY = inicio + 6 - (PLAY_H - (PY + 11));
        aviao = { x: CX - 7, vel: 1, curva: 0 };
        combustivel = 100;
        morto = 0;
        // gera o trecho atual e o próximo já de início
        linha(checkpoint * SEC);
        linha((checkpoint + 1) * SEC);
      }
      reiniciarTrecho();

      function explodir(e, cores) {
        U.explosao(particulas, e.x + e.w / 2, topoTela(e) + e.h / 2, cores, 18, 2);
        api.som.chiado(0.45, 0.35, 1800);
      }

      function pontuar(n) {
        api.addScore(n);
        if (api.getScore() >= proximaVida) {
          proximaVida += 10000;
          vidas++;
          api.som.bipe(1046, 0.3, 'square', 0.12);
        }
      }

      function morrer() {
        if (morto) return;
        morto = 100;
        U.explosao(particulas, aviao.x + 7, PY + 5, ['#f0e050', '#ffffff', '#e85a2a', '#e8a82a'], 34, 2.5);
        api.som.chiado(1.2, 0.5, 1500);
        vidas--;
      }

      return {
        update: function (inp) {
          U.atualizarParticulas(particulas);
          var i, e;

          if (morto) {
            if (--morto === 0) {
              if (vidas <= 0) { api.gameOver('FIM DE JOGO'); return; }
              reiniciarTrecho();
            }
            return;
          }

          // velocidade e rolagem
          var alvoVel = inp.up ? 2.1 : inp.down ? 0.5 : 1.1;
          aviao.vel += U.clamp(alvoVel - aviao.vel, -0.06, 0.06);
          camY += aviao.vel;

          aviao.curva = 0;
          if (inp.left) { aviao.x -= 1.8; aviao.curva = -1; }
          if (inp.right) { aviao.x += 1.8; aviao.curva = 1; }
          aviao.x = U.clamp(aviao.x, 0, W - 14);

          // combustível
          combustivel -= 0.022 + aviao.vel * 0.012;
          if (combustivel < 25 && api.quadro % 40 === 0) api.som.bipe(1500, 0.08, 'square', 0.1);
          if (combustivel <= 0) { combustivel = 0; morrer(); return; }

          // colisão com as margens (vários pontos do avião)
          var pontos = [[7, 0], [0, 6], [13, 6], [4, 10], [9, 10], [7, 5]];
          if (aviao.curva !== 0) pontos = [[7, 0], [2, 6], [11, 6], [4, 10], [9, 10]];
          for (i = 0; i < pontos.length; i++) {
            var wy = camY + (PLAY_H - (PY + pontos[i][1]));
            if (!agua(Math.floor(wy / ROW), aviao.x + pontos[i][0])) { morrer(); return; }
          }

          // tiro
          if (!tiro && (inp.pressed.fire || inp.fire)) {
            tiro = { x: aviao.x + 6, y: PY - 8, w: 2, h: 8 };
            api.som.bipe(1600, 0.12, 'sawtooth', 0.07, 200);
          }
          if (tiro) {
            tiro.y -= 6;
            if (tiro.y < -10) tiro = null;
          }

          var caixaAviao = { x: aviao.x + 2, y: PY + 1, w: 10, h: 9 };
          var abastecendo = false;

          for (i = entidades.length - 1; i >= 0; i--) {
            e = entidades[i];
            var ty = topoTela(e);
            if (ty > PLAY_H + 20) { entidades.splice(i, 1); continue; }
            if (ty + e.h < -40) continue; // ainda fora da tela, acima

            // movimento
            if (e.tipo === 'jato') {
              if (!e.ativo && ty > -e.h) { e.ativo = true; e.vx = e.x < 0 ? 1.6 : -1.6; }
              e.x += e.vx;
              if (e.ativo && (e.x > W + 20 || e.x < -40)) { entidades.splice(i, 1); continue; }
            } else if ((e.tipo === 'navio' || e.tipo === 'heli') && e.mover) {
              if (!e.ativo && ty > 30 + (e.wy % 40)) {
                e.ativo = true;
                e.vx = e.dirInicial * (e.tipo === 'heli' ? 0.9 : 0.6);
              }
              if (e.ativo) {
                var nx = e.x + e.vx;
                var r0 = Math.floor(e.wy / ROW), r1 = Math.floor((e.wy + e.h) / ROW);
                var bate = false;
                for (var r = r0; r <= r1; r++) {
                  if (!agua(r, nx) || !agua(r, nx + e.w)) { bate = true; break; }
                }
                if (bate) e.vx = -e.vx; else e.x = nx;
              }
            }

            var caixa = { x: e.x, y: ty, w: e.w, h: e.h };

            // tiro acerta
            if (tiro && U.colide(tiro, caixa)) {
              tiro = null;
              if (e.tipo === 'ponte') {
                pontuar(500);
                explodir(e, ['#d8d8d8', '#e8c840', '#e85a2a', '#8a8a8a']);
                api.som.chiado(1.0, 0.45, 1000);
                checkpoint = Math.max(checkpoint, e.secao + 1);
              } else {
                var valores = { navio: 30, heli: 60, fuel: 80, jato: 100 };
                pontuar(valores[e.tipo]);
                explodir(e, e.tipo === 'fuel' ? ['#e84848', '#ffffff'] : ['#ffffff', '#e8a82a', '#202020']);
              }
              entidades.splice(i, 1);
              continue;
            }

            // colisão com o avião
            if (U.colide(caixaAviao, caixa)) {
              if (e.tipo === 'fuel') {
                abastecendo = true;
              } else {
                if (e.tipo !== 'ponte') { explodir(e, ['#ffffff', '#e8a82a']); entidades.splice(i, 1); }
                morrer();
                return;
              }
            }
          }

          if (abastecendo && combustivel < 100) {
            combustivel = Math.min(100, combustivel + 0.7);
            if (api.quadro % 6 === 0) api.som.bipe(300 + combustivel * 6, 0.05, 'square', 0.08);
          }
          avisoComb = combustivel < 25 ? avisoComb + 1 : 0;

          // descarta trechos que já ficaram para trás
          var secAtual = Math.floor(camY / ROW / SEC);
          for (var key in secoes) if (+key < secAtual - 1) delete secoes[key];
          linha((secAtual + 1) * SEC + 10);
        },

        draw: function (ctx) {
          // terreno
          ctx.fillStyle = '#5aa83c';
          ctx.fillRect(0, 0, W, PLAY_H);
          var rBase = Math.floor(camY / ROW);
          var desloc = camY - rBase * ROW;
          for (var q = 0; q <= Math.ceil(PLAY_H / ROW) + 1; q++) {
            var r = rBase + q;
            var l = linha(r);
            var y = Math.round(PLAY_H - (q + 1) * ROW + desloc);
            if (l.ponte) {
              ctx.fillStyle = '#6a6a6a';
              ctx.fillRect(0, y, W, ROW);
              if (r % 3 === 1) {
                ctx.fillStyle = '#e8c840';
                for (var xx = 4; xx < W; xx += 16) ctx.fillRect(xx, y + 1, 8, 2);
              }
            }
            ctx.fillStyle = '#2c3cb4';
            if (l.iw > 0) {
              ctx.fillRect(CX - l.w, y, l.w - l.iw, ROW);
              ctx.fillRect(CX + l.iw, y, l.w - l.iw, ROW);
            } else {
              ctx.fillRect(CX - l.w, y, l.w * 2, ROW);
            }
            // árvores decorativas nas margens
            if (!l.ponte && ((r * 2654435761) >>> 0) % 29 === 0) {
              var lado = r % 2 ? -1 : 1;
              var espacoTerra = CX - l.w;
              if (espacoTerra > 24) {
                var tx = lado < 0 ? 6 + (r * 13) % (espacoTerra - 18) : W - 18 - (r * 13) % (espacoTerra - 18);
                desenharArvore(ctx, Math.round(tx), y - 10);
              }
            }
          }

          // entidades
          for (var i = 0; i < entidades.length; i++) {
            var e = entidades[i];
            var ty = Math.round(topoTela(e));
            if (ty > PLAY_H || ty + e.h < 0) continue;
            var ex = Math.round(e.x);
            if (e.tipo === 'ponte') {
              ctx.fillStyle = '#8a8a8a';
              ctx.fillRect(ex, ty, e.w, e.h);
              ctx.fillStyle = '#e8c840';
              for (var bx = ex + 2; bx < ex + e.w - 4; bx += 10) ctx.fillRect(bx, ty + 5, 6, 2);
              ctx.fillStyle = '#4a4a4a';
              ctx.fillRect(ex, ty, e.w, 1);
              ctx.fillRect(ex, ty + e.h - 1, e.w, 1);
            } else if (e.tipo === 'navio') {
              var esp = e.vx < 0;
              api.sprite(ctx, NAVIO_CASCO, ex, ty - 3, 1, '#1c1c1c', esp);
              api.sprite(ctx, NAVIO_TOPO, ex, ty - 3, 1, '#d8d8d8', esp);
            } else if (e.tipo === 'heli') {
              api.sprite(ctx, HELI[Math.floor(api.quadro / 4) % 2], ex, ty, 1, '#1e6a28', e.vx < 0);
            } else if (e.tipo === 'jato') {
              api.sprite(ctx, JATO, ex, ty, 1, '#5ad8e8', e.vx < 0);
            } else if (e.tipo === 'fuel') {
              for (var f = 0; f < 4; f++) {
                ctx.fillStyle = f % 2 ? '#ffffff' : '#e84848';
                ctx.fillRect(ex, ty + f * 6, e.w, 6);
                api.texto(ctx, 'FUEL'[f], ex + 4, ty + f * 6 + 1, 1, f % 2 ? '#e84848' : '#ffffff');
              }
            }
          }

          if (tiro) {
            ctx.fillStyle = '#f0e050';
            ctx.fillRect(Math.round(tiro.x), Math.round(tiro.y), tiro.w, tiro.h);
          }
          if (!morto) api.sprite(ctx, aviao.curva ? AVIAO_CURVA : AVIAO, Math.round(aviao.x), PY, 1, '#f0e050');
          U.desenharParticulas(ctx, particulas);

          // painel
          ctx.fillStyle = '#8c8c8c';
          ctx.fillRect(0, PLAY_H, W, H - PLAY_H);
          ctx.fillStyle = '#6a6a6a';
          ctx.fillRect(0, PLAY_H, W, 2);
          api.texto(ctx, String(api.getScore()), W / 2, PLAY_H + 5, 2, '#f0e050', 'center');
          // medidor de combustível
          var gx = W / 2 - 50, gy = PLAY_H + 20;
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(gx, gy, 100, 15);
          api.texto(ctx, 'E', gx + 5, gy + 5, 1, '#ffffff');
          api.texto(ctx, '1/2', gx + 50, gy + 5, 1, '#ffffff', 'center');
          api.texto(ctx, 'F', gx + 92, gy + 5, 1, '#ffffff');
          var nx = gx + 4 + Math.round((combustivel / 100) * 90);
          ctx.fillStyle = combustivel < 25 && avisoComb % 20 < 10 ? '#ff0021' : '#f0e050';
          ctx.fillRect(nx, gy + 1, 3, 13);
          // vidas e ponte atual
          for (var v = 0; v < Math.min(vidas - 1, 6); v++) {
            api.sprite(ctx, AVIAO, 12 + v * 16, PLAY_H + 24, 1, '#f0e050');
          }
          api.texto(ctx, 'PONTE ' + (checkpoint + 1), W - 10, PLAY_H + 28, 1, '#1c1c1c', 'right');
        }
      };

      function desenharArvore(ctx, x, y) {
        ctx.fillStyle = '#2e6a1e';
        ctx.fillRect(x + 4, y, 4, 2);
        ctx.fillRect(x + 2, y + 2, 8, 3);
        ctx.fillRect(x, y + 5, 12, 3);
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(x + 5, y + 8, 2, 3);
      }
    }
  });
})();
