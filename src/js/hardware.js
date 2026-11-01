/*
 * Página Hardware — interações:
 *  1. Placa-mãe interativa (SVG gerado em código)
 *  2. Diagrama de blocos com passo a passo
 *  3. Mapa de memória + RAM animada
 *  4. "Correndo contra o feixe" (canvas)
 *  5. Paleta de 128 cores
 *  6. Gerador de som do TIA (Web Audio)
 *  7. Joystick com os bits de SWCHA / INPT4
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Executa fn apenas enquanto o elemento estiver visível na tela. */
  function quandoVisivel(el, aoMudar) {
    if (!('IntersectionObserver' in window)) { aoMudar(true); return; }
    new IntersectionObserver(function (entradas) {
      aoMudar(entradas[0].isIntersecting);
    }, { threshold: 0.05 }).observe(el);
  }

  /* ================================================================== */
  /* 1. PLACA-MÃE                                                        */
  /* ================================================================== */

  var PECAS = [
    {
      id: 'cpu', nome: 'Processador MOS 6507', tag: 'CPU · 28 pinos',
      caixa: [80, 312, 250, 92], marcador: [80, 312],
      texto: 'O cérebro do console. É um 6502 — o mesmo processador do Apple II e do NES — com menos pinos para baratear a produção. Ele busca as instruções no cartucho e controla todo o resto lendo e escrevendo endereços de memória.',
      specs: [['Clock', '1,19 MHz (NTSC)'], ['Arquitetura', '8 bits, little-endian'], ['Endereçamento', '13 linhas → 8 KB'], ['Interrupções', 'nenhuma (IRQ e NMI removidos)'], ['Fabricante', 'MOS Technology']],
      curiosidade: 'Em 1975 o 6502 custava cerca de US$ 25, enquanto concorrentes passavam de US$ 150. Sem esse preço, um videogame programável de US$ 199 não teria sido possível.'
    },
    {
      id: 'tia', nome: 'TIA — Television Interface Adaptor', tag: 'Vídeo e som · 40 pinos',
      caixa: [360, 424, 320, 92], marcador: [360, 424],
      texto: 'Chip feito sob medida por Jay Miner. Ele gera o sinal de vídeo pixel a pixel, os dois canais de som e lê os botões de tiro e os paddles. Também fornece o clock da CPU (divide o cristal por 3) e detecta colisões entre os objetos da tela.',
      specs: [['Código', 'CO10444 (versão NTSC)'], ['Resolução', '160 pixels por linha'], ['Objetos', 'playfield, 2 jogadores, 2 mísseis, 1 bola'], ['Cores', '128 (16 matizes × 8 brilhos)'], ['Som', '2 canais independentes']],
      curiosidade: 'O TIA não tem memória de vídeo: guarda apenas o que vai na linha atual. Toda a imagem é "redesenhada" pela CPU 60 vezes por segundo, linha por linha.'
    },
    {
      id: 'riot', nome: 'RIOT — MOS 6532', tag: 'RAM, E/S e timer · 40 pinos',
      caixa: [630, 304, 320, 92], marcador: [630, 304],
      texto: 'RAM–I/O–Timer: três funções em um chip. Guarda os 128 bytes de memória do console, lê os joysticks (porta A) e as chaves do painel (porta B) e tem um temporizador programável usado para medir o tempo do apagamento vertical.',
      specs: [['RAM', '128 bytes'], ['Porta A', 'joysticks (SWCHA, $0280)'], ['Porta B', 'chaves do painel (SWCHB, $0282)'], ['Timer', 'passos de 1, 8, 64 ou 1024 ciclos'], ['Fabricante', 'MOS Technology']],
      curiosidade: 'A pilha da CPU e todas as variáveis do jogo dividem os mesmos 128 bytes. Programadores chegavam a reaproveitar o mesmo byte para coisas diferentes em cada parte do quadro.'
    },
    {
      id: 'cartucho', nome: 'Conector do cartucho', tag: 'Slot · 24 contatos',
      caixa: [340, 186, 350, 80], marcador: [340, 186],
      texto: 'O cartucho é basicamente um chip de ROM ligado direto aos barramentos da CPU — não há nada no meio. Quando a linha de endereço A12 está em 1, quem responde é o cartucho. O jogo inteiro, até o código de partida, mora ali.',
      specs: [['Contatos', '24 (endereços, dados, +5 V e terra)'], ['Espaço visível', '4 KB ($1000–$1FFF)'], ['Jogos maiores', 'troca de bancos (8, 16, 32 KB…)'], ['BIOS', 'não existe — tudo vem do cartucho']],
      curiosidade: 'Como o console não tem sistema operacional, ligar o Atari sem cartucho não mostra nada. O primeiro byte executado já é do jogo.'
    },
    {
      id: 'cristal', nome: 'Cristal de 3,579545 MHz', tag: 'Relógio do sistema',
      caixa: [708, 440, 96, 54], marcador: [708, 440],
      texto: 'Um cristal de quartzo que oscila na frequência da subportadora de cor do padrão NTSC. O TIA usa esse sinal para gerar cada pixel e cada cor, e o divide por 3 para criar o clock da CPU.',
      specs: [['Frequência', '3,579545 MHz (NTSC)'], ['Versão PAL', '3,546894 MHz'], ['Clock da CPU', 'cristal ÷ 3 ≈ 1,19 MHz'], ['Pixels por ciclo', '3']],
      curiosidade: 'Usar a mesma frequência da cor da TV economizou componentes: a cor de cada pixel é só um atraso de fase desse sinal.'
    },
    {
      id: 'mixer', nome: 'Mixer de vídeo', tag: 'Resistores e transistores',
      caixa: [812, 420, 146, 112], marcador: [812, 420],
      texto: 'O TIA entrega sinais separados: sincronismo, 3 bits de luminância (8 níveis de brilho), cor e apagamento. Esta rede de resistores e transistores soma tudo em um único sinal de vídeo composto, que segue para o modulador de RF.',
      specs: [['Entradas', 'SYNC, LUM0–LUM2, COLOR, BLK'], ['Saída', 'vídeo composto'], ['Brilho', '8 níveis (3 bits)']],
      curiosidade: 'Muitos fãs fazem o "mod de vídeo composto": tiram o sinal daqui direto para a entrada AV da TV, pulando o modulador e ganhando uma imagem bem mais nítida.'
    },
    {
      id: 'rf', nome: 'Modulador de RF', tag: 'Saída para a TV',
      caixa: [700, 40, 250, 135], marcador: [700, 40],
      texto: 'A caixa metálica blindada transforma o vídeo composto e o som em um sinal de TV, como se fosse uma pequena emissora. A chave do canal escolhe em qual canal de VHF a TV deve ser sintonizada. A blindagem evita interferência nos aparelhos vizinhos.',
      specs: [['Canais', '2 ou 3 (VHF, versão americana)'], ['Entradas', 'vídeo composto + áudio'], ['Saída', 'cabo coaxial para a antena da TV']],
      curiosidade: 'Para jogar, era preciso ligar o cabo na entrada de antena da TV e sintonizar o canal — e torcer para não ter uma emissora local no mesmo canal.'
    },
    {
      id: 'regulador', nome: 'Regulador de tensão 7805', tag: 'Fonte · com dissipador',
      caixa: [168, 44, 136, 100], marcador: [168, 44],
      texto: 'Recebe os 9 V da fonte externa e entrega 5 V estáveis para todos os chips. O excesso de tensão vira calor, por isso o regulador fica preso a uma placa de alumínio (dissipador).',
      specs: [['Entrada', '9 V DC (fonte externa)'], ['Saída', '5 V regulados'], ['Encapsulamento', 'TO-220']],
      curiosidade: 'Um dos defeitos mais comuns em Ataris antigos é o regulador ou os capacitores de filtro ao lado dele: a imagem fica com faixas ou o console nem liga.'
    },
    {
      id: 'energia', nome: 'Conector de alimentação', tag: 'Entrada 9 V',
      caixa: [44, 48, 108, 82], marcador: [44, 48],
      texto: 'Entrada da fonte externa. Uma fonte de parede converte a tomada em 9 V contínuos, que entram aqui e seguem para o regulador.',
      specs: [['Tensão', '9 V DC'], ['Fonte', 'externa (adaptador de parede)']]
    },
    {
      id: 'joysticks', nome: 'Portas de controle DB-9', tag: 'Jogador 1 e jogador 2',
      caixa: [318, 36, 334, 74], marcador: [318, 36],
      texto: 'Dois conectores de 9 pinos para joysticks, paddles, teclados ou volantes. As direções vão para a porta A do RIOT, e os botões e potenciômetros vão para as entradas do TIA.',
      specs: [['Pinos 1–4', 'cima, baixo, esquerda, direita'], ['Pino 6', 'botão de tiro'], ['Pinos 5 e 9', 'paddles (potenciômetros)'], ['Pinos 7 e 8', '+5 V e terra']],
      curiosidade: 'O conector DB-9 do Atari virou padrão: Commodore 64, Amiga, MSX e Master System usaram joysticks compatíveis por anos.'
    },
    {
      id: 'chaves', nome: 'Chaves do painel', tag: 'Power, TV Type, Difficulty, Select, Reset',
      caixa: [70, 522, 860, 82], marcador: [70, 522],
      texto: 'As chaves que ficam na frente do console. A de liga/desliga corta a alimentação; as outras são lidas pela porta B do RIOT, e cada jogo decide o que fazer com elas.',
      specs: [['Power', 'liga e desliga'], ['TV Type', 'cor ou preto e branco'], ['Difficulty', 'A (difícil) ou B (fácil), uma por jogador'], ['Select / Reset', 'escolhe o modo e reinicia o jogo']],
      curiosidade: 'Nos primeiros modelos eram seis chaves na frente. A partir de 1980 as de dificuldade foram para trás do console.'
    },
    {
      id: 'capacitores', nome: 'Capacitores de filtro', tag: 'Eletrolíticos e cerâmicos',
      caixa: [176, 150, 142, 64], marcador: [176, 150],
      texto: 'Os capacitores eletrolíticos (cilindros azuis) suavizam a tensão da fonte; os pequenos capacitores cerâmicos espalhados pela placa ficam junto aos chips para filtrar ruídos de alta frequência.',
      specs: [['Eletrolíticos', 'filtragem da fonte'], ['Cerâmicos', 'desacoplamento dos chips']],
      curiosidade: 'Depois de 40 anos, os eletrolíticos secam. Trocá-los (o famoso "recap") é a primeira manutenção feita por quem restaura um Atari.'
    }
  ];

  function dip(x, y, w, h, pinos, nome, sub) {
    var lado = pinos / 2;
    var passo = (w - 24) / (lado - 1);
    var s = '';
    for (var i = 0; i < lado; i++) {
      var px = x + 12 + i * passo - 3;
      s += '<rect x="' + px.toFixed(1) + '" y="' + (y - 9) + '" width="6" height="10" fill="url(#pino)"/>';
      s += '<rect x="' + px.toFixed(1) + '" y="' + (y + h - 1) + '" width="6" height="10" fill="url(#pino)"/>';
    }
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="url(#chip)"/>';
    s += '<circle cx="' + x + '" cy="' + (y + h / 2) + '" r="8" fill="#0d0c0c"/>';
    s += '<circle cx="' + (x + 16) + '" cy="' + (y + h - 12) + '" r="3" fill="#2a2828"/>';
    s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 - 4) + '" class="sv-chip">' + nome + '</text>';
    s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 16) + '" class="sv-chip-sub">' + sub + '</text>';
    return s;
  }

  function eletrolitico(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#2346a8" stroke="#16307a" stroke-width="2"/>' +
      '<path d="M' + (cx - r + 3) + ',' + cy + ' A' + (r - 3) + ',' + (r - 3) + ' 0 0 1 ' + (cx - r / 3) + ',' + (cy - r + 4) + '" stroke="#9fb3ea" stroke-width="3" fill="none"/>' +
      '<path d="M' + (cx - 5) + ',' + (cy - 1) + ' l5,5 l5,-5 M' + (cx - 5) + ',' + (cy + 4) + ' l5,5 l5,-5" stroke="#16307a" stroke-width="1.5" fill="none" opacity=".6"/>';
  }

  function ceramico(cx, cy) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#d8833a" stroke="#9a5420" stroke-width="1.5"/>';
  }

  function resistor(x, y, cores, vertical) {
    var w = vertical ? 9 : 30, h = vertical ? 30 : 9;
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#d9c49a"/>';
    for (var i = 0; i < cores.length; i++) {
      if (vertical) s += '<rect x="' + x + '" y="' + (y + 6 + i * 5) + '" width="9" height="2.5" fill="' + cores[i] + '"/>';
      else s += '<rect x="' + (x + 6 + i * 5) + '" y="' + y + '" width="2.5" height="9" fill="' + cores[i] + '"/>';
    }
    return s;
  }

  function transistor(cx, cy) {
    return '<path d="M' + (cx - 10) + ',' + (cy + 5) + ' A10,10 0 0 1 ' + (cx + 10) + ',' + (cy + 5) + ' Z" fill="#141313"/>';
  }

  function db9(x, y, w, h, rotulo) {
    var s = '<rect x="' + (x - 14) + '" y="' + (y + 6) + '" width="' + (w + 28) + '" height="' + (h - 12) + '" rx="4" fill="url(#metal)"/>';
    s += '<circle cx="' + (x - 6) + '" cy="' + (y + h / 2) + '" r="4" fill="#555"/><circle cx="' + (x + w + 6) + '" cy="' + (y + h / 2) + '" r="4" fill="#555"/>';
    s += '<path d="M' + x + ',' + y + ' H' + (x + w) + ' L' + (x + w - 12) + ',' + (y + h) + ' H' + (x + 12) + ' Z" fill="#c9c9c9" stroke="#8a8a8a" stroke-width="2"/>';
    s += '<path d="M' + (x + 10) + ',' + (y + 8) + ' H' + (x + w - 10) + ' L' + (x + w - 20) + ',' + (y + h - 8) + ' H' + (x + 20) + ' Z" fill="#1b1a1a"/>';
    for (var i = 0; i < 5; i++) s += '<circle cx="' + (x + 28 + i * ((w - 56) / 4)) + '" cy="' + (y + 18) + '" r="3" fill="#d4af37"/>';
    for (var j = 0; j < 4; j++) s += '<circle cx="' + (x + 36 + j * ((w - 72) / 3)) + '" cy="' + (y + 32) + '" r="3" fill="#d4af37"/>';
    s += '<text x="' + (x + w / 2) + '" y="' + (y + h + 18) + '" class="sv-silk">' + rotulo + '</text>';
    return s;
  }

  function chave(x, y, rotulo) {
    return '<rect x="' + x + '" y="' + y + '" width="64" height="44" rx="5" fill="#1b1a1a" stroke="#3a3738" stroke-width="2"/>' +
      '<rect x="' + (x + 22) + '" y="' + (y + 8) + '" width="20" height="28" rx="3" fill="#0b0a0a"/>' +
      '<rect x="' + (x + 25) + '" y="' + (y + 10) + '" width="14" height="14" rx="3" fill="url(#metal)"/>' +
      '<text x="' + (x + 32) + '" y="' + (y + 60) + '" class="sv-silk">' + rotulo + '</text>';
  }

  function montarPlaca() {
    var trilhas = '';
    var i;
    // barramento CPU → cartucho → RIOT
    for (i = 0; i < 8; i++) {
      trilhas += '<path class="trilha" d="M' + (190 + i * 14) + ',321 V' + (290 - i * 5) + ' H' + (400 + i * 26) + ' V266"/>';
      trilhas += '<path class="trilha" d="M' + (400 + i * 26) + ',' + (290 - i * 5) + ' H' + (660 + i * 18) + ' V313"/>';
    }
    // CPU → TIA
    for (i = 0; i < 7; i++) {
      trilhas += '<path class="trilha" d="M' + (106 + i * 15) + ',395 V' + (420 - i * 2) + ' H' + (300 + i * 4) + ' V' + (470 - i * 0) + ' L' + (312 + i * 4) + ',' + (476) + ' H360"/>';
    }
    // cristal → TIA, mixer, RF
    trilhas += '<path class="trilha" d="M708,467 H690"/>';
    trilhas += '<path class="trilha" d="M690,500 H812 M880,420 V180 M900,420 V180"/>';
    // alimentação
    trilhas += '<path class="trilha trilha-forte" d="M152,90 H168 M236,144 V230 H520 V266 M236,230 H60 V600"/>';
    // joysticks → RIOT
    for (i = 0; i < 5; i++) {
      trilhas += '<path class="trilha" d="M' + (560 + i * 12) + ',110 V' + (150 + i * 8) + ' H' + (720 + i * 10) + ' V313"/>';
    }
    // chaves → RIOT
    for (i = 0; i < 4; i++) {
      trilhas += '<path class="trilha" d="M' + (672 + i * 100) + ',522 V' + (505 - i * 4) + ' H' + (960 - i * 8) + ' V' + (360) + ' H950"/>';
    }

    var decoracao = '';
    // furos de fixação
    [[54, 54], [946, 54], [54, 586], [946, 586]].forEach(function (p) {
      decoracao += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="#c9a43a"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="#0b0a0a"/>';
    });
    // capacitores cerâmicos espalhados e vias
    [[345, 312], [345, 420], [560, 412], [690, 290], [960, 300], [330, 170], [690, 186], [520, 300]].forEach(function (p) { decoracao += ceramico(p[0], p[1]); });
    for (i = 0; i < 40; i++) {
      var vx = 70 + ((i * 137) % 860), vy = 140 + ((i * 89) % 360);
      decoracao += '<circle cx="' + vx + '" cy="' + vy + '" r="2.4" fill="#c9a43a" opacity=".7"/>';
    }
    // resistores avulsos
    decoracao += resistor(130, 420, ['#7a4a1a', '#000', '#e8742c']);
    decoracao += resistor(130, 440, ['#e8c840', '#7a2a9a', '#e84848']);
    decoracao += resistor(560, 440, ['#7a4a1a', '#000', '#e84848'], true);
    decoracao += resistor(580, 440, ['#e84848', '#e84848', '#7a4a1a'], true);
    decoracao += '<text x="500" y="616" class="sv-silk sv-silk-grande">VIDEO COMPUTER SYSTEM · CX2600</text>';

    var desenhos = {
      cpu: dip(90, 330, 230, 56, 28, 'MOS 6507', 'CPU · U1'),
      tia: dip(370, 442, 300, 62, 40, 'TIA', 'CO10444 · U2'),
      riot: dip(640, 322, 300, 62, 40, 'MOS 6532', 'RIOT · U3'),
      cartucho:
        '<rect x="350" y="196" width="330" height="60" rx="6" fill="#151414" stroke="#3a3738" stroke-width="2"/>' +
        '<rect x="368" y="216" width="294" height="20" rx="3" fill="#050505"/>' +
        (function () { var c = ''; for (var k = 0; k < 12; k++) { c += '<rect x="' + (374 + k * 24) + '" y="218" width="12" height="6" fill="#d4af37"/><rect x="' + (374 + k * 24) + '" y="228" width="12" height="6" fill="#d4af37"/>'; } return c; })() +
        '<text x="515" y="188" class="sv-silk">J1 · CARTUCHO</text>',
      cristal:
        '<rect x="718" y="452" width="76" height="30" rx="15" fill="url(#metal)" stroke="#8a8a8a" stroke-width="2"/>' +
        '<text x="756" y="472" class="sv-mini">3.58</text>' +
        '<text x="756" y="500" class="sv-silk">Y1</text>',
      mixer:
        resistor(822, 432, ['#7a4a1a', '#000', '#e8742c']) + resistor(822, 448, ['#e8c840', '#7a2a9a', '#7a4a1a']) +
        resistor(822, 464, ['#e84848', '#e84848', '#e8742c']) + resistor(822, 480, ['#7a4a1a', '#48a848', '#e84848']) +
        resistor(864, 432, ['#e8742c', '#e8742c', '#7a4a1a']) + resistor(864, 448, ['#7a4a1a', '#000', '#e8c840']) +
        transistor(912, 446) + transistor(912, 476) + transistor(940, 446) +
        '<text x="884" y="522" class="sv-silk">Q1–Q3 · VÍDEO</text>',
      rf:
        '<rect x="712" y="52" width="226" height="110" rx="4" fill="url(#metal)" stroke="#8a8a8a" stroke-width="2"/>' +
        '<path d="M712,80 H938 M712,134 H938" stroke="#9a9a9a" stroke-width="1.5"/>' +
        '<text x="800" y="114" class="sv-rf">RF</text>' +
        '<rect x="872" y="92" width="40" height="22" rx="3" fill="#1b1a1a"/><rect x="876" y="95" width="16" height="16" rx="2" fill="#c9c9c9"/>' +
        '<text x="892" y="130" class="sv-mini sv-escuro">CH 2·3</text>' +
        '<path d="M760,52 C760,20 820,20 840,8" stroke="#141313" stroke-width="9" fill="none" stroke-linecap="round"/>',
      regulador:
        '<rect x="180" y="56" width="112" height="62" rx="3" fill="url(#metal)"/>' +
        (function () { var f = ''; for (var k = 0; k < 9; k++) f += '<rect x="' + (186 + k * 12) + '" y="56" width="5" height="62" fill="#9a9a9a"/>'; return f; })() +
        '<rect x="214" y="104" width="44" height="34" rx="2" fill="#141313"/>' +
        '<text x="236" y="126" class="sv-mini">7805</text>',
      energia:
        '<rect x="56" y="60" width="84" height="58" rx="6" fill="#141313" stroke="#3a3738" stroke-width="2"/>' +
        '<circle cx="98" cy="89" r="17" fill="#2a2828"/><circle cx="98" cy="89" r="6" fill="#c9c9c9"/>' +
        '<text x="98" y="140" class="sv-silk">9V DC</text>',
      joysticks: db9(330, 48, 140, 50, 'P1') + db9(500, 48, 140, 50, 'P2'),
      chaves:
        chave(90, 534, 'POWER') + chave(200, 534, 'TV TYPE') + chave(310, 534, 'L. DIFF') +
        chave(626, 534, 'R. DIFF') + chave(736, 534, 'SELECT') + chave(846, 534, 'RESET'),
      capacitores: eletrolitico(206, 182, 20) + eletrolitico(258, 182, 16) + eletrolitico(298, 186, 12)
    };

    var pecas = '';
    PECAS.forEach(function (p, n) {
      var c = p.caixa;
      pecas += '<g class="peca" data-peca="' + p.id + '" tabindex="0" role="button" aria-label="' + (n + 1) + '. ' + p.nome + '">' +
        desenhos[p.id] +
        '<rect class="peca-contorno" x="' + c[0] + '" y="' + c[1] + '" width="' + c[2] + '" height="' + c[3] + '" rx="8"/>' +
        '<g class="peca-marcador"><circle cx="' + p.marcador[0] + '" cy="' + p.marcador[1] + '" r="14"/><text x="' + p.marcador[0] + '" y="' + (p.marcador[1] + 1) + '">' + (n + 1) + '</text></g>' +
        '</g>';
    });

    var svg =
      '<svg viewBox="0 0 1000 640" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<linearGradient id="pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#23704a"/><stop offset="1" stop-color="#174d33"/></linearGradient>' +
      '<linearGradient id="chip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2c2c"/><stop offset="1" stop-color="#121111"/></linearGradient>' +
      '<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e6e6"/><stop offset=".5" stop-color="#b4b4b4"/><stop offset="1" stop-color="#d8d8d8"/></linearGradient>' +
      '<linearGradient id="pino" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a9a9a"/><stop offset=".5" stop-color="#e8e8e8"/><stop offset="1" stop-color="#9a9a9a"/></linearGradient>' +
      '<pattern id="trama" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0,10 L10,0" stroke="#ffffff" stroke-opacity=".025" stroke-width="1"/></pattern>' +
      '<style>' +
      '.sv-chip{fill:#d0d0d0;font:700 18px Poppins,sans-serif;text-anchor:middle;letter-spacing:.08em}' +
      '.sv-chip-sub{fill:#8a8a8a;font:500 12px Poppins,sans-serif;text-anchor:middle;letter-spacing:.1em}' +
      '.sv-silk{fill:#e8f2ea;font:500 11px Poppins,sans-serif;text-anchor:middle;letter-spacing:.08em;opacity:.85}' +
      '.sv-silk-grande{font-size:12px;letter-spacing:.3em;opacity:.6}' +
      '.sv-mini{fill:#e8e8e8;font:700 11px Poppins,sans-serif;text-anchor:middle}' +
      '.sv-escuro{fill:#333}' +
      '.sv-rf{fill:#6a6a6a;font:700 34px Poppins,sans-serif;text-anchor:middle;letter-spacing:.1em}' +
      '.trilha{fill:none;stroke:#3fa56c;stroke-width:2.2;opacity:.55}' +
      '.trilha-forte{stroke-width:4}' +
      '</style>' +
      '</defs>' +
      '<rect x="30" y="30" width="940" height="590" rx="16" fill="url(#pcb)"/>' +
      '<rect x="30" y="30" width="940" height="590" rx="16" fill="url(#trama)"/>' +
      '<rect x="40" y="40" width="920" height="570" rx="12" fill="none" stroke="#e8f2ea" stroke-opacity=".12" stroke-width="2"/>' +
      '<g class="placa-trilhas destaque" id="placa-trilhas">' + trilhas + '</g>' +
      decoracao + pecas +
      '</svg>';

    $('placa-svg').innerHTML = svg;
  }

  function iniciarPlaca() {
    if (!$('placa-svg')) return;
    montarPlaca();

    var lista = $('placa-lista');
    PECAS.forEach(function (p, n) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button" data-peca="' + p.id + '"><span class="num">' + (n + 1) + '</span>' + p.nome + '</button>';
      lista.appendChild(li);
    });

    function selecionar(id) {
      var p = PECAS.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      $('painel-tag').textContent = p.tag;
      $('painel-titulo').textContent = p.nome;
      $('painel-texto').textContent = p.texto;
      $('painel-specs').innerHTML = (p.specs || []).map(function (s) {
        return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>';
      }).join('');
      var cur = $('painel-curiosidade');
      if (p.curiosidade) { cur.hidden = false; cur.textContent = '💡 ' + p.curiosidade; } else { cur.hidden = true; }
      document.querySelectorAll('[data-peca]').forEach(function (el) {
        el.classList.toggle('ativa', el.getAttribute('data-peca') === id);
      });
    }

    document.querySelectorAll('[data-peca]').forEach(function (el) {
      el.addEventListener('click', function () {
        selecionar(el.getAttribute('data-peca'));
        if (el.tagName === 'BUTTON' && window.matchMedia('(max-width: 1200px)').matches) {
          $('placa-painel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
      el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selecionar(el.getAttribute('data-peca')); }
      });
    });

    $('mostrar-trilhas').addEventListener('change', function () {
      $('placa-trilhas').classList.toggle('destaque', this.checked);
    });
  }

  /* ================================================================== */
  /* 2. DIAGRAMA DE BLOCOS                                               */
  /* ================================================================== */

  var PASSOS = [
    { t: 'Ligou: a CPU acorda', on: ['cartucho', 'barramento', 'cpu'],
      txt: 'Ao ligar, o 6507 lê o endereço de partida gravado nos últimos bytes do cartucho (o vetor de RESET) e começa a executar o jogo. Não existe BIOS nem sistema operacional: todo o programa mora na ROM do cartucho.' },
    { t: 'Lê os controles', on: ['controles', 'riot', 'tia', 'barramento', 'cpu'],
      txt: 'No início de cada quadro, enquanto a TV está no apagamento vertical, o jogo lê a porta A do RIOT (direções do joystick) e as entradas do TIA (botões de tiro) e calcula as novas posições de tudo.' },
    { t: 'Guarda o estado na RAM', on: ['cpu', 'barramento', 'riot'],
      txt: 'Pontos, vidas e posições ficam nos 128 bytes de RAM do RIOT. O timer do RIOT avisa quando o tempo do apagamento está acabando, para o jogo não perder a hora de começar a desenhar.' },
    { t: 'Desenha linha por linha', on: ['cpu', 'barramento', 'tia', 'cartucho'],
      txt: 'Na área visível, a CPU reescreve os registradores do TIA a cada linha: cores, desenho dos jogadores, playfield e posições. A instrução STA WSYNC pausa a CPU até o começo da linha seguinte e mantém tudo em sincronia.' },
    { t: 'O TIA gera o vídeo e o som', on: ['clock', 'tia', 'tv'],
      txt: 'Com o cristal de 3,58 MHz o TIA gera cada pixel e sua cor. Ele entrega sincronismo, brilho e cor; a placa mistura tudo em vídeo composto, e o modulador de RF envia imagem e som para a antena da TV.' },
    { t: 'E repete 60 vezes por segundo', on: ['cartucho', 'barramento', 'cpu', 'tia', 'riot', 'clock', 'controles', 'tv'],
      txt: 'São 262 linhas por quadro e 60 quadros por segundo. Se o código atrasar um único ciclo, a imagem treme ou rola na TV — por isso os programadores contavam cada instrução a dedo.' }
  ];

  function iniciarArquitetura() {
    var svg = $('arq-svg');
    if (!svg) return;
    var atual = 0;
    var pontos = $('arq-pontos');
    PASSOS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Passo ' + (i + 1));
      b.addEventListener('click', function () { mostrar(i); });
      pontos.appendChild(b);
    });

    function mostrar(i) {
      atual = (i + PASSOS.length) % PASSOS.length;
      var p = PASSOS[atual];
      $('arq-contador').textContent = 'Passo ' + (atual + 1) + ' de ' + PASSOS.length;
      $('arq-titulo').textContent = p.t;
      $('arq-texto').textContent = p.txt;
      svg.classList.add('arq-svg-ativo');
      svg.querySelectorAll('.arq-item').forEach(function (g) {
        g.classList.toggle('aceso', p.on.indexOf(g.getAttribute('data-arq')) >= 0);
      });
      Array.prototype.forEach.call(pontos.children, function (b, k) { b.classList.toggle('ativo', k === atual); });
    }

    $('arq-anterior').addEventListener('click', function () { mostrar(atual - 1); });
    $('arq-proximo').addEventListener('click', function () { mostrar(atual + 1); });
    mostrar(0);
  }

  /* ================================================================== */
  /* 3. MEMÓRIA                                                          */
  /* ================================================================== */

  var MAPA = {
    tia: ['Registradores do TIA', 'Esses 128 endereços não guardam dados: escrever neles comanda o TIA. $02 é o WSYNC, $09 é o COLUBK (cor de fundo), $1B é o GRP0 (desenho do jogador 0) e de $15 a $1A ficam os registradores de som. Ler os mesmos endereços devolve as colisões e o estado dos botões.'],
    ram: ['RAM do RIOT', 'Os únicos 128 bytes de memória de trabalho do console. A pilha da CPU também mora aqui, crescendo a partir do $FF para baixo (em roxo na grade abaixo). Programar para o Atari era um exercício de economia: cada bit contava.'],
    io: ['Portas e timer do RIOT', '$0280 (SWCHA) lê as direções dos joysticks, $0282 (SWCHB) lê as chaves do painel e $0284 (INTIM) devolve o valor atual do timer. Escrever entre $0294 e $0297 dispara o timer contando de 1 em 1, 8 em 8, 64 em 64 ou 1024 em 1024 ciclos.'],
    rom: ['Cartucho (ROM)', 'O programa do jogo. Quando a linha de endereço A12 está em 1, quem responde é o cartucho, que aparece como 4 KB entre $1000 e $1FFF. Jogos de 8, 16 ou 32 KB trocam de banco ao acessar endereços especiais (bank switching). Os últimos bytes guardam o endereço de partida, o vetor de RESET.']
  };

  function iniciarMemoria() {
    var mapa = $('mapa');
    if (!mapa) return;
    var faixas = mapa.querySelectorAll('[data-mapa]');
    function mostrar(id) {
      $('mapa-titulo').textContent = MAPA[id][0];
      $('mapa-texto').textContent = MAPA[id][1];
      faixas.forEach(function (f) { f.classList.toggle('ativa', f.getAttribute('data-mapa') === id); });
    }
    faixas.forEach(function (f) {
      var id = f.getAttribute('data-mapa');
      f.addEventListener('mouseenter', function () { mostrar(id); });
      f.addEventListener('focus', function () { mostrar(id); });
      f.addEventListener('click', function () { mostrar(id); });
    });
    mostrar('tia');

    // grade da RAM
    var grade = $('ram-grade');
    var celulas = [];
    for (var i = 0; i < 128; i++) {
      var c = document.createElement('span');
      if (i >= 116) c.className = 'pilha';
      c.title = '$' + (0x80 + i).toString(16).toUpperCase();
      grade.appendChild(c);
      celulas.push(c);
    }
    if (reduzirMovimento) return;
    var timer = null;
    function piscar() {
      for (var k = 0; k < 4; k++) {
        var idx = Math.random() < 0.25 ? 116 + Math.floor(Math.random() * 12) : Math.floor(Math.random() * 40);
        var cel = celulas[idx];
        cel.classList.add('on');
        (function (el) { setTimeout(function () { el.classList.remove('on'); }, 160); })(cel);
      }
    }
    quandoVisivel(grade, function (v) {
      if (v && !timer) timer = setInterval(piscar, 140);
      else if (!v && timer) { clearInterval(timer); timer = null; }
    });
  }

  /* ================================================================== */
  /* 5. PALETA NTSC (aproximação usada por emuladores)                  */
  /* ================================================================== */

  var PALETA = [
    '000000', '404040', '6c6c6c', '909090', 'b0b0b0', 'c8c8c8', 'dcdcdc', 'ececec',
    '444400', '646410', '848424', 'a0a034', 'b8b840', 'd0d050', 'e8e85c', 'fcfc68',
    '702800', '844414', '985c28', 'ac783c', 'bc8c4c', 'cca05c', 'dcb468', 'ecc878',
    '841800', '983418', 'ac5030', 'c06848', 'd0805c', 'e09470', 'eca880', 'fcbc94',
    '880000', '9c2020', 'b03c3c', 'c05858', 'd07070', 'e08888', 'eca0a0', 'fcb4b4',
    '78005c', '8c2074', 'a03c88', 'b0589c', 'c070b0', 'd084c0', 'dc9cd0', 'ecb0e0',
    '480078', '602090', '783ca4', '8c58b8', 'a070cc', 'b484dc', 'c49cec', 'd4b0fc',
    '140084', '302098', '4c3cac', '6858c0', '7c70d0', '9488e0', 'a8a0ec', 'bcb4fc',
    '000088', '1c209c', '3840b0', '505cc0', '6874d0', '7c8ce0', '90a4ec', 'a4b8fc',
    '00187c', '1c3890', '3854a8', '5070bc', '6888cc', '7c9cdc', '90b4ec', 'a4c8fc',
    '002c5c', '1c4c78', '386890', '5084ac', '689cc0', '7cb4d4', '90cce8', 'a4e0fc',
    '003c2c', '1c5c48', '387c64', '509c80', '68b494', '7cd0ac', '90e4c0', 'a4fcd4',
    '003c00', '205c20', '407c40', '5c9c5c', '74b474', '8cd08c', 'a4e4a4', 'b8fcb8',
    '143800', '345c1c', '507c38', '6c9850', '84b468', '9ccc7c', 'b4e490', 'c8fca4',
    '2c3000', '4c501c', '687034', '848c4c', '9ca864', 'b4c078', 'ccd488', 'e0ec9c',
    '442800', '644818', '846830', 'a08444', 'b89c58', 'd0b46c', 'e8cc7c', 'fce08c'
  ];

  /** Cor de um valor de registrador ($00–$FE) em [r, g, b]. */
  function corAtari(valor) {
    var hex = PALETA[(valor >> 4) * 8 + ((valor >> 1) & 7)];
    return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
  }

  function iniciarPaleta() {
    var paleta = $('paleta');
    if (!paleta) return;
    var botoes = [];
    for (var h = 0; h < 16; h++) {
      for (var l = 0; l < 8; l++) {
        var valor = (h << 4) | (l << 1);
        var b = document.createElement('button');
        b.type = 'button';
        b.style.background = '#' + PALETA[h * 8 + l];
        b.setAttribute('aria-label', 'Cor $' + hex2(valor));
        b.dataset.valor = valor;
        b.addEventListener('click', function () { mostrar(+this.dataset.valor, this); });
        b.addEventListener('mouseenter', function () { mostrar(+this.dataset.valor, this); });
        paleta.appendChild(b);
        botoes.push(b);
      }
    }
    function mostrar(valor, botao) {
      var h = valor >> 4, l = (valor >> 1) & 7;
      var cor = '#' + PALETA[h * 8 + l];
      $('cor-amostra').style.background = cor;
      $('cor-valor').textContent = '$' + hex2(valor);
      $('cor-codigo').textContent = hex2(valor);
      $('cor-matiz').textContent = h + ' (%' + ('000' + h.toString(2)).slice(-4) + ')';
      $('cor-lum').textContent = l + ' (%' + ('00' + l.toString(2)).slice(-3) + ')';
      $('cor-hex').textContent = cor.toUpperCase();
      botoes.forEach(function (x) { x.classList.toggle('ativa', x === botao); });
    }
    mostrar(0x86, botoes[8 * 8 + 3]);
  }

  function hex2(n) { return ('0' + n.toString(16).toUpperCase()).slice(-2); }

  /* ================================================================== */
  /* 4. CORRENDO CONTRA O FEIXE                                          */
  /* ================================================================== */

  var LISTAGENS = {
    vsync: [
      ['NovoQuadro:', 'rot'],
      ['  lda #2'],
      ['  sta VSYNC     ; liga o sincronismo vertical'],
      ['  sta WSYNC     ; 1ª linha'],
      ['  sta WSYNC     ; 2ª linha'],
      ['  sta WSYNC     ; 3ª linha'],
      ['  lda #0'],
      ['  sta VSYNC     ; desliga o sincronismo']
    ],
    vblank: [
      ['  lda #43'],
      ['  sta TIM64T    ; timer para 37 linhas'],
      ['  jsr LerJoystick'],
      ['  jsr MoverJogadores'],
      ['  jsr TocarSons'],
      ['Espera:', 'rot'],
      ['  lda INTIM     ; o tempo acabou?'],
      ['  bne Espera'],
      ['  sta WSYNC'],
      ['  sta VBLANK    ; liga o vídeo: hora de desenhar']
    ],
    visivel: [
      ['Kernel:', 'rot'],
      ['  sta WSYNC     ; espera a próxima linha   (3)'],
      ['  lda Ceu,y     ; cor do céu desta linha   (4)'],
      ['  sta COLUBK    ; muda a cor de fundo      (3)'],
      ['  lda Sprite,y  ; 8 pixels do jogador      (4)'],
      ['  sta GRP0      ;                          (3)'],
      ['  lda Cenario,y ; blocos do playfield      (4)'],
      ['  sta PF1       ;                          (3)'],
      ['  dey           ; próxima linha            (2)'],
      ['  bne Kernel    ; repete 192 vezes         (3)']
    ],
    overscan: [
      ['  lda #2'],
      ['  sta VBLANK    ; apaga o vídeo'],
      ['  lda #35'],
      ['  sta TIM64T    ; timer para 30 linhas'],
      ['  jsr AtualizarPlacar'],
      ['Espera2:', 'rot'],
      ['  lda INTIM'],
      ['  bne Espera2'],
      ['  jmp NovoQuadro']
    ]
  };

  var VELOCIDADES = [
    [2, 'câmera lenta'], [12, 'lento'], [228, 'linha a linha'],
    [228 * 4, 'rápido'], [228 * 20, 'muito rápido'], [228 * 262, 'tempo real']
  ];

  function iniciarFeixe() {
    var canvas = $('feixe-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 228, H = 262, HB = 68, TOPO = 40, VIS = 192;
    var img = ctx.createImageData(W, H);
    var px = img.data;
    var linha = 0, clock = 0, quadro = 0;
    var rodando = !reduzirMovimento;
    var vel = 2;
    var objetos = { fundo: true, playfield: true, p0: true, p1: true, missil: true, bola: true };
    var codigo = $('feixe-codigo');
    var listagemAtual = null, linhaCodigoAtual = -1, regiaoAtual = '';

    var SPRITE0 = [0x3c, 0x7e, 0xdb, 0xff, 0xbd, 0xc3, 0x7e, 0x3c];
    var SPRITE1 = [0x42, 0x24, 0x7e, 0xdb, 0xff, 0x7e, 0x24, 0x66];
    var COR_PF = corAtari(0xc4), COR_CHAO = corAtari(0xc2), COR_P0 = corAtari(0x1e), COR_P1 = corAtari(0x58);
    var COR_BOLA = corAtari(0x44), BRANCO = [236, 236, 236];

    // fundo das regiões de apagamento
    function pintarApagamento() {
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var visivel = x >= HB && y >= TOPO && y < TOPO + VIS;
          if (visivel) continue;
          var c = y < 3 ? [46, 10, 14] : x < HB && y >= TOPO && y < TOPO + VIS ? [16, 16, 20] : [20, 20, 34];
          var i = (y * W + x) * 4;
          px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
        }
      }
    }
    pintarApagamento();
    for (var k = 3; k < px.length; k += 4) px[k] = 255;

    function montanha(bloco) {
      return 22 + Math.round(14 * Math.sin(bloco * 0.9) + 9 * Math.sin(bloco * 2.3));
    }

    // TIA: cor do pixel (x 0..159, y 0..191) neste quadro
    function pixel(x, y) {
      // posições que mudam a cada quadro
      var p0x = 20 + ((quadro * 1) % 120), p0y = 126;
      var p1x = 140 - ((quadro * 1) % 120), p1y = 54;
      var bx = Math.abs(((quadro * 2) % 296) - 148) + 4, by = 20 + Math.abs(((quadro * 1.5) % 180) - 90);
      var mx = p0x + 7, my = p0y - 8 - ((quadro * 3) % 110);

      if (objetos.p0 && y >= p0y && y < p0y + 16 && x >= p0x && x < p0x + 16) {
        if (SPRITE0[(y - p0y) >> 1] & (0x80 >> ((x - p0x) >> 1))) return COR_P0;
      }
      if (objetos.missil && x >= mx && x < mx + 2 && y >= my && y < my + 6 && my > 0) return BRANCO;
      if (objetos.p1 && y >= p1y && y < p1y + 16 && x >= p1x && x < p1x + 16) {
        if (SPRITE1[(y - p1y) >> 1] & (0x80 >> ((x - p1x) >> 1))) return COR_P1;
      }
      if (objetos.bola && x >= bx && x < bx + 4 && y >= by && y < by + 4) return COR_BOLA;
      if (objetos.playfield) {
        var bloco = x >> 2; // 40 blocos de 4 pixels
        var b = bloco < 20 ? bloco : 39 - bloco; // metade direita espelhada
        if (y < 4) return COR_PF;
        if (y >= 176) return (y >> 2) % 2 === (bloco % 2) ? COR_PF : COR_CHAO;
        if (y >= 150 && y < 176) return COR_CHAO;
        if (y < 150 && y >= 150 - montanha(b)) return COR_PF;
      }
      if (objetos.fundo) {
        if (y >= 150) return corAtari(0xc0);
        var lum = Math.min(7, 1 + Math.floor(y / 21));
        return corAtari(0x80 | (lum << 1));
      }
      return [0, 0, 0];
    }

    function avancar(n) {
      for (var i = 0; i < n; i++) {
        if (clock >= HB && linha >= TOPO && linha < TOPO + VIS) {
          var c = pixel(clock - HB, linha - TOPO);
          var o = (linha * W + clock) * 4;
          px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
        }
        if (++clock >= W) {
          clock = 0;
          if (++linha >= H) { linha = 0; quadro++; }
        }
      }
    }

    function regiao() {
      if (linha < 3) return 'vsync';
      if (linha < TOPO) return 'vblank';
      if (linha < TOPO + VIS) return 'visivel';
      return 'overscan';
    }

    function linhaDoCodigo(reg, ciclo) {
      if (reg === 'vsync') return [2, 3, 4][linha] || 5;
      if (reg === 'vblank') {
        var l = linha - 3;
        if (l < 3) return 1;
        if (l < 14) return 2;
        if (l < 25) return 3;
        if (l < 31) return 4;
        if (l < 35) return ciclo % 6 < 3 ? 6 : 7;
        if (l < 36) return 8;
        return 9;
      }
      if (reg === 'visivel') {
        if (ciclo <= 3) return 2;
        if (ciclo <= 6) return 3;
        if (ciclo <= 10) return 4;
        if (ciclo <= 13) return 5;
        if (ciclo <= 17) return 6;
        if (ciclo <= 20) return 7;
        if (ciclo <= 22) return 8;
        if (ciclo <= 25) return 9;
        return 1;
      }
      var lo = linha - TOPO - VIS;
      if (lo < 1) return 1;
      if (lo < 2) return 3;
      if (lo < 14) return 4;
      if (lo < 29) return ciclo % 6 < 3 ? 6 : 7;
      return 8;
    }

    var EXPLICA = {
      vsync: 'O jogo liga o sincronismo vertical por 3 linhas. É o sinal que manda o feixe da TV voltar para o topo e começar um quadro novo.',
      vblank: 'O feixe está apagado, voltando para cima. São 37 linhas — cerca de 2.800 ciclos de CPU — para ler os controles e rodar a lógica do jogo antes de desenhar.',
      hblank: 'Ainda no apagamento horizontal: o feixe está voltando para a esquerda. A CPU aproveita estes primeiros ciclos para trocar cores e sprites antes de o feixe aparecer.',
      desenho: 'O feixe já está desenhando a linha. Mudar um registrador agora altera a imagem no meio da linha — truque usado para mostrar mais objetos do que o TIA permite.',
      espera: 'A CPU executou STA WSYNC e está parada. O TIA só a libera no início da próxima linha, e assim código e imagem nunca saem de sincronia.',
      overscan: 'Mais 30 linhas apagadas na parte de baixo da tela: tempo extra para atualizar o placar e os sons antes do próximo quadro.'
    };
    var SUB = { vsync: 'sincronismo', vblank: 'apagamento', visivel: 'desenhando', overscan: 'apagamento' };
    var NOME = { vsync: 'VSYNC', vblank: 'VBLANK', visivel: 'VISÍVEL', overscan: 'OVERSCAN' };

    function atualizarPainel() {
      var reg = regiao();
      var ciclo = Math.floor(clock / 3);
      $('feixe-linha').textContent = linha;
      $('feixe-ciclo').textContent = ciclo;
      if (reg !== regiaoAtual) {
        regiaoAtual = reg;
        $('feixe-regiao').textContent = NOME[reg];
        $('feixe-regiao-sub').textContent = SUB[reg];
      }
      if (listagemAtual !== reg) {
        listagemAtual = reg;
        codigo.innerHTML = LISTAGENS[reg].map(function (l) {
          var texto = l[0].replace(/&/g, '&amp;').replace(/</g, '&lt;');
          var partes = texto.split(';');
          var html = l[1] === 'rot' ? '<span class="rot">' + texto + '</span>' : partes[0] + (partes[1] !== undefined ? '<span class="com">;' + partes.slice(1).join(';') + '</span>' : '');
          return '<span class="lin">' + html + '</span>';
        }).join('');
        linhaCodigoAtual = -1;
      }
      var lc = linhaDoCodigo(reg, ciclo);
      if (lc !== linhaCodigoAtual) {
        var linhas = codigo.children;
        if (linhas[linhaCodigoAtual]) linhas[linhaCodigoAtual].classList.remove('atual');
        if (linhas[lc]) linhas[lc].classList.add('atual');
        linhaCodigoAtual = lc;
      }
      var chave = reg;
      if (reg === 'visivel') chave = ciclo < 23 ? 'hblank' : ciclo <= 28 ? 'desenho' : 'espera';
      var exp = $('feixe-explica');
      if (exp.dataset.chave !== chave) { exp.dataset.chave = chave; exp.textContent = EXPLICA[chave]; }
    }

    function desenhar() {
      ctx.putImageData(img, 0, 0);
      // feixe
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, linha, W, 1);
      var ligado = clock >= HB && linha >= TOPO && linha < TOPO + VIS;
      ctx.fillStyle = ligado ? '#ffffff' : 'rgba(255,0,33,0.9)';
      ctx.fillRect(clock - 1, linha - 1, 3, 3);
      ctx.fillStyle = ligado ? 'rgba(255,255,255,0.35)' : 'rgba(255,0,33,0.35)';
      ctx.fillRect(clock - 3, linha - 3, 7, 7);
    }

    var visivel = true;
    quandoVisivel(canvas, function (v) { visivel = v; });

    function ciclo() {
      if (rodando && visivel) {
        avancar(VELOCIDADES[vel][0]);
        desenhar();
        atualizarPainel();
      }
      requestAnimationFrame(ciclo);
    }

    // estado inicial: um quadro completo já desenhado
    avancar(W * H);
    desenhar();
    atualizarPainel();
    requestAnimationFrame(ciclo);

    var btn = $('feixe-play');
    function rotuloBotao() { btn.textContent = rodando ? 'Pausar' : 'Continuar'; }
    rotuloBotao();
    btn.addEventListener('click', function () { rodando = !rodando; rotuloBotao(); });

    var range = $('feixe-vel');
    range.addEventListener('input', function () {
      vel = +range.value;
      $('feixe-vel-rotulo').textContent = VELOCIDADES[vel][1];
    });
    $('feixe-vel-rotulo').textContent = VELOCIDADES[vel][1];

    document.querySelectorAll('[data-obj]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        objetos[cb.getAttribute('data-obj')] = cb.checked;
        if (!rodando) { avancar(W * H); desenhar(); }
      });
    });
  }

  /* ================================================================== */
  /* 6. SOM DO TIA                                                       */
  /* ================================================================== */

  var CLOCK_AUDIO = 31400; // ≈ 3,579545 MHz / 114

  /** Gera a sequência de bits de um período completo do gerador AUDC. */
  function periodoAudc(audc) {
    var bits = [], i, r;
    if (audc === 4) return [1, 0];
    if (audc === 12) return [1, 1, 1, 0, 0, 0];
    if (audc === 6) { for (i = 0; i < 31; i++) bits.push(i < 13 ? 1 : 0); return bits; }
    if (audc === 1) { // polinômio de 4 bits (período 15)
      r = 0xf;
      for (i = 0; i < 15; i++) { bits.push(r & 1); var b4 = ((r >> 0) ^ (r >> 1)) & 1; r = (r >> 1) | (b4 << 3); }
      return bits;
    }
    if (audc === 8) { // polinômio de 9 bits (período 511)
      r = 0x1ff;
      for (i = 0; i < 511; i++) { bits.push(r & 1); var b9 = ((r >> 0) ^ (r >> 4)) & 1; r = (r >> 1) | (b9 << 8); }
      return bits;
    }
    // 15: polinômio de 5 bits dividido por 3 (período 93)
    r = 0x1f;
    var p5 = [];
    for (i = 0; i < 31; i++) { p5.push(r & 1); var b5 = ((r >> 0) ^ (r >> 2)) & 1; r = (r >> 1) | (b5 << 4); }
    for (i = 0; i < 93; i++) bits.push(p5[Math.floor(i / 3)]);
    return bits;
  }

  function iniciarSom() {
    var btn = $('som-tocar');
    if (!btn) return;
    var actx = null, fonte = null, ganho = null, tocando = false;
    var selAudc = $('som-audc'), rngF = $('som-audf'), rngV = $('som-audv');

    function freq() {
      var per = periodoAudc(+selAudc.value).length;
      return CLOCK_AUDIO / ((+rngF.value + 1) * per);
    }

    function atualizarRotulos() {
      $('som-audf-valor').textContent = rngF.value;
      $('som-audv-valor').textContent = rngV.value;
      var f = freq();
      $('som-freq').textContent = f >= 100 ? Math.round(f) : f.toFixed(1);
    }

    function criarBuffer() {
      var bits = periodoAudc(+selAudc.value);
      var div = +rngF.value + 1;
      var periodo = bits.length * div;
      var repeticoes = Math.max(1, Math.ceil(CLOCK_AUDIO / 2 / periodo));
      var total = periodo * repeticoes;
      var buf = actx.createBuffer(1, total, CLOCK_AUDIO);
      var d = buf.getChannelData(0);
      for (var i = 0; i < total; i++) {
        d[i] = bits[Math.floor(i / div) % bits.length] ? 0.5 : -0.5;
      }
      return buf;
    }

    function iniciarFonte() {
      if (fonte) { try { fonte.stop(); } catch (e) { /* já parou */ } fonte.disconnect(); }
      fonte = actx.createBufferSource();
      fonte.buffer = criarBuffer();
      fonte.loop = true;
      fonte.connect(ganho);
      fonte.start();
    }

    function volume() {
      if (ganho) ganho.gain.setTargetAtTime((+rngV.value / 15) * 0.22, actx.currentTime, 0.01);
    }

    function tocar() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { btn.textContent = 'Sem suporte a áudio'; return; }
      if (!actx) {
        try {
          actx = new AC({ sampleRate: 44100 });
        } catch (e) {
          actx = new AC();
        }
        ganho = actx.createGain();
        ganho.gain.value = 0;
        ganho.connect(actx.destination);
      }
      if (actx.state === 'suspended') actx.resume();
      iniciarFonte();
      volume();
      tocando = true;
      btn.textContent = 'Parar';
    }

    function parar() {
      if (ganho) ganho.gain.setTargetAtTime(0, actx.currentTime, 0.02);
      if (fonte) { var f = fonte; setTimeout(function () { try { f.stop(); } catch (e) { /* ok */ } }, 120); fonte = null; }
      tocando = false;
      btn.textContent = 'Tocar';
    }

    btn.addEventListener('click', function () { if (tocando) parar(); else tocar(); });
    selAudc.addEventListener('change', function () { atualizarRotulos(); if (tocando) iniciarFonte(); });
    rngF.addEventListener('input', function () { atualizarRotulos(); if (tocando) iniciarFonte(); });
    rngV.addEventListener('input', function () { atualizarRotulos(); volume(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && tocando) parar(); });
    atualizarRotulos();
  }

  /* ================================================================== */
  /* 7. JOYSTICK                                                         */
  /* ================================================================== */

  function iniciarJoystick() {
    var joy = $('joystick');
    if (!joy) return;
    var estado = { cima: false, baixo: false, esq: false, dir: false, tiro: false };
    var swcha = $('bits-swcha'), inpt4 = $('bits-inpt4'), alavanca = $('joy-alavanca');

    function celulas(el, n) { for (var i = 0; i < n; i++) el.appendChild(document.createElement('span')); return el.children; }
    var cA = celulas(swcha, 8), cB = celulas(inpt4, 8);

    function render() {
      // SWCHA: bit 7 direita, 6 esquerda, 5 baixo, 4 cima (jogador 1); 3–0 jogador 2 (solto)
      var bitsA = [!estado.dir, !estado.esq, !estado.baixo, !estado.cima, 1, 1, 1, 1];
      for (var i = 0; i < 8; i++) {
        cA[i].textContent = bitsA[i] ? '1' : '0';
        cA[i].className = (bitsA[i] ? '' : 'zero') + (i >= 4 ? ' apagado' : '');
      }
      cB[0].textContent = estado.tiro ? '0' : '1';
      cB[0].className = estado.tiro ? 'zero' : '';
      for (var j = 1; j < 8; j++) { cB[j].textContent = '·'; cB[j].className = 'apagado'; }

      var dx = (estado.dir ? 1 : 0) - (estado.esq ? 1 : 0);
      var dy = (estado.baixo ? 1 : 0) - (estado.cima ? 1 : 0);
      alavanca.style.transform = 'translate(' + dx * 14 + 'px,' + dy * 14 + 'px)';
      joy.querySelectorAll('[data-dir]').forEach(function (b) {
        b.classList.toggle('ativo', !!estado[b.getAttribute('data-dir')]);
      });
    }

    var OPOSTO = { cima: 'baixo', baixo: 'cima', esq: 'dir', dir: 'esq' };
    function definir(dir, valor) {
      if (valor && OPOSTO[dir]) estado[OPOSTO[dir]] = false; // a alavanca não aponta para lados opostos
      estado[dir] = valor;
      render();
    }

    joy.querySelectorAll('[data-dir]').forEach(function (b) {
      var dir = b.getAttribute('data-dir');
      b.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        try { b.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
        definir(dir, true);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) {
        b.addEventListener(n, function () { definir(dir, false); });
      });
      b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    });

    var TECLAS = { ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esq', ArrowRight: 'dir', Space: 'tiro', KeyW: 'cima', KeyS: 'baixo', KeyA: 'esq', KeyD: 'dir' };
    joy.addEventListener('keydown', function (ev) {
      var d = TECLAS[ev.code];
      if (!d) return;
      ev.preventDefault();
      definir(d, true);
    });
    joy.addEventListener('keyup', function (ev) {
      var d = TECLAS[ev.code];
      if (d) definir(d, false);
    });
    joy.addEventListener('blur', function () {
      Object.keys(estado).forEach(function (k) { estado[k] = false; });
      render();
    });
    render();
  }

  /* ================================================================== */
  iniciarPlaca();
  iniciarArquitetura();
  iniciarMemoria();
  iniciarPaleta();
  iniciarFeixe();
  iniciarSom();
  iniciarJoystick();
})();
