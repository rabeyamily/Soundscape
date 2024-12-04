class FaceMode {
    constructor() {
        this.initialized = false;
        this.faceMesh = null;
        this.video = null;
        this.faces = [];
        this.score = 0;
        this.fallingWords = [];
        this.synth = new Tone.Synth().toDestination();
        this.notes = ['C4', 'E4', 'G4', 'B4', 'A4', 'D4'];
        this.currentNoteIndex = 0;
        this.lastCatchTime = 0;
        this.catchCooldown = 300;
        this.maxWords = 40;
        this.gameStartTime = null;
        this.gameLength = 60000; // 60 seconds in milliseconds
        this.gameEnded = false;
        this.wordColors = [
            [255, 87, 51],  // Coral
            [255, 189, 51], // Yellow
            [87, 255, 51],  // Green
            [51, 255, 189], // Turquoise
            [51, 87, 255],  // Blue
            [189, 51, 255], // Purple
            [255, 51, 189]  // Pink
        ];
    }

    async init(p) {
        this.p5Instance = p;
        this.video = p.createCapture(p.VIDEO);
        this.video.size(640, 480);
        this.video.hide();

        const options = {
            maxFaces: 1,
            refineLandmarks: true,
            flipped: true
        };

        this.faceMesh = await ml5.facemesh(this.video, options);
        this.faceMesh.on('predict', (results) => {
            this.faces = results;
        });

        await Tone.start();
        this.initialized = true;
        this.gameStartTime = Date.now();
        this.gameEnded = false;
        this.startWordGeneration();
    }

    startWordGeneration() {
        setInterval(() => {
            if (!this.gameEnded && this.fallingWords.length < this.maxWords) {
                this.addNewWord();
            }
        }, 1000);
    }

    addNewWord() {
        const words = [
            'MUSIC', 'SOUND', 'RHYTHM', 'MELODY', 'HARMONY',
            'BEAT', 'TEMPO', 'SONG', 'DANCE', 'VOICE',
            'DRUM', 'BASS', 'PIANO', 'SYNTH', 'JAZZ',
            'ROCK', 'POP', 'FOLK', 'BLUES', 'OPERA',
            'RAP', 'SOUL', 'FUNK', 'DISCO', 'METAL','mad','kill','flower',
            'head','class','nothing', 'else', 'thanks', 'everything','man'
        ];
        
        const word = {
            text: words[Math.floor(Math.random() * words.length)],
            x: Math.random() * (this.p5Instance.width - 100) + 50,
            y: -20,
            speed: 2 + Math.random() * 4,
            size: 20 + Math.floor(Math.random() * 30),
            color: this.wordColors[Math.floor(Math.random() * this.wordColors.length)],
            caught: false
        };
        this.fallingWords.push(word);
    }

    playSound() {
        const note = this.notes[this.currentNoteIndex];
        this.synth.triggerAttackRelease(note, '8n');
        this.currentNoteIndex = (this.currentNoteIndex + 1) % this.notes.length;
    }

    checkCollision(faceX, faceY, word) {
        const currentTime = Date.now();
        if (currentTime - this.lastCatchTime < this.catchCooldown) return false;
        const distance = this.p5Instance.dist(faceX, faceY, word.x, word.y);
        return distance < 50;
    }

    draw(p) {
        if (this.gameEnded) {
            this.showGameEndScreen(p);
            return;
        }

        const timeElapsed = Date.now() - this.gameStartTime;
        if (timeElapsed >= this.gameLength) {
            this.gameEnded = true;
            return;
        }

        p.background(20);

        p.push();
        p.translate(p.width, 0);
        p.scale(-1, 1);
        p.image(this.video, 0, 0, p.width, p.height);
        p.pop();

        if (this.faces.length > 0) {
            const face = this.faces[0];
            const forehead = face.scaledMesh[6];
            const foreheadX = p.width - forehead[0];
            
            p.fill(0, 255, 0);
            p.noStroke();
            p.circle(foreheadX, forehead[1], 10);

            this.handleFallingWords(p, foreheadX, forehead[1]);
        }

        // Draw score and timer
        p.fill(0, 0, 0, 180);
        p.noStroke();
        p.rect(20, p.height - 70, 300, 50, 10);
        p.fill(255);
        p.textSize(32);
        p.textAlign(p.LEFT, p.CENTER);
        const timeLeft = Math.ceil((this.gameLength - timeElapsed) / 1000);
        p.text(`Score: ${this.score} | Time: ${timeLeft}s`, 30, p.height - 45);
    }

    showGameEndScreen(p) {
        p.background(0, 0, 0, 200);
        
        // Draw end game popup
        p.fill(0, 0, 0, 230);
        p.noStroke();
        const boxWidth = 400;
        const boxHeight = 200;
        p.rect(p.width/2 - boxWidth/2, p.height/2 - boxHeight/2, boxWidth, boxHeight, 20);
        
        // Draw text
        p.fill(255);
        p.textSize(40);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Game Over!', p.width/2, p.height/2 - 40);
        p.textSize(32);
        p.text(`Final Score: ${this.score}`, p.width/2, p.height/2 + 20);
    }

    handleFallingWords(p, x, y) {
        this.fallingWords = this.fallingWords.filter(word => {
            if (word.caught) return false;
            if (word.y > p.height) return false;

            word.y += word.speed;

            if (this.checkCollision(x, y, word)) {
                this.score += 10;
                this.playSound();
                this.lastCatchTime = Date.now();
                return false;
            }

            p.fill(word.color[0], word.color[1], word.color[2]);
            p.textSize(word.size);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(word.text, word.x, word.y);
            return true;
        });
    }

    cleanup() {
        if (this.video) {
            this.video.remove();
            this.video = null;
        }
        
        if (this.faceMesh) {
            this.faceMesh.removeAllListeners();
            this.faceMesh = null;
        }
        
        if (this.synth) {
            this.synth.dispose();
            this.synth = null;
        }
        
        this.score = 0;
        this.fallingWords = [];
        this.initialized = false;
        this.gameStartTime = null;
        this.gameEnded = false;
    }
}