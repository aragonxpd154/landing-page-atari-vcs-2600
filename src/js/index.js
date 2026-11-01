// Modal de vídeo (só é ativado se a página tiver os elementos do modal)
const modal = document.querySelector('.modal');
const btnAbrirModal = document.querySelector('.botao-trailer');
const btnfecharModal = document.querySelector('.fechar-modal');
const frameSource = document.getElementById('video');

if (modal && btnAbrirModal && btnfecharModal && frameSource) {
  const linkDoVideo = frameSource.src;

  function alternarModal() {
    modal.classList.toggle('aberto');
  }

  btnAbrirModal.addEventListener('click', () => {
    frameSource.setAttribute('src', linkDoVideo);
    alternarModal();
  });

  btnfecharModal.addEventListener('click', () => {
    frameSource.setAttribute('src', '');
    alternarModal();
  });
}

// Janela "Sobre" — informações do criador da página
const janelaSobre = document.getElementById('janela-sobre');
const abrirSobre = document.getElementById('abrir-sobre');
const fecharSobre = document.getElementById('fechar-sobre');

if (janelaSobre && abrirSobre && fecharSobre) {
  const suportaDialog = typeof janelaSobre.showModal === 'function';

  function abrirJanelaSobre(evento) {
    evento.preventDefault();
    if (suportaDialog) janelaSobre.showModal();
    else janelaSobre.setAttribute('open', '');
  }

  function fecharJanelaSobre() {
    if (suportaDialog) janelaSobre.close();
    else janelaSobre.removeAttribute('open');
  }

  abrirSobre.addEventListener('click', abrirJanelaSobre);
  fecharSobre.addEventListener('click', fecharJanelaSobre);

  // fecha ao clicar fora da janela (no fundo escurecido)
  janelaSobre.addEventListener('click', (evento) => {
    if (evento.target !== janelaSobre) return;
    const r = janelaSobre.getBoundingClientRect();
    const fora =
      evento.clientX < r.left || evento.clientX > r.right ||
      evento.clientY < r.top || evento.clientY > r.bottom;
    if (fora) fecharJanelaSobre();
  });

  // abre direto pelo endereço: index.html#sobre
  if (location.hash === '#sobre') abrirSobre.click();
}
