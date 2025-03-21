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
    const config = {
        starCount: 100,                   // Number of stars
        starSize: { min: 1, max: 3 },     // Size range for stars
        starColor: 'rgba(255, 255, 255, 0.8)',
        lineColor: 'rgba(255, 255, 255, 0.2)',
        connectionDistance: 90,           // set maximum distance for connections
        minConnectionDistance: 70,        // set Minimum distance for connections
        maxConnections: 3,                // Maximum connections per star
        movementSpeed: 1,                 // Base speed of star movement
        attractionFactor: 0.1,           // How strongly stars are attracted to cursor
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
    function calculateConnections() {
        connections = [];
        
        // Reset connection count
        stars.forEach(star => {
            star.connections = 0;
        });
        
        // Find connections
        for (let i = 0; i < stars.length; i++) {
            if (stars[i].connections >= config.maxConnections) continue;
            
            // Store potential connections for this star
            const potentialConnections = [];
            
            for (let j = 0; j < stars.length; j++) {
                if (i === j) continue; // Skip self
                if (stars[j].connections >= config.maxConnections) continue;
                
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check both minimum and maximum distance constraints
                if (distance >= config.minConnectionDistance && distance < config.connectionDistance) {
                    potentialConnections.push([j, distance]);
                }
            }
            
            // Sort by distance (prefer closer connections)
            potentialConnections.sort((a, b) => a[1] - b[1]);
            
            // Take only the closest connections up to max
            const connectionCount = Math.min(potentialConnections.length, config.maxConnections - stars[i].connections);
            for (let k = 0; k < connectionCount; k++) {
                const j = potentialConnections[k][0];
                const distance = potentialConnections[k][1];
                
                if (stars[j].connections < config.maxConnections) {
                    connections.push([i, j, distance]);
                    stars[i].connections++;
                    stars[j].connections++;
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
        ctx.strokeStyle = config.lineColor;
        ctx.lineWidth = 1;
        
        connections.forEach(connection => {
            const star1 = stars[connection[0]];
            const star2 = stars[connection[1]];
            const distance = connection[2];
            
            // Fade lines based on distance
            const opacity = Math.max(0.1, 0.2 * (1 - (distance - config.minConnectionDistance) / (config.connectionDistance - config.minConnectionDistance)));
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
            
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
        
        // Draw cursor influence circle (for debugging, can be removed)
        /*
        if (mouse.x !== null && mouse.y !== null) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
            ctx.stroke();
        }
        */
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