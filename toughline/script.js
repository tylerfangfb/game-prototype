// Game constants
const GRID_ROWS = 9;
const GRID_COLS = 5;
const TOUGH_LINE_ROW = 4; // Row 5 (index 4)

// Word sets for the game
const wordSets = [
    ['BLEND', 'SCARE', 'PLANT', 'CROAK', 'STONE', 'GRATE'],
    ['LIGHT', 'DANCE', 'FLAME', 'BEACH', 'FROST', 'QUIET'],
    ['SHARK', 'PIANO', 'GRAPE', 'CHESS', 'PEACH', 'OCEAN'],
];

// Game state
let currentWords = [];
let usedWords = [];
let grid = [];
let selectedCell = null;
let toughLineComplete = false;
let toughLineWord = '';

// Initialize the game
function initGame() {
    // Select a random word set
    currentWords = [...wordSets[Math.floor(Math.random() * wordSets.length)]];
    usedWords = [];
    toughLineComplete = false;
    toughLineWord = '';
    selectedCell = null;
    
    // Initialize empty grid
    grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(''));
    
    renderWordBank();
    renderGrid();
    clearMessage();
}

// Render the word bank
function renderWordBank() {
    const wordList = document.getElementById('word-list');
    wordList.innerHTML = '';
    
    currentWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.textContent = word;
        
        if (usedWords.includes(word)) {
            wordItem.classList.add('used');
        }
        
        wordList.appendChild(wordItem);
    });
}

// Render the grid
function renderGrid() {
    const gridElement = document.getElementById('game-grid');
    gridElement.innerHTML = '';
    
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add tough line styling
            if (row === TOUGH_LINE_ROW) {
                cell.classList.add('tough-line');
            }
            
            // Set cell content
            if (grid[row][col]) {
                cell.textContent = grid[row][col];
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            gridElement.appendChild(cell);
        }
    }
}

// Select a cell
function selectCell(row, col) {
    // Check if we're in phase 1 (tough line) or phase 2 (vertical)
    if (!toughLineComplete && row !== TOUGH_LINE_ROW) {
        showMessage('Please fill the tough line (cyan row) first!', 'info');
        setTimeout(clearMessage, 2000);
        return;
    }
    
    const previousSelected = document.querySelector('.cell.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('selected');
    selectedCell = { row, col };
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    // Handle letter input (A-Z)
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        grid[row][col] = e.key.toUpperCase();
        updateCell(row, col);
        
        // Check if tough line is complete
        if (row === TOUGH_LINE_ROW) {
            checkToughLine();
        }
        
        // Check if a vertical column is complete
        if (toughLineComplete) {
            checkVerticalColumn(col);
        }
        
        // Auto-advance to next cell
        autoAdvanceCell(row, col);
    }
    
    // Handle backspace/delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
        grid[row][col] = '';
        updateCell(row, col);
        clearMessage();
    }
});

// Update a single cell
function updateCell(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.textContent = grid[row][col];
    
    // Remove validation classes
    cell.classList.remove('correct', 'incorrect');
}

// Auto-advance to next cell
function autoAdvanceCell(row, col) {
    if (!toughLineComplete && row === TOUGH_LINE_ROW) {
        // During tough line phase, move horizontally
        if (col < GRID_COLS - 1) {
            selectCell(row, col + 1);
        }
    } else if (toughLineComplete) {
        // During vertical phase, move vertically
        if (row < GRID_ROWS - 1) {
            selectCell(row + 1, col);
        }
    }
}

// Check if tough line is complete
function checkToughLine() {
    // Check if all cells in tough line are filled
    let word = '';
    for (let col = 0; col < GRID_COLS; col++) {
        if (!grid[TOUGH_LINE_ROW][col]) {
            return; // Not complete yet
        }
        word += grid[TOUGH_LINE_ROW][col];
    }
    
    // Validate the word
    if (currentWords.includes(word)) {
        toughLineComplete = true;
        toughLineWord = word;
        usedWords.push(word);
        
        // Mark cells as correct
        for (let col = 0; col < GRID_COLS; col++) {
            const cell = document.querySelector(`[data-row="${TOUGH_LINE_ROW}"][data-col="${col}"]`);
            cell.classList.add('correct');
        }
        
        renderWordBank();
        showMessage('✓ Tough line complete! Now fill the vertical words.', 'success');
        
        // Select first cell of first column
        setTimeout(() => {
            selectCell(0, 0);
        }, 500);
    } else {
        // Incorrect word
        for (let col = 0; col < GRID_COLS; col++) {
            const cell = document.querySelector(`[data-row="${TOUGH_LINE_ROW}"][data-col="${col}"]`);
            cell.classList.add('incorrect');
        }
        
        showMessage('✗ Not a valid word. Try again!', 'error');
        
        // Clear incorrect cells after animation
        setTimeout(() => {
            for (let col = 0; col < GRID_COLS; col++) {
                grid[TOUGH_LINE_ROW][col] = '';
                const cell = document.querySelector(`[data-row="${TOUGH_LINE_ROW}"][data-col="${col}"]`);
                cell.textContent = '';
                cell.classList.remove('incorrect');
            }
            selectCell(TOUGH_LINE_ROW, 0);
        }, 1000);
    }
}

// Check if a vertical column is complete
function checkVerticalColumn(col) {
    // Check if all cells in this column are filled
    let word = '';
    for (let row = 0; row < GRID_ROWS; row++) {
        if (!grid[row][col]) {
            return; // Not complete yet
        }
        word += grid[row][col];
    }
    
    // Validate the word
    if (currentWords.includes(word) && !usedWords.includes(word)) {
        usedWords.push(word);
        
        // Mark cells as correct
        for (let row = 0; row < GRID_ROWS; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('correct');
        }
        
        renderWordBank();
        showMessage(`✓ Column ${col + 1} complete!`, 'success');
        
        // Check win condition
        checkWinCondition();
        
        // Move to next column if available
        if (col < GRID_COLS - 1) {
            setTimeout(() => {
                selectCell(0, col + 1);
            }, 500);
        }
    } else if (usedWords.includes(word)) {
        // Word already used
        for (let row = 0; row < GRID_ROWS; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('incorrect');
        }
        
        showMessage('✗ Word already used!', 'error');
        
        // Clear incorrect cells after animation
        setTimeout(() => {
            for (let row = 0; row < GRID_ROWS; row++) {
                if (row !== TOUGH_LINE_ROW) {
                    grid[row][col] = '';
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.textContent = '';
                    cell.classList.remove('incorrect');
                }
            }
            selectCell(0, col);
        }, 1000);
    } else {
        // Incorrect word
        for (let row = 0; row < GRID_ROWS; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('incorrect');
        }
        
        showMessage('✗ Not a valid word. Try again!', 'error');
        
        // Clear incorrect cells after animation
        setTimeout(() => {
            for (let row = 0; row < GRID_ROWS; row++) {
                if (row !== TOUGH_LINE_ROW) {
                    grid[row][col] = '';
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.textContent = '';
                    cell.classList.remove('incorrect');
                }
            }
            selectCell(0, col);
        }, 1000);
    }
}

// Check win condition
function checkWinCondition() {
    if (usedWords.length === currentWords.length) {
        showMessage('🎉 Congratulations! You completed the puzzle!', 'success');
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

// Reset game
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to start a new game?')) {
        initGame();
    }
});

// Initialize game on load
initGame();
