import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__, static_folder='.')
CORS(app)

# Database connection function
def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get('PGHOST'),
        database=os.environ.get('PGDATABASE'),
        user=os.environ.get('PGUSER'),
        password=os.environ.get('PGPASSWORD'),
        port=os.environ.get('PGPORT')
    )
    return conn

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create contacts table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create visitors table for name tracking
    cur.execute('''
        CREATE TABLE IF NOT EXISTS visitors (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address INET
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# API endpoint to submit contact form
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'dob', 'gender', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Insert into database
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO contacts (name, email, phone, date_of_birth, gender, message)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (data['name'], data['email'], data['phone'], data['dob'], data['gender'], data['message']))
        
        result = cur.fetchone()
        contact_id = result[0] if result else None
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully!',
            'id': contact_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoint to save visitor name
@app.route('/api/visitor', methods=['POST'])
def save_visitor():
    try:
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        # Get visitor IP
        ip_address = request.remote_addr
        
        # Insert into database
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO visitors (name, ip_address)
            VALUES (%s, %s)
            RETURNING id
        ''', (name, ip_address))
        
        result = cur.fetchone()
        visitor_id = result[0] if result else None
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Visitor information saved!',
            'id': visitor_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoint to get contact submissions (for admin purposes)
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute('''
            SELECT id, name, email, phone, date_of_birth, gender, message, submitted_at
            FROM contacts
            ORDER BY submitted_at DESC
            LIMIT 50
        ''')
        
        contacts = cur.fetchall()
        cur.close()
        conn.close()
        
        # Convert datetime objects to strings for JSON serialization
        for contact in contacts:
            contact['submitted_at'] = contact['submitted_at'].isoformat()
            if contact['date_of_birth']:
                contact['date_of_birth'] = contact['date_of_birth'].isoformat()
        
        return jsonify({
            'success': True,
            'contacts': contacts
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoint to get visitor statistics
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get total contacts
        cur.execute('SELECT COUNT(*) FROM contacts')
        result = cur.fetchone()
        total_contacts = result[0] if result else 0
        
        # Get total visitors
        cur.execute('SELECT COUNT(*) FROM visitors')
        result = cur.fetchone()
        total_visitors = result[0] if result else 0
        
        # Get recent contacts (last 7 days)
        cur.execute('''
            SELECT COUNT(*) FROM contacts 
            WHERE submitted_at >= NOW() - INTERVAL '7 days'
        ''')
        result = cur.fetchone()
        recent_contacts = result[0] if result else 0
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_contacts': total_contacts,
                'total_visitors': total_visitors,
                'recent_contacts': recent_contacts
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT 1')
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)