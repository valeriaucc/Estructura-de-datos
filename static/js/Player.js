class MusicPlayer {
  constructor() {
    this.audio = document.getElementById("audioPlayer")
    this.currentSong = null
    this.playlist = []
    this.filteredPlaylist = []
    this.currentIndex = 0
    this.isPlaying = false
    this.isShuffled = false
    this.repeatMode = "none"
    this.playlists = JSON.parse(localStorage.getItem("playlists")) || []
    this.currentView = "home"
    this.currentPlaylistView = null

    this.initializeElements()
    this.bindEvents()
    this.loadPlaylist()
    this.initializeDragAndDrop()

    this.setVolume()
  }

  initializeElements() {
    // Player controls
    this.playBtn = document.getElementById("playBtn")
    this.prevBtn = document.getElementById("prevBtn")
    this.nextBtn = document.getElementById("nextBtn")
    this.shuffleBtn = document.getElementById("shuffleBtn")
    this.repeatBtn = document.getElementById("repeatBtn")

    // Progress and volume
    this.progressSlider = document.getElementById("progressSlider")
    this.volumeSlider = document.getElementById("volumeSlider")
    this.currentTimeEl = document.getElementById("currentTime")
    this.totalTimeEl = document.getElementById("totalTime")

    // Current song display
    this.currentTitle = document.getElementById("currentTitle")
    this.currentArtist = document.getElementById("currentArtist")
    this.currentArtwork = document.getElementById("currentArtwork")

    // Lists
    this.musicGrid = document.getElementById("musicGrid")
    this.queueList = document.getElementById("queueList")

    // Upload
    this.uploadBtn = document.getElementById("uploadBtn")
    this.uploadArea = document.getElementById("uploadArea")
    this.fileInput = document.getElementById("fileInput")

    this.searchInput = document.getElementById("searchInput")
  }

  bindEvents() {
    // Player controls
    this.playBtn.addEventListener("click", () => this.togglePlay())
    this.prevBtn.addEventListener("click", () => this.previousSong())
    this.nextBtn.addEventListener("click", () => this.nextSong())
    this.shuffleBtn.addEventListener("click", () => this.toggleShuffle())
    this.repeatBtn.addEventListener("click", () => this.toggleRepeat())

    // Progress and volume
    this.progressSlider.addEventListener("input", () => this.seekTo())
    this.volumeSlider.addEventListener("input", () => this.setVolume())

    // Audio events
    this.audio.addEventListener("loadedmetadata", () => this.updateDuration())
    this.audio.addEventListener("timeupdate", () => this.updateProgress())
    this.audio.addEventListener("ended", () => this.handleSongEnd())

    this.searchInput.addEventListener("input", (e) => this.handleSearch(e.target.value))

    // Upload events
    this.uploadBtn.addEventListener("click", () => this.showUploadArea())
    this.uploadArea.addEventListener("click", (e) => {
      if (e.target === this.uploadArea) this.hideUploadArea()
    })
    this.fileInput.addEventListener("change", (e) => this.handleFileUpload(e))

    this.uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault()
      this.uploadArea.classList.add("drag-over")
    })

    this.uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault()
      if (!this.uploadArea.contains(e.relatedTarget)) {
        this.uploadArea.classList.remove("drag-over")
      }
    })

    this.uploadArea.addEventListener("drop", (e) => {
      e.preventDefault()
      this.uploadArea.classList.remove("drag-over")
      this.handleFileUpload(e)
    })

    document.addEventListener("contextmenu", (e) => {
      const musicCard = e.target.closest(".music-card")
      if (musicCard) {
        e.preventDefault()
        this.showContextMenu(e, musicCard)
      }
    })

    document.addEventListener("click", () => {
      this.hideContextMenu()
    })

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          this.togglePlay()
          break
        case "ArrowLeft":
          this.previousSong()
          break
        case "ArrowRight":
          this.nextSong()
          break
        case "ArrowUp":
          e.preventDefault()
          this.adjustVolume(5)
          break
        case "ArrowDown":
          e.preventDefault()
          this.adjustVolume(-5)
          break
      }
    })
  }

  async loadPlaylist() {
    try {
      const response = await fetch("/api/songs")
      const songs = await response.json()
      this.playlist = songs
      this.filteredPlaylist = [...songs]
      this.renderMusicGrid()
      this.renderQueue()
    } catch (error) {
      console.error("Error loading playlist:", error)
      this.playlist = [
        {
          id: 1,
          title: "Sample Song 1",
          artist: "Sample Artist",
          filename: "sample1.mp3",
          artwork:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='180' height='180' rx='12' fill='url(%23grad1)'/%3E%3Cg transform='translate(90,90)'%3E%3Ccircle cx='0' cy='0' r='30' fill='none' stroke='white' stroke-width='2' opacity='0.3'/%3E%3Cpath d='M-15,-15 L15,0 L-15,15 Z' fill='white' opacity='0.8'/%3E%3C/g%3E%3C/svg%3E",
        },
        {
          id: 2,
          title: "Sample Song 2",
          artist: "Sample Artist",
          filename: "sample2.mp3",
          artwork:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cdefs%3E%3ClinearGradient id='grad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f093fb;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23f5576c;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='180' height='180' rx='12' fill='url(%23grad2)'/%3E%3Cg transform='translate(90,90)'%3E%3Ccircle cx='0' cy='-10' r='8' fill='white' opacity='0.8'/%3E%3Cpath d='M-20,10 L20,10 M-15,20 L15,20 M-10,30 L10,30' stroke='white' stroke-width='3' opacity='0.6'/%3E%3C/g%3E%3C/svg%3E",
        },
      ]
      this.filteredPlaylist = [...this.playlist]
      this.renderMusicGrid()
      this.renderQueue()
    }
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.filteredPlaylist = [...this.playlist]
    } else {
      const searchTerm = query.toLowerCase()
      this.filteredPlaylist = this.playlist.filter(
        (song) =>
          song.title.toLowerCase().includes(searchTerm) ||
          (song.artist && song.artist.toLowerCase().includes(searchTerm)),
      )
    }
    this.renderMusicGrid()
  }

  renderMusicGrid() {
    this.musicGrid.innerHTML = this.filteredPlaylist
      .map((song, index) => {
        const originalIndex = this.playlist.findIndex((s) => s.id === song.id)
        const defaultArtwork = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cdefs%3E%3ClinearGradient id='grad${song.id}' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23${this.getRandomColor(song.id)};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23${this.getRandomColor(song.id + 1)};stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='180' height='180' rx='12' fill='url(%23grad${song.id})'/%3E%3Cg transform='translate(90,90)'%3E%3Ccircle cx='0' cy='0' r='25' fill='none' stroke='white' stroke-width='2' opacity='0.4'/%3E%3Cpath d='M-10,-10 L10,0 L-10,10 Z' fill='white' opacity='0.8'/%3E%3C/g%3E%3C/svg%3E`

        return `
            <div class="music-card ${this.currentIndex === originalIndex ? "active" : ""}" 
                 onclick="player.playSong(${originalIndex})" data-song-index="${originalIndex}">
                 <div class="card-artwork">
                    <img src="${song.artwork || defaultArtwork}" 
                         alt="${song.title}">
                    <button class="play-overlay">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="card-info">
                    <div class="card-title">${song.title}</div>
                    <div class="card-artist">${song.artist || "Artista desconocido"}</div>
                </div>
            </div>
        `
      })
      .join("")
  }

  getRandomColor(seed) {
    const colors = [
      "fa2d48",
      "ff3b30",
      "007aff",
      "30d158",
      "ff9500",
      "667eea",
      "764ba2",
      "f093fb",
      "f5576c",
      "4facfe",
      "00f2fe",
      "a8edea",
      "fed6e3",
      "ffecd2",
      "fcb69f",
    ]
    return colors[seed % colors.length]
  }

  updateCurrentSongDisplay() {
    if (!this.currentSong) return

    this.currentTitle.textContent = this.currentSong.title
    this.currentArtist.textContent = this.currentSong.artist || "Artista desconocido"

    const defaultPlayerArtwork = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cdefs%3E%3ClinearGradient id='playerGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23fa2d48;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23ff3b30;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='56' height='56' rx='6' fill='url(%23playerGrad)'/%3E%3Cg transform='translate(28,28)'%3E%3Ccircle cx='0' cy='0' r='12' fill='none' stroke='white' stroke-width='1.5' opacity='0.4'/%3E%3Cpath d='M-5,-5 L5,0 L-5,5 Z' fill='white' opacity='0.8'/%3E%3C/g%3E%3C/svg%3E`

    this.currentArtwork.src = this.currentSong.artwork || defaultPlayerArtwork

    const playIndicator = document.querySelector(".play-indicator")

    if (this.isPlaying) {
      playIndicator?.classList.add("active")
    } else {
      playIndicator?.classList.remove("active")
    }
  }

  updatePlayButton() {
    const icon = this.playBtn.querySelector("i")
    icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play"

    const playIndicator = document.querySelector(".play-indicator")

    if (this.isPlaying) {
      playIndicator?.classList.add("active")
    } else {
      playIndicator?.classList.remove("active")
    }
  }

  showNotification(message, type = "success") {
    const notification = document.getElementById("notification")
    const notificationText = document.getElementById("notificationText")
    const icon = notification.querySelector("i")

    notificationText.textContent = message

    if (type === "error") {
      icon.className = "fas fa-exclamation-circle"
      icon.style.color = "var(--red)"
    } else {
      icon.className = "fas fa-check-circle"
      icon.style.color = "var(--green)"
    }

    notification.classList.add("show")

    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }

  initializeDragAndDrop() {
    const queueList = document.getElementById("queueList")

    this.makeSortable(queueList, (oldIndex, newIndex) => {
      const movedSong = this.playlist.splice(oldIndex, 1)[0]
      this.playlist.splice(newIndex, 0, movedSong)

      if (this.currentIndex === oldIndex) {
        this.currentIndex = newIndex
      } else if (oldIndex < this.currentIndex && newIndex >= this.currentIndex) {
        this.currentIndex--
      } else if (oldIndex > this.currentIndex && newIndex <= this.currentIndex) {
        this.currentIndex++
      }

      this.renderQueue()
      this.renderMusicGrid()
    })
  }

  makeSortable(container, onSort) {
    let draggedElement = null
    let draggedIndex = null

    container.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("queue-item")) {
        draggedElement = e.target
        draggedIndex = Array.from(container.children).indexOf(e.target)
        e.target.classList.add("dragging")
        e.dataTransfer.effectAllowed = "move"
      }
    })

    container.addEventListener("dragend", (e) => {
      if (e.target.classList.contains("queue-item")) {
        e.target.classList.remove("dragging")
        container.querySelectorAll(".drag-over").forEach((el) => {
          el.classList.remove("drag-over")
        })
      }
    })

    container.addEventListener("dragover", (e) => {
      e.preventDefault()
      const afterElement = this.getDragAfterElement(container, e.clientY)
      const dragging = container.querySelector(".dragging")

      if (afterElement == null) {
        container.appendChild(dragging)
      } else {
        container.insertBefore(dragging, afterElement)
      }
    })

    container.addEventListener("drop", (e) => {
      e.preventDefault()
      if (draggedElement) {
        const newIndex = Array.from(container.children).indexOf(draggedElement)
        if (draggedIndex !== newIndex) {
          onSort(draggedIndex, newIndex)
        }
      }
    })
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".queue-item:not(.dragging)")]

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element
  }

  renderQueue() {
    this.queueList.innerHTML = this.playlist
      .map((song, index) => {
        const defaultQueueArtwork = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cdefs%3E%3ClinearGradient id='queueGrad${song.id}' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23${this.getRandomColor(song.id)};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23${this.getRandomColor(song.id + 2)};stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='40' height='40' rx='6' fill='url(%23queueGrad${song.id})'/%3E%3Cg transform='translate(20,20)'%3E%3Cpath d='M-6,-6 L6,0 L-6,6 Z' fill='white' opacity='0.8'/%3E%3C/g%3E%3C/svg%3E`

        return `
            <div class="queue-item ${this.currentIndex === index ? "active" : ""}" 
                 onclick="player.playSong(${index})" draggable="true">
                <img src="${song.artwork || defaultQueueArtwork}" 
                     alt="${song.title}">
                <div class="queue-item-info">
                    <div class="queue-item-title">${song.title}</div>
                    <div class="queue-item-artist">${song.artist || "Artista desconocido"}</div>
                </div>
            </div>
        `
      })
      .join("")
  }

  playSong(index) {
    if (index < 0 || index >= this.playlist.length) return

    this.currentIndex = index
    this.currentSong = this.playlist[index]

    this.audio.src = `/static/music/${this.currentSong.filename}`
    this.audio.load()

    this.updateCurrentSongDisplay()
    this.renderMusicGrid()
    this.renderQueue()

    this.audio
      .play()
      .then(() => {
        this.isPlaying = true
        this.updatePlayButton()
      })
      .catch((error) => {
        console.error("Error playing song:", error)
      })
  }

  togglePlay() {
    if (!this.currentSong) {
      if (this.playlist.length > 0) {
        this.playSong(0)
      }
      return
    }

    if (this.isPlaying) {
      this.audio.pause()
      this.isPlaying = false
    } else {
      this.audio
        .play()
        .then(() => {
          this.isPlaying = true
        })
        .catch((error) => {
          console.error("Error playing song:", error)
        })
    }
    this.updatePlayButton()
  }

  previousSong() {
    let newIndex = this.currentIndex - 1
    if (newIndex < 0) {
      newIndex = this.playlist.length - 1
    }
    this.playSong(newIndex)
  }

  nextSong() {
    let newIndex
    if (this.isShuffled) {
      newIndex = Math.floor(Math.random() * this.playlist.length)
    } else {
      newIndex = this.currentIndex + 1
      if (newIndex >= this.playlist.length) {
        newIndex = 0
      }
    }
    this.playSong(newIndex)
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled
    this.shuffleBtn.classList.toggle("active", this.isShuffled)
  }

  toggleRepeat() {
    const modes = ["none", "one", "all"]
    const currentModeIndex = modes.indexOf(this.repeatMode)
    this.repeatMode = modes[(currentModeIndex + 1) % modes.length]

    this.repeatBtn.classList.toggle("active", this.repeatMode !== "none")

    const icon = this.repeatBtn.querySelector("i")
    if (this.repeatMode === "one") {
      icon.className = "fas fa-redo-alt"
    } else {
      icon.className = "fas fa-redo"
    }
  }

  seekTo() {
    if (!this.audio.duration) return
    const seekTime = (this.progressSlider.value / 100) * this.audio.duration
    this.audio.currentTime = seekTime
  }

  setVolume() {
    this.audio.volume = this.volumeSlider.value / 100

    document.documentElement.style.setProperty("--volume-progress", `${this.volumeSlider.value}%`)

    const volumeIcon = document.querySelector("#volumeBtn i")
    const volume = this.volumeSlider.value

    if (volume == 0) {
      volumeIcon.className = "fas fa-volume-mute"
    } else if (volume < 50) {
      volumeIcon.className = "fas fa-volume-down"
    } else {
      volumeIcon.className = "fas fa-volume-up"
    }
  }

  adjustVolume(delta) {
    const currentVolume = Number.parseInt(this.volumeSlider.value)
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta))
    this.volumeSlider.value = newVolume
    this.setVolume()
  }

  updateDuration() {
    this.totalTimeEl.textContent = this.formatTime(this.audio.duration)
  }

  updateProgress() {
    if (!this.audio.duration) return

    const progress = (this.audio.currentTime / this.audio.duration) * 100
    this.progressSlider.value = progress
    this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime)

    document.documentElement.style.setProperty("--progress", `${progress}%`)
  }

  handleSongEnd() {
    if (this.repeatMode === "one") {
      this.audio.currentTime = 0
      this.audio.play()
    } else if (this.repeatMode === "all" || this.currentIndex < this.playlist.length - 1) {
      this.nextSong()
    } else {
      this.isPlaying = false
      this.updatePlayButton()
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  showUploadArea() {
    this.uploadArea.classList.add("active")
  }

  hideUploadArea() {
    this.uploadArea.classList.remove("active")
  }

  async handleFileUpload(event) {
    const files = event.target.files || event.dataTransfer.files
    if (!files.length) return

    const uploadProgress = document.getElementById("uploadProgress")
    const progressFill = document.getElementById("progressFill")
    const progressText = document.getElementById("progressText")

    uploadProgress.classList.add("active")

    const formData = new FormData()
    let validFiles = 0

    for (const file of files) {
      if (file.type.startsWith("audio/")) {
        formData.append("files", file)
        validFiles++
      }
    }

    if (validFiles === 0) {
      this.showNotification("No se encontraron archivos de audio válidos", "error")
      uploadProgress.classList.remove("active")
      return
    }

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          progressFill.style.width = percentComplete + "%"
          progressText.textContent = Math.round(percentComplete) + "%"
        }
      })

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          await this.loadPlaylist()
          this.hideUploadArea()
          this.showNotification(`${validFiles} archivo(s) subido(s) correctamente`)
        } else {
          this.showNotification("Error al subir archivos", "error")
        }
        uploadProgress.classList.remove("active")
        progressFill.style.width = "0%"
        progressText.textContent = "0%"
      })

      xhr.addEventListener("error", () => {
        this.showNotification("Error de conexión", "error")
        uploadProgress.classList.remove("active")
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    } catch (error) {
      console.error("Upload error:", error)
      this.showNotification("Error al subir archivos", "error")
      uploadProgress.classList.remove("active")
    }
  }

  showContextMenu(event, musicCard) {
    const contextMenu = document.getElementById("contextMenu")
    const songIndex = Number.parseInt(musicCard.dataset.songIndex)

    this.contextSongIndex = songIndex
    contextMenu.style.left = event.pageX + "px"
    contextMenu.style.top = event.pageY + "px"
    contextMenu.classList.add("active")
  }

  hideContextMenu() {
    const contextMenu = document.getElementById("contextMenu")
    contextMenu.classList.remove("active")
  }

  addToQueue() {
    if (this.contextSongIndex !== undefined) {
      this.showNotification("Canción agregada a la cola")
    }
  }

  createPlaylist() {
    // Create a custom modal for playlist creation
    const modal = document.createElement("div")
    modal.className = "playlist-modal"
    modal.innerHTML = `
      <div class="playlist-modal-content">
        <h3>Nueva Playlist</h3>
        <div style="margin-bottom: var(--spacing-lg);">
          <input type="text" id="playlistNameInput" placeholder="Nombre de la playlist" 
                 style="width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-color); 
                        border-radius: var(--radius-md); background: var(--background-elevated); 
                        color: var(--text-primary); font-size: 14px; outline: none;">
        </div>
        <div style="display: flex; gap: var(--spacing-md);">
          <button onclick="player.confirmCreatePlaylist()" class="btn-primary" style="flex: 1;">
            <i class="fas fa-plus"></i>
            Crear
          </button>
          <button onclick="player.closeCreatePlaylistModal()" class="btn-secondary" style="flex: 1;">
            Cancelar
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    setTimeout(() => {
      modal.classList.add("active")
      document.getElementById("playlistNameInput").focus()
    }, 10)

    // Handle Enter key
    document.getElementById("playlistNameInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.confirmCreatePlaylist()
      }
    })
  }

  confirmCreatePlaylist() {
    const nameInput = document.getElementById("playlistNameInput")
    const name = nameInput.value.trim()

    if (name) {
      const playlist = {
        id: Date.now(),
        name: name,
        songs: [],
        created: new Date().toISOString(),
      }
      this.playlists.push(playlist)
      this.savePlaylists()
      this.renderPlaylists()
      this.showNotification(`Playlist "${name}" creada`)
      this.closeCreatePlaylistModal()
    } else {
      nameInput.focus()
      nameInput.style.borderColor = "var(--red)"
      setTimeout(() => {
        nameInput.style.borderColor = "var(--border-color)"
      }, 2000)
    }
  }

  closeCreatePlaylistModal() {
    const modal = document.querySelector(".playlist-modal")
    if (modal) {
      modal.classList.remove("active")
      setTimeout(() => modal.remove(), 300)
    }
  }

  addToPlaylist() {
    if (this.contextSongIndex !== undefined) {
      if (this.playlists.length === 0) {
        this.showNotification("Crea una playlist primero", "error")
        return
      }

      const song = this.playlist[this.contextSongIndex]
      const modal = document.createElement("div")
      modal.className = "playlist-modal"
      modal.innerHTML = `
        <div class="playlist-modal-content">
          <h3>Agregar a Playlist</h3>
          <div class="playlist-options">
            ${this.playlists
              .map(
                (playlist) => `
              <div class="playlist-option" onclick="player.addSongToPlaylist(${playlist.id}, ${this.contextSongIndex})">
                <i class="fas fa-music"></i>
                <span>${playlist.name}</span>
                <span class="song-count">${playlist.songs.length} canción${playlist.songs.length !== 1 ? "es" : ""}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          <button onclick="player.closePlaylistModal()" class="close-modal-btn">Cancelar</button>
        </div>
      `

      document.body.appendChild(modal)
      setTimeout(() => modal.classList.add("active"), 10)
    }
  }

  addSongToPlaylist(playlistId, songIndex) {
    const playlist = this.playlists.find((p) => p.id === playlistId)
    const song = this.playlist[songIndex]

    if (playlist && song) {
      const exists = playlist.songs.some((s) => s.id === song.id)
      if (exists) {
        this.showNotification("La canción ya está en esta playlist", "error")
      } else {
        playlist.songs.push(song)
        this.savePlaylists()
        this.showNotification(`Agregado a "${playlist.name}"`)
      }
    }

    this.closePlaylistModal()
  }

  closePlaylistModal() {
    const modal = document.querySelector(".playlist-modal")
    if (modal) {
      modal.classList.remove("active")
      setTimeout(() => modal.remove(), 300)
    }
  }

  downloadSong() {
    if (this.contextSongIndex !== undefined) {
      const song = this.playlist[this.contextSongIndex]
      const link = document.createElement("a")
      link.href = `/static/music/${song.filename}`
      link.download = song.filename
      link.click()
    }
  }

  async deleteSong() {
    if (this.contextSongIndex !== undefined) {
      const song = this.playlist[this.contextSongIndex]
      if (confirm(`¿Eliminar "${song.title}"?`)) {
        try {
          const response = await fetch(`/api/delete/${song.filename}`, {
            method: "DELETE",
          })

          if (response.ok) {
            this.playlist.splice(this.contextSongIndex, 1)
            this.filteredPlaylist = [...this.playlist]

            if (this.currentIndex > this.contextSongIndex) {
              this.currentIndex--
            } else if (this.currentIndex === this.contextSongIndex) {
              this.audio.pause()
              this.isPlaying = false
              this.currentSong = null
              this.currentIndex = 0
              this.updatePlayButton()
              this.updateCurrentSongDisplay()
            }

            this.renderMusicGrid()
            this.renderQueue()

            this.showNotification(`"${song.title}" eliminada correctamente`)
          } else {
            const error = await response.json()
            this.showNotification(error.error || "Error al eliminar la canción", "error")
          }
        } catch (error) {
          console.error("Delete error:", error)
          this.showNotification("Error de conexión al eliminar", "error")
        }
      }
    }
  }

  showView(view) {
    this.currentView = view

    document.querySelectorAll(".nav-link").forEach((item) => {
      item.classList.remove("active")
    })

    if (view === "home") {
      document.getElementById("homeView").style.display = "block"
      document.getElementById("playlistsView").style.display = "none"
      document.querySelector('.nav-link[onclick*="home"]').classList.add("active")
    } else if (view === "playlists") {
      document.getElementById("homeView").style.display = "none"
      document.getElementById("playlistsView").style.display = "block"
      document.querySelector('.nav-link[onclick*="playlists"]').classList.add("active")
      this.renderPlaylists()
    }
  }

  renderPlaylists() {
    const playlistsGrid = document.getElementById("playlistsGrid")

    if (this.playlists.length === 0) {
      playlistsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-secondary);">
          <i class="fas fa-music" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <h3>No tienes playlists</h3>
          <p>Crea tu primera playlist para organizar tu música</p>
        </div>
      `
      return
    }

    playlistsGrid.innerHTML = this.playlists
      .map(
        (playlist) => `
        <div class="playlist-card" onclick="player.openPlaylist(${playlist.id})">
          <div class="playlist-artwork">
            <i class="fas fa-music"></i>
          </div>
          <div class="playlist-info">
            <div class="playlist-title">${playlist.name}</div>
            <div class="playlist-count">${playlist.songs.length} canción(es)</div>
          </div>
        </div>
      `,
      )
      .join("")
  }

  openPlaylist(playlistId) {
    const playlist = this.playlists.find((p) => p.id === playlistId)
    if (playlist) {
      this.currentPlaylistView = playlist
      this.showPlaylistView(playlist)
    }
  }

  showPlaylistView(playlist) {
    document.getElementById("homeView").style.display = "none"
    document.getElementById("playlistsView").style.display = "none"

    let playlistView = document.getElementById("playlistView")
    if (!playlistView) {
      playlistView = document.createElement("div")
      playlistView.id = "playlistView"
      playlistView.className = "view"
      document.querySelector(".main-content").appendChild(playlistView)
    }

    playlistView.style.display = "block"
    playlistView.innerHTML = `
      <div class="playlist-header">
        <button onclick="player.showView('playlists')" class="back-btn">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
        <h2>${playlist.name}</h2>
        <button onclick="player.playPlaylist(${playlist.id})" class="play-all-btn">
          <i class="fas fa-play"></i> Reproducir todo
        </button>
      </div>
      <div class="playlist-songs">
        ${playlist.songs
          .map(
            (song, index) => `
          <div class="playlist-song" onclick="player.playPlaylistSong(${playlist.id}, ${index})">
            <img src="${song.artwork || this.getDefaultArtwork(song.id)}" alt="${song.title}">
            <div class="song-info">
              <div class="song-title">${song.title}</div>
              <div class="song-artist">${song.artist || "Artista desconocido"}</div>
            </div>
            <button onclick="event.stopPropagation(); player.removeSongFromPlaylist(${playlist.id}, ${index})" class="remove-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  getDefaultArtwork(songId) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cdefs%3E%3ClinearGradient id='grad${songId}' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23${this.getRandomColor(songId)};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23${this.getRandomColor(songId + 1)};stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='40' height='40' rx='6' fill='url(%23grad${songId})'/%3E%3Cg transform='translate(20,20)'%3E%3Cpath d='M-6,-6 L6,0 L-6,6 Z' fill='white' opacity='0.8'/%3E%3C/g%3E%3C/svg%3E`
  }

  playPlaylist(playlistId) {
    const playlist = this.playlists.find((p) => p.id === playlistId)
    if (playlist && playlist.songs.length > 0) {
      this.playlist = [...playlist.songs]
      this.filteredPlaylist = [...playlist.songs]
      this.playSong(0)
      this.renderMusicGrid()
      this.renderQueue()
    }
  }

  playPlaylistSong(playlistId, songIndex) {
    const playlist = this.playlists.find((p) => p.id === playlistId)
    if (playlist && playlist.songs[songIndex]) {
      this.playlist = [...playlist.songs]
      this.filteredPlaylist = [...playlist.songs]
      this.playSong(songIndex)
      this.renderMusicGrid()
      this.renderQueue()
    }
  }

  removeSongFromPlaylist(playlistId, songIndex) {
    const playlist = this.playlists.find((p) => p.id === playlistId)
    if (playlist) {
      playlist.songs.splice(songIndex, 1)
      this.savePlaylists()
      this.showPlaylistView(playlist)
      this.showNotification("Canción eliminada de la playlist")
    }
  }

  deletePlaylist(playlistId) {
    if (confirm("¿Eliminar esta playlist?")) {
      this.playlists = this.playlists.filter((p) => p.id !== playlistId)
      this.savePlaylists()
      this.showView("playlists")
      this.showNotification("Playlist eliminada")
    }
  }

  savePlaylists() {
    localStorage.setItem("playlists", JSON.stringify(this.playlists))
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.player = new MusicPlayer()
})
