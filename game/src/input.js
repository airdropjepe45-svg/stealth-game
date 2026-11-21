// Input: keyboard (WASD / arrows, Shift to sneak) and mouse
// (click to throw a pebble). The canvas reports clicks in its own
// coordinate space; the game converts them to world coordinates.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
};

export function createInput(canvas, onAction, onClick) {
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
  };
  const pressed = new Set();

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  function down(event) {
    const k = keyName(event);
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === 'ArrowLeft' || k === 'a') keys.left = true;
    if (event.key === 'ArrowRight' || k === 'd') keys.right = true;
    if (event.key === 'ArrowUp' || k === 'w') keys.up = true;
    if (event.key === 'ArrowDown' || k === 's') keys.down = true;
    if (event.key === 'Shift') keys.sneak = true;
    const action = KEY_ACTIONS[event.key];
    if (action && !pressed.has(action)) {
      pressed.add(action);
      onAction(action);
    }
  }

  function up(event) {
    const k = keyName(event);
    if (event.key === 'ArrowLeft' || k === 'a') keys.left = false;
    if (event.key === 'ArrowRight' || k === 'd') keys.right = false;
    if (event.key === 'ArrowUp' || k === 'w') keys.up = false;
    if (event.key === 'ArrowDown' || k === 's') keys.down = false;
    if (event.key === 'Shift') keys.sneak = false;
    const action = KEY_ACTIONS[event.key];
    if (action) pressed.delete(action);
  }

  function click(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    onClick(
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY,
    );
  }

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('mousedown', click);

  return { keys };
}
