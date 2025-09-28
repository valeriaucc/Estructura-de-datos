from flask import Blueprint, request, jsonify
from models.PlayList import PlayList
from models.Song import Song
from services.FileService import FileService

playlist_bp = Blueprint("playlist", __name__)
playlist = PlayList()
file_service = FileService()

# Subir canción desde la PC y agregar a la playlist
@playlist_bp.route("/uploadSong", methods=["POST"])
def uploadSong():
    if "file" not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400

    file = request.files["file"]
    title = request.form.get("title")
    artist = request.form.get("artist")

    try:
        filePath = file_service.save_file(file)
        newSong = Song(title, artist, filePath)
        playlist.addSongEnd(newSong)
        return jsonify({
            "message": "Canción subida y agregada",
            "song": {"title": title, "artist": artist, "path": filePath}
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


# Listar canciones
@playlist_bp.route("/listSongs", methods=["GET"])
def listSongs():
    songs = []
    current = playlist.home
    while current:
        songs.append({
            "title": current.song.title,
            "artist": current.song.artist,
            "path": current.song.path
        })
        current = current.next

    return jsonify({"songs": songs, "length": playlist.length}), 200


# Siguiente canción
@playlist_bp.route("/skipSong", methods=["GET"])
def skipSong():
    if playlist.currentSong is None:
        return jsonify({"error": "No hay canción actual"}), 400

    playlist.skipSong()
    if playlist.currentSong:
        return jsonify({
            "message": "Canción siguiente",
            "current": {
                "title": playlist.currentSong.song.title,
                "artist": playlist.currentSong.song.artist
            }
        }), 200
    return jsonify({"error": "No hay siguiente canción"}), 400


# Canción anterior
@playlist_bp.route("/goBackSong", methods=["GET"])
def goBackSong():
    if playlist.currentSong is None:
        return jsonify({"error": "No hay canción actual"}), 400

    playlist.goBackSong()
    if playlist.currentSong:
        return jsonify({
            "message": "Canción anterior",
            "current": {
                "title": playlist.currentSong.song.title,
                "artist": playlist.currentSong.song.artist
            }
        }), 200
    return jsonify({"error": "No hay canción anterior"}), 400
