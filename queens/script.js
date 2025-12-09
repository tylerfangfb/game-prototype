// Game state
let grid = [];
let colorRegions = [];
const GRID_SIZE = 8;
const MIN_REGION_SIZE = 4;
const MAX_REGION_SIZE = 10;
const COLORS = [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
    '#BAE1FF', '#E0BBE4', '#FFDFD3', '#D4F1F4'
];

// Cell states
const EMPTY = 0;
const MARKED = 1;  // X mark
const QUEEN = 2;   // ♛

// Initialize game
function initGame() {
    grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(EMPTY));
    generateColorRegions();
    renderGrid();
    clearMessage();
}

// Generate connected color regions using flood fill
function generateColorRegions() {
    colorRegions = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(-1));
    let regionId = 0;
    const cellsToAssign = [];
    
    // Create list of all cells
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            cellsToAssign.push({r, c});
        }
    }
    
    // Shuffle cells for randomness
    shuffleArray(cellsToAssign);
    
    // Assign regions using flood fill to ensure connectivity
    while (cellsToAssign.length > 0) {
        const start = cellsToAssign.shift();
        
        if (colorRegions[start.r][start.c] !== -1) continue;
        
        // Decide region size
        const targetSize = Math.floor(Math.random() * (MAX_REGION_SIZE - MIN_REGION_SIZE + 1)) + MIN_REGION_SIZE;
        const region = [];
        const queue = [start];
        const visited = new Set();
        visited.add(`${start.r},${start.c}`);
        
        while (queue.length > 0 && region.length < targetSize) {
            const cell = queue.shift();
            
            if (colorRegions[cell.r][cell.c] !== -1) continue;
            
            region.push(cell);
            colorRegions[cell.r][cell.c] = regionId;
            
            // Remove from cellsToAssign
            const idx = cellsToAssign.findIndex(c => c.r === cell.r && c.c === cell.c);
            if (idx !== -1) cellsToAssign.splice(idx, 1);
            
            // Add neighbors to queue
            const neighbors = getNeighbors(cell.r, cell.c);
            for (const neighbor of neighbors) {
                const key = `${neighbor.r},${neighbor.c}`;
                if (!visited.has(key) && colorRegions[neighbor.r][neighbor.c] === -1) {
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }
        
        regionId++;
    }
}

// Get adjacent neighbors (up, down, left, right)
function getNeighbors(r, c) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            neighbors.push({r: nr, c: nc});
        }
    }
    
    return neighbors;
}

// Shuffle array in place
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Render the grid
function renderGrid() {
    const gridElement = document.getElementById('queens-grid');
    gridElement.innerHTML = '';
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Set background color based on region
            const regionId = colorRegions[r][c];
            const colorIndex = regionId % COLORS.length;
            cell.style.backgroundColor = COLORS[colorIndex];
            
            // Add bold borders between different regions
            addBoldBorders(cell, r, c);
            
            // Set cell content
            const state = grid[r][c];
            if (state === MARKED) {
                cell.textContent = 'X';
                cell.classList.add('marked');
            } else if (state === QUEEN) {
                cell.textContent = '♛';
                cell.classList.add('queen');
            }
            
            cell.addEventListener('click', () => handleCellClick(r, c));
            gridElement.appendChild(cell);
        }
    }
}

// Add bold borders between different colored regions
function addBoldBorders(cell, r, c) {
    const currentRegion = colorRegions[r][c];
    
    // Check top neighbor
    if (r > 0 && colorRegions[r - 1][c] !== currentRegion) {
        cell.classList.add('border-top');
    }
    
    // Check bottom neighbor
    if (r < GRID_SIZE - 1 && colorRegions[r + 1][c] !== currentRegion) {
        cell.classList.add('border-bottom');
    }
    
    // Check left neighbor
    if (c > 0 && colorRegions[r][c - 1] !== currentRegion) {
        cell.classList.add('border-left');
    }
    
    // Check right neighbor
    if (c < GRID_SIZE - 1 && colorRegions[r][c + 1] !== currentRegion) {
        cell.classList.add('border-right');
    }
}

// Handle cell click - cycle through states
function handleCellClick(r, c) {
    const currentState = grid[r][c];
    
    // Cycle: EMPTY -> MARKED -> QUEEN -> EMPTY
    if (currentState === EMPTY) {
        grid[r][c] = MARKED;
    } else if (currentState === MARKED) {
        // Check if queen placement is valid (doesn't touch other queens)
        if (isValidQueenPlacement(r, c)) {
            grid[r][c] = QUEEN;
        } else {
            showMessage('Queens cannot touch each other, even diagonally!', 'error');
            setTimeout(clearMessage, 2000);
            return;
        }
    } else if (currentState === QUEEN) {
        grid[r][c] = EMPTY;
    }
    
    updateCell(r, c);
    checkWinCondition();
}

// Update a single cell
function updateCell(r, c) {
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    const state = grid[r][c];
    
    cell.classList.remove('marked', 'queen');
    
    if (state === MARKED) {
        cell.textContent = 'X';
        cell.classList.add('marked');
    } else if (state === QUEEN) {
        cell.textContent = '♛';
        cell.classList.add('queen');
    } else {
        cell.textContent = '';
    }
}

// Check if queen placement is valid (doesn't touch other queens diagonally)
function isValidQueenPlacement(r, c) {
    // Check all 8 directions (including diagonals)
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            if (grid[nr][nc] === QUEEN) {
                return false;
            }
        }
    }
    
    return true;
}

// Check win condition
function checkWinCondition() {
    // Count queens
    let queenCount = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === QUEEN) {
                queenCount++;
            }
        }
    }
    
    // Need exactly 8 queens
    if (queenCount !== GRID_SIZE) {
        return;
    }
    
    // Check one queen per row
    for (let r = 0; r < GRID_SIZE; r++) {
        let count = 0;
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === QUEEN) count++;
        }
        if (count !== 1) return;
    }
    
    // Check one queen per column
    for (let c = 0; c < GRID_SIZE; c++) {
        let count = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r][c] === QUEEN) count++;
        }
        if (count !== 1) return;
    }
    
    // Check one queen per color region
    const regionQueens = {};
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === QUEEN) {
                const region = colorRegions[r][c];
                regionQueens[region] = (regionQueens[region] || 0) + 1;
            }
        }
    }
    
    // Count unique regions
    const uniqueRegions = new Set();
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            uniqueRegions.add(colorRegions[r][c]);
        }
    }
    
    // Check each region has exactly one queen
    for (const region of uniqueRegions) {
        if (regionQueens[region] !== 1) return;
    }
    
    // All conditions met!
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

// Reset puzzle (clear all placements but keep same colors)
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the puzzle?')) {
        grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(EMPTY));
        renderGrid();
        clearMessage();
    }
});

// New game (generate new color regions)
document.getElementById('new-game-btn').addEventListener('click', () => {
    initGame();
});

// Initialize game on load
initGame();
