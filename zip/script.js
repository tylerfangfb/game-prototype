// Game state
let grid = [];
let numberPositions = {}; // Maps numbers 1-6 to {row, col}
let currentPath = [];
let savedPath = []; // Saved path segments when numbers are connected in sequence
let isDragging = false;
let startNumber = null;
let lastSavedNumber = 0; // Cache for the last saved number

// Wall configuration - defines which cells have walls on which sides
// Format: {row: {col: ['top', 'right', 'bottom', 'left']}}
let walls = {};

// Generate exactly 5 separate walls
function generateWalls() {
    walls = {};
    const wallCount = 5;
    
    // Each wall is a line of 2-4 segments
    for (let i = 0; i < wallCount; i++) {
        // Random starting position
        const startRow = Math.floor(Math.random() * 6);
        const startCol = Math.floor(Math.random() * 6);
        
        // Random direction (0=horizontal, 1=vertical)
        const isHorizontal = Math.random() < 0.5;
        
        // Random length (2-4 segments)
        const length = Math.floor(Math.random() * 3) + 2;
        
        // Add wall segments
        for (let j = 0; j < length; j++) {
            let row = startRow;
            let col = startCol;
            
            if (isHorizontal) {
                col = startCol + j;
                if (col >= 6) break; // Don't go out of bounds
                
                // Add right wall to this cell
                if (!walls[row]) walls[row] = {};
                if (!walls[row][col]) walls[row][col] = [];
                if (!walls[row][col].includes('right')) {
                    walls[row][col].push('right');
                }
            } else {
                row = startRow + j;
                if (row >= 6) break; // Don't go out of bounds
                
                // Add bottom wall to this cell
                if (!walls[row]) walls[row] = {};
                if (!walls[row][col]) walls[row][col] = [];
                if (!walls[row][col].includes('bottom')) {
                    walls[row][col].push('bottom');
                }
            }
        }
    }
}

// Initialize the game
function initGame() {
    grid = [];
    numberPositions = {};
    currentPath = [];
    savedPath = [];
    isDragging = false;
    startNumber = null;
    lastSavedNumber = 0;
    
    // Generate walls
    generateWalls();
    
    // Create empty 6x6 grid
    for (let i = 0; i < 6; i++) {
        grid[i] = new Array(6).fill(0);
    }
    
    // Place numbers 1-6 randomly (one of each)
    const numbers = [1, 2, 3, 4, 5, 6];
    const shuffledPositions = [];
    
    // Generate all 36 positions
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            shuffledPositions.push({row, col});
        }
    }
    
    // Shuffle positions
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
    }
    
    // Assign first 6 positions to numbers 1-6
    for (let i = 0; i < 6; i++) {
        const {row, col} = shuffledPositions[i];
        grid[row][col] = numbers[i];
        numberPositions[numbers[i]] = {row, col};
    }
    
    renderGrid();
    clearMessage();
}

// Render the grid
function renderGrid() {
    const gridEl = document.getElementById('zip-grid');
    gridEl.innerHTML = '';
    
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add wall classes
            if (walls[row] && walls[row][col]) {
                walls[row][col].forEach(side => {
                    cell.classList.add(`wall-${side}`);
                });
            }
            
            const value = grid[row][col];
            if (value !== 0) {
                cell.textContent = value;
                cell.classList.add('number-cell');
            }
            
            gridEl.appendChild(cell);
        }
    }
    
    // Add event listeners
    addEventListeners();
}

// Add event listeners for drag interaction
function addEventListeners() {
    const gridEl = document.getElementById('zip-grid');
    const cells = gridEl.querySelectorAll('.cell');
    
    // Remove existing document listeners to prevent duplicates
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleEnd);
    
    // Mouse events
    cells.forEach(cell => {
        cell.addEventListener('mousedown', handleStart);
        cell.addEventListener('mouseenter', handleMove);
    });
    
    document.addEventListener('mouseup', handleEnd);
    
    // Touch events
    cells.forEach(cell => {
        cell.addEventListener('touchstart', handleTouchStart, {passive: false});
    });
    
    document.addEventListener('touchmove', handleTouchMove, {passive: false});
    document.addEventListener('touchend', handleEnd);
}

// Handle start of drag (mouse)
function handleStart(e) {
    e.preventDefault();
    
    if (!e.target.dataset.row || !e.target.dataset.col) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    if (isNaN(row) || isNaN(col)) return;
    
    const cellValue = grid[row][col];
    
    // Allow starting from 1 or from the last saved number to continue
    const lastSavedNumber = getLastSavedNumber();
    const canStart = (lastSavedNumber === 0 && cellValue === 1) || 
                     (lastSavedNumber > 0 && cellValue === lastSavedNumber);
    
    if (canStart) {
        isDragging = true;
        startNumber = cellValue;
        currentPath = [{row, col}];
        updateHighlighting();
    }
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    // Try to use the target first, fallback to elementFromPoint
    let element = e.target;
    if (!element.classList.contains('cell')) {
        element = document.elementFromPoint(touch.clientX, touch.clientY);
    }
    
    if (element && element.classList.contains('cell') && element.dataset.row) {
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        
        const cellValue = grid[row][col];
        
        // Allow starting from 1 or from the last saved number to continue
        const lastSavedNumber = getLastSavedNumber();
        const canStart = (lastSavedNumber === 0 && cellValue === 1) || 
                         (lastSavedNumber > 0 && cellValue === lastSavedNumber);
        
        if (canStart) {
            isDragging = true;
            startNumber = cellValue;
            currentPath = [{row, col}];
            updateHighlighting();
        }
    }
}

