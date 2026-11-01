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
