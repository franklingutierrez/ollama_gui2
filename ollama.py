from flask import Flask, request, Response, send_from_directory
import requests
import json

app = Flask(__name__)

OLLAMA_URL = 'http://127.0.0.1:11434/api/generate'


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')


@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')


@app.route('/ask', methods=['POST'])
def ask_ollama():
    data = request.get_json()
    question = data.get('question')
    model = data.get('model')

    payload = {
        "model": model,
        "prompt": question
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, stream=True)
        response.raise_for_status()

        def generate():
            for chunk in response.iter_lines():
                if chunk:
                    yield chunk.decode('utf-8') + '\n'

        return Response(generate(), content_type='text/plain')

    except requests.exceptions.RequestException as e:
        return jsonify({'answer': f'Error communicating with Ollama: {e}'})


if __name__ == '__main__':
    app.run(debug=True)
