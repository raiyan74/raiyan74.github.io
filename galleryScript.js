document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.querySelector('.photo-gallery');
    const items = gallery.querySelectorAll('.photo-item');

    // Set the row height based on your grid-auto-rows value in CSS
    const rowHeight = 10; // This should match grid-auto-rows in galleryStyle.css

    function resizeGridItem(item) {
        const grid = item.closest('.photo-gallery');
        const rowGap = parseFloat(window.getComputedStyle(grid).getPropertyValue('row-gap')); // Get dynamic row gap
        const itemContent = item.querySelector('img, iframe'); // Assuming img or iframe inside
        if (itemContent) {
            // Ensure the content is loaded to get its true height
            if (itemContent.complete || itemContent.readyState === 'complete') {
                const itemHeight = itemContent.offsetHeight;
                const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap)); // Calculate span
                item.style.gridRowEnd = `span ${rowSpan}`;
            } else {
                // If image is not loaded, wait for it
                itemContent.onload = () => {
                    const itemHeight = itemContent.offsetHeight;
                    const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap));
                    item.style.gridRowEnd = `span ${rowSpan}`;
                };
            }
        }
    }

    // Apply to all items
    items.forEach(resizeGridItem);

    // Re-calculate on window resize (debounced for performance)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            items.forEach(resizeGridItem);
        }, 250); // Debounce to avoid excessive calculations
    });
});