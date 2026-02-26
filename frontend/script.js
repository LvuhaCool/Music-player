// Spotify clone – full working script

document.addEventListener('DOMContentLoaded', function() {
    // ========== AUDIO PLAYER ==========
    const audio = new Audio();
    let currentSongCard = null;
    let isPlaying = false;

    const playPauseBtn = document.querySelector('.play-pause-btn');
    const progressBar = document.querySelector('.seek-bar .progress-bar');
    const currentTimeSpan = document.querySelector('.current-time');
    const durationSpan = document.querySelector('.duration');
    const playerImg = document.querySelector('.player-bar img');
    const playerTitle = document.querySelector('.player-title');
    const playerArtist = document.querySelector('.player-artist');
    const seekBar = document.querySelector('.seek-bar');
    const volumeBar = document.querySelector('.volume-bar .progress-bar');
    const volumeContainer = document.querySelector('.volume-bar');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');

    const allCards = document.querySelectorAll('.playlist-card');

    // ========== SONG DETAILS MODAL ==========
    const songDetailsModal = new bootstrap.Modal(document.getElementById('songDetailsModal'));
    const modalSongImage = document.getElementById('modalSongImage');
    const modalSongTitle = document.getElementById('modalSongTitle');
    const modalSongArtist = document.getElementById('modalSongArtist');
    const modalPlayBtn = document.getElementById('modalPlayBtn');
    const modalAddToPlaylistBtn = document.getElementById('modalAddToPlaylistBtn');
    const modalLikeBtn = document.getElementById('modalLikeBtn');
    const modalShareBtn = document.getElementById('modalShareBtn');
    let currentModalCard = null;

    function openSongDetails(card) {
        currentModalCard = card;
        modalSongImage.src = card.querySelector('img').src;
        modalSongTitle.innerText = card.querySelector('.card-title').innerText;
        modalSongArtist.innerText = card.querySelector('.card-text').innerText;
        songDetailsModal.show();
    }

    modalPlayBtn.addEventListener('click', function() {
        if (currentModalCard) {
            if (currentSongCard === currentModalCard) {
                if (isPlaying) pauseSong();
                else playSong();
            } else {
                if (currentSongCard) stopSong();
                loadSong(currentModalCard);
                playSong();
            }
            songDetailsModal.hide();
        }
    });

    modalAddToPlaylistBtn.addEventListener('click', () => console.log('Add to playlist:', modalSongTitle.innerText));
    modalLikeBtn.addEventListener('click', () => console.log('Like:', modalSongTitle.innerText));
    modalShareBtn.addEventListener('click', () => console.log('Share:', modalSongTitle.innerText));

    // ========== SEARCH MODAL ==========
    const modalSearchInput = document.getElementById('modalSearchInput');
    const searchResultsList = document.getElementById('searchResultsList');
    
    const songDatabase = Array.from(allCards).map((card, index) => ({
        title: card.querySelector('.card-title').innerText,
        artist: card.querySelector('.card-text').innerText,
        card: card,
        index: index
    }));

    function renderModalResults(filterText = '') {
        const filterLower = filterText.toLowerCase();
        const filtered = songDatabase.filter(item => 
            item.title.toLowerCase().includes(filterLower) || 
            item.artist.toLowerCase().includes(filterLower)
        );

        if (filtered.length === 0) {
            searchResultsList.innerHTML = '<li class="list-group-item text-center text-subdued">No results found</li>';
            return;
        }

        searchResultsList.innerHTML = filtered.map(item => `
            <li class="list-group-item d-flex align-items-center justify-content-between modal-result-item" 
                data-card-index="${item.index}" 
                style="cursor: pointer;">
                <div>
                    <span class="fw-bold">${item.title}</span><br>
                    <span class="small text-subdued">${item.artist}</span>
                </div>
                <i class="bi bi-play-circle text-green" style="font-size: 1.5rem;"></i>
            </li>
        `).join('');

        document.querySelectorAll('.modal-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const index = this.dataset.cardIndex;
                const targetCard = songDatabase[index].card;
                bootstrap.Modal.getInstance(document.getElementById('searchModal')).hide();
                if (currentSongCard === targetCard) {
                    if (isPlaying) pauseSong();
                    else playSong();
                } else {
                    if (currentSongCard) stopSong();
                    loadSong(targetCard);
                    playSong();
                }
            });
        });
    }

    renderModalResults();
    modalSearchInput.addEventListener('input', () => renderModalResults(modalSearchInput.value));

    // ========== AUDIO FUNCTIONS ==========
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updatePlayPauseIcon() {
        if (isPlaying) {
            playPauseBtn.classList.remove('bi-play-circle-fill');
            playPauseBtn.classList.add('bi-pause-circle-fill');
        } else {
            playPauseBtn.classList.remove('bi-pause-circle-fill');
            playPauseBtn.classList.add('bi-play-circle-fill');
        }
    }

    function loadSong(card) {
        audio.src = card.dataset.audio;
        playerTitle.innerText = card.querySelector('.card-title').innerText;
        playerArtist.innerText = card.querySelector('.card-text').innerText;
        playerImg.src = card.querySelector('img').src;
        progressBar.style.width = '0%';
        currentTimeSpan.innerText = '0:00';
        durationSpan.innerText = '0:00';
        audio.addEventListener('loadedmetadata', function onMeta() {
            durationSpan.innerText = formatTime(audio.duration);
            audio.removeEventListener('loadedmetadata', onMeta);
        }, { once: true });
        currentSongCard = card;
    }

    function playSong() {
        if (!audio.src) return;
        audio.play().then(() => {
            isPlaying = true;
            updatePlayPauseIcon();
        }).catch(e => console.error('Playback failed:', e));
    }

    function pauseSong() {
        audio.pause();
        isPlaying = false;
        updatePlayPauseIcon();
    }

    function stopSong() {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        updatePlayPauseIcon();
    }

    // ========== FILTER CARDS (TOP BAR SEARCH) ==========
    function filterCards() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        allCards.forEach(card => {
            const title = card.querySelector('.card-title').innerText.toLowerCase();
            const artist = card.querySelector('.card-text').innerText.toLowerCase();
            const matches = title.includes(searchTerm) || artist.includes(searchTerm);
            card.closest('.col').classList.toggle('d-none', !matches);
        });

        if (currentSongCard && currentSongCard.closest('.col').classList.contains('d-none')) {
            stopSong();
            playerTitle.innerText = 'Song Title';
            playerArtist.innerText = 'Artist';
            playerImg.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'56\' viewBox=\'0 0 56 56\'%3E%3Crect width=\'56\' height=\'56\' fill=\'%231DB954\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23FFFFFF\' font-size=\'12\'%3ENow%3C/text%3E%3C/svg%3E';
            currentSongCard = null;
        }
    }

    // ========== THEME TOGGLE ==========
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            themeIcon.classList.remove('bi-sun-fill');
            themeIcon.classList.add('bi-moon-stars-fill');
        } else {
            themeIcon.classList.remove('bi-moon-stars-fill');
            themeIcon.classList.add('bi-sun-fill');
        }
    }

    // ========== EVENT LISTENERS ==========
    searchInput.addEventListener('input', filterCards);
    themeToggle.addEventListener('click', toggleTheme);

    allCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            openSongDetails(this);
        });
    });

    playPauseBtn.addEventListener('click', function() {
        if (!currentSongCard) {
            const firstVisible = Array.from(allCards).find(c => !c.closest('.col').classList.contains('d-none'));
            if (firstVisible) {
                loadSong(firstVisible);
                playSong();
            }
        } else {
            if (isPlaying) pauseSong();
            else playSong();
        }
    });

    nextBtn.addEventListener('click', function() {
        const visible = Array.from(allCards).filter(c => !c.closest('.col').classList.contains('d-none'));
        if (visible.length === 0) return;
        let nextIndex = 0;
        if (currentSongCard) {
            const curr = visible.indexOf(currentSongCard);
            nextIndex = (curr === -1) ? 0 : (curr + 1) % visible.length;
        }
        stopSong();
        loadSong(visible[nextIndex]);
        playSong();
    });

    prevBtn.addEventListener('click', function() {
        const visible = Array.from(allCards).filter(c => !c.closest('.col').classList.contains('d-none'));
        if (visible.length === 0) return;
        let prevIndex = visible.length - 1;
        if (currentSongCard) {
            const curr = visible.indexOf(currentSongCard);
            prevIndex = (curr === -1) ? visible.length - 1 : (curr - 1 + visible.length) % visible.length;
        }
        stopSong();
        loadSong(visible[prevIndex]);
        playSong();
    });

    audio.addEventListener('timeupdate', function() {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = percent + '%';
            currentTimeSpan.innerText = formatTime(audio.currentTime);
        }
    });

    audio.addEventListener('ended', () => nextBtn.click());

    seekBar.addEventListener('click', function(e) {
        if (!audio.duration) return;
        const rect = this.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });

    volumeContainer.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        audio.volume = percent;
        volumeBar.style.width = (percent * 100) + '%';
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterCards();
        }
    });

    // Set initial icon
    if (document.body.classList.contains('light-theme')) {
        themeIcon.classList.remove('bi-sun-fill');
        themeIcon.classList.add('bi-moon-stars-fill');
    }
});