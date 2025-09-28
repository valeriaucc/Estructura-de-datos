class Song:
    def __init__(self, title, file, artist=None, album=None, duration=None, gender=None):
        self.title = title
        self.file = file              # 👈 aquí guardamos el archivo real (ej: "cancion1.mp3")
        self.artist = artist
        self.album = album
        self.duration = duration
        self.gender = gender
        self.rute = "static/music/"
