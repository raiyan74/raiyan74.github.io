// Global configuration variables for the floating stars
const config = {

    //stars
    starCount: 150,                 // Number of stars
    starSize: { min: 1, max: 4 },   // Size range for stars
    starColor: 'rgba(255, 255, 255, 0.8)', // Color of the stars
    movementSpeed: 0.5,            // Base speed of star movement
    
    //lines
    connectionDistance: 100,       // Maximum distance for stars to connect with a line
    lineColor: 'rgba(255, 255, 255, 1)', // Color of the connection lines (slightly transparent white)
    sizeChangeSpeed: 0.01,         // Speed at which stars change size (smaller is slower)
    sizeHoldDuration: 100          // Number of frames to hold size at 0
};

// Array to hold all the star objects
let stars = [];

// Canvas and context variables
let canvas;
let ctx;

// Star class/constructor
class Star {
    constructor() {
        // Initialize star properties
        this.targetSize = Math.random() * (config.starSize.max - config.starSize.min) + config.starSize.min;
        this.currentSize = Math.random() * this.targetSize; // Start at a random size between 0 and target
        this.sizeDirection = 1; // 1 for increasing, -1 for decreasing, 0 for holding

        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Random velocity based on global movementSpeed
        this.vx = (Math.random() - 0.5) * config.movementSpeed;
        this.vy = (Math.random() - 0.5) * config.movementSpeed;

        this.sizeHoldTimer = 0; // Timer for holding size at 0
    }

    // Method to draw the star
    draw() {
        // Draw using the current size
        if (this.currentSize > 0) { // Only draw if size is greater than 0
            ctx.fillStyle = config.starColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Method to update the star's position and size
    update() {
        // Move the star
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Update star size
        if (this.sizeDirection === 1) {
            // Increasing size
            this.currentSize += config.sizeChangeSpeed;
            if (this.currentSize >= this.targetSize) {
                this.currentSize = this.targetSize; // Cap at target size
                this.sizeDirection = -1; // Start decreasing
            }
        } else if (this.sizeDirection === -1) {
            // Decreasing size
            this.currentSize -= config.sizeChangeSpeed;
            if (this.currentSize <= config.starSize.min) { // Change condition to use min size
                this.currentSize = config.starSize.min; // Cap at min size
                this.sizeDirection = 0; // Start holding at min size
                this.sizeHoldTimer = config.sizeHoldDuration; // Initialize hold timer
            }
        } else if (this.sizeDirection === 0) {
            // Holding at size 0
            this.sizeHoldTimer--;
            if (this.sizeHoldTimer <= 0) {
                this.sizeDirection = 1; // Start increasing again
                // Reset target size for next cycle
                this.targetSize = Math.random() * (config.starSize.max - config.starSize.min) + config.starSize.min;
            }
        }
    }
}

// Function to initialize the canvas and stars
function initBackground() {
    canvas = document.getElementById('background');
    ctx = canvas.getContext('2d');

    // Set canvas dimensions and scale for high DPI screens
    resizeCanvas();

    // Create the specified number of stars
    stars = []; // Clear existing stars on re-initialization
    for (let i = 0; i < config.starCount; i++) {
        stars.push(new Star());
    }

    // Start the animation loop
    animate();
}

// Function to resize the canvas
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    // Scale the context to match the DPI
    ctx.scale(dpr, dpr);
}

// Function to draw connections between nearby stars
function drawConnections() {
    ctx.lineWidth = 1; // Set line thickness

    // Iterate through all pairs of stars
    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const star1 = stars[i];
            const star2 = stars[j];

            // Calculate the distance between the two stars
            const dx = star1.x - star2.x;
            const dy = star1.y - star2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If the distance is within the connection threshold and both stars are visible, draw a line
            if (distance < config.connectionDistance && star1.currentSize > 0 && star2.currentSize > 0) {
                // Calculate opacity based on distance (closer stars have more opaque lines)
                const distanceOpacity = 1 - (distance / config.connectionDistance);

                // Calculate opacity based on average current size relative to max size
                const maxPossibleSize = config.starSize.max;
                const averageCurrentSize = (star1.currentSize + star2.currentSize) / 2;
                const sizeOpacity = averageCurrentSize / maxPossibleSize;

                // Combine opacities (e.g., multiply them)
                const combinedOpacity = distanceOpacity * sizeOpacity;


                ctx.strokeStyle = `rgba(255, 255, 255, ${combinedOpacity * 1})`; // Apply combined opacity to line color

                ctx.beginPath();
                ctx.moveTo(star1.x, star1.y);
                ctx.lineTo(star2.x, star2.y);
                ctx.stroke();
            }
        }
    }
}


// Function to draw all stars and connections
function drawBackground() {
    // Clear the canvas
    ctx.fillStyle = '#0f0f23'; // Use the same background color as your CSS
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections first
    drawConnections();

    // Draw each star
    stars.forEach(star => {
        star.draw();
    });
}

// Function to update all star positions and sizes
function updateStars() {
    stars.forEach(star => {
        star.update();
    });
}

// Animation loop
function animate() {
    updateStars();     // Update positions and sizes
    drawBackground();  // Draw everything (connections and stars)
    // Request the next frame
    requestAnimationFrame(animate);
}

// Event listener for window resize
window.addEventListener('resize', resizeCanvas); // Only resize, initBackground will be called on DOMContentLoaded

// Initialize the background when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initBackground);