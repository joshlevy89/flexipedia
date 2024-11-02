from flask import Flask, request, jsonify, render_template
import requests
import os
import json

app = Flask(__name__)
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

def transform_to_narrative(text, title):
    
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",  
        "content-type": "application/json",
    }
    
    prompt = f"""Transform the article below into something very narratively compelling but reasonably concise.
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
                "system": "Your job is to take the text from Wikipedia articles and transform them in some way. Just output the transformed text, don't include a preamble like 'Here is...'.",
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
            # print("Response:", response.text)
            return None
            
        response_data = response.json()
        
        # print("Successful response:", response_data)  # Debug logging
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

    if not text or not title:
        print("Missing text or title")  # Debug log
        return jsonify({'error': 'Missing text or title'}), 400
        
    narrative = transform_to_narrative(text, title)
    if narrative:
        return jsonify({
            'success': True,
            'narrative': narrative
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Failed to transform text - check server logs for details'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)