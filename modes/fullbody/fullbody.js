class FullBodyMode {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        console.log('Initializing Full Body Mode');
        this.initialized = true;
    }

    draw(p) {
        p.background(220);
        p.fill(0);
        p.textSize(32);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Full Body Mode Active', p.width/2, p.height/2);
    }

    cleanup() {
        this.initialized = false;
        console.log('Cleaning up Full Body Mode');
    }
}