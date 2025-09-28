from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
from werkzeug.utils import secure_filename
import base64

try:
    import mutagen
    from mutagen import File as MutagenFile
    MUTAGEN_AVAILABLE = True
except ImportError:
    MUTAGEN_AVAILABLE = False
    print("Warning: mutagen not available. Metadata extraction will be limited.")

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/music'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_metadata(filepath):
    """Extract metadata from audio file"""
    if not MUTAGEN_AVAILABLE:
        return None
        
    try:
        audio_file = MutagenFile(filepath)
        if audio_file is None:
            return None
        
        metadata = {
            'title': None,
            'artist': None,
            'album': None,
            'duration': None,
            'artwork': None
        }
        
        # Try different tag formats
        title_tags = ['TIT2', 'TITLE', '\xa9nam']
        artist_tags = ['TPE1', 'ARTIST', '\xa9ART']
        album_tags = ['TALB', 'ALBUM', '\xa9alb']
        
        for tag in title_tags:
            if tag in audio_file and audio_file[tag]:
                metadata['title'] = str(audio_file[tag][0]) if isinstance(audio_file[tag], list) else str(audio_file[tag])
                break
                
        for tag in artist_tags:
            if tag in audio_file and audio_file[tag]:
                metadata['artist'] = str(audio_file[tag][0]) if isinstance(audio_file[tag], list) else str(audio_file[tag])
                break
                
        for tag in album_tags:
            if tag in audio_file and audio_file[tag]:
                metadata['album'] = str(audio_file[tag][0]) if isinstance(audio_file[tag], list) else str(audio_file[tag])
                break
        
        # Duration
        if hasattr(audio_file, 'info') and hasattr(audio_file.info, 'length'):
            metadata['duration'] = int(audio_file.info.length)
        
        try:
            if hasattr(audio_file, 'tags') and audio_file.tags:
                for key in audio_file.tags.keys():
                    if 'APIC' in key or 'covr' in key:
                        artwork_tag = audio_file.tags[key]
                        if hasattr(artwork_tag, 'data') and artwork_tag.data:
                            artwork_data = base64.b64encode(artwork_tag.data).decode('utf-8')
                            metadata['artwork'] = f"data:image/jpeg;base64,{artwork_data}"
                            break
        except:
            pass  # Artwork extraction failed, continue without it
        
        return metadata
    except Exception as e:
        print(f"Error extracting metadata from {filepath}: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs')
def get_songs():
    """Get all songs in the music directory"""
    songs = []
    music_dir = app.config['UPLOAD_FOLDER']
    
    if os.path.exists(music_dir):
        for filename in os.listdir(music_dir):
            if allowed_file(filename):
                filepath = os.path.join(music_dir, filename)
                metadata = extract_metadata(filepath)
                
                song = {
                    'id': len(songs) + 1,
                    'filename': filename,
                    'title': metadata['title'] if metadata and metadata['title'] else os.path.splitext(filename)[0],
                    'artist': metadata['artist'] if metadata and metadata['artist'] else 'Artista desconocido',
                    'album': metadata['album'] if metadata and metadata['album'] else None,
                    'duration': metadata['duration'] if metadata and metadata['duration'] else None,
                    'artwork': metadata['artwork'] if metadata and metadata['artwork'] else None
                }
                songs.append(song)
    
    return jsonify(songs)

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Upload music files"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    uploaded_files = []
    
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Handle duplicate filenames
            counter = 1
            base_name, ext = os.path.splitext(filename)
            while os.path.exists(filepath):
                filename = f"{base_name}_{counter}{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                counter += 1
            
            file.save(filepath)
            uploaded_files.append(filename)
    
    return jsonify({
        'message': f'Successfully uploaded {len(uploaded_files)} files',
        'files': uploaded_files
    })

@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_song(filename):
    """Delete a music file"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'message': f'Successfully deleted {filename}'})
        else:
            return jsonify({'error': 'File not found'}), 404
            
    except Exception as e:
        return jsonify({'error': f'Error deleting file: {str(e)}'}), 500

@app.route('/static/music/<filename>')
def serve_music(filename):
    """Serve music files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
