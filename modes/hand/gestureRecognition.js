class GestureRecognition {
    constructor() {
        this.currentGestures = [null, null];
        this.gestureHistory = [];
        this.lastGestureTime = [0, 0];
        this.gestureThreshold = 500; // ms between gesture updates
    }

  

    detectGesture(landmarks, handIndex) {
        if (!landmarks || landmarks.length === 0) return null;
        const currentTime = Date.now();
        
        if (currentTime - this.lastGestureTime[handIndex] < this.gestureThreshold) {
            return this.currentGestures[handIndex];
        }
    
        const fingerStates = this.getFingerStates(landmarks);
        let gesture = this.identifyGesture(fingerStates);
        
        if (gesture !== this.currentGestures[handIndex]) {
            this.gestureHistory.push({
                gesture: gesture,
                handIndex: handIndex,
                timestamp: currentTime
            });
            this.currentGestures[handIndex] = gesture;
            this.lastGestureTime[handIndex] = currentTime;
        }
        
        return gesture;
    }
    
    getFingerStates(landmarks) {
        const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
        const fingerBases = [6, 10, 14, 18];
        const states = [];

        for (let i = 0; i < fingerTips.length; i++) {
            const tipY = landmarks[fingerTips[i]][1];
            const baseY = landmarks[fingerBases[i]][1];
            states.push(tipY < baseY);
        }

        // Special check for thumb
        const thumbTipX = landmarks[4][0];
        const thumbBaseX = landmarks[2][0];
        states.unshift(thumbTipX < thumbBaseX);

        return states;
    }

    identifyGesture(fingerStates) {
        // All fingers extended
        if (fingerStates.every(state => state)) {
            return 'open_palm';
        }
        
        // All fingers closed
        if (fingerStates.every(state => !state)) {
            return 'fist';
        }
        
        // Peace sign
        if (!fingerStates[0] && fingerStates[1] && fingerStates[2] && 
            !fingerStates[3] && !fingerStates[4]) {
            return 'peace';
        }
        
        // Pointing
        if (!fingerStates[0] && fingerStates[1] && 
            !fingerStates[2] && !fingerStates[3] && !fingerStates[4]) {
            return 'pointing';
        }

        return 'unknown';
    }
}