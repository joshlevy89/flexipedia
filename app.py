# app.py
from flask import Flask, request, jsonify, render_template
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/')
def index():
    return render_template('index.html')

# We'll keep this endpoint for future GPT transformations
@app.route('/process', methods=['POST'])
@limiter.limit("1 per second")
def process_text():
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)