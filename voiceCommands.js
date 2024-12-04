class VoiceCommands {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.speechSynthesis = window.speechSynthesis;
        this.globalCommands = {
            'hand mode': () => this.selectMode('hand'),
            'face mode': () => this.selectMode('face'),
            'read instructions': () => this.readInstructions(),
            'start game': () => this.startGame(),
            'go back': () => this.goBack(),
            'sound on': () => this.toggleSound(true),
            'sound off': () => this.toggleSound(false),
            'voice on': () => this.toggleVoice(true),
            'voice off': () => this.toggleVoice(false),
            'volume up': () => this.adjustVolume('up'),
            'volume down': () => this.adjustVolume('down')
        };
    }

    init() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return false;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
        };

        return true;
    }

    start(callback) {
        if (!this.recognition) return;
        
        this.recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            if (this.globalCommands[command]) {
                this.globalCommands[command]();
            } else if (callback) {
                callback(command);
            }
        };

        this.isListening = true;
        this.recognition.start();
        this.speak('Voice commands activated');
    }

    selectMode(mode) {
        const modeBtn = document.querySelector(`[data-mode="${mode}"]`);
        if (modeBtn) {
            modeBtn.click();
            this.speak(`${mode} mode selected`);
        }
    }

    readInstructions() {
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            this.speak(instructions.textContent);
        }
    }

    startGame() {
        const startBtn = document.querySelector('#start-hand-game') || 
                        document.querySelector('#start-face-game');
        if (startBtn) {
            startBtn.click();
            this.speak('Starting game');
        }
    }

    goBack() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.click();
            this.speak('Going back');
        }
    }

    toggleSound(state) {
        if (typeof window.soundEnabled !== 'undefined') {
            window.soundEnabled = state;
            this.speak(state ? 'Sound enabled' : 'Sound disabled');
        }
    }

    toggleVoice(state) {
        if (typeof window.voiceEnabled !== 'undefined') {
            window.voiceEnabled = state;
            this.speak(state ? 'Voice control enabled' : 'Voice control disabled');
        }
    }

    adjustVolume(direction) {
        const volumeChange = direction === 'up' ? 5 : -5;
        if (window.synth && window.synth.volume) {
            window.synth.volume.value += volumeChange;
            this.speak(`Volume ${direction}`);
        }
    }

    stop() {
        if (!this.recognition) return;
        
        this.isListening = false;
        this.recognition.stop();
        this.speak('Voice commands deactivated');
    }

    speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        this.speechSynthesis.speak(utterance);
    }

    cleanup() {
        if (this.recognition) {
            this.stop();
            this.recognition = null;
        }
    }
}