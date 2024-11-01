from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_text():
    text = request.json.get('text', '')
    # For now, just return the text back as is
    return jsonify({'result': text})

if __name__ == '__main__':
    app.run(debug=True)
