// ================================================
// GAME CONFIGURATION & STATE
// ================================================

const GAME_CONFIG = {
    playerSpeed: 15,          // Pixels to move per keypress
    heartSpawnInterval: 2000, // Milliseconds between heart spawns
    maxHearts: 3,             // Maximum hearts on screen at once
    heartsToCollect: 10,      // Total hearts needed to win
    canvasWidth: 0,           // Will be set dynamically
    canvasHeight: 0,          // Will be set dynamically
};

let gameState = {
    score: 0,
    hearts: [],
    isGameActive: true,
    playerPosition: { x: 0, y: 0 },
};

// DOM Elements
let player;
let gameCanvas;
let scoreDisplay;
let finalScreen;
let heartSpawnTimer;

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    // Get DOM elements
    player = document.getElementById('player');
    gameCanvas = document.getElementById('gameCanvas');
    scoreDisplay = document.getElementById('scoreDisplay');
    finalScreen = document.getElementById('finalScreen');

    // Set canvas dimensions
    const canvasRect = gameCanvas.getBoundingClientRect();
    GAME_CONFIG.canvasWidth = canvasRect.width;
    GAME_CONFIG.canvasHeight = canvasRect.height;

    // Initialize player position (center of canvas)
    gameState.playerPosition = {
        x: GAME_CONFIG.canvasWidth / 2 - 25,
        y: GAME_CONFIG.canvasHeight / 2 - 25,
    };
    updatePlayerPosition();

    // Set up controls
    setupKeyboardControls();
    setupMobileControls();

    // Start spawning hearts
    spawnHeart(); // Spawn first heart immediately
    heartSpawnTimer = setInterval(spawnHeart, GAME_CONFIG.heartSpawnInterval);

    // Update score display
    updateScore();
}

// ================================================
// PLAYER MOVEMENT
// ================================================

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameState.isGameActive) return;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                movePlayer(0, -GAME_CONFIG.playerSpeed);
                break;
            case 'ArrowDown':
                e.preventDefault();
                movePlayer(0, GAME_CONFIG.playerSpeed);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                movePlayer(-GAME_CONFIG.playerSpeed, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                movePlayer(GAME_CONFIG.playerSpeed, 0);
                break;
        }
    });
}

function setupMobileControls() {
    const controlButtons = document.querySelectorAll('.control-btn');
    
    controlButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!gameState.isGameActive) return;

            const direction = button.getAttribute('data-direction');
            
            switch (direction) {
                case 'up':
                    movePlayer(0, -GAME_CONFIG.playerSpeed);
                    break;
                case 'down':
                    movePlayer(0, GAME_CONFIG.playerSpeed);
                    break;
                case 'left':
                    movePlayer(-GAME_CONFIG.playerSpeed, 0);
                    break;
                case 'right':
                    movePlayer(GAME_CONFIG.playerSpeed, 0);
                    break;
            }
        });
    });
}

function movePlayer(dx, dy) {
    // Update position
    gameState.playerPosition.x += dx;
    gameState.playerPosition.y += dy;

    // Constrain to canvas boundaries
    gameState.playerPosition.x = Math.max(0, Math.min(
        GAME_CONFIG.canvasWidth - 50,
        gameState.playerPosition.x
    ));
    gameState.playerPosition.y = Math.max(0, Math.min(
        GAME_CONFIG.canvasHeight - 50,
        gameState.playerPosition.y
    ));

    // Update player DOM position
    updatePlayerPosition();

    // Check for collisions with hearts
    checkCollisions();
}

function updatePlayerPosition() {
    player.style.left = gameState.playerPosition.x + 'px';
    player.style.top = gameState.playerPosition.y + 'px';
}

// ================================================
// HEART SPAWNING & MANAGEMENT
// ================================================

function spawnHeart() {
    if (!gameState.isGameActive) return;
    if (gameState.hearts.length >= GAME_CONFIG.maxHearts) return;

    // Generate random position within canvas
    const randomX = Math.random() * (GAME_CONFIG.canvasWidth - 40);
    const randomY = Math.random() * (GAME_CONFIG.canvasHeight - 40);

    // Create heart element
    const heartElement = document.createElement('div');
    heartElement.className = 'game-heart';
    heartElement.style.left = randomX + 'px';
    heartElement.style.top = randomY + 'px';

    // Add to canvas
    gameCanvas.appendChild(heartElement);

    // Store heart data
    const heart = {
        element: heartElement,
        x: randomX,
        y: randomY,
    };

    gameState.hearts.push(heart);
}

// ================================================
// COLLISION DETECTION
// ================================================

