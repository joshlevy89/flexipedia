from flask import Flask, request, jsonify, render_template
import requests
import os
import json

app = Flask(__name__)
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

def transform_text(text, title, transform_type):
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    
    prompts = {
        "narrative": "Transform the article below into something very narratively compelling but reasonably concise.",
        "simple": "Rewrite the article below using basic english words and shorter sentences.",
        "highlights": "Extract 3-5 of the most important and interesting facts from the article below. Format each fact as a bullet point starting with '- '. Present them in a clear list.",
        "kidFriendly": "Rewrite the article below in a fun, engaging way that would be perfect for children to understand, while keeping it educational."
    }
    
    prompt = f"""{prompts.get(transform_type, prompts['narrative'])}
Original text:
{text}"""
    
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1000,
                "temperature": 0,
                "system": "Your job is to take the text from Wikipedia articles and transform them in some way.",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
        )
        
        if response.status_code != 200:
            print(f"API Error: Status {response.status_code}")
            return None
            
        response_data = response.json()
        return response_data['content'][0]['text']
        
    except Exception as e:
        print(f"Error calling Claude API: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_text():
    data = request.get_json()
    title = data.get('title')
    text = data.get('text')
    transform_type = data.get('transformType', 'narrative')

    if not text or not title:
        print("Missing text or title")
        return jsonify({'error': 'Missing text or title'}), 400
        
    transformed_text = transform_text(text, title, transform_type)
    if transformed_text:
        return jsonify({
            'success': True,
            'transformed': transformed_text
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Failed to transform text - check server logs for details'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)