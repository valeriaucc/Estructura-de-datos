import os
from werkzeug.utils import secure_filename

class FileService:
    def __init__(self, upload_folder="uploads", allowed_extensions={"mp3"}):
        self.upload_folder = upload_folder
        self.allowed_extensions = allowed_extensions

        # Crear carpeta si no existe
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

    def allowedFile(self, filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in self.allowed_extensions

    def saveFile(self, file):
        if file and self.allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(self.upload_folder, filename)
            file.save(file_path)
            return file_path
        else:
            raise ValueError("Archivo no permitido. Solo se aceptan MP3.")
