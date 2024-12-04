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
                switchToCanvasView(mode);
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
            modeInstance = new FaceMode();
            break;
        case 'fullbody':
            modeInstance = new FullBodyMode();
            break;
    }
    
    document.getElementById('mode-selection-page').classList.add('hidden');
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
                p.background(220);
                p.fill(255, 0, 0);
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Please allow camera access and refresh the page', p.width/2, p.height/2);
            }
        };

        p.draw = () => {
            if (modeInstance && !modeInstance.initializationError) {
                modeInstance.draw(p);
            }
        };

        p.windowResized = () => {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
    });
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
    document.getElementById('mode-selection-page').classList.remove('hidden');
    currentMode = null;
}

// Single DOMContentLoaded event listener
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
    
    // Add start button handler
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('instruction-page').style.display = 'none';
        document.getElementById('mode-selection-page').style.display = 'flex';
    });

    // Initially hide mode selection page
    document.getElementById('mode-selection-page').style.display = 'none';
    
    // Global audio context handler
    document.addEventListener('click', async () => {
        if (Tone.context.state !== 'running') {
            try {
                await Tone.start();
            } catch (error) {
                console.error('Error starting audio context:', error);
            }
        }
    });
    // Add back to instructions button handler
    document.getElementById('back-to-instructions').addEventListener('click', () => {
        document.getElementById('mode-selection-page').style.display = 'none';
        document.getElementById('instruction-page').style.display = 'flex';
    });
});
