//modes/hand/handTracking.js
class HandTracking {
    constructor(p5Instance) {
        this.p = p5Instance;
        this.handpose = null;
        this.predictions = [];
        this.video = null;
        this.modelReady = false;
        
        // Voice commands
        this.voiceCommands = new VoiceCommands();
        this.voiceEnabled = false;
    
        // Gesture recognition
        this.currentGesture = null;
        this.gestureHistory = [];
        this.lastGestureTime = 0;
        this.gestureThreshold = 500;
        
        // Performance optimization
        this.frameCount = 0;
        this.processingEveryNFrames = 2;
        this.lastProcessedPredictions = [];
        
        // Status tracking
        this.trackingStatus = 'initializing';
        this.lastTrackingTime = Date.now();
        this.trackingTimeout = 1000;
        
        // Sound synthesis
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.2,
                release: 0.5
            },
            volume: 30
        }).toDestination();
    
        this.notes = {
            'open_palm': 'E3',
            'fist': 'G3',
            'peace': 'A3',
            'point': 'B3',
            'thumbs_up': 'C4',
            'thumbs_down': 'D4',
            'three': 'E4',
            'four': 'G4',
            'rock_on': 'A4',
            'unknown': 'C3'
        };
    
        // Initialize hand controls for two hands
        this.handControls = [
            {
                volume: { current: -10, min: -40, max: 20 },
                pitch: { current: 0, min: -12, max: 12 }
            },
            {
                volume: { current: -10, min: -40, max: 20 },
                pitch: { current: 0, min: -12, max: 12 }
            }
        ];
    
        // Tracking state for both hands
        this.lastPlayedGestures = [null, null];
        this.soundEnabled = false;
    
        // Particle system
        this.particleSystem = new ParticleSystem(p5Instance);
        
        // Gesture colors
        this.gestureColors = {
            'open_palm': [0, 255, 0],
            'fist': [255, 0, 0],
            'peace': [0, 255, 255],
            'point': [255, 255, 0],
            'thumbs_up': [255, 165, 0],
            'thumbs_down': [255, 0, 255],
            'three': [128, 0, 255],
            'four': [0, 128, 255],
            'rock_on': [255, 0, 128],
            'unknown': [128, 128, 128]
        };
    }

    async init() {
        try {
            this.video = this.p.createCapture({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: "user"
                }
            });
            this.video.size(640, 480);
            this.video.hide();

            //console.log('Loading handpose model...');
            this.handpose = await ml5.handpose(this.video, {
                flipHorizontal: false,
                maxContinuousChecks: 100,
                detectionConfidence: 0.8,
                trackingConfidence: 0.8,
                maxHands: 2 
            }, () => {
                //console.log('Handpose model loaded!');
                this.modelReady = true;
            });

            this.handpose.on('predict', results => {
                this.predictions = results;
                this.checkTrackingStatus();
            });

            // Initialize audio and voice
            await this.initAudio();
            await this.initVoiceCommands();
            await this.initVoiceCallbacks();

        } catch (error) {
            console.error('Error in HandTracking init:', error);
            throw error;
        }
    }

    async initAudio() {
        try {
            await Tone.start();
            this.soundEnabled = true;
            // Set initial volume
            this.synth.volume.value = 14; // approximately 5 times louder in dB
            //console.log('Audio initialized');
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }

    async initVoiceCallbacks() {
        if (!this.voiceEnabled) return;
        
        const callbacks = {
            'start tracking': () => {
                this.modelReady = true;
                this.speak('Hand tracking started');
            },
            'stop tracking': () => {
                this.modelReady = false;
                this.speak('Hand tracking stopped');
            },
            'sound on': () => {
                this.soundEnabled = true;
                this.speak('Sound enabled');
            },
            'sound off': () => {
                this.soundEnabled = false;
                this.speak('Sound disabled');
            },
            'go back': () => {
                this.speak('Going back to mode selection');
                document.getElementById('back-btn').click();
            },
            'volume up': () => {
                this.volumeControl.current = Math.min(this.volumeControl.current + 5, this.volumeControl.max);
                this.synth.volume.value = this.volumeControl.current;
                this.speak('Volume increased');
            },
            'volume down': () => {
                this.volumeControl.current = Math.max(this.volumeControl.current - 5, this.volumeControl.min);
                this.synth.volume.value = this.volumeControl.current;
                this.speak('Volume decreased');
            }
        };
    
        // Add callbacks to voice commands
        Object.entries(callbacks).forEach(([command, callback]) => {
            if (this.voiceCommands && typeof this.voiceCommands.addCallback === 'function') {
                this.voiceCommands.addCallback(command, callback);
            }
        });
    }
    
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }


    async initVoiceCommands() {
        this.voiceEnabled = this.voiceCommands.init();
        
        if (this.voiceEnabled) {
            this.voiceCommands.start((command) => {
                //console.log('Processing command:', command);
                
                // Handle different voice commands
                if (command.includes('start sound')) {
                    this.soundEnabled = true;
                    this.voiceCommands.speak('Sound enabled');
                }
                else if (command.includes('stop sound')) {
                    this.soundEnabled = false;
                    this.voiceCommands.speak('Sound disabled');
                }
                else if (command.includes('volume up')) {
                    this.volumeControl.current = Math.min(this.volumeControl.current + 5, this.volumeControl.max);
                    this.synth.volume.value = this.volumeControl.current;
                    this.voiceCommands.speak('Volume increased');
                }
                else if (command.includes('volume down')) {
                    this.volumeControl.current = Math.max(this.volumeControl.current - 5, this.volumeControl.min);
                    this.synth.volume.value = this.volumeControl.current;
                    this.voiceCommands.speak('Volume decreased');
                }
                else if (command.includes('go back')) {
                    this.voiceCommands.speak('Going back');
                    document.getElementById('back-btn').click();
                }
            });
        }
    }

    updateVolumeFromHandPosition(landmarks, handIndex) {
        if (!landmarks || landmarks.length === 0) return;
        
        const palmY = landmarks[0][1];
        const normalizedHeight = 1 - (palmY / this.video.height);
        
        // Use the handControls array with the correct index
        this.handControls[handIndex || 0].volume.current = this.p.map(
            normalizedHeight,
            0,
            1,
            this.handControls[handIndex || 0].volume.min,
            this.handControls[handIndex || 0].volume.max
        );
        
        this.synth.volume.value = this.handControls[handIndex || 0].volume.current;
    }

    updatePitchFromHandPosition(landmarks, handIndex) {
        if (!landmarks || landmarks.length === 0) return;
        
        const palmX = landmarks[0][0];
        const normalizedX = palmX / this.video.width;
        
        // Use the handControls array with the correct index
        this.handControls[handIndex || 0].pitch.current = this.p.map(
            normalizedX,
            0,
            1,
            this.handControls[handIndex || 0].pitch.min,
            this.handControls[handIndex || 0].pitch.max
        );
        
        this.synth.set({
            detune: this.handControls[handIndex || 0].pitch.current * 100
        });
    } 
    
    playGestureSound(gesture, handIndex) {
        if (!this.soundEnabled || !gesture) return;
        
        // Check if lastPlayedGestures exists
        if (!this.lastPlayedGestures) {
            this.lastPlayedGestures = [null, null];
        }
    
        if (gesture !== this.lastPlayedGestures[handIndex || 0]) {
            const note = this.notes[gesture || 'unknown'];
            if (note) {
                const pitchOffset = (handIndex || 0) * 12;
                const adjustedNote = Tone.Frequency(note).transpose(pitchOffset).toNote();
                this.synth.triggerAttackRelease(adjustedNote, "8n");
                this.lastPlayedGestures[handIndex || 0] = gesture;
            }
        }
    }


    detectGesture(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;

        const currentTime = Date.now();
        if (currentTime - this.lastGestureTime < this.gestureThreshold) {
            return this.currentGesture;
        }

        // Get finger states (extended or not)
        const fingerStates = this.getFingerStates(landmarks);
        
        // Identify gesture
        let gesture = this.identifyGesture(fingerStates);
        
        if (gesture !== this.currentGesture) {
            this.gestureHistory.push({
                gesture: gesture,
                timestamp: currentTime
            });
            this.currentGesture = gesture;
            this.lastGestureTime = currentTime;
        }

        return gesture;
    }

    getFingerStates(landmarks) {
        // Define finger joint indices
        const fingerTips = [4, 8, 12, 16, 20];  // Thumb, Index, Middle, Ring, Pinky tips
        const fingerBases = [2, 5, 9, 13, 17];  // Corresponding bases/knuckles
        const fingerMids = [3, 7, 11, 15, 19];  // Middle joints
    
        const states = [];
    
        // Check each finger
        for (let i = 0; i < 5; i++) {
            if (i === 0) {
                // Special case for thumb
                const tipY = landmarks[fingerTips[i]][1];
                const baseY = landmarks[fingerBases[i]][1];
                // For thumb, check if it's pointing up or down
                states.push({
                    isExtended: Math.abs(tipY - baseY) > 30,
                    direction: tipY < baseY ? 'up' : 'down'
                });
            } else {
                // For other fingers, compare y positions
                const tipY = landmarks[fingerTips[i]][1];
                const midY = landmarks[fingerMids[i]][1];
                const baseY = landmarks[fingerBases[i]][1];
                
                states.push({
                    isExtended: tipY < midY && tipY < baseY,
                    direction: 'neutral'
                });
            }
        }
        return states;
    }
    
    identifyGesture(fingerStates) {
        // Extract basic states
        const fingersExtended = fingerStates.map(state => state.isExtended);
        const thumbDirection = fingerStates[0].direction;
    
        // Thumbs up: only thumb up, others closed
        if (fingersExtended[0] && !fingersExtended[1] && !fingersExtended[2] && 
            !fingersExtended[3] && !fingersExtended[4] && thumbDirection === 'up') {
            return 'thumbs_up';
        }
    
        // Thumbs down: only thumb up (but pointing down), others closed
        if (fingersExtended[0] && !fingersExtended[1] && !fingersExtended[2] && 
            !fingersExtended[3] && !fingersExtended[4] && thumbDirection === 'down') {
            return 'thumbs_down';
        }
    
        // Open Palm: all fingers extended
        if (fingersExtended.every(state => state)) {
            return 'open_palm';
        }
    
        // Fist: all fingers closed
        if (fingersExtended.every(state => !state)) {
            return 'fist';
        }
    
        // Peace: index and middle up, others down
        if (!fingersExtended[0] && fingersExtended[1] && fingersExtended[2] && 
            !fingersExtended[3] && !fingersExtended[4]) {
            return 'peace';
        }
    
        // Point: only index up
        if (!fingersExtended[0] && fingersExtended[1] && !fingersExtended[2] && 
            !fingersExtended[3] && !fingersExtended[4]) {
            return 'point';
        }
    
        // Three: middle three fingers up
        if (!fingersExtended[0] && fingersExtended[1] && fingersExtended[2] && 
            fingersExtended[3] && !fingersExtended[4]) {
            return 'three';
        }
    
        // Four: all fingers except thumb
        if (!fingersExtended[0] && fingersExtended[1] && fingersExtended[2] && 
            fingersExtended[3] && fingersExtended[4]) {
            return 'four';
        }
    
        // Rock on: index and pinky up
        if (!fingersExtended[0] && fingersExtended[1] && !fingersExtended[2] && 
            !fingersExtended[3] && fingersExtended[4]) {
            return 'rock_on';
        }
    
        return 'unknown';
    }
    
    
    checkTrackingStatus() {
        const currentTime = Date.now();
        
        if (this.predictions.length > 0) {
            this.trackingStatus = 'tracking';
            this.lastTrackingTime = currentTime;
        } else if (currentTime - this.lastTrackingTime > this.trackingTimeout) {
            this.trackingStatus = 'no_hand';
        }
    }

    drawHand() {
        if (!this.modelReady) return;
        this.frameCount++;
        if (this.frameCount % this.processingEveryNFrames === 0) {
            this.lastProcessedPredictions = this.predictions;
        }

        // Calculate scaling factors for full screen
        const scaleX = this.p.width / this.video.width;
        const scaleY = this.p.height / this.video.height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate centered position for the video
        const videoWidth = this.video.width * scale;
        const videoHeight = this.video.height * scale;
        const xOffset = (this.p.width - videoWidth) / 2;
        const yOffset = (this.p.height - videoHeight) / 2;

        // Draw video
        this.p.push();
        this.p.translate(this.p.width, 0);
        this.p.scale(-1, 1);
        this.p.image(this.video, xOffset, yOffset, videoWidth, videoHeight);
        this.p.pop();

        // Draw keypoints for each hand
        this.lastProcessedPredictions.forEach((hand, index) => {
            if (!hand || !hand.landmarks) return;
            
            const gesture = this.detectGesture(hand.landmarks);
            if (gesture) {
                this.updateVolumeFromHandPosition(hand.landmarks, index);
                this.updatePitchFromHandPosition(hand.landmarks, index);
                this.playGestureSound(gesture, index);

                // Add particles
                const palmX = hand.landmarks[0][0] * scale + xOffset;
                const palmY = hand.landmarks[0][1] * scale + yOffset;
                const color = this.gestureColors[gesture || 'unknown'];
                this.particleSystem.addParticles(palmX, palmY, color, 20);
            }
        
        // // Draw keypoints for each hand
        // this.lastProcessedPredictions.forEach((hand, index) => {
        //     // Detect gesture for this hand
        //     this.currentGesture = this.detectGesture(hand.landmarks);
        //     this.updateVolumeFromHandPosition(hand.landmarks, index);
        //     this.updatePitchFromHandPosition(hand.landmarks, index);  
        //     this.playGestureSound(this.currentGesture, index);
            
        //     // Add particles at palm position when gesture changes
        //     if (this.currentGesture !== this.lastPlayedGesture) {
        //         const palmX = hand.landmarks[0][0] * scale + xOffset;
        //         const palmY = hand.landmarks[0][1] * scale + yOffset;
        //         const color = this.gestureColors[this.currentGesture || 'unknown'];
        //         this.particleSystem.addParticles(palmX, palmY, color, 20);
        //     }

            // Draw hand skeleton
            this.p.push();
            this.p.translate(this.p.width, 0);
            this.p.scale(-1, 1);

            // Draw connections 
            this.p.stroke(0, 255, 0);
            this.p.strokeWeight(2);

            // Draw fingers
            const fingers = [
                [0, 1, 2, 3, 4],        // thumb
                [0, 5, 6, 7, 8],        // index
                [0, 9, 10, 11, 12],     // middle
                [0, 13, 14, 15, 16],    // ring
                [0, 17, 18, 19, 20]     // pinky
            ];

            for (let finger of fingers) {
                for (let i = 0; i < finger.length - 1; i++) {
                    const x1 = hand.landmarks[finger[i]][0] * scale + xOffset;
                    const y1 = hand.landmarks[finger[i]][1] * scale + yOffset;
                    const x2 = hand.landmarks[finger[i + 1]][0] * scale + xOffset;
                    const y2 = hand.landmarks[finger[i + 1]][1] * scale + yOffset;
                    
                    this.p.line(x1, y1, x2, y2);
                }
            }

            // Draw landmarks
            for (let point of hand.landmarks) {
                this.p.fill(0, 255, 0);
                this.p.noStroke();
                this.p.circle(
                    point[0] * scale + xOffset,
                    point[1] * scale + yOffset,
                    10
                );
            }

            this.p.pop();
        });

        // Update and draw particles
        this.particleSystem.update();
        this.particleSystem.draw();
        
        // Display status and gesture
        this.displayStatus();
    }


    displayStatus() {
        this.p.fill(0, 0, 0, 80);
        this.p.rect(10, this.p.height - 80, 300, 60, 10);
        this.p.textSize(20);
        this.p.textAlign(this.p.LEFT, this.p.TOP);
        
        let statusColor;
        let gestureText = '';
        switch (this.trackingStatus) {
            case 'initializing':
                statusColor = this.p.color(255, 255, 0);
                gestureText = 'Initializing hand tracking...';
                break;
            case 'tracking':
                statusColor = this.p.color(0, 255, 0);
                gestureText = `Gesture: ${this.currentGesture || 'unknown'}`;
                break;
            case 'no_hand':
                statusColor = this.p.color(255, 0, 0);
                gestureText = 'No hand detected';
                break;
        }
    
        this.p.fill(statusColor);
        this.p.text(gestureText, 20, this.p.height - 60);
    
        if (this.trackingStatus === 'tracking') {
            this.p.textSize(16);
            this.p.fill(255);
            
            // Display sound status
            const soundStatus = this.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
            this.p.text(soundStatus, this.p.width - 120, 30);
            
            // Use handControls array for volume and pitch display
            const volumeText = `Volume: ${Math.round(this.handControls[0].volume.current)}dB`;
            this.p.text(volumeText, this.p.width - 150, 60);
            
            const pitchText = `Pitch: ${Math.round(this.handControls[0].pitch.current)} semitones`;
            this.p.text(pitchText, this.p.width - 200, 90);
            
            const voiceStatus = this.voiceEnabled ? 'Voice: ON' : 'Voice: OFF';
            this.p.text(voiceStatus, this.p.width - 120, 120);
        }
    }


    cleanup() {
        if (this.video) {
            this.video.remove();
        }
        if (this.handpose) {
            this.handpose = null;
        }
        if (this.synth) {
            this.synth.dispose();
        }
        if (this.voiceCommands) {
            this.voiceCommands.cleanup();
        }
        
        // Reset all states
        this.voiceEnabled = false;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.modelReady = false;
        this.currentGesture = null;
        this.gestureHistory = [];
        this.trackingStatus = 'initializing';
        this.soundEnabled = false;
        this.lastPlayedGestures = [null, null];
        
        // Reset hand controls
        this.handControls = [
            {
                volume: { current: -10, min: -40, max: 20 },
                pitch: { current: 0, min: -12, max: 12 }
            },
            {
                volume: { current: -10, min: -40, max: 20 },
                pitch: { current: 0, min: -12, max: 12 }
            }
        ];
    }
}