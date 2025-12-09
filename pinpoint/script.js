// Game data - Collection of puzzles
const puzzles = [
    {
        clues: ["Orange", "Banana", "Apple", "Cherry", "Watermelon"],
        answer: "Fruits"
    },
    {
        clues: ["Paris", "London", "Tokyo", "New York", "Rome"],
        answer: "Cities"
    },
    {
        clues: ["Red", "Blue", "Green", "Yellow", "Purple"],
        answer: "Colors"
    },
    {
        clues: ["Piano", "Guitar", "Violin", "Drums", "Flute"],
        answer: "Musical Instruments"
    },
    {
        clues: ["Soccer", "Basketball", "Tennis", "Baseball", "Swimming"],
        answer: "Sports"
    },
    {
        clues:  ["Lion", "Elephant", "Giraffe", "Zebra", "Tiger"],
        answer: "Animals"
    },
    {
        clues: ["Shakespeare", "Hemingway", "Tolkien", "Austen", "Dickens"],
        answer: "Authors"
    },
    {
        clues: ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"],
        answer: "Planets"
    }
];

// Game state
let currentPuzzle = null;
let revealedCount = 0;
let gameOver = false;
let attempts = 0;

// Initialize the game
function initGame() {
    // Select a random puzzle
    currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    revealedCount = 1; // Start with first clue revealed
    gameOver = false;
    attempts = 0;
    
    // Clear input and message
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').disabled = false;
    document.getElementById('submit-btn').disabled = false;
    clearMessage();
    
    // Render the cards
    renderCards();
}

// Render all cards
function renderCards() {
    const cardStack = document.getElementById('card-stack');
    cardStack.innerHTML = '';
    
    // Create 5 clue cards
    for (let i = 0; i < 5; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        
        if (i < revealedCount) {
            // Show the clue
            card.textContent = currentPuzzle.clues[i];
            if (i === revealedCount - 1 && ! gameOver) {
                card. classList.add('revealed');
            }
        } else {
            // Hide the clue
            card.classList.add('empty');
        }
        
        cardStack.appendChild(card);
    }
    
    // Create answer card
    const answerCard = document.createElement('div');
    answerCard.className = 'card answer-card';
    answerCard.id = 'answer-card';
    
    if (gameOver) {
        answerCard.textContent = currentPuzzle.answer;
    } else {
        answerCard.classList.add('empty');
    }
    
    cardStack.appendChild(answerCard);
}

// Check the user's answer
function checkAnswer() {
    if (gameOver) return;
    
    const userGuess = document.getElementById('guess-input').value.trim();
    
    if (!userGuess) {
        showMessage('Please enter a guess!', 'error');
        return;
    }
    
    attempts++;
    
    // Check if the answer is correct (case-insensitive)
    if (userGuess.toLowerCase() === currentPuzzle.answer.toLowerCase()) {
        gameOver = true;
        revealedCount = 5; // Reveal all clues
        renderCards();
        
        // Reveal answer card
        setTimeout(() => {
            const answerCard = document.getElementById('answer-card');
            answerCard.classList.remove('empty');
            answerCard.textContent = currentPuzzle.answer;
            answerCard.classList.add('revealed');
        }, 300);
        
        showMessage(`🎉 Correct! You guessed it with ${attempts} attempt${attempts > 1 ? 's' : ''} and ${revealedCount} clue${revealedCount > 1 ? 's' : ''}! `, 'success');
        
        // Disable input
        document.getElementById('guess-input').disabled = true;
        document.getElementById('submit-btn').disabled = true;
    } else {
        // Wrong answer - reveal next clue if available
        if (revealedCount < 5) {
            revealedCount++;
            renderCards();
            showMessage(`❌ Incorrect!  Here's another clue... `, 'error');
            // Clear input for next attempt
            document.getElementById('guess-input').value = '';
        } else {
            // All clues revealed and still wrong - end game
            gameOver = true;
            renderCards();
            
            // Reveal answer card
            setTimeout(() => {
                const answerCard = document.getElementById('answer-card');
                answerCard.classList.remove('empty');
                answerCard.textContent = currentPuzzle.answer;
                answerCard.classList.add('revealed');
            }, 300);
            
            showMessage(`❌ Game Over! The answer was "${currentPuzzle.answer}". Try a new game!`, 'error');
            
            // Disable input
            document.getElementById('guess-input').disabled = true;
            document.getElementById('submit-btn').disabled = true;
        }
    }
}

// Show message
function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
}

// Clear message
function clearMessage() {
    const message = document.getElementById('message');
    message.textContent = '';
    message.className = 'message';
}

// Event listeners
document.getElementById('submit-btn').addEventListener('click', checkAnswer);

document.getElementById('guess-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

document.getElementById('new-game-btn').addEventListener('click', initGame);

// Start the game when page loads
initGame();
