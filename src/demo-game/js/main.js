/* Liga a interface da página (cartuchos, botões, controles de toque) ao console. */
(function () {
  'use strict';

  var canvas = document.getElementById('tela');
  var lista = document.getElementById('cartuchos');
  var btnIniciar = document.getElementById('btn-iniciar');
  var btnPausar = document.getElementById('btn-pausar');
  var btnSom = document.getElementById('btn-som');
  var detalhes = document.getElementById('jogo-detalhes');
  var led = document.getElementById('led');
  var nomeCartucho = document.getElementById('tv-cartucho');
  var tv = document.getElementById('tv');

  Atari.ligar(canvas);
  Atari.ligarControlesToque(document.getElementById('controles-toque'));

  /* mostra o controle na tela em celulares e tablets */
  function ativarToque() { document.body.classList.add('tem-toque'); }
  var telaPequena = window.matchMedia('(max-width: 1200px)').matches;
  if (window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && telaPequena)) {
    ativarToque();
  }
  window.addEventListener('touchstart', ativarToque, { once: true, passive: true });

  /* -------- cartuchos -------- */
  Atari.jogos.forEach(function (jogo, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cartucho';
    b.setAttribute('data-jogo', jogo.id);
    b.style.setProperty('--cor-etiqueta', jogo.cartColor || jogo.color);
    b.innerHTML =
      '<span class="cartucho-numero">' + ('0' + (i + 1)).slice(-2) + '</span>' +
      '<span class="cartucho-etiqueta">' +
        '<span class="cartucho-titulo">' + jogo.title + '</span>' +
        '<span class="cartucho-meta">' + capitalizar(jogo.publisher) + ' · ' + jogo.year + '</span>' +
      '</span>' +
      '<span class="cartucho-recorde">Recorde <strong data-recorde="' + jogo.id + '">' +
        Atari.recordes.obter(jogo.id) + '</strong></span>';
    b.addEventListener('click', function () { selecionar(jogo.id, true); });
    li.appendChild(b);
    lista.appendChild(li);
  });

  function capitalizar(s) {
    return s.charAt(0) + s.slice(1).toLowerCase();
  }

  function selecionar(id, rolar) {
    Atari.carregar(id);
    var jogo = Atari.jogoAtual;
    if (!jogo) return;

    Array.prototype.forEach.call(lista.querySelectorAll('.cartucho'), function (c) {
      var ativo = c.getAttribute('data-jogo') === id;
      c.classList.toggle('ativo', ativo);
      c.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });

    document.getElementById('jogo-titulo').textContent = jogo.title;
    document.getElementById('jogo-meta').textContent = capitalizar(jogo.publisher) + ' · ' + jogo.year;
    document.getElementById('jogo-resumo').textContent = jogo.summary;
    document.getElementById('jogo-controles').textContent = jogo.controls;
    detalhes.hidden = false;
    nomeCartucho.textContent = jogo.title.toLowerCase();
    tv.classList.add('ligada');

    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// em alguns navegadores */ }

    canvas.focus({ preventScroll: true });
    if (rolar && window.matchMedia('(max-width: 1200px)').matches) {
      tv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* -------- botões -------- */
  btnIniciar.addEventListener('click', function () {
    Atari.iniciar();
    canvas.focus({ preventScroll: true });
  });
  btnPausar.addEventListener('click', function () {
    Atari.pausar();
    canvas.focus({ preventScroll: true });
  });
  btnSom.addEventListener('click', function () {
    Atari.alternarSom();
  });

  Atari.on('som', function (ligado) {
    btnSom.textContent = ligado ? 'Som: ligado' : 'Som: desligado';
    btnSom.setAttribute('aria-pressed', ligado ? 'true' : 'false');
  });

  Atari.on('estado', function (estado) {
    btnIniciar.disabled = !Atari.jogoAtual;
    btnIniciar.textContent = estado === 'jogando' || estado === 'pausado' ? 'Reiniciar' : 'Iniciar';
    btnPausar.disabled = !(estado === 'jogando' || estado === 'pausado');
    btnPausar.textContent = estado === 'pausado' ? 'Continuar' : 'Pausar';
    led.classList.toggle('jogando', estado === 'jogando');
  });

  Atari.on('recorde', function (r) {
    var el = lista.querySelector('[data-recorde="' + r.id + '"]');
    if (el) el.textContent = r.pontos;
  });

  /* -------- jogo inicial pelo endereço (#riverraid, #pong...) -------- */
  var inicial = (location.hash || '').replace('#', '');
  if (inicial && Atari.jogos.some(function (j) { return j.id === inicial; })) {
    selecionar(inicial, false);
  }
})();
