const cells = [...document.querySelectorAll('.cell')];
const status = document.querySelector('#game-status');
const roundStatus = document.querySelector('#round-status');
const resetButton = document.querySelector('#reset-button');
const modeInputs = [...document.querySelectorAll('input[name="mode"]')];

const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let gameMode = 'local';
let botThinking = false;
let botTimer;

function getWinningLine() {
  return winningLines.find(([first, second, third]) => (
    board[first] && board[first] === board[second] && board[first] === board[third]
  ));
}

function getWinner() {
  const winningLine = getWinningLine();
  return winningLine ? board[winningLine[0]] : null;
}

function finishGame(message, detail, winningLine = []) {
  gameOver = true;
  status.textContent = message;
  roundStatus.textContent = detail;
  cells.forEach((cell, index) => {
    cell.disabled = true;
    if (winningLine.includes(index)) cell.classList.add('winner');
  });
}

function handleMove(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  if (gameOver || botThinking || board[index] || (gameMode === 'bot' && currentPlayer === 'O')) return;

  playMove(index);
}

function playMove(index) {
  board[index] = currentPlayer;
  const cell = cells[index];
  cell.textContent = currentPlayer === 'X' ? '×' : '○';
  cell.classList.add(`mark-${currentPlayer.toLowerCase()}`);
  cell.disabled = true;
  cell.setAttribute('aria-label', `${cell.getAttribute('aria-label').replace(', empty', '')}, ${currentPlayer}`);

  const winningLine = getWinningLine();
  if (winningLine) {
    finishGame(`Player ${currentPlayer} wins!`, 'Three in a row', winningLine);
    return;
  }

  if (board.every(Boolean)) {
    finishGame("It's a draw!", 'Nobody gets the point');
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  status.textContent = `Player ${currentPlayer}'s turn`;
  roundStatus.textContent = 'Make your move';
  cells.forEach((cell, cellIndex) => {
    if (!board[cellIndex]) cell.disabled = false;
  });

  if (gameMode === 'bot' && currentPlayer === 'O') scheduleBotMove();
}

function scheduleBotMove() {
  botThinking = true;
  cells.forEach((cell) => { cell.disabled = true; });
  status.textContent = "Bot's turn";
  roundStatus.textContent = 'Bot is thinking';
  botTimer = setTimeout(() => {
    botThinking = false;
    const bestMove = getBestBotMove();
    playMove(bestMove);
  }, 350);
}

function getBestBotMove() {
  let bestScore = -Infinity;
  let bestMove = 0;

  board.forEach((value, index) => {
    if (value) return;
    board[index] = 'O';
    const score = minimax(false);
    board[index] = '';
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  });

  return bestMove;
}

function minimax(isMaximizing) {
  const winner = getWinner();
  if (winner === 'O') return 10;
  if (winner === 'X') return -10;
  if (board.every(Boolean)) return 0;

  const scores = [];
  board.forEach((value, index) => {
    if (value) return;
    board[index] = isMaximizing ? 'O' : 'X';
    scores.push(minimax(!isMaximizing));
    board[index] = '';
  });

  return isMaximizing ? Math.max(...scores) : Math.min(...scores);
}

function resetGame() {
  clearTimeout(botTimer);
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  botThinking = false;
  status.textContent = "Player X's turn";
  roundStatus.textContent = gameMode === 'bot' ? 'You are X' : 'Make your move';
  cells.forEach((cell, index) => {
    cell.textContent = '';
    cell.disabled = false;
    cell.className = 'cell';
    cell.setAttribute('aria-label', `${['Top left', 'Top center', 'Top right', 'Middle left', 'Center', 'Middle right', 'Bottom left', 'Bottom center', 'Bottom right'][index]}, empty`);
  });
  cells[0].focus();
}

function changeMode(event) {
  gameMode = event.target.value;
  resetGame();
}

cells.forEach((cell) => cell.addEventListener('click', handleMove));
resetButton.addEventListener('click', resetGame);
modeInputs.forEach((input) => input.addEventListener('change', changeMode));
