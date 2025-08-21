class MediaPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.shuffle = false;
        this.repeatMode = 'none'; // none, one, all
        this.loopA = null;
        this.loopB = null;
        
        // Track organization
        this.artists = new Set();
        this.albums = new Set();
        this.playlists = new Map(); // name -> track list
        
        // Theme settings
        this.currentTheme = 'dark';
        this.currentGradient = 'default';
        this.accentColor = '#00ff9d';
        
        // Load settings and playlist
        this.loadSettings();
        this.loadPlaylist();
        this.initializeEventListeners();
        this.initializeSidebar();
        this.initializeThemes();
    }

    loadPlaylist() {
        const savedPlaylist = localStorage.getItem('playlist');
        if (savedPlaylist) {
            this.playlist = JSON.parse(savedPlaylist);
            this.updateSidebarLists(); // Update sidebar on initial load
            this.renderPlaylist();
        }
    }

    savePlaylist() {
        localStorage.setItem('playlist', JSON.stringify(this.playlist));
    }

    initializeEventListeners() {
        // Mobile menu toggle - Fixed to check for element existence
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const hamburger = document.getElementById('menuToggle');
            if (window.innerWidth <= 1024 && 
                sidebar && !sidebar.contains(e.target) && 
                hamburger && !hamburger.contains(e.target) &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });

        // Play/Pause button
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());

        // Next/Previous buttons
        document.getElementById('nextBtn').addEventListener('click', () => this.next());
        document.getElementById('prevBtn').addEventListener('click', () => this.previous());

        // Shuffle and Repeat buttons
        document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());

        // A-B Loop buttons
        document.getElementById('setA').addEventListener('click', () => this.setLoopPoint('A'));
        document.getElementById('setB').addEventListener('click', () => this.setLoopPoint('B'));
        document.getElementById('clearAB').addEventListener('click', () => this.clearLoopPoints());

        // File input for adding new tracks
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));

        // Progress bar
        const progressBar = document.querySelector('.progress-bar');
        progressBar.addEventListener('click', (e) => this.seek(e));

        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    }

    async handleFileSelect(event) {
        console.log('File selection started');
        const files = Array.from(event.target.files);
        console.log('Files selected:', files.map(f => f.name));
        
        for (const file of files) {
            console.log('Processing file:', file.name);
            try {
                const metadata = await this.getAudioMetadata(file);
                console.log('Metadata retrieved:', metadata);
                
                const trackInfo = {
                    file: file,
                    title: metadata.title || file.name,
                    artist: metadata.artist || 'Unknown Artist',
                    album: metadata.album || 'Unknown Album',
                    artwork: metadata.artwork || './icons/album.png'
                };
                console.log('Adding track to playlist:', trackInfo);
                this.playlist.push(trackInfo);
                
                // Update artists and albums sets
                this.artists.add(metadata.artist || 'Unknown Artist');
                this.albums.add(metadata.album || 'Unknown Album');
            } catch (error) {
                console.error('Error processing file:', file.name, error);
                const trackInfo = {
                    file: file,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Unknown Artist',
                    album: 'Unknown Album',
                    artwork: './icons/album.png'
                };
                console.log('Adding fallback track to playlist:', trackInfo);
                this.playlist.push(trackInfo);
                
                // Update artists and albums sets
                this.artists.add('Unknown Artist');
                this.albums.add('Unknown Album');
            }
        }

        console.log('Saving playlist...');
        this.savePlaylist();
        console.log('Rendering playlist...');
        this.renderPlaylist();
        console.log('Updating sidebar lists...');
        this.updateSidebarLists(); // Update the sidebar after adding new files
        
        if (this.playlist.length === files.length) {
            console.log('Loading first track...');
            this.loadTrack(0);
        }
        
        console.log('File processing complete');
        // Reset the file input to allow selecting the same file again
        event.target.value = '';
    }

    async getAudioMetadata(file) {
        return new Promise((resolve, reject) => {
            jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const tags = tag.tags;
                    let artwork = null;
                    
                    if (tags.picture) {
                        const { data, format } = tags.picture;
                        let base64String = "";
                        for (let i = 0; i < data.length; i++) {
                            base64String += String.fromCharCode(data[i]);
                        }
                        artwork = `data:${format};base64,${window.btoa(base64String)}`;
                    }

                    const metadata = {
                        title: tags.title || file.name.replace(/\.[^/.]+$/, ""),
                        artist: tags.artist || 'Unknown Artist',
                        album: tags.album || 'Unknown Album',
                        artwork: artwork
                    };

                    resolve(metadata);
                },
                onError: (error) => {
                    console.log('Error reading tags:', error);
                    // Try to parse artist and album from filename
                    let artist = 'Unknown Artist';
                    let album = 'Unknown Album';
                    let title = file.name.replace(/\.[^/.]+$/, "");

                    // Common pattern: Artist - Album - Title.mp3
                    const parts = title.split(' - ');
                    if (parts.length >= 3) {
                        artist = parts[0];
                        album = parts[1];
                        title = parts.slice(2).join(' - ');
                    } else if (parts.length === 2) {
                        artist = parts[0];
                        title = parts[1];
                    }

                    resolve({
                        title: title,
                        artist: artist,
                        album: album,
                        artwork: null
                    });
                }
            });
        });
    }

    renderPlaylist() {
        const playlistElement = document.getElementById('playlist');
        const musicGrid = document.getElementById('musicGrid');
        
        // Clear both containers
        playlistElement.innerHTML = '';
        musicGrid.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            // Render in playlist
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${track.title}</span>
                <span>${track.artist}</span>
            `;
            if (index === this.currentTrackIndex) {
                li.classList.add('playing');
            }
            li.addEventListener('click', () => this.loadTrack(index));
            playlistElement.appendChild(li);
            
            // Render in music grid with the options button and listener
            const card = document.createElement('div');
            card.className = 'track-card';
            
            card.innerHTML = `
                <div class="track-info">
                     <img src="${track.artwork || './icons/album.png'}" alt="${track.title}" style="width: 100%; border-radius: 5px; margin-bottom: 1rem;">
                    <h3>${track.title}</h3>
                    <p>${track.artist}</p>
                </div>
                <button class="track-options-btn" data-index="${index}">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            `;
            
            // Add click listener for playing the track (on the info part)
            card.querySelector('.track-info').addEventListener('click', () => {
                this.loadTrack(index);
            });
            
            // Add click listener for the options button
            const optionsBtn = card.querySelector('.track-options-btn');
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents the card's play listener from firing
                this.showTrackOptions(e, index);
            });
            
            musicGrid.appendChild(card);
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        if (track.file instanceof File) {
            const url = URL.createObjectURL(track.file);
            this.audio.src = url;
        } else {
            // Handle case where file is not a File object (e.g., after reload from localStorage)
            // This part requires a more complex implementation to persist files,
            // for now, we'll just show the metadata.
            console.warn("Cannot play track from localStorage. Please re-upload files.");
        }
        
        document.getElementById('trackTitle').textContent = track.title;
        document.getElementById('artistName').textContent = track.artist;
        
        const albumArt = document.getElementById('albumArt');
        albumArt.src = track.artwork || './icons/album.png';
        
        this.renderPlaylist();
        if (this.isPlaying) this.play();
    }

    togglePlay() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    play() {
        if (!this.audio.src) {
             if (this.playlist.length > 0) {
                 this.loadTrack(this.currentTrackIndex);
             } else {
                 alert("Please add music to the playlist first.");
                 return;
             }
        }
        this.audio.play().catch(e => console.error("Error playing audio:", e));
        this.isPlaying = true;
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>';
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
    }

    next() {
        let nextIndex;
        if (this.shuffle) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        }
        this.loadTrack(nextIndex);
    }

    previous() {
        let prevIndex;
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
        } else {
            prevIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(prevIndex);
        }
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        document.getElementById('shuffleBtn').classList.toggle('active');
    }

    toggleRepeat() {
        const states = ['none', 'one', 'all'];
        const currentIndex = states.indexOf(this.repeatMode);
        this.repeatMode = states[(currentIndex + 1) % states.length];
        
        const btn = document.getElementById('repeatBtn');
        btn.classList.toggle('active', this.repeatMode !== 'none');
        
        if (this.repeatMode === 'one') {
            btn.innerHTML = '<i class="fas fa-redo">1</i>';
        } else {
            btn.innerHTML = '<i class="fas fa-redo"></i>';
        }
    }

    setLoopPoint(point) {
        if (point === 'A') {
            this.loopA = this.audio.currentTime;
            document.getElementById('setA').classList.add('active');
        } else {
            this.loopB = this.audio.currentTime;
            document.getElementById('setB').classList.add('active');
        }
    }

    clearLoopPoints() {
        this.loopA = null;
        this.loopB = null;
        document.getElementById('setA').classList.remove('active');
        document.getElementById('setB').classList.remove('active');
    }

    seek(event) {
        const progressBar = document.querySelector('.progress-bar');
        const percent = (event.offsetX / progressBar.offsetWidth);
        this.audio.currentTime = percent * this.audio.duration;
    }

    updateProgress() {
        if (this.audio.duration) {
            const progress = document.querySelector('.progress');
            const currentTime = document.getElementById('currentTime');
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            progress.style.width = percent + '%';
            currentTime.textContent = this.formatTime(this.audio.currentTime);

            if (this.loopA !== null && this.loopB !== null && this.loopB > this.loopA) {
                if (this.audio.currentTime >= this.loopB) {
                    this.audio.currentTime = this.loopA;
                }
            }
        }
    }

    updateDuration() {
        document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);
    }

    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all') {
            this.next();
        } else if (this.currentTrackIndex < this.playlist.length - 1) {
             this.next();
        } else {
            this.pause();
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    loadSettings() {
        const settings = localStorage.getItem('webmedia_settings');
        if (settings) {
            const { theme, gradient, accent } = JSON.parse(settings);
            this.currentTheme = theme || 'dark';
            this.currentGradient = gradient || 'default';
            this.accentColor = accent || '#00ff9d';
        }
        // Apply the loaded theme (removed the line that was forcing dark mode)
        this.applyTheme();
    }

    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            gradient: this.currentGradient,
            accent: this.accentColor
        };
        localStorage.setItem('webmedia_settings', JSON.stringify(settings));
    }

    initializeThemes() {
        // Theme mode buttons
        document.getElementById('lightMode').addEventListener('click', () => this.setTheme('light'));
        document.getElementById('darkMode').addEventListener('click', () => this.setTheme('dark'));

        // Accent color picker
        const colorPicker = document.getElementById('accentColor');
        colorPicker.value = this.accentColor;
        // Fixed: Changed from 'change' to 'input' for real-time updates
        colorPicker.addEventListener('input', (e) => {
            this.setAccentColor(e.target.value);
        });

        // Gradient buttons
        document.querySelectorAll('.gradient-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setGradient(btn.dataset.gradient);
            });
        });

        // Apply initial theme and set correct button states
        this.applyTheme();
        this.updateThemeButtons();
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme();
        this.saveSettings();
        this.updateThemeButtons();
    }

    setAccentColor(color) {
        this.accentColor = color;
        document.documentElement.style.setProperty('--accent-color', color);
        this.saveSettings();
    }

    setGradient(gradient) {
        this.currentGradient = gradient;
        this.applyTheme();
        this.saveSettings();
        this.updateGradientButtons();
    }

    // Fixed: Added method to properly update theme button states
    updateThemeButtons() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((btn.id === 'lightMode' && this.currentTheme === 'light') ||
                (btn.id === 'darkMode' && this.currentTheme === 'dark')) {
                btn.classList.add('active');
            }
        });
    }

    // Fixed: Added method to properly update gradient button states
    updateGradientButtons() {
        document.querySelectorAll('.gradient-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.gradient === this.currentGradient) {
                btn.classList.add('active');
            }
        });
    }

    applyTheme() {
        // Apply theme attribute
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Apply gradient based on current selection
        let gradient = '';
        switch(this.currentGradient) {
            case 'sunset':
                gradient = 'linear-gradient(45deg, #ff416c, #ff4b2b)';
                break;
            case 'ocean':
                gradient = 'linear-gradient(45deg, #2193b0, #6dd5ed)';
                break;
            case 'forest':
                gradient = 'linear-gradient(45deg, #134e5e, #71b280)';
                break;
            default:
                if (this.currentTheme === 'light') {
                    gradient = 'linear-gradient(45deg, #f0f2f5, #e6e9ef)';
                } else {
                    gradient = 'linear-gradient(45deg, #0f0f1a, #1a1a2e)';
                }
        }
        
        // Apply the gradient and accent color
        document.documentElement.style.setProperty('--primary-gradient', gradient);
        document.documentElement.style.setProperty('--accent-color', this.accentColor);
        
        // Update button states
        this.updateThemeButtons();
        this.updateGradientButtons();
    }

    renderMusicGrid() {
        // This function is redundant as its logic is now inside renderPlaylist.
        // It can be safely removed or left empty.
    }

    showTrackOptions(event, trackIndex) {
        const menu = document.getElementById('trackOptionsMenu');
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        
        menu.style.visibility = 'hidden';
        menu.classList.add('active');
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        
        let top = rect.bottom + 5;
        let left = rect.left - menuWidth + rect.width;
        
        if (left < 0) left = rect.left;
        if (left + menuWidth > viewportWidth) left = viewportWidth - menuWidth - 5;
        if (top + menuHeight > viewportHeight) top = rect.top - menuHeight - 5;
        
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        menu.style.visibility = 'visible';
        
        const editItem = menu.querySelector('.edit-track');
        const removeItem = menu.querySelector('.remove-track');
        editItem.replaceWith(editItem.cloneNode(true));
        removeItem.replaceWith(removeItem.cloneNode(true));
        
        menu.querySelector('.edit-track').addEventListener('click', () => {
            this.editTrack(trackIndex);
            menu.classList.remove('active');
        });
        
        menu.querySelector('.remove-track').addEventListener('click', () => {
            this.deleteTrack(trackIndex);
            menu.classList.remove('active');
        });
        
        menu.classList.add('active');
        
        const hideMenu = (e) => {
            if (!menu.contains(e.target) && !button.contains(e.target)) {
                menu.classList.remove('active');
                document.removeEventListener('click', hideMenu);
            }
        };
        
        setTimeout(() => document.addEventListener('click', hideMenu), 0);
    }
    
    editTrack(trackIndex) {
        const track = this.playlist[trackIndex];
        if (!track) return;

        const newTitle = prompt("Enter new title:", track.title);
        const newArtist = prompt("Enter new artist:", track.artist);
        const newAlbum = prompt("Enter new album:", track.album);

        if (newTitle !== null && newArtist !== null && newAlbum !== null) {
            track.title = newTitle.trim() || track.title;
            track.artist = newArtist.trim() || track.artist;
            track.album = newAlbum.trim() || track.album;

            this.savePlaylist();
            this.updateSidebarLists();
            this.renderPlaylist();

            // If the currently playing track was edited, update the player info
            if (this.currentTrackIndex === trackIndex) {
                document.getElementById('trackTitle').textContent = track.title;
                document.getElementById('artistName').textContent = track.artist;
            }
        }
    }

    deleteTrack(trackIndex) {
        const track = this.playlist[trackIndex];
        if (!track) return;
        
        if (confirm(`Are you sure you want to remove "${track.title}"?`)) {
            this.playlist.splice(trackIndex, 1);
            this.savePlaylist();
            this.updateSidebarLists();
            this.renderPlaylist();

            // Handle case where deleted track was the currently playing one
            if (this.currentTrackIndex === trackIndex) {
                if (this.playlist.length === 0) {
                    this.audio.src = '';
                    document.getElementById('trackTitle').textContent = 'No Track Selected';
                    document.getElementById('artistName').textContent = 'Unknown Artist';
                    this.pause();
                } else {
                    // Adjust index if needed and load the next available track
                    this.currentTrackIndex = Math.max(0, trackIndex - 1);
                    this.loadTrack(this.currentTrackIndex);
                }
            } else if (this.currentTrackIndex > trackIndex) {
                // Adjust current index if deleted track was before current one
                this.currentTrackIndex--;
            }
        }
    }

    initializeSidebar() {
        document.getElementById('createPlaylist').addEventListener('click', () => {
            const name = prompt('Enter playlist name:');
            if (name && !this.playlists.has(name)) {
                this.playlists.set(name, []);
                this.updatePlaylistsList();
                this.savePlaylists();
            }
        });

        const savedPlaylists = localStorage.getItem('playlists');
        if (savedPlaylists) {
            this.playlists = new Map(JSON.parse(savedPlaylists));
        }
        this.updateSidebarLists();
    }

    updateSidebarLists() {
        // Rebuild artist and album sets from the current playlist
        this.artists.clear();
        this.albums.clear();
        this.playlist.forEach(track => {
            this.artists.add(track.artist || 'Unknown Artist');
            this.albums.add(track.album || 'Unknown Album');
        });

        this.updateArtistsList();
        this.updateAlbumsList();
        this.updatePlaylistsList();
    }

    updateArtistsList() {
        const artistList = document.getElementById('artistList');
        artistList.innerHTML = '';
        Array.from(this.artists).sort().forEach(artist => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-user"></i> ${artist}`;
            artistList.appendChild(li);
        });
    }

    updateAlbumsList() {
        const albumList = document.getElementById('albumList');
        albumList.innerHTML = '';
        Array.from(this.albums).sort().forEach(album => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-record-vinyl"></i> ${album}`;
            albumList.appendChild(li);
        });
    }

    updatePlaylistsList() {
        const playlistsList = document.getElementById('playlistsList');
        playlistsList.innerHTML = '';
        Array.from(this.playlists.keys()).sort().forEach(name => {
            const li = document.createElement('li');
            li.innerHTML = `
                <i class="fas fa-list"></i> 
                ${name}
                <button class="delete-playlist" data-name="${name}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            li.querySelector('.delete-playlist').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePlaylist(name);
            });
            playlistsList.appendChild(li);
        });
    }

    deletePlaylist(name) {
        if (confirm(`Delete playlist "${name}"?`)) {
            this.playlists.delete(name);
            this.updatePlaylistsList();
            this.savePlaylists();
        }
    }

    savePlaylists() {
        localStorage.setItem('playlists', JSON.stringify(Array.from(this.playlists.entries())));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.mediaPlayer = new MediaPlayer();
});