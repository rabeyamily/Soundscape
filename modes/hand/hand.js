//modes/hand/hand.js
class HandMode {
    constructor() {
        this.initialized = false;
        this.handTracking = null;
        this.initializationError = null;
        this.p5Instance = null;
    }

    async init(p) {
        if (this.initialized) return;
        
        //console.log('Initializing Hand Mode');
        try {
            this.p5Instance = p;
            this.handTracking = new HandTracking(p);
            await this.handTracking.init();
            this.initialized = true;
        } catch (error) {
            this.initializationError = error;
            console.error('Failed to initialize hand mode:', error);
            throw error;
        }
    }

    draw(p) {
        p.background(220);

        if (this.initializationError) {
            p.fill(255, 0, 0);
            p.textSize(24);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Error initializing hand tracking. Please refresh and try again.', p.width/2, p.height/2);
            return;
        }

        if (!this.initialized) {
            p.fill(0);
            p.textSize(32);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Initializing Hand Tracking...', p.width/2, p.height/2);
            return;
        }

        if (this.handTracking) {
            this.handTracking.drawHand();
        }
    }

    cleanup() {
        if (this.handTracking) {
            this.handTracking.cleanup();
        }
        this.initialized = false;
        this.initializationError = null;
    }
}