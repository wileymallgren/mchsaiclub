window.onload = function () {
    const clubName = document.getElementById('clubName');
    const text = clubName.innerText;
    clubName.innerHTML = ''; // Clear the existing text

    // Split the text into individual letters and wrap each one in a span, skipping spaces
    for (let letter of text) {
        if (letter !== ' ') { // Skip spaces
            const span = document.createElement('span');
            span.textContent = letter;
            clubName.appendChild(span);
        } else {
            clubName.innerHTML += ' '; // Directly add spaces to the HTML
        }
    }

    // Define an array of colors for the animation
    const colors = ['#89b4fa','#cdd6f4']

    let colorIndex = 0;
    let letterIndex = 0;

    // Function to change colors sequentially
    function changeColors() {
        const letters = clubName.getElementsByTagName('span');

        // Change the color of each letter sequentially
        for (let i = 0; i <= letterIndex; i++) {
            letters[i].style.transition = 'color 1s ease'; // Smooth transition
            letters[i].style.color = colors[colorIndex % colors.length];
        }

        // Move to the next letter and color
        letterIndex++;

        // If we've changed the color for all letters, reset and start from the beginning
        if (letterIndex === letters.length) {
            letterIndex = 0;
            colorIndex++; // Change to the next color for the next loop
        }
    }

    setInterval(changeColors, 150);
};
