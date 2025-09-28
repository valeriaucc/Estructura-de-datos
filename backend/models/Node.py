from .Song import Song

class Node:
    def __init__(self, song: Song):
        self.song = song
        self.next = None
        self.prev = None

