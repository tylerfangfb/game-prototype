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

// Constants
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1';

// Game state
let currentWordSet = null;
let generatedImageUrl = null;
let attemptsRemaining = 3;
let gameActive = false;
let huggingFaceToken = null; // Store token in memory only (not localStorage for security)
let currentImageObjectURL = null; // Track current object URL for cleanup

// Helper function for pluralization
function pluralize(count, singular, plural = null) {
    if (count === 1) return singular;
    return plural || singular + 's';
}

// Initialize the game
function initGame() {
    // Clean up previous object URL to prevent memory leaks
    if (currentImageObjectURL) {
        URL.revokeObjectURL(currentImageObjectURL);
        currentImageObjectURL = null;
    }
    
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
    document.getElementById('generate-btn').textContent = 'Generate Image';
    
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

// Generate image using Hugging Face Inference API
async function generateImage(prompt) {
    // Check if token is provided
    if (!huggingFaceToken) {
        throw new Error('Please enter your Hugging Face API token first.');
    }
    
    // Show loading state
    document.getElementById('generate-btn').disabled = true;
    document.getElementById('generate-btn').textContent = 'Generating...';
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; // 5 seconds (in milliseconds)
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(HUGGINGFACE_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${huggingFaceToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: prompt })
            });
            
            // Handle different response statuses
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `API Error (${response.status})`;
                
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    
                    // Handle model loading
                    if (response.status === 503 && errorData.error && errorData.error.includes('loading')) {
                        if (attempt < MAX_RETRIES) {
                            const waitTime = errorData.estimated_time ? errorData.estimated_time * 1000 : RETRY_DELAY;
                            document.getElementById('generate-btn').textContent = `Model loading... Retry ${attempt}/${MAX_RETRIES}`;
                            await new Promise(resolve => setTimeout(resolve, Math.ceil(waitTime)));
                            continue; // Retry
                        } else {
                            errorMessage = 'Model is still loading. Please try again in a moment.';
                        }
                    }
                    // Handle invalid token
                    else if (response.status === 401 || response.status === 403) {
                        errorMessage = 'Invalid API token. Please check your Hugging Face token.';
                    }
                    // Handle rate limit
                    else if (response.status === 429) {
                        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
                    }
                    // Generic error with message
                    else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } else {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            // Convert blob response to object URL
            const blob = await response.blob();
            
            // Clean up previous object URL before creating a new one
            if (currentImageObjectURL) {
                URL.revokeObjectURL(currentImageObjectURL);
            }
            
            const imageUrl = URL.createObjectURL(blob);
            currentImageObjectURL = imageUrl;
            
            return imageUrl;
            
        } catch (error) {
            // If it's the last attempt or not a model loading error, throw
            if (attempt === MAX_RETRIES || !error.message.includes('loading')) {
                throw error;
            }
        }
    }
    
    throw new Error('Failed to generate image after multiple attempts.');
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

// Test if Hugging Face token is valid
async function testHuggingFaceToken(token) {
    try {
        const response = await fetch(HUGGINGFACE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                inputs: 'test'
            })
        });
        
        // If we get 401 or 403, token is invalid
        if (response.status === 401 || response.status === 403) {
            return { valid: false, message: 'Invalid token' };
        }
        
        // Any other status (including 503 for model loading) means token is valid
        return { valid: true, message: 'Token is valid' };
        
    } catch (error) {
        // Network error or other issue
        return { valid: false, message: 'Could not verify token. Check your connection.' };
    }
}

// Handle saving and testing token
async function saveAndTestToken() {
    const tokenInput = document.getElementById('hf-token-input');
    const token = tokenInput.value.trim();
    const statusElement = document.getElementById('token-status');
    const saveBtn = document.getElementById('save-token-btn');
    
    if (!token) {
        statusElement.innerHTML = '❌ Please enter a token first';
        statusElement.className = 'token-status error';
        return;
    }
    
    // Show testing state
    statusElement.innerHTML = '⏳ Testing token...';
    statusElement.className = 'token-status testing';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Testing...';
    
    // Test the token
    const result = await testHuggingFaceToken(token);
    
    if (result.valid) {
        huggingFaceToken = token;
        statusElement.innerHTML = '✅ Token saved & verified! Ready to generate images.';
        statusElement.className = 'token-status saved';
        saveBtn.textContent = 'Token Verified ✓';
    } else {
        huggingFaceToken = null;
        statusElement.innerHTML = `❌ ${result.message}. Please check your token.`;
        statusElement.className = 'token-status error';
        saveBtn.textContent = 'Save & Test Token';
    }
    
    saveBtn.disabled = false;
}

// Handle token input changes (reset validation status)
document.getElementById('hf-token-input').addEventListener('input', function() {
    const token = this.value.trim();
    const statusElement = document.getElementById('token-status');
    const saveBtn = document.getElementById('save-token-btn');
    
    if (!token) {
        huggingFaceToken = null;
        statusElement.textContent = '';
        statusElement.className = 'token-status empty';
        saveBtn.textContent = 'Save & Test Token';
    } else {
        // Show that token needs to be saved/tested
        if (huggingFaceToken !== token) {
            statusElement.innerHTML = 'ℹ️ Click "Save & Test Token" or press Enter to verify';
            statusElement.className = 'token-status testing';
            saveBtn.textContent = 'Save & Test Token';
        }
    }
});

// Handle Enter key in token input
document.getElementById('hf-token-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveAndTestToken();
    }
});

// Handle save token button click
document.getElementById('save-token-btn').addEventListener('click', function() {
    saveAndTestToken();
});

// Handle generate button click
document.getElementById('generate-btn').addEventListener('click', async function() {
    const prompt = document.getElementById('prompt-input').value.trim();
    const errorElement = document.getElementById('prompt-error');
    
    // Check if token is entered
    if (!huggingFaceToken) {
        errorElement.textContent = '⚠️ Please save and verify your Hugging Face API token first!';
        // Scroll to token input and highlight it
        const tokenInput = document.getElementById('hf-token-input');
        tokenInput.focus();
        tokenInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
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
        errorElement.textContent = error.message || 'Failed to generate image. Please try again.';
        document.getElementById('generate-btn').disabled = false;
        document.getElementById('generate-btn').textContent = 'Generate Image';
    }
});

// Handle share button click
document.getElementById('share-btn').addEventListener('click', function() {
    if (!generatedImageUrl) return;
    
    // Generate a fake share link for this prototype
    const shareLink = `https://taboodles.game/share/${Math.random().toString(36).substring(2, 11)}`;
    
    // Simulate sharing - in this prototype, directly activate Player B's screen
    document.getElementById('waiting-message').style.display = 'none';
    document.getElementById('player-b-game').style.display = 'block';
    document.getElementById('shared-image').src = generatedImageUrl;
    gameActive = true;
    attemptsRemaining = 3;
    document.getElementById('attempts-count').textContent = attemptsRemaining;
    
    // Show share link feedback (in a real app, this would be copied to clipboard or shown in a modal)
    const feedbackMsg = `Share link generated: ${shareLink}\n\n(In this prototype, Player B's screen is automatically updated)`;
    console.log(feedbackMsg);
    
    // Create a temporary message overlay for better UX (replacing alert)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000; max-width: 400px; text-align: center;';
    overlay.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #667eea;">Share Link Generated!</h3>
        <p style="margin: 0 0 10px 0; word-break: break-all; color: #666;">${shareLink}</p>
        <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #999;">(In this prototype, Player B's screen is automatically updated)</p>
        <button onclick="this.parentElement.remove()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">OK</button>
    `;
    document.body.appendChild(overlay);
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
        feedbackElement.textContent = `❌ Incorrect! Try again. ${attemptsRemaining} ${pluralize(attemptsRemaining, 'attempt')} remaining.`;
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