// Handle move (mouse)
function handleMove(e) {
    if (!isDragging) return;
    
    if (!e.target.dataset.row || !e.target.dataset.col) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    if (isNaN(row) || isNaN(col)) return;
    
    addToPath(row, col);
}

// Handle touch move
function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('cell') && element.dataset.row) {
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        
        addToPath(row, col);
    }
}

// Add cell to path
function addToPath(row, col) {
    if (!isDragging) return;
    
    const lastCell = currentPath[currentPath.length - 1];
    
    // Check if this cell is already in the path
    const existingIndex = currentPath.findIndex(c => c.row === row && c.col === col);
    
    if (existingIndex !== -1) {
        // If backtracking, remove cells after this one
        if (existingIndex < currentPath.length - 1) {
            currentPath = currentPath.slice(0, existingIndex + 1);
            updateHighlighting();
        }
        return;
    }
    
    // Check if adjacent to last cell
    if (!isAdjacent(lastCell.row, lastCell.col, row, col)) {
        return;
    }
    
    // Check if there's a wall between cells
    if (hasWallBetween(lastCell.row, lastCell.col, row, col)) {
        return;
    }
    
    // Check if next number in sequence
    const currentNumber = getCurrentSequenceNumber();
    const cellValue = grid[row][col];
    
    // Allow moving to empty cells or the next number in sequence
    if (cellValue === 0 || cellValue === currentNumber + 1) {
        currentPath.push({row, col});
        updateHighlighting();
        
        // If we reached the next number in sequence, save the path
        if (cellValue === currentNumber + 1 && cellValue > 0) {
            // Save current path to savedPath, but skip first cell if it's already saved
            const firstCell = currentPath[0];
            const isFirstCellSaved = savedPath.some(c => c.row === firstCell.row && c.col === firstCell.col);
            const pathToSave = isFirstCellSaved ? currentPath.slice(1) : currentPath;
            
            savedPath = [...savedPath, ...pathToSave];
            lastSavedNumber = cellValue; // Update cached value
            currentPath = [];
            isDragging = false;
            startNumber = null;
            updateHighlighting();
            
            // Check win condition
            if (cellValue === 6) {
                checkWinCondition();
            }
        }
    }
}

// Get the last saved number (cached)
function getLastSavedNumber() {
    return lastSavedNumber;
}

// Get current expected number in sequence
function getCurrentSequenceNumber() {
    let maxNumber = startNumber || 1;
    for (const cell of currentPath) {
        const value = grid[cell.row][cell.col];
        if (value > maxNumber) {
            maxNumber = value;
        }
    }
    return maxNumber;
}

// Check if two cells are adjacent
function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Check if there's a wall between two adjacent cells
function hasWallBetween(row1, col1, row2, col2) {
    // Determine direction
    if (row2 < row1) {
        // Moving up - check if row1,col1 has wall-top or row2,col2 has wall-bottom
        return hasWall(row1, col1, 'top') || hasWall(row2, col2, 'bottom');
    } else if (row2 > row1) {
        // Moving down - check if row1,col1 has wall-bottom or row2,col2 has wall-top
        return hasWall(row1, col1, 'bottom') || hasWall(row2, col2, 'top');
    } else if (col2 < col1) {
        // Moving left - check if row1,col1 has wall-left or row2,col2 has wall-right
        return hasWall(row1, col1, 'left') || hasWall(row2, col2, 'right');
    } else if (col2 > col1) {
        // Moving right - check if row1,col1 has wall-right or row2,col2 has wall-left
        return hasWall(row1, col1, 'right') || hasWall(row2, col2, 'left');
    }
    return false;
}

// Check if a cell has a wall on a specific side
function hasWall(row, col, side) {
    return walls[row] && walls[row][col] && walls[row][col].includes(side);
}

// Handle end of drag
function handleEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    startNumber = null;
    
    // Clear current path (saved path is preserved)
    currentPath = [];
    updateHighlighting();
}

// Update highlighting on the grid
function updateHighlighting() {
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        const isInCurrentPath = currentPath.some(c => c.row === row && c.col === col);
        const isInSavedPath = savedPath.some(c => c.row === row && c.col === col);
        
        // Remove all highlighting classes first
        cell.classList.remove('highlighted', 'saved', 'start-selected');
        
        if (isInSavedPath) {
            cell.classList.add('saved');
        }
        
        if (isInCurrentPath) {
            cell.classList.add('highlighted');
            
            // Add special highlight for starting number when selected
            const cellValue = grid[row][col];
            if (cellValue === startNumber && isDragging) {
                cell.classList.add('start-selected');
            }
        }
    });
}

// Check win condition
function checkWinCondition() {
    // Must have all 36 cells in saved path
    if (savedPath.length !== 36) {
        return;
    }
    
    // Must have all numbers 1-6 in sequence
    const numbers = [1, 2, 3, 4, 5, 6];
    for (const num of numbers) {
        const pos = numberPositions[num];
        const inPath = savedPath.some(c => c.row === pos.row && c.col === pos.col);
        if (!inPath) {
            return;
        }
    }
    
    // Check that numbers appear in correct sequence order in the path
    let lastNumberIndex = -1;
    for (let i = 1; i <= 6; i++) {
        const pos = numberPositions[i];
        const pathIndex = savedPath.findIndex(c => c.row === pos.row && c.col === pos.col);
        if (pathIndex <= lastNumberIndex) {
            return;
        }
        lastNumberIndex = pathIndex;
    }
    
    showMessage('🎉 Congratulations! You solved the puzzle!', 'success');
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

// Initialize game on load
initGame();

// Reset puzzle - add listener after DOM is ready
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the puzzle?')) {
        initGame();
    }
});
