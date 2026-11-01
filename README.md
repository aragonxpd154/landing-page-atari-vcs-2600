<h1 align="center">
<img alt="Atari VCS 2600" src="https://raw.githubusercontent.com/aragonxpd154/landing-page-atari-vcs-2600/main/src/imagens/logo-descricao.png"/>
<br>

<h4 align="center">

O Atari 2600 foi um console revolucionário que conquistou o mundo no fim dos anos 1970 e início dos anos 1980. Esta página interativa e responsiva apresenta a história do Atari 2600, do sucesso inicial ao fim do projeto, uma seção sobre o hardware usado na construção do console — circuitos e controles da época — e uma página com jogos clássicos para jogar direto no navegador.
<br>
<br>
<a href="https://aragonxpd154.github.io/landing-page-atari-vcs-2600/">
<img alt="Acessar o projeto" src="https://raw.githubusercontent.com/aragonxpd154/landing-page-atari-vcs-2600/main/src/imagens/acessar%20o%20projeto.png"/>
</a>

</h4>

<p align="center">
<img alt="Linguagem principal" src="https://img.shields.io/github/languages/top/aragonxpd154/landing-page-atari-vcs-2600">
<img alt="Quantidade de linguagens" src="https://img.shields.io/github/languages/count/aragonxpd154/landing-page-atari-vcs-2600">
<img alt="Tamanho do repositório" src="https://img.shields.io/github/repo-size/aragonxpd154/landing-page-atari-vcs-2600">
<img alt="Último commit" src="https://img.shields.io/github/last-commit/aragonxpd154/landing-page-atari-vcs-2600">
<a href="https://github.com/aragonxpd154/landing-page-atari-vcs-2600/issues">
<img alt="Issues do repositório" src="https://img.shields.io/github/issues/aragonxpd154/landing-page-atari-vcs-2600">
</a>
<img alt="Licença" src="https://img.shields.io/github/license/aragonxpd154/landing-page-atari-vcs-2600">
</p>

<p align="center">
<a href="#rocket-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
<a href="#information_source-sobre">Sobre</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
<a href="#video_game-demo-games">Demo Games</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
<a href="#memo-licença">Licença</a>
</p>

<p align="center">
<img alt="Foto do Atari 2600" src="https://raw.githubusercontent.com/aragonxpd154/landing-page-atari-vcs-2600/main/src/imagens/atari.png">
</p>

## :rocket: Tecnologias

O projeto continua em desenvolvimento e usa as seguintes tecnologias:

- HTML5, CSS3 e JavaScript puro (Canvas 2D + Web Audio API) — sem etapa de build e sem dependências
- [Google Fonts — Poppins](https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;500&display=swap)

## :information_source: Sobre

_Atari 2600: uma viagem pela história dos videogames_

O Atari 2600 foi um console revolucionário que conquistou o mundo no fim dos anos 1970 e início dos anos 1980. Esta página interativa e responsiva mostra a história do Atari 2600, do sucesso inicial ao fim do projeto. Ela também traz uma seção sobre o hardware usado na construção do console, incluindo os circuitos e controles da época. Por fim, a página de Demo Games reúne seis remakes jogáveis em JavaScript de clássicos do 2600 — Pong, Breakout, Space Invaders, Asteroids, Freeway e River Raid — para reviver os bons tempos do console.

_A história do 2600_

O 2600 foi um console revolucionário que levou a emoção dos fliperamas para dentro de casa em todo o mundo. Lançado nos Estados Unidos em setembro de 1977, tornou-se um dos presentes mais populares das festas de fim de ano, com milhões de unidades vendidas. A chegada do clássico Space Invaders aumentou ainda mais sua popularidade e fez as vendas dobrarem, com mais de 2 milhões de unidades vendidas em um ano. O sucesso continuou nos anos seguintes, chegando a quase 8 milhões de unidades vendidas até 1982. No Brasil, o console chegou oficialmente em 1983. O 2600 continua sendo um ícone da indústria de jogos e um símbolo atemporal da história dos videogames.

_O hardware por trás do 2600_

O 2600 era muito mais do que um console de jogos: era um hardware engenhoso, que combinava circuitos e controles inovadores para entregar uma experiência de jogo sem igual na época. Esta seção da página explora o hardware por trás do 2600 e as inovações tecnológicas que o tornaram possível — dos circuitos integrados aos controles. O 2600 ampliou os limites do que era possível nos videogames domésticos.

## :video_game: Demo Games

A página **Demo Game** segue o visual da página inicial (vídeo de fundo, fonte Poppins, botões vermelhos) e transforma a tela em um pequeno console Atari: escolha um cartucho e jogue seis clássicos, refeitos do zero em JavaScript como homenagem — nenhuma ROM ou arte original é utilizada.

| # | Jogo | Lançamento original no 2600 | Controles |
|---|------|-----------------------------|-----------|
| 01 | Pong | Video Olympics — Atari, 1977 | `W` `S` / `↑` `↓` (ou mouse/dedo) |
| 02 | Breakout | Atari, 1978 | `A` `D` / `←` `→`, `Espaço` lança a bola |
| 03 | Invasores (homenagem a Space Invaders) | Atari, 1980 | `A` `D` / `←` `→`, `Espaço` atira |
| 04 | Asteroides (homenagem a Asteroids) | Atari, 1981 | `←` `→` giram, `↑` acelera, `Espaço` atira, `↓` hiperespaço |
| 05 | Freeway | Activision, 1981 | `W` `S` / `↑` `↓` |
| 06 | River Raid | Activision, 1982 | setas movem/aceleram/freiam, `Espaço` atira |

Atalhos: `Enter` inicia, `P`/`Esc` pausa e `M` liga/desliga o som. Em celulares e tablets aparecem um direcional e um botão FOGO na tela. Os recordes ficam salvos no navegador (localStorage), e cada jogo pode ser aberto direto pelo endereço, por exemplo `src/demo-game/index.html#riverraid`.

Estrutura do código:

```
src/demo-game/
├── index.html          # página (mesmo design da página inicial)
├── css/style-game.css  # console, cartuchos e controles de toque
└── js/
    ├── engine.js       # loop do jogo, entrada, som, fonte pixelada 3x5 e recordes
    ├── main.js         # liga a interface da página ao console
    └── games/          # um arquivo por jogo: pong, breakout, invaders, asteroids, freeway, riverraid
```

Para adicionar um jogo novo, crie um arquivo em `js/games/` que chame `Atari.register({ id, title, publisher, year, create(api) { return { update(input), draw(ctx) } } })` e inclua a tag `<script>` correspondente no `index.html`.

_Melhorias contínuas_

Este projeto está sempre sendo melhorado e atualizado para oferecer a melhor experiência possível. Seja você um veterano do 2600 ou alguém conhecendo o console agora, esta página é uma viagem emocionante pela história dos videogames.

## :memo: Licença

Este projeto está sob a licença GPL v3.0. Veja o arquivo [LICENSE](https://github.com/aragonxpd154/landing-page-atari-vcs-2600/blob/main/LICENSE) para mais informações.

---

Feito com ♥ por Marcos (Obel) :wave: [Entre em contato!](https://www.linkedin.com/in/marcosobel)
