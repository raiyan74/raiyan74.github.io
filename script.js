// Create constellation background animation with cursor attraction
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Stars and connections
    let stars = [];
    let connections = [];
    
    // Mouse position tracking
    let mouse = {
        x: null,
        y: null,
        radius: 150  // Radius of influence around the cursor
    };
    
    // Configuration
    // Update the config object to simplify connection settings
    const config = {
        starCount: 100,                   // Number of stars
        starSize: { min: 1, max: 3 },     // Size range for stars
        starColor: 'rgba(255, 255, 255, 0.8)',
        lineColor: 'rgba(255, 255, 255, 0.2)',
        connectionDistance: 100,          // Fixed connection distance of 100px

        cursorRandomFactor: 0.5,           // How much randomness to add when cursor is active
        connectionRandomness: true,        // Enable/disable connection randomness
        randomConnectionThreshold: 150,    // Distance from cursor to activate randomness

        movementSpeed: 1,                 // Base speed of star movement
        attractionFactor: 0.1,            // How strongly stars are attracted to cursor
        repulsionDistance: 30,            // Distance at which stars start to be repulsed
        maxAttractionDistance: 300,       // Maximum distance for cursor attraction
        velocityDamping: 0.95,            // Damping factor to gradually slow stars after scatter
        returnToBaseSpeed: 2              // Speed at which stars return to their base velocity after scattering
    };
    
    // Create a star
    function createStar() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * (config.starSize.max - config.starSize.min) + config.starSize.min,
            vx: (Math.random() - 0.5) * config.movementSpeed,
            vy: (Math.random() - 0.5) * config.movementSpeed,
            baseVx: (Math.random() - 0.5) * config.movementSpeed, // Store original velocity
            baseVy: (Math.random() - 0.5) * config.movementSpeed, // Store original velocity
            connections: 0
        };
    }
    
    // Initialize stars
    function initStars() {
        stars = [];
        for (let i = 0; i < config.starCount; i++) {
            stars.push(createStar());
        }
    }
    
    // Calculate connections between stars
    // Modify the calculateConnections function to remove connections near cursor
    function calculateConnections() {
        connections = [];
        
        // Check if cursor is on screen
        const cursorActive = mouse.x !== null && mouse.y !== null;
        
        // Check all pairs of stars
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Skip connecting stars near the cursor
                if (cursorActive) {
                    // Check if either star is near the cursor
                    const d1ToCursor = Math.sqrt(Math.pow(stars[i].x - mouse.x, 2) + Math.pow(stars[i].y - mouse.y, 2));
                    const d2ToCursor = Math.sqrt(Math.pow(stars[j].x - mouse.x, 2) + Math.pow(stars[j].y - mouse.y, 2));
                    
                    // If either star is under cursor influence, don't draw the connection
                    if (d1ToCursor < mouse.radius || d2ToCursor < mouse.radius) {
                        continue; // Skip this pair entirely
                    }
                }
                
                // Connect if within the connection distance (and not near cursor)
                if (distance < config.connectionDistance) {
                    connections.push([i, j, distance]);
                }
            }
        }
    }
    
    // Draw stars and connections
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#0f0f23'; // Dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        
        connections.forEach(connection => {
            const star1 = stars[connection[0]];
            const star2 = stars[connection[1]];
            const distance = connection[2];
            
            // Calculate base opacity
            let opacity = 0.2 * (1 - distance / config.connectionDistance);
            
            // Add subtle pulsing effect to lines affected by cursor
            if (mouse.x !== null && mouse.y !== null) {
                const d1ToCursor = Math.sqrt(Math.pow(star1.x - mouse.x, 2) + Math.pow(star1.y - mouse.y, 2));
                const d2ToCursor = Math.sqrt(Math.pow(star2.x - mouse.x, 2) + Math.pow(star2.y - mouse.y, 2));
                
                if (d1ToCursor < config.randomConnectionThreshold || d2ToCursor < config.randomConnectionThreshold) {
                    // Add subtle pulsing to affected connections
                    opacity *= 0.7 + 0.3 * Math.sin(Date.now() / 300 + connection[0] * connection[1]);
                }
            }
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            
            // Draw the line
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.stroke();
        });
            
        // Draw stars
        ctx.fillStyle = config.starColor;
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        
    }
    
    // Update star positions with cursor attraction
    function updateStars() {
        stars.forEach(star => {
            // Apply damping to gradually slow down stars after scattering
            star.vx *= config.velocityDamping;
            star.vy *= config.velocityDamping;
            
            // Gradually return to base velocity
            star.vx += (star.baseVx - star.vx) * config.returnToBaseSpeed;
            star.vy += (star.baseVy - star.vy) * config.returnToBaseSpeed;
            
            // Apply cursor attraction if mouse is on screen
            if (mouse.x !== null && mouse.y !== null) {
                // Calculate distance from star to cursor
                const dx = mouse.x - star.x;
                const dy = mouse.y - star.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Apply attraction only within the maximum attraction distance
                if (distance < config.maxAttractionDistance) {
                    // Calculate attraction strength based on distance
                    // Closer = stronger attraction, but avoid division by zero
                    let attractionStrength = config.attractionFactor * (1 - distance / config.maxAttractionDistance);
                    
                    // Apply repulsion if too close to cursor
                    if (distance < config.repulsionDistance) {
                        attractionStrength = -attractionStrength * 2; // Stronger repulsion
                    }
                    
                    // Apply attraction/repulsion force
                    star.vx += dx * attractionStrength;
                    star.vy += dy * attractionStrength;
                }
            }
            
            // Move star
            star.x += star.vx;
            star.y += star.vy;
            
            // Wrap around edges
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            if (star.y < 0) star.y = canvas.height;
            if (star.y > canvas.height) star.y = 0;
        });
    }
    
    // Animation loop
    function animate() {
        updateStars();
        calculateConnections(); // Calculate connections every frame for smoother experience
        draw();
        requestAnimationFrame(animate);
    }
    
    // Track mouse position
    window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });
    
    // Handle mouse leaving the window
    window.addEventListener('mouseout', function() {
        mouse.x = null;
        mouse.y = null;
    });
    
    // Handle click to scatter stars
    window.addEventListener('click', function(event) {
        // Scatter all stars with random velocities
        stars.forEach(star => {
            // Calculate direction from click point
            const dx = star.x - event.x;
            const dy = star.y - event.y;
            
            // Add strong outward velocity
            const scatterStrength = 5 + Math.random() * 5; // Randomize scatter strength
            const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
            
            // Set new velocity (stronger for closer stars)
            const strength = scatterStrength * (1 - Math.min(distance, 300) / 300);
            star.vx = (dx / distance) * strength + (Math.random() - 0.5) * 2;
            star.vy = (dy / distance) * strength + (Math.random() - 0.5) * 2;
            
            // Save these as the new base velocities (they'll gradually return to normal movement)
            star.baseVx = (Math.random() - 0.5) * config.movementSpeed;
            star.baseVy = (Math.random() - 0.5) * config.movementSpeed;
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        resizeCanvas();
        initStars();
        calculateConnections();
    });
    
    // Initialize animation
    resizeCanvas();
    initStars();
    calculateConnections();
    animate();
});