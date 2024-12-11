//modes/face/faceGame.js
let faceMesh;
let video;
let faces = [];
let words = [];
let score = 0;
let gameTime = 60; // 1 minute game
let startTime;
let favoriteWord = '';
let gameState = 'playing';
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

async function setup() {
    const canvas = createCanvas(windowWidth * 0.6, windowHeight * 0.7);
    canvas.parent('game-canvas');
    
    try {
        // Request camera access with explicit constraints
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        // Only create video capture after permission is granted
        video = createCapture(stream);
        video.size(width, height);
        video.hide();
        
        // Initialize faceMesh after video is ready
        faceMesh = ml5.faceMesh(options);
        faceMesh.detectStart(video, gotFaces);
        
        startTime = millis();
        textAlign(CENTER, CENTER);
    } catch (err) {
        console.error('Camera access error:', err);
        alert('Please allow camera access to play the game');
    }
}


function draw() {
    background(255);
    
    if (gameState === 'playing') {
        // Mirror the video
        push();
        translate(width, 0);
        scale(-1, 1);
        image(video, 0, 0, width, height);
        pop();
        
        // Update game time
        let elapsed = millis() - startTime;
        let remaining = max(0, gameTime - floor(elapsed/1000));
        updateGameStats(remaining);
        
        if (remaining === 0) {
            gameState = 'ended';
            showLeaderboard();
            return;
        }
        
        // Generate new words
        if (frameCount % 60 === 0) {
            words.push(new Word());
        }
        
        // Update and draw words
        updateWords();
    }
}

class Word {
    constructor() {
        this.text = randomWord();
        this.x = random(100, width-100);
        this.y = -20;
        this.speed = random(2, 5);
        this.size = random(20, 40);
        this.color = color(random(100, 200), random(100, 200), random(100, 200));
        this.caught = false;
    }
    
    update() {
        this.y += this.speed;
        return this.y > height;
    }
    
    draw() {
        fill(this.color);
        textSize(this.size);
        text(this.text, this.x, this.y);
    }
}

function updateWords() {
    for (let i = words.length - 1; i >= 0; i--) {
        let word = words[i];
        if (!word.caught) {
            word.draw();
            if (word.update()) {
                words.splice(i, 1);
            } else if (faces.length > 0) {
                checkCollision(word, faces[0]);
            }
        }
    }
}

function checkCollision(word, face) {
    let headBounds = getHeadBounds(face);
    
    if (word.y > headBounds.top && word.y < headBounds.bottom &&
        word.x > headBounds.left && word.x < headBounds.right && !word.caught) {
        score += Math.floor(word.size);
        word.caught = true;
    }
}

function getHeadBounds(face) {
    let left = width;
    let right = 0;
    let top = height;
    let bottom = 0;
    
    for (let i = 0; i < face.keypoints.length; i++) {
        let point = face.keypoints[i];
        left = min(left, point.x);
        right = max(right, point.x);
        top = min(top, point.y);
        bottom = max(bottom, point.y);
    }
    
    return { left, right, top, bottom };
}

function updateGameStats(remaining) {
    document.querySelector('.score-box').textContent = `Score: ${score}`;
    document.querySelector('.time-box').textContent = `Time: ${remaining}s`;
}

function gotFaces(results) {
    faces = results;
}

function randomWord() {
    const wordList = ['CATCH', 'JUMP', 'PLAY', 'FUN', 'SCORE', 'WIN', 'DANCE', 'MUSIC', 
                     'MOVE', 'SMILE', 'HAPPY', 'SOUND', 'BEAT', 'RHYTHM'];
    return random(wordList);
}

function showLeaderboard() {
    background(255);
    textSize(32);
    fill(0);
    text('Game Over!', width/2, height/3);
    text(`Final Score: ${score}`, width/2, height/2);
    
    // Save score to leaderboard
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard.push({
        name: document.getElementById('favorite-word').value || 'Player',
        score: score
    });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    
    // Display leaderboard
    textSize(24);
    text('Top 5 Scores:', width/2, height/2 + 50);
    leaderboard.forEach((entry, i) => {
        text(`${entry.name}: ${entry.score}`, width/2, height/2 + 90 + i * 30);
    });
}

// Event listener for favorite word bonus
document.getElementById('favorite-word').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        score += 100;
        e.target.disabled = true;
    }
});

// Event listener for home button
document.querySelector('.home-btn').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index.html';
});
