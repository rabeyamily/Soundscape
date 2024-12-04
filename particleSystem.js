class ParticleSystem {
    constructor(p5Instance) {
        this.p = p5Instance;
        this.particles = [];  // Array to hold all active particles
    }

    // Creates new particles at the specified position
    addParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.p, x, y, color));
        }
    }

    // Updates all particles' positions and removes dead ones
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    // Draws all particles
    draw() {
        for (let particle of this.particles) {
            particle.draw();
        }
    }
}

class Particle {
    constructor(p5Instance, x, y, color) {
        this.p = p5Instance;
        this.pos = this.p.createVector(x, y);  // Starting position
        this.vel = this.p.createVector(        // Random velocity
            this.p.random(-2, 2),
            this.p.random(-2, 2)
        );
        this.acc = this.p.createVector(0, 0.1);  // Gravity
        this.life = 255;                         // Lifespan (opacity)
        this.color = color;                      // Particle color
    }

    // Updates particle position and life
    update() {
        this.vel.add(this.acc);    // Apply acceleration
        this.pos.add(this.vel);    // Move particle
        this.life -= 5;            // Reduce lifespan
    }

    // Draws the particle
    draw() {
        this.p.noStroke();
        this.p.fill(this.color[0], this.color[1], this.color[2], this.life);
        this.p.circle(this.pos.x, this.pos.y, 8);
    }

    // Checks if particle should be removed
    isDead() {
        return this.life <= 0;
    }
}