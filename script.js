document.getElementById('sendButton').addEventListener('click', function() {
    const userInput = document.getElementById('userInput').value;
    const selectedModel = document.getElementById('modelSelect').value;

    if (userInput.trim() === '') {
        return;
    }

    // Add user input to the output box
    const outputBox = document.getElementById('output');
    const userParagraph = document.createElement('p');
    userParagraph.className = 'user-text';
    userParagraph.textContent = 'You: ' + userInput;
    outputBox.appendChild(userParagraph);

    // Create a paragraph for Ollama's response
    const ollamaParagraph = document.createElement('p');
    ollamaParagraph.className = 'ollama-text';
    outputBox.appendChild(ollamaParagraph);

    // Call the Python backend (assuming a Flask server running locally)
    fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userInput, model: selectedModel })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let result = '';

        function read() {
            return reader.read().then(({ done, value }) => {
                if (done) {
                    return;
                }
                const chunk = decoder.decode(value, { stream: true });
                // Split response by newlines to parse individual JSON objects
                const parts = chunk.split('\n').filter(part => part.trim() !== '');
                parts.forEach(part => {
                    try {
                        const json = JSON.parse(part);
                        if (json.response) {
                            result += json.response;
                            ollamaParagraph.textContent = result;
                            outputBox.scrollTop = outputBox.scrollHeight;
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                });
                return read();
            });
        }

        return read();
    })
    .catch(error => {
        console.error('Error:', error);
        const errorParagraph = document.createElement('p');
        errorParagraph.className = 'error-text';
        errorParagraph.textContent = 'Error: Could not reach the server.';
        outputBox.appendChild(errorParagraph);
    });

    document.getElementById('userInput').value = '';
});
