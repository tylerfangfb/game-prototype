// Game constants
const GRID_ROWS = 9;
const GRID_COLS = 5;
const TOUGH_LINE_ROW = 4; // Row 5 (index 4)
const VERTICAL_WORD_START = 2; // Vertical words start at row 2 (3rd row)
const VERTICAL_WORD_END = 6; // Vertical words end at row 6 (7th row) - total 5 rows (2,3,4,5,6)

// Word sets for the game
// Each set has 6 words: 1 horizontal word + 5 vertical words that intersect with it
// Vertical words use rows 2-6 (5 rows), with row 4 being the tough line at position 2 (0-indexed)
const wordSets = [
    // Horizontal: SHARK at row 4 (S-H-A-R-K across columns 0-4)
    // Verticals must have matching letters at row 4 (position 2 in 0-indexed 5-letter word):
    // Column 0: needs S at position 2 (row4) - BASIC (B-A-S-I-C rows 2-6)
    // Column 1: needs H at position 2 (row4) - WHARF (W-H-A-R-F rows 2-6) - wait, H is at pos 1
    // Let me use: ASHES (A-S-H-E-S) - H at pos 2
    // Column 2: needs A at position 2 (row4) - SNACK (S-N-A-C-K rows 2-6)
    // Column 3: needs R at position 2 (row4) - STRAW (S-T-R-A-W rows 2-6)
    // Column 4: needs K at position 2 (row4) - BIKES (B-I-K-E-S rows 2-6)
    ['SHARK', 'BASIC', 'ASHES', 'SNACK', 'STRAW', 'BIKES'],
    
    // Horizontal: BLEND at row 4 (B-L-E-N-D across columns 0-4)
    // Column 0: needs B at position 2 -РОБED - wait, CUBED (C-U-B-E-D rows 2-6)
    // Column 1: needs L at position 2 - PILES (P-I-L-E-S rows 2-6)
    // Column 2: needs E at position 2 - CHEER (C-H-E-E-R rows 2-6)
    // Column 3: needs N at position 2 - TUNES (T-U-N-E-S rows 2-6)
    // Column 4: needs D at position 2 - RIDES (R-I-D-E-S rows 2-6)
    ['BLEND', 'CUBED', 'PILES', 'CHEER', 'TUNES', 'RIDES'],
    
    // Horizontal: CRANE at row 4 (C-R-A-N-E across columns 0-4)  
    // Column 0: needs C at position 2 - DUCKS (D-U-C-K-S rows 2-6)
    // Column 1: needs R at position 2 - STRAY (S-T-R-A-Y rows 2-6)
    // Column 2: needs A at position 2 - PEAKS (P-E-A-K-S rows 2-6)
    // Column 3: needs N at position 2 - BONES (B-O-N-E-S rows 2-6)
    // Column 4: needs E at position 2 - OCEAN (O-C-E-A-N rows 2-6)
    ['CRANE', 'DUCKS', 'STRAY', 'PEAKS', 'BONES', 'OCEAN'],
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
            
            // Add word area styling for vertical word cells
            if (row >= VERTICAL_WORD_START && row <= VERTICAL_WORD_END) {
                cell.classList.add('word-area');
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
    
    // In phase 2, only allow selecting cells in the vertical word range
    if (toughLineComplete && (row < VERTICAL_WORD_START || row > VERTICAL_WORD_END)) {
        showMessage('Only fill cells in the word area (rows 3-7)!', 'info');
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
        // During vertical phase, move vertically within the word range
        if (row < VERTICAL_WORD_END) {
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
        
        // Select first cell of first column (in the vertical word range)
        setTimeout(() => {
            selectCell(VERTICAL_WORD_START, 0);
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
    // Check if all cells in the vertical word range are filled (rows 2-6, which includes the tough line at row 4)
    let word = '';
    for (let row = VERTICAL_WORD_START; row <= VERTICAL_WORD_END; row++) {
        if (!grid[row][col]) {
            return; // Not complete yet
        }
        word += grid[row][col];
    }
    
    // Validate the word
    if (currentWords.includes(word) && !usedWords.includes(word)) {
        usedWords.push(word);
        
        // Mark cells as correct
        for (let row = VERTICAL_WORD_START; row <= VERTICAL_WORD_END; row++) {
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
                selectCell(VERTICAL_WORD_START, col + 1);
            }, 500);
        }
    } else if (usedWords.includes(word)) {
        // Word already used
        for (let row = VERTICAL_WORD_START; row <= VERTICAL_WORD_END; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('incorrect');
        }
        
        showMessage('✗ Word already used!', 'error');
        
        // Clear incorrect cells after animation
        setTimeout(() => {
            for (let row = VERTICAL_WORD_START; row <= VERTICAL_WORD_END; row++) {
                if (row !== TOUGH_LINE_ROW) {
                    grid[row][col] = '';
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.textContent = '';
                    cell.classList.remove('incorrect');
                }
            }
            selectCell(VERTICAL_WORD_START, col);
        }, 1000);
    } else {
        // Incorrect word
        for (let row = VERTICAL_WORD_START; row <= VERTICAL_WORD_END; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('incorrect');
        }
        
        showMessage('✗ Not a valid word. Try again!', 'error');
        
        // Clear incorrect cells after animation
        setTimeout(() => {
            for (let row = VERTICAL_WORD_START; row <= VERTICAL_WORD_END; row++) {
                if (row !== TOUGH_LINE_ROW) {
                    grid[row][col] = '';
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.textContent = '';
                    cell.classList.remove('incorrect');
                }
            }
            selectCell(VERTICAL_WORD_START, col);
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
