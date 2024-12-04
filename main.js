let currentMode = null;
let p5Canvas = null;
let modeInstance = null;
let voiceCommands = null;

function initializeModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const backButton = document.getElementById('back-btn');
    const voiceToggle = document.getElementById('voice-control-toggle');
    
    voiceCommands = new VoiceCommands();
    
    voiceToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            voiceCommands.init();
            voiceCommands.start((command) => {
                if (command.includes('hand mode')) {
                    document.querySelector('[data-mode="hand"]').click();
                } else if (command.includes('face mode')) {
                    document.querySelector('[data-mode="face"]').click();
                } else if (command.includes('start game')) {
                    const startButton = document.querySelector('#start-hand-game') || 
                                     document.querySelector('#start-face-game');
                    if (startButton) startButton.click();
                } else if (command.includes('go back')) {
                    backButton.click();
                }
            });
        } else {
            voiceCommands.cleanup();
        }
    });
    
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

// document.addEventListener('DOMContentLoaded', () => {
//     setTimeout(() => {
//         const splashScreen = document.getElementById('splash-screen');
//         splashScreen.style.opacity = '0';
//         splashScreen.style.transition = 'opacity 0.5s ease';
//         setTimeout(() => {
//             splashScreen.style.display = 'none';
//             document.getElementById('instruction-page').style.display = 'flex';
//         }, 500);
//     }, 1000);
    
//     initializeModeSelection();
    
//     document.addEventListener('click', async () => {
//         if (Tone.context.state !== 'running') {
//             try {
//                 await Tone.start();
//             } catch (error) {
//                 console.error('Error starting audio context:', error);
//             }
//         }
//     });
// });

// document.addEventListener('DOMContentLoaded', () => {
//     const voiceCommands = new VoiceCommands();
    
//     setTimeout(() => {
//         const splashScreen = document.getElementById('splash-screen');
//         splashScreen.style.opacity = '0';
//         splashScreen.style.transition = 'opacity 0.5s ease';
//         setTimeout(() => {
//             splashScreen.style.display = 'none';
//             document.getElementById('instruction-page').style.display = 'flex';
            
//             voiceCommands.speak('Welcome to SoundScape! If you want to continue with voice commands, say enable voice control');
            
//             voiceCommands.init();
//             voiceCommands.start((command) => {
//                 if (command.includes('enable voice control')) {
//                     document.getElementById('voice-control-toggle').checked = true;
//                     voiceCommands.speak('Voice control enabled. You can now use voice commands to control the application');
//                 }
//             });
//         }, 500);
//     }, 1500);
    
//     // Add these lines back
//     initializeModeSelection();
    
//     document.addEventListener('click', async () => {
//         if (Tone.context.state !== 'running') {
//             try {
//                 await Tone.start();
//             } catch (error) {
//                 console.error('Error starting audio context:', error);
//             }
//         }
//     });
// });

document.addEventListener('DOMContentLoaded', () => {
    voiceCommands = new VoiceCommands(); // Initialize voice commands instance

    // Show splash screen, then transition to the instruction page
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        splashScreen.style.opacity = '0';
        splashScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            document.getElementById('instruction-page').style.display = 'flex';
            
            // Greet the user with a welcome message
            voiceCommands.speak('Welcome to SoundScape!');
            
            // Prompt the user to enable voice commands
            setTimeout(() => {
                voiceCommands.speak('Say "enable voice control" to use voice commands');
                
                // Start listening for the command to enable voice control
                voiceCommands.start((command) => {
                    if (command.includes('enable voice control')) {
                        document.getElementById('voice-control-toggle').checked = true;
                        voiceCommands.speak('Voice control enabled. You can now use voice commands');
                    }
                });
            }, 3000); // Wait 3 seconds after the welcome message
        }, 500);
    }, 1500);

    // Initialize mode selection
    initializeModeSelection();
});
