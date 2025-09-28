from .Node import Node

class PlayList:
    def __init__(self):
        self.home = None
        self.end = None
        self.length = 0
        self.currentSong = None

    def addSongEnd(self, song):
        newSong = Node(song)
        if self.home is None:
            self.home = newSong
            self.end = newSong
            self.currentSong = newSong
        else:
            newSong.prev = self.end
            self.end.next = newSong
            self.end = newSong
        self.length += 1

    def addSongStart(self, song):
        newSong = Node(song)
        if self.home is None:
            self.home = newSong
            self.end = newSong
            self.currentSong = newSong
        else:
            newSong.next = self.home
            self.home.prev = newSong
            self.home = newSong
        self.length += 1

    def deleteSong(self, title):
        deleteSong = self.home
        while deleteSong is not None:
            if deleteSong.song.title == title:
                if deleteSong.prev:
                    deleteSong.prev.next = deleteSong.next
                if deleteSong.next:
                    deleteSong.next.prev = deleteSong.prev
                if deleteSong == self.home:  
                    self.home = deleteSong.next
                if deleteSong == self.end:  
                    self.end = deleteSong.prev
                if deleteSong == self.currentSong:  
                    self.currentSong = deleteSong.next if deleteSong.next else deleteSong.prev
                self.length -= 1
                return True  
            deleteSong = deleteSong.next

    def skipSong(self):
        if self.currentSong and self.currentSong.next:
            self.currentSong = self.currentSong.next
            return self.currentSong.song
        return None

    def goBackSong(self):
        if self.currentSong and self.currentSong.prev:
            self.currentSong = self.currentSong.prev
            return self.currentSong.song
        return None

    def current(self):
        if self.currentSong:
            return self.currentSong.song
        return None
    
    def iterate(self):
        current = self.home
        while current:
            yield current
            current = current.next
