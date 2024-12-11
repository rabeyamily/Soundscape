document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', async function() {
        if (this.textContent.toLowerCase() === 'face') {
            document.getElementById('mode-selection').style.display = 'none';
            document.getElementById('face-mode').style.display = 'block';
            await setup(); // Wait for camera initialization
        }
    });
});
