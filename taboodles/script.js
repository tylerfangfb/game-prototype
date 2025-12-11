// Game data - Collection of word puzzles
const wordSets = [
    {
        target: "Waterfall",
        forbidden: ["River", "Cliff", "Over", "Niagara", "Barrel"]
    },
    {
        target: "Basketball",
        forbidden: ["Hoop", "Court", "Dribble", "NBA", "Slam"]
    },
    {
        target: "Pizza",
        forbidden: ["Cheese", "Dough", "Italy", "Slice", "Pepperoni"]
    },
    {
        target: "Coffee",
        forbidden: ["Bean", "Caffeine", "Brew", "Espresso", "Starbucks"]
    },
    {
        target: "Guitar",
        forbidden: ["String", "Music", "Strum", "Fret", "Rock"]
    },
    {
        target: "Butterfly",
        forbidden: ["Wings", "Insect", "Caterpillar", "Flutter", "Cocoon"]
    },
    {
        target: "Ocean",
        forbidden: ["Sea", "Water", "Wave", "Beach", "Salt"]
    },
    {
        target: "Airplane",
        forbidden: ["Fly", "Sky", "Pilot", "Wing", "Airport"]
    }
];

// Game state
let currentWordSet = null;
let generatedImageUrl = null;
let attemptsRemaining = 3;
let gameActive = false;

// Initialize the game
function initGame() {
    // Select a random word set
    currentWordSet = wordSets[Math.floor(Math.random() * wordSets.length)];
    generatedImageUrl = null;
    attemptsRemaining = 3;
    gameActive = false;
    
    // Display target and forbidden words for Player A
    document.getElementById('target-word').textContent = currentWordSet.target;
    
    const forbiddenWordsContainer = document.getElementById('forbidden-words');
    forbiddenWordsContainer.innerHTML = '';
    currentWordSet.forbidden.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'forbidden-word';
        wordElement.textContent = word;
        forbiddenWordsContainer.appendChild(wordElement);
    });
    
    // Reset Player A UI
    document.getElementById('prompt-input').value = '';
    document.getElementById('prompt-error').textContent = '';
    document.getElementById('image-placeholder').style.display = 'block';
    document.getElementById('generated-image').style.display = 'none';
    document.getElementById('share-btn').style.display = 'none';
    document.getElementById('generate-btn').disabled = false;
    
    // Reset Player B UI
    document.getElementById('waiting-message').style.display = 'block';
    document.getElementById('player-b-game').style.display = 'none';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-feedback').textContent = '';
    document.getElementById('guess-feedback').className = 'message';
    document.getElementById('attempts-count').textContent = '3';
}

// Check if prompt contains forbidden words
function validatePrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const allForbiddenWords = [currentWordSet.target, ...currentWordSet.forbidden];
    
    for (const word of allForbiddenWords) {
        // Check for whole word matches (with word boundaries)
        const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
        if (regex.test(lowerPrompt)) {
            return { valid: false, word: word };
        }
    }
    
    return { valid: true };
}

// Simulate image generation using a placeholder service
async function generateImage(prompt) {
    // For this prototype, we'll generate a placeholder image with text
    // In a real implementation, this would call a GenAI API like DALL-E, Stable Diffusion, etc.
    
    // Show loading state
    document.getElementById('generate-btn').disabled = true;
    document.getElementById('generate-btn').textContent = 'Generating...';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a simple placeholder image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);
    
    // Add text overlay showing it's AI-generated
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 AI Generated Image', 200, 140);
    
    // Add a smaller text showing the prompt was used
    ctx.font = '16px Arial';
    ctx.fillText('(Placeholder for prototype)', 200, 170);
    
    // Convert canvas to data URL
    const imageUrl = canvas.toDataURL('image/png');
    
    // In a real app, you would make an API call here:
    // const response = await fetch('https://api.openai.com/v1/images/generations', {
    //     method: 'POST',
    //     headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ prompt: prompt, n: 1, size: "512x512" })
    // });
    // const data = await response.json();
    // const imageUrl = data.data[0].url;
    
    return imageUrl;
}

