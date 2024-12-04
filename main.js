let currentMode = null;
let p5Canvas = null;
let modeInstance = null;

function initializeModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const backButton = document.getElementById('back-btn');
    
    modeButtons.forEach(button => {
        button.addEventListener('click', async function() {
            try {
                await Tone.start();
                const mode = this.getAttribute('data-mode');
                
                if (mode === 'face') {
                    document.getElementById('face-instructions-modal').classList.remove('hidden');
                    
                    document.getElementById('start-face-game').addEventListener('click', () => {
                        document.getElementById('face-instructions-modal').classList.add('hidden');
                        modeInstance = new FaceMode();
                        switchToCanvasView('face');
                    });
                } else if (mode === 'hand') {
                    document.getElementById('hand-instructions-modal').classList.remove('hidden');
                    
                    document.getElementById('start-hand-game').addEventListener('click', () => {
                        document.getElementById('hand-instructions-modal').classList.add('hidden');
                        modeInstance = new HandMode();
                        switchToCanvasView('hand');
                    });
                } else {
                    switchToCanvasView(mode);
                }
            } catch (error) {
                console.error('Error starting audio context:', error);
            }
        });
    });

    backButton.addEventListener('click', () => {
        switchToModeSelection();
    });
}

function switchToCanvasView(mode) {
    currentMode = mode;
    
    switch(mode) {
        case 'hand':
            modeInstance = new HandMode();
            break;
        case 'face':
            if (!modeInstance) {
                modeInstance = new FaceMode();
            }
            break;
    }
    
    document.getElementById('instruction-page').classList.add('hidden');
    document.getElementById('canvas-page').classList.remove('hidden');
    createP5Canvas();
}

function createP5Canvas() {
    if (p5Canvas) {
        p5Canvas.remove();
    }

    p5Canvas = new p5((p) => {
        p.setup = async () => {
            const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
            canvas.parent('canvas-container');
            
            try {
                if (modeInstance) {
                    await modeInstance.init(p);
                }
            } catch (error) {
                console.error('Setup error:', error);
                showCameraPermissionPrompt();
            }
        };

        p.draw = () => {
            if (modeInstance && modeInstance.initialized && !modeInstance.initializationError) {
                modeInstance.draw(p);
            }
        };

        p.windowResized = () => {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
    });
}

function showCameraPermissionPrompt() {
    const permissionDiv = document.createElement('div');
    permissionDiv.className = 'camera-permission';
    permissionDiv.innerHTML = `
        <p>Please allow camera access to use this mode</p>
        <button onclick="location.reload()">Retry</button>
    `;
    document.body.appendChild(permissionDiv);
}

function switchToModeSelection() {
    if (modeInstance) {
        modeInstance.cleanup();
        modeInstance = null;
    }
    
    if (p5Canvas) {
        p5Canvas.remove();
        p5Canvas = null;
    }
    
    document.getElementById('canvas-page').classList.add('hidden');
    document.getElementById('face-instructions-modal').classList.add('hidden');
    document.getElementById('hand-instructions-modal').classList.add('hidden');
    document.getElementById('instruction-page').classList.remove('hidden');
    currentMode = null;
}

document.addEventListener('DOMContentLoaded', () => {
    // Show splash screen for 3 seconds
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        splashScreen.style.opacity = '0';
        splashScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            document.getElementById('instruction-page').style.display = 'flex';
        }, 500);
    }, 3000);
    initializeModeSelection();
    
    document.addEventListener('click', async () => {
        if (Tone.context.state !== 'running') {
            try {
                await Tone.start();
            } catch (error) {
                console.error('Error starting audio context:', error);
            }
        }
    });
});