function checkCollisions() {
    const playerRect = {
        x: gameState.playerPosition.x,
        y: gameState.playerPosition.y,
        width: 50,
        height: 50,
    };

    // Check each heart for collision
    gameState.hearts = gameState.hearts.filter(heart => {
        const heartRect = {
            x: heart.x,
            y: heart.y,
            width: 40,
            height: 40,
        };

        // Simple rectangle collision detection
        const isColliding = !(
            playerRect.x + playerRect.width < heartRect.x ||
            playerRect.x > heartRect.x + heartRect.width ||
            playerRect.y + playerRect.height < heartRect.y ||
            playerRect.y > heartRect.y + heartRect.height
        );

        if (isColliding) {
            collectHeart(heart);
            return false; // Remove this heart from array
        }

        return true; // Keep this heart
    });
}

function collectHeart(heart) {
    // Play collection animation
    heart.element.classList.add('collected');

    // Play pop sound effect
    const collectSound = document.getElementById('collectSound');
    if (collectSound) {
        collectSound.currentTime = 0;
        collectSound.volume = 0.4;
        collectSound.play();
    }

    // Remove heart element after animation
    setTimeout(() => {
        if (heart.element.parentNode) {
            heart.element.parentNode.removeChild(heart.element);
        }
    }, 500);

    // Update score
    gameState.score++;
    updateScore();

    // Check if game is won
    if (gameState.score >= GAME_CONFIG.heartsToCollect) {
        winGame();
    }
}

// ================================================
// SCORE & UI UPDATES
// ================================================

function updateScore() {
    scoreDisplay.textContent = `${gameState.score} / ${GAME_CONFIG.heartsToCollect}`;
}

// ================================================
// GAME END & FINAL SCREEN
// ================================================

function winGame() {
    // Stop the game
    gameState.isGameActive = false;

    // Clear heart spawning
    clearInterval(heartSpawnTimer);

    // Remove remaining hearts
    gameState.hearts.forEach(heart => {
        if (heart.element.parentNode) {
            heart.element.parentNode.removeChild(heart.element);
        }
    });

    // Play success sound
    const winSound = document.getElementById('winSound');
    if (winSound) {
        winSound.volume = 0.5;
        winSound.play();
    }

    // Show final screen after a brief delay
    setTimeout(() => {
        finalScreen.classList.add('show');
    }, 1000);
}

// ================================================
// FINAL SCREEN INTERACTIONS
// ================================================

function goToMemories() {
    // Store music state
    const music = document.getElementById('bgMusic');
    if (music) {
        sessionStorage.setItem('musicPlaying', 'true');
        sessionStorage.setItem('musicTime', music.currentTime);
    }
    window.location.href = 'memories.html';
}

function sayYes() {
    // Hide the question and buttons
    document.getElementById('finalQuestion').style.display = 'none';
    document.getElementById('valentineQuestion').style.display = 'none';
    document.getElementById('answerButtons').style.display = 'none';

    // Show success message
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('show');

    // Create heart explosion
    createHeartExplosion();

    // Play romantic music (if available)
    // Uncomment if you add the music file
    /*
    const finalMusic = document.getElementById('finalMusic');
    if (finalMusic) {
        finalMusic.volume = 0.3;
        finalMusic.play();
    }
    */
}

function createHeartExplosion() {
    const heartExplosion = document.getElementById('heartExplosion');
    const heartEmojis = ['💖', '💕', '💗', '💓', '💝', '💘', '❤️', '💙', '💜', '🩷'];

    // Create 30 hearts exploding in different directions
    for (let i = 0; i < 30; i++) {
        const heart = document.createElement('div');
        heart.className = 'explosion-heart';
        heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

        // Random direction for explosion
        const angle = (Math.PI * 2 * i) / 30;
        const distance = 100 + Math.random() * 150;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        heart.style.setProperty('--tx', `${tx}px`);
        heart.style.setProperty('--ty', `${ty}px`);
        heart.style.left = '50%';
        heart.style.top = '50%';

        // Random delay for staggered effect
        heart.style.animationDelay = `${Math.random() * 0.5}s`;

        heartExplosion.appendChild(heart);
    }
}

// ================================================
// WINDOW RESIZE HANDLER
// ================================================

window.addEventListener('resize', () => {
    // Update canvas dimensions on resize
    const canvasRect = gameCanvas.getBoundingClientRect();
    GAME_CONFIG.canvasWidth = canvasRect.width;
    GAME_CONFIG.canvasHeight = canvasRect.height;

    // Constrain player to new boundaries
    gameState.playerPosition.x = Math.max(0, Math.min(
        GAME_CONFIG.canvasWidth - 50,
        gameState.playerPosition.x
    ));
    gameState.playerPosition.y = Math.max(0, Math.min(
        GAME_CONFIG.canvasHeight - 50,
        gameState.playerPosition.y
    ));

    updatePlayerPosition();
});