// Display generated image
function displayImage(imageUrl) {
    generatedImageUrl = imageUrl;
    document.getElementById('image-placeholder').style.display = 'none';
    const imageElement = document.getElementById('generated-image');
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
    document.getElementById('share-btn').style.display = 'inline-block';
    document.getElementById('generate-btn').textContent = 'Generate New Image';
    document.getElementById('generate-btn').disabled = false;
}

// Handle generate button click
document.getElementById('generate-btn').addEventListener('click', async function() {
    const prompt = document.getElementById('prompt-input').value.trim();
    const errorElement = document.getElementById('prompt-error');
    
    if (!prompt) {
        errorElement.textContent = 'Please enter a prompt first!';
        return;
    }
    
    // Validate prompt doesn't contain forbidden words
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
        errorElement.textContent = `⚠️ Your prompt contains a forbidden word: "${validation.word}"`;
        return;
    }
    
    // Clear error
    errorElement.textContent = '';
    
    // Generate image
    try {
        const imageUrl = await generateImage(prompt);
        displayImage(imageUrl);
    } catch (error) {
        errorElement.textContent = 'Failed to generate image. Please try again.';
        document.getElementById('generate-btn').disabled = false;
        document.getElementById('generate-btn').textContent = 'Generate Image';
    }
});

// Handle share button click
document.getElementById('share-btn').addEventListener('click', function() {
    if (!generatedImageUrl) return;
    
    // Generate a fake share link for this prototype
    const shareLink = `https://taboodles.game/share/${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate sharing - in this prototype, directly activate Player B's screen
    document.getElementById('waiting-message').style.display = 'none';
    document.getElementById('player-b-game').style.display = 'block';
    document.getElementById('shared-image').src = generatedImageUrl;
    gameActive = true;
    attemptsRemaining = 3;
    document.getElementById('attempts-count').textContent = attemptsRemaining;
    
    // Show feedback to Player A
    alert(`Share link generated: ${shareLink}\n\n(In this prototype, Player B's screen is automatically updated)`);
});

// Handle guess submission for Player B
document.getElementById('submit-guess-btn').addEventListener('click', function() {
    if (!gameActive) return;
    
    const guess = document.getElementById('guess-input').value.trim();
    const feedbackElement = document.getElementById('guess-feedback');
    
    if (!guess) {
        feedbackElement.textContent = 'Please enter a guess!';
        feedbackElement.className = 'message error';
        return;
    }
    
    // Check if guess matches target word (case-insensitive)
    if (guess.toLowerCase() === currentWordSet.target.toLowerCase()) {
        feedbackElement.textContent = `🎉 Correct! The target word was "${currentWordSet.target}"!`;
        feedbackElement.className = 'message success';
        gameActive = false;
        document.getElementById('submit-guess-btn').disabled = true;
        return;
    }
    
    // Incorrect guess
    attemptsRemaining--;
    document.getElementById('attempts-count').textContent = attemptsRemaining;
    
    if (attemptsRemaining === 0) {
        feedbackElement.textContent = `❌ Game Over! The correct word was "${currentWordSet.target}".`;
        feedbackElement.className = 'message error';
        gameActive = false;
        document.getElementById('submit-guess-btn').disabled = true;
    } else {
        feedbackElement.textContent = `❌ Incorrect! Try again. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining.`;
        feedbackElement.className = 'message error';
        document.getElementById('guess-input').value = '';
        document.getElementById('guess-input').focus();
    }
});

// Allow Enter key to submit guess
document.getElementById('guess-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('submit-guess-btn').click();
    }
});

// Clear prompt error when typing
document.getElementById('prompt-input').addEventListener('input', function() {
    document.getElementById('prompt-error').textContent = '';
});

// Initialize game on page load
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});
