const figureImage = document.querySelector('.figure__image');
const figureCaption = document.querySelector('.figure__caption');
const steps = document.querySelectorAll('.scrolly .step');
const screenBlocks = document.querySelectorAll('.screen-block');

const setActiveStep = targetStep => {
  steps.forEach(step => {
    step.classList.toggle('is-active', step === targetStep);
  });
};

const updateFigure = step => {
  const bg = step.getAttribute('data-bg');
  const caption = step.getAttribute('data-caption');
  if (bg) {
    figureImage.style.backgroundImage = `url(${bg})`;
  }
  if (caption) {
    figureCaption.textContent = caption;
  }
  setActiveStep(step);
};

if (steps.length) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateFigure(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  steps.forEach(step => observer.observe(step));
}

if (screenBlocks.length) {
  const firstWithMedia =
    Array.from(screenBlocks).find(block => block.dataset.bg) || screenBlocks[0];
  if (firstWithMedia) {
    updateFigure(firstWithMedia);
    firstWithMedia.classList.add('is-active');
  }

  const blockObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          screenBlocks.forEach(block => block.classList.remove('is-active'));
          entry.target.classList.add('is-active');
          if (entry.target.dataset.bg || entry.target.dataset.caption) {
            updateFigure(entry.target);
          }
        }
      });
    },
    { threshold: 0.6}
  );

  screenBlocks.forEach(block => blockObserver.observe(block));
}
