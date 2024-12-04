class FaceMode {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        console.log('Initializing Face Mode');
        this.initialized = true;
    }

    draw(p) {
        p.background(220);
        p.fill(0);
        p.textSize(32);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Face Mode Active', p.width/2, p.height/2);
    }

    cleanup() {
        this.initialized = false;
        console.log('Cleaning up Face Mode');
    }
}