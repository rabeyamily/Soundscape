class VoiceCommands {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.speechSynthesis = window.speechSynthesis;
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
            //console.log('Voice recognition started');
            this.isListening = true;
        };

        this.recognition.onend = () => {
            //console.log('Voice recognition ended');
            // Restart if still supposed to be listening
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
            //console.log('Voice command received:', command);
            if (callback) callback(command);
        };

        this.isListening = true;
        this.recognition.start();
        this.speak('Voice commands activated');
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