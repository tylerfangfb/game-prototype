// Initial puzzle configuration
// 0 represents empty cells, other numbers are locked cells
const initialPuzzle = [
    [1, 0, 3, 0, 5, 0],
    [0, 5, 0, 3, 0, 1],
    [3, 0, 1, 0, 6, 0],
    [0, 6, 0, 1, 0, 3],
    [6, 0, 2, 0, 1, 0],
    [0, 1, 0, 6, 0, 2]
];

// Solution for validation
const solution = [
    [1, 2, 3, 4, 5, 6],
    [4, 5, 6, 3, 2, 1],
    [3, 4, 1, 2, 6, 5],
    [2, 6, 5, 1, 4, 3],
    [6, 3, 2, 5, 1, 4],
    [5, 1, 4, 6, 3, 2]
];

// Current game state
let currentPuzzle = JSON.parse(JSON.stringify(initialPuzzle));
let selectedCell = null;

// Initialize the game
function initGame() {
    const grid = document.getElementById('sudoku-grid');
    grid.innerHTML = '';
    
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset. col = col;
            
            const value = currentPuzzle[row][col];
            
            if (value !== 0) {
                cell.textContent = value;
                if (initialPuzzle[row][col] !== 0) {
                    cell.classList.add('locked');
                } else {
                    cell.classList.add('user-input');
                }
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            grid.appendChild(cell);
        }
    }
}

// Select a cell
function selectCell(row, col) {
    if (initialPuzzle[row][col] !== 0) {
        return;
    }
    
    const previousSelected = document.querySelector('.cell.selected');
    if (previousSelected) {
        previousSelected. classList.remove('selected');
    }
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('selected');
    selectedCell = { row, col };
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    if (initialPuzzle[row][col] !== 0) return;
    
    if (e.key >= '1' && e.key <= '6') {
        const num = parseInt(e.key);
        currentPuzzle[row][col] = num;
        updateCell(row, col, num);
        checkCompletion();
    }
    
    if (e. key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        currentPuzzle[row][col] = 0;
        updateCell(row, col, 0);
        clearMessage();
    }
});

// Update a single cell
function updateCell(row, col, value) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (value === 0) {
        cell.textContent = '';
        cell.classList.remove('user-input');
    } else {
        cell. textContent = value;
        cell.classList.add('user-input');
    }
}

// Check if puzzle is completed
function checkCompletion() {
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            if (currentPuzzle[row][col] === 0) {
                return;
            }
        }
    }
    
    let isCorrect = true;
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            if (currentPuzzle[row][col] !== solution[row][col]) {
                isCorrect = false;
                break;
            }
        }
        if (!isCorrect) break;
    }
    
    if (isCorrect) {
        showMessage('🎉 Congratulations! You solved the puzzle!', 'success');
    } else {
        showMessage('Puzzle complete, but there are some mistakes. Keep trying!', 'error');
    }
}

// Show message
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

// Clear message
function clearMessage() {
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = 'message';
}

// Number pad functionality
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!selectedCell) {
            showMessage('Please select a cell first!', 'error');
            setTimeout(clearMessage, 2000);
            return;
        }
        
        const { row, col } = selectedCell;
        
        // Can't modify locked cells
        if (initialPuzzle[row][col] !== 0) {
            return;
        }
        
        const value = btn.dataset.number;
        
        if (value === 'clear') {
            // Clear the cell
            currentPuzzle[row][col] = 0;
            updateCell(row, col, 0);
            clearMessage();
        } else {
            // Insert number
            const num = parseInt(value);
            currentPuzzle[row][col] = num;
            updateCell(row, col, num);
            checkCompletion();
        }
    });
});

// Reset puzzle
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the puzzle?')) {
        currentPuzzle = JSON.parse(JSON.stringify(initialPuzzle));
        selectedCell = null;
        clearMessage();
        initGame();
    }
});

// Initialize game on load
initGame();
