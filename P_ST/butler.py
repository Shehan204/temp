from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
from datetime import datetime, timedelta
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_URL = 'http://localhost:11434/api/generate'
MODEL_NAME = 'mindtales'
PORT = 3000

# Rate limiting
rate_limit_store = defaultdict(lambda: {'count': 0, 'reset_time': datetime.now()})
RATE_LIMIT_WINDOW = timedelta(minutes=1)
RATE_LIMIT_MAX = 10

def is_rate_limited(client_ip):
    now = datetime.now()
    client_data = rate_limit_store[client_ip]

    if now > client_data['reset_time']:
        client_data['count'] = 0
        client_data['reset_time'] = now + RATE_LIMIT_WINDOW

    if client_data['count'] >= RATE_LIMIT_MAX:
        return True

    client_data['count'] += 1
    return False

def filter_content(text):
    inappropriate_patterns = [
        r'\b(violence|weapon|kill|death|scary|nightmare|monster)\b',
        r'\b(adult|mature|inappropriate)\b'
    ]
    for pattern in inappropriate_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False
    return True

def clean_story_output(text):
    # Remove repetitive patterns
    cleaned = re.sub(r'(.{10,}?)\1{2,}', r'\1', text, flags=re.IGNORECASE)

    # Remove incomplete sentences at the end
    sentences = re.split(r'[.!?]+', cleaned)
    if len(sentences) > 1 and len(sentences[-1].strip()) < 10:
        sentences.pop()
        cleaned = '. '.join(sentences) + '.'

    # Ensure proper capitalization
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]

    # Add "The End" if not present
    if 'The End' not in cleaned and 'THE END' not in cleaned:
        cleaned += ' The End.'

    return cleaned.strip()

@app.route('/health', methods=['GET'])
def health():
    try:
        requests.get('http://localhost:11434')
        return jsonify({'status': 'healthy', 'model': MODEL_NAME})
    except:
        return jsonify({'status': 'unhealthy', 'error': 'Ollama is not reachable'}), 503

@app.route('/api/generate-story', methods=['POST'])
def generate_story():
    client_ip = request.remote_addr
    if is_rate_limited(client_ip):
        return jsonify({'error': 'Too many requests. Please wait before generating another story.'}), 429

    data = request.json
    prompt = data.get('prompt', '').strip() if data else ''

    if not prompt or not isinstance(prompt, str):
        return jsonify({'error': 'Prompt is required and must be a string'}), 400

    #if len(prompt) > 200:
        #return jsonify({'error': 'Prompt is too long. Please keep it under 200 characters.'}), 400

    if not filter_content(prompt):
        return jsonify({'error': 'Please use appropriate content for children\'s stories.'}), 400

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                'model': MODEL_NAME,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.9,
                    'top_p': 0.95,
                    'top_k': 50,
                    'repeat_penalty': 1.15,
                    'num_predict': 120,
                    'stop': ['<|endoftext|>', '\n\n', 'THE END', 'The End']
                }
            },
            timeout=30
        )
        response.raise_for_status()
        raw_story = response.json().get('response', '')

        if not filter_content(raw_story):
            return jsonify({'error': 'Generated content was inappropriate. Please try a different prompt.'}), 400

        cleaned_story = clean_story_output(raw_story)

        return jsonify({
            'story': cleaned_story,
            'metadata': {
                'prompt': prompt,
                'timestamp': datetime.now().isoformat(),
                'wordCount': len(cleaned_story.split())
            }
        })

    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'AI service is not available. Please make sure Ollama is running.'}), 503
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({'error': f"Model '{MODEL_NAME}' not found. Please check if the model is loaded in Ollama."}), 404
        return jsonify({'error': 'Failed to generate story. Please try again.'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    try:
        response = requests.get('http://localhost:11434/api/tags')
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': 'Could not fetch available models'}), 503

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Something went wrong!'}), 500

if __name__ == '__main__':
    print(f"Story Generator API running on http://localhost:{PORT}")
    print(f"Using Ollama model: {MODEL_NAME}")
    print('\nAPI Endpoints:')
    print('POST /api/generate-story - Generate a children\'s story')
    print('GET  /api/models - Get available models')
    print('GET  /health - Health check')
    app.run(port=PORT)
