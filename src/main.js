/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Size canvas to the full viewport
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

console.log('Game ready');
