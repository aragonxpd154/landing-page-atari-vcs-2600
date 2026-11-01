/*
 * Atari 2600 Demo Games — mini "console" em JavaScript puro.
 *
 * Responsável por: loop de jogo a 60 quadros/s, teclado, toque e mouse,
 * efeitos sonoros (Web Audio), fonte bitmap 3x5 no estilo Atari,
 * telas de título / pausa / fim de jogo e recordes (localStorage).
 *
 * Cada jogo se registra com Atari.register({...}) — veja js/games/*.js.
 */
(function (global) {
  'use strict';

  var W = 320;
  var H = 240;

  /* ------------------------------------------------------------------ */
  /* Fonte bitmap 3x5                                                    */
  /* ------------------------------------------------------------------ */
  var FONT = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111',
    '3': '111001111001111', '4': '101101111001001', '5': '111100111001111',
    '6': '111100111101111', '7': '111001001010010', '8': '111101111101111',
    '9': '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011',
    D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111',
    J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101',
    S: '011100010001110', T: '111010010010010', U: '101101101101111',
    V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    ' ': '000000000000000', '-': '000000111000000', ':': '000010000010000',
    '.': '000000000000010', ',': '000000000010100', '!': '010010010000010',
    '?': '110001010000010', '/': '001001010100100', '>': '100010001010100',
    '<': '001010100010001', '+': '000010111010000', '=': '000111000111000',
    "'": '010010000000000', '(': '010100100100010', ')': '010001001001010',
    '*': '000101010101000', '#': '101111101111101'
  };

  function normalizar(texto) {
    return String(texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase();
  }

  function larguraTexto(texto, escala) {
    var n = normalizar(texto).length;
    return n ? n * 4 * escala - escala : 0;
  }

  /**
   * Desenha texto com a fonte 3x5.
   * alinhamento: 'left' | 'center' | 'right'
   */
  function texto(ctx, str, x, y, escala, cor, alinhamento) {
    escala = escala || 1;
    var s = normalizar(str);
    var largura = larguraTexto(s, escala);
    if (alinhamento === 'center') x -= Math.floor(largura / 2);
    else if (alinhamento === 'right') x -= largura;
    ctx.fillStyle = cor || '#ffffff';
    for (var i = 0; i < s.length; i++) {
      var glifo = FONT[s[i]] || FONT['?'];
      for (var p = 0; p < 15; p++) {
        if (glifo.charCodeAt(p) === 49) {
          ctx.fillRect(
            Math.round(x + (p % 3) * escala),
            Math.round(y + Math.floor(p / 3) * escala),
            escala,
            escala
          );
        }
      }
      x += 4 * escala;
    }
  }

  /** Desenha um sprite a partir de linhas de texto ('#' = pixel aceso). */
  function sprite(ctx, linhas, x, y, escala, cor, espelhar) {
    ctx.fillStyle = cor;
    for (var ly = 0; ly < linhas.length; ly++) {
      var linha = linhas[ly];
      var n = linha.length;
      for (var lx = 0; lx < n; lx++) {
        if (linha[lx] === '#') {
          var px = espelhar ? n - 1 - lx : lx;
          ctx.fillRect(
            Math.round(x + px * escala),
            Math.round(y + ly * escala),
            escala,
            escala
          );
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Som (Web Audio)                                                     */
  /* ------------------------------------------------------------------ */
  var Som = {
    ctx: null,
    ligado: true,
    ruido: null,

    iniciar: function () {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        var tam = this.ctx.sampleRate;
        this.ruido = this.ctx.createBuffer(1, tam, tam);
        var dados = this.ruido.getChannelData(0);
        for (var i = 0; i < tam; i++) dados[i] = Math.random() * 2 - 1;
      } catch (e) {
        this.ctx = null;
      }
    },

    /** Bipe simples ou varredura de frequência (f2). */
    bipe: function (f, duracao, tipo, volume, f2) {
      if (!this.ligado || !this.ctx) return;
      var c = this.ctx;
      var t = c.currentTime;
      var osc = c.createOscillator();
      var ganho = c.createGain();
      osc.type = tipo || 'square';
      osc.frequency.setValueAtTime(f, t);
      if (f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + duracao);
      var v = (volume || 0.15) * 0.6;
      ganho.gain.setValueAtTime(v, t);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
      osc.connect(ganho);
      ganho.connect(c.destination);
      osc.start(t);
      osc.stop(t + duracao + 0.02);
    },

    /** Ruído filtrado — explosões, motores. */
    chiado: function (duracao, volume, freqFiltro) {
      if (!this.ligado || !this.ctx || !this.ruido) return;
      var c = this.ctx;
      var t = c.currentTime;
      var fonte = c.createBufferSource();
      fonte.buffer = this.ruido;
      var filtro = c.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.frequency.setValueAtTime(freqFiltro || 1200, t);
      filtro.frequency.exponentialRampToValueAtTime(80, t + duracao);
      var ganho = c.createGain();
      ganho.gain.setValueAtTime((volume || 0.3) * 0.6, t);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
      fonte.connect(filtro);
      filtro.connect(ganho);
      ganho.connect(c.destination);
      fonte.start(t, Math.random() * 0.5);
      fonte.stop(t + duracao + 0.02);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Recordes                                                            */
  /* ------------------------------------------------------------------ */
  var Recordes = {
    chave: 'atari2600-demo-recordes',
    cache: null,
    ler: function () {
      if (this.cache) return this.cache;
      try {
        this.cache = JSON.parse(global.localStorage.getItem(this.chave)) || {};
      } catch (e) {
        this.cache = {};
      }
      return this.cache;
    },
    obter: function (id) {
      return this.ler()[id] || 0;
    },
    salvar: function (id, pontos) {
      var dados = this.ler();
      if (pontos <= (dados[id] || 0)) return false;
      dados[id] = pontos;
      try {
        global.localStorage.setItem(this.chave, JSON.stringify(dados));
      } catch (e) { /* navegação privada: mantém só na memória */ }
      return true;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Entrada                                                             */
  /* ------------------------------------------------------------------ */
  var MAPA_TECLAS = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'fire', KeyJ: 'fire', KeyG: 'fire', KeyK: 'fire'
  };

  function novaEntrada() {
    return {
      left: false, right: false, up: false, down: false, fire: false,
      pressed: { left: false, right: false, up: false, down: false, fire: false },
      pointer: { x: 0, y: 0, active: false, down: false }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Console                                                             */
  /* ------------------------------------------------------------------ */
  var Atari = {
    W: W,
    H: H,
    jogos: [],
    texto: texto,
    larguraTexto: larguraTexto,
    sprite: sprite,
    som: Som,
    recordes: Recordes,

    canvas: null,
    ctx: null,
    jogoAtual: null,
    instancia: null,
    estado: 'desligado', // desligado | titulo | jogando | pausado | fim
    entrada: novaEntrada(),
    pontos: 0,
    novoRecorde: false,
    mensagemFim: '',
    quadro: 0,
    ouvintes: {},

    register: function (def) {
      this.jogos.push(def);
    },

    on: function (evento, fn) {
      (this.ouvintes[evento] = this.ouvintes[evento] || []).push(fn);
    },

    emitir: function (evento, dado) {
      (this.ouvintes[evento] || []).forEach(function (fn) { fn(dado); });
    },

    ligar: function (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      canvas.width = W;
      canvas.height = H;
      this.ctx.imageSmoothingEnabled = false;
      this.configurarEntrada();
      var self = this;
      var anterior = performance.now();
      var acumulado = 0;
      var PASSO = 1000 / 60;
      function ciclo(agora) {
        acumulado += Math.min(agora - anterior, 250);
        anterior = agora;
        var passos = 0;
        while (acumulado >= PASSO && passos < 5) {
          self.atualizar();
          acumulado -= PASSO;
          passos++;
        }
        if (passos === 5) acumulado = 0;
        self.desenhar();
        global.requestAnimationFrame(ciclo);
      }
      global.requestAnimationFrame(ciclo);

      document.addEventListener('visibilitychange', function () {
        if (document.hidden && self.estado === 'jogando') self.pausar();
      });
    },

    /** API entregue a cada jogo. */
    api: function () {
      var self = this;
      return {
        W: W,
        H: H,
        texto: texto,
        larguraTexto: larguraTexto,
        sprite: sprite,
        som: Som,
        get quadro() { return self.quadro; },
        setScore: function (n) { self.pontos = n; },
        addScore: function (n) { self.pontos += n; return self.pontos; },
        getScore: function () { return self.pontos; },
        gameOver: function (mensagem) { self.fimDeJogo(mensagem); },
        recorde: function () { return Recordes.obter(self.jogoAtual.id); },
        rand: function (a, b) { return a + Math.random() * (b - a); },
        randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
      };
    },

    carregar: function (id) {
      var def = this.jogos.filter(function (j) { return j.id === id; })[0];
      if (!def) return;
      this.jogoAtual = def;
      this.pontos = 0;
      this.instancia = def.create(this.api());
      this.estado = 'titulo';
      this.limparEntrada();
      this.emitir('carregou', def);
      this.emitir('estado', this.estado);
    },

    iniciar: function () {
      if (!this.jogoAtual) return;
      Som.iniciar();
      this.pontos = 0;
      this.novoRecorde = false;
      this.mensagemFim = '';
      this.instancia = this.jogoAtual.create(this.api());
      this.estado = 'jogando';
      this.limparEntrada();
      Som.bipe(440, 0.08, 'square', 0.15);
      Som.bipe(880, 0.12, 'square', 0.1);
      this.emitir('estado', this.estado);
    },

    pausar: function () {
      if (this.estado === 'jogando') {
        this.estado = 'pausado';
      } else if (this.estado === 'pausado') {
        this.estado = 'jogando';
        Som.iniciar();
      } else {
        return;
      }
      this.limparEntrada();
      this.emitir('estado', this.estado);
    },

    fimDeJogo: function (mensagem) {
      if (this.estado !== 'jogando') return;
      this.estado = 'fim';
      this.mensagemFim = mensagem || 'FIM DE JOGO';
      this.novoRecorde = Recordes.salvar(this.jogoAtual.id, this.pontos);
      this.esperaFim = 45; // evita reiniciar sem querer segurando o tiro
      Som.bipe(392, 0.18, 'square', 0.15, 196);
      this.emitir('recorde', { id: this.jogoAtual.id, pontos: Recordes.obter(this.jogoAtual.id) });
      this.emitir('estado', this.estado);
    },

    limparEntrada: function () {
      var e = this.entrada;
      ['left', 'right', 'up', 'down', 'fire'].forEach(function (k) {
        e.pressed[k] = false;
      });
    },

    atualizar: function () {
      this.quadro++;
      var e = this.entrada;
      if (this.estado === 'jogando' && this.instancia) {
        this.instancia.update(e);
      } else if (this.estado === 'titulo') {
        if (e.pressed.fire) this.iniciar();
      } else if (this.estado === 'fim') {
        if (this.esperaFim > 0) this.esperaFim--;
        else if (e.pressed.fire) this.iniciar();
      }
      this.limparEntrada();
    },

    desenhar: function () {
      var ctx = this.ctx;
      if (!ctx) return;
      if (!this.instancia) {
        this.desenharDesligado(ctx);
        return;
      }
      ctx.save();
      this.instancia.draw(ctx);
      ctx.restore();

      var piscar = Math.floor(this.quadro / 30) % 2 === 0;
      var def = this.jogoAtual;
      if (this.estado === 'titulo') {
        this.veu(ctx, 0.62);
        var escalaTitulo = larguraTexto(def.title, 4) > W - 24 ? 3 : 4;
        texto(ctx, def.title, W / 2, 62, escalaTitulo, def.color || '#ff0021', 'center');
        texto(ctx, (def.publisher + ' ' + def.year), W / 2, 62 + escalaTitulo * 5 + 10, 1, '#a8adb7', 'center');
        var linhas = def.controlsShort || [];
        for (var i = 0; i < linhas.length; i++) {
          texto(ctx, linhas[i], W / 2, 128 + i * 11, 1, '#ffffff', 'center');
        }
        if (piscar) texto(ctx, 'APERTE ESPACO PARA JOGAR', W / 2, 196, 1, '#ffd23f', 'center');
        texto(ctx, 'RECORDE ' + Recordes.obter(def.id), W / 2, 216, 1, '#a8adb7', 'center');
      } else if (this.estado === 'pausado') {
        this.veu(ctx, 0.55);
        texto(ctx, 'PAUSA', W / 2, 96, 5, '#ffffff', 'center');
        if (piscar) texto(ctx, 'P OU ESC PARA CONTINUAR', W / 2, 140, 1, '#ffd23f', 'center');
      } else if (this.estado === 'fim') {
        this.veu(ctx, 0.62);
        var escalaFim = larguraTexto(this.mensagemFim, 4) > W - 24 ? 3 : 4;
        texto(ctx, this.mensagemFim, W / 2, 64, escalaFim, '#ff0021', 'center');
        texto(ctx, 'PONTOS ' + this.pontos, W / 2, 110, 2, '#ffffff', 'center');
        texto(ctx, 'RECORDE ' + Recordes.obter(def.id), W / 2, 132, 1, '#a8adb7', 'center');
        if (this.novoRecorde && piscar) texto(ctx, 'NOVO RECORDE!', W / 2, 150, 2, '#ffd23f', 'center');
        if (this.esperaFim <= 0 && Math.floor(this.quadro / 30) % 2 === 1) {
          texto(ctx, 'APERTE ESPACO PARA JOGAR DE NOVO', W / 2, 196, 1, '#ffd23f', 'center');
        }
      }
    },

    veu: function (ctx, alfa) {
      ctx.fillStyle = 'rgba(4,2,3,' + alfa + ')';
      ctx.fillRect(0, 0, W, H);
    },

    desenharDesligado: function (ctx) {
      // "chuvisco" de TV fora do ar
      var img = ctx.createImageData(W, H);
      var d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var v = Math.random() * 90;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      ctx.fillStyle = 'rgba(4,2,3,0.7)';
      ctx.fillRect(40, 92, W - 80, 56);
      texto(ctx, 'ESCOLHA UM CARTUCHO', W / 2, 104, 2, '#ffffff', 'center');
      texto(ctx, 'PARA LIGAR O CONSOLE', W / 2, 128, 1, '#a8adb7', 'center');
    },

    /* ---------------------------- entrada ---------------------------- */
    pressionar: function (tecla, valor) {
      var e = this.entrada;
      if (valor && !e[tecla]) e.pressed[tecla] = true;
      e[tecla] = valor;
      if (valor) Som.iniciar();
    },

    configurarEntrada: function () {
      var self = this;

      function focoPermiteJogo() {
        var el = document.activeElement;
        if (!el || el === document.body || el === self.canvas) return true;
        var tag = el.tagName;
        return !(tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA');
      }

      document.addEventListener('keydown', function (ev) {
        if (!self.jogoAtual) return;
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        var tecla = MAPA_TECLAS[ev.code];
        if (tecla) {
          if (!focoPermiteJogo()) return;
          ev.preventDefault();
          if (!ev.repeat) self.pressionar(tecla, true);
          else self.entrada[tecla] = true;
          return;
        }
        if (ev.code === 'KeyP' || ev.code === 'Escape') {
          if (self.estado === 'jogando' || self.estado === 'pausado') {
            ev.preventDefault();
            self.pausar();
          }
        } else if (ev.code === 'Enter' && focoPermiteJogo()) {
          ev.preventDefault();
          if (self.estado === 'titulo' || (self.estado === 'fim' && self.esperaFim <= 0)) self.iniciar();
          else if (self.estado === 'pausado') self.pausar();
        } else if (ev.code === 'KeyM') {
          self.alternarSom();
        }
      });

      document.addEventListener('keyup', function (ev) {
        var tecla = MAPA_TECLAS[ev.code];
        if (tecla) self.entrada[tecla] = false;
      });

      global.addEventListener('blur', function () {
        var e = self.entrada;
        e.left = e.right = e.up = e.down = e.fire = false;
      });

      // Mouse / toque sobre a tela (usado por Pong e Breakout)
      var c = this.canvas;
      function posicao(ev) {
        var r = c.getBoundingClientRect();
        self.entrada.pointer.x = ((ev.clientX - r.left) / r.width) * W;
        self.entrada.pointer.y = ((ev.clientY - r.top) / r.height) * H;
      }
      c.addEventListener('pointermove', function (ev) {
        posicao(ev);
        self.entrada.pointer.active = true;
      });
      c.addEventListener('pointerdown', function (ev) {
        posicao(ev);
        self.entrada.pointer.active = true;
        self.entrada.pointer.down = true;
        c.focus({ preventScroll: true });
        Som.iniciar();
        if (self.estado === 'titulo' || (self.estado === 'fim' && self.esperaFim <= 0)) {
          self.iniciar();
        } else if (self.estado === 'jogando' && (self.jogoAtual.tapToFire)) {
          self.pressionar('fire', true);
          setTimeout(function () { self.entrada.fire = false; }, 60);
        }
      });
      ['pointerup', 'pointercancel'].forEach(function (nome) {
        c.addEventListener(nome, function () { self.entrada.pointer.down = false; });
      });
      c.addEventListener('pointerleave', function (ev) {
        if (ev.pointerType === 'mouse') self.entrada.pointer.active = false;
        self.entrada.pointer.down = false;
      });
    },

    /** Liga botões de toque: elementos com data-tecla="left|right|up|down|fire". */
    ligarControlesToque: function (raiz) {
      var self = this;
      var botoes = raiz.querySelectorAll('[data-tecla]');
      Array.prototype.forEach.call(botoes, function (b) {
        var tecla = b.getAttribute('data-tecla');
        function soltar(ev) {
          if (ev) ev.preventDefault();
          self.entrada[tecla] = false;
          b.classList.remove('ativo');
        }
        b.addEventListener('pointerdown', function (ev) {
          ev.preventDefault();
          try { b.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
          b.classList.add('ativo');
          if (tecla === 'fire' && (self.estado === 'titulo' || (self.estado === 'fim' && self.esperaFim <= 0))) {
            self.iniciar();
            return;
          }
          self.pressionar(tecla, true);
        });
        b.addEventListener('pointerup', soltar);
        b.addEventListener('pointercancel', soltar);
        b.addEventListener('lostpointercapture', soltar);
        b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
      });
    },

    alternarSom: function () {
      Som.ligado = !Som.ligado;
      if (Som.ligado) Som.iniciar();
      this.emitir('som', Som.ligado);
      return Som.ligado;
    }
  };

  /* Utilitários compartilhados pelos jogos */
  Atari.util = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    colide: function (a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    /** Gerador pseudoaleatório com semente (mulberry32). */
    semente: function (s) {
      return function () {
        s |= 0;
        s = (s + 0x6d2b79f5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /** Partículas de explosão em quadradinhos. */
    explosao: function (lista, x, y, cores, n, forca) {
      n = n || 14;
      forca = forca || 2;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var v = Math.random() * forca + 0.3;
        lista.push({
          x: x, y: y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          vida: 20 + Math.random() * 20,
          cor: cores[i % cores.length],
          t: Math.random() < 0.5 ? 2 : 3
        });
      }
    },
    atualizarParticulas: function (lista) {
      for (var i = lista.length - 1; i >= 0; i--) {
        var p = lista[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        if (--p.vida <= 0) lista.splice(i, 1);
      }
    },
    desenharParticulas: function (ctx, lista) {
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        ctx.fillStyle = p.cor;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.t, p.t);
      }
    }
  };

  global.Atari = Atari;
})(window);
