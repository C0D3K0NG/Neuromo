// Variables
let timerInterval;
let timeLeft = 25 * 60; // 25 mins default
let isRunning = false;
let currentMode = 'pomodoro';

// 1. Loading Screen (3 Sec Fake Load)
window.onload = function () {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 1000);
    }, 3000);

    // Set default alarm
    const alarmSelect = document.getElementById('alarm-selector');
    if (alarmSelect.options.length > 0) {
        changeAlarm(alarmSelect.options[0].value);
    }
};

// 2. Change Background Dynamically
function changeBackground(filename) {
    document.body.style.backgroundImage = `url('/static/background/${filename}')`;
}

// 3. Change Alarm Dynamically
function changeAlarm(filename) {
    const audio = document.getElementById('alarm-audio');
    audio.src = `/static/alarm/${filename}`;
}

// 4. Timer Logic
function updateDisplay() {
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    document.getElementById('timer-display').innerText =
        `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // UX: Update Tab Title
    document.title = `${mins}:${secs < 10 ? '0' : ''}${secs} - ${currentMode === 'pomodoro' ? 'Focus' : 'Break'}`;
}

// UX: Request Notification Permission
if ("Notification" in window) {
    Notification.requestPermission();
}

function sendNotification(msg) {
    if (Notification.permission === "granted") {
        new Notification("Neuromo", { body: msg, icon: "/static/favicon.ico" });
    }
}

// UX: Prevent Accidental Close
window.addEventListener('beforeunload', (e) => {
    if (isRunning) {
        e.preventDefault();
        e.returnValue = '';
    }
});

function adjustTime(minutes) {
    if (isRunning) {
        showToast("Pause timer to adjust time", "error");
        return;
    }

    let newTime = timeLeft + (minutes * 60);
    if (newTime < 60) newTime = 60; // Min 1 min
    if (newTime > 60 * 60) newTime = 60 * 60; // Max 60 min

    timeLeft = newTime;
    updateDisplay();
}

function playIntervalBeep() {
    const beep = document.getElementById('interval-beep');
    if (beep) {
        beep.currentTime = 0;
        beep.play().catch(e => console.log("Audio play failed:", e));
    }
}

function handleTimerComplete() {
    clearInterval(timerInterval);
    isRunning = false;
    document.getElementById('start-btn').innerText = "START";

    // Play Beep
    playIntervalBeep();

    // Loop Logic
    if (currentMode === 'pomodoro') {
        // Focus -> Short Break
        setMode('short');
        showToast("Break Time! Relax.", "info");
        sendNotification("Break Time! Relax.");
        // Auto-Start
        setTimeout(() => toggleTimer(), 1000);
    } else if (currentMode === 'short') {
        // Short Break -> Focus
        setMode('pomodoro');
        showToast("Focus Time! Let's go.", "success");
        sendNotification("Focus Time! Let's go.");
        // Auto-Start
        setTimeout(() => toggleTimer(), 1000);
    } else {
        // Long Break -> Stop
        document.getElementById('alarm-audio').play();
        toggleCamera(false);
        alert("Long Break Complete!");
    }
}

function toggleTimer() {
    const btn = document.getElementById('start-btn');

    if (isRunning) {
        // === USER CLICKED PAUSE ===
        clearInterval(timerInterval);
        isRunning = false;
        btn.innerText = "START";

        // 🛑 STOP EVERYTHING
        stopAlarm();
        toggleCamera(false); // Turn off camera

    } else {
        // === USER CLICKED START ===
        isRunning = true;
        btn.innerText = "PAUSE";

        // 🟢 START EVERYTHING
        if (currentMode === 'pomodoro') {
            toggleCamera(true); // Turn on camera ONLY for Focus
        } else {
            toggleCamera(false); // Ensure OFF for breaks
        }

        playIntervalBeep(); // Play start beep

        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                // Time's up!
                handleTimerComplete();
            }
        }, 1000);
    }
}

// 5. Mode Switcher (Pomodoro / Short / Long)
function setMode(mode) {
    // 1. Reset Logic
    clearInterval(timerInterval);
    isRunning = false;
    document.getElementById('start-btn').innerText = "START";

    // 2. 🛑 FORCE STOP CAMERA & ALARM
    stopAlarm();
    toggleCamera(false);

    // Update Global Mode
    currentMode = mode;

    // 3. Set Time
    const statusBox = document.getElementById('mode-status');

    if (mode === 'pomodoro') {
        timeLeft = 25 * 60;
        if (statusBox) {
            statusBox.innerText = "Focus Time";
            statusBox.dataset.status = "focus";
            statusBox.className = "glass px-6 py-2 rounded-lg mb-4 text-sm font-mono tracking-widest uppercase text-green-400 border border-green-500/30";
        }
    }
    if (mode === 'short') {
        timeLeft = 5 * 60;
        if (statusBox) {
            statusBox.innerText = "Break Time";
            statusBox.dataset.status = "break";
            statusBox.className = "glass px-6 py-2 rounded-lg mb-4 text-sm font-mono tracking-widest uppercase text-blue-400 border border-blue-500/30";
        }
    }
    if (mode === 'long') {
        timeLeft = 15 * 60;
        if (statusBox) {
            statusBox.innerText = "Long Break";
            statusBox.dataset.status = "break";
            statusBox.className = "glass px-6 py-2 rounded-lg mb-4 text-sm font-mono tracking-widest uppercase text-purple-400 border border-purple-500/30";
        }
    }

    updateDisplay();
}

// 6. Settings Toggle
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('hidden');
}

// 7. Music Player Toggle - Simplified Control
window.LOFI_VIDEO_URL = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&controls=0&modestbranding=1&loop=1&playlist=jfKfPfyJRdk";

function toggleMusic() {
    const musicPlayer = document.getElementById('music-player');
    const lofiPlayer = document.getElementById('lofi-player');

    if (musicPlayer.classList.contains('hidden')) {
        // First click: Open player and start music (autoplay=1)
        musicPlayer.classList.remove('hidden');
        lofiPlayer.src = window.LOFI_VIDEO_URL || "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&controls=0&modestbranding=1&loop=1&playlist=jfKfPfyJRdk";
    } else {
        // Second click: Close player and stop music
        lofiPlayer.src = ""; // This stops the video completely
        musicPlayer.classList.add('hidden');
    }
}

// Check AI status every 1 second
setInterval(() => {
    // Only check if timer is running!
    if (isRunning) {
        fetch('/status')
            .then(response => response.json())
            .then(data => {
                const aiFeed = document.getElementById('ai-feed');

                if (data.status === "alarm") {
                    // Play Alarm
                    document.getElementById('alarm-audio').play();

                    // Visual Warning (Red Border)
                    aiFeed.classList.remove('border-green-500');
                    aiFeed.classList.add('border-red-600', 'animate-pulse');
                } else {
                    // Back to Normal
                    document.getElementById('alarm-audio').pause();
                    aiFeed.classList.remove('border-red-600', 'animate-pulse');
                    aiFeed.classList.add('border-green-500');
                }
            });
    }
}, 1000);

// --- HELPER: Turn Camera On/Off ---
// --- HELPER: Turn Camera On/Off ---
function toggleCamera(turnOn) {
    const streamImg = document.getElementById('camera-stream');
    const aiFeed = document.getElementById('ai-feed');
    const statusBox = document.getElementById('mode-status');

    // STRICT CHECK: If status is NOT 'focus', FORCE OFF.
    if (statusBox && statusBox.dataset.status !== 'focus') {
        console.log("Camera blocked by status check (Not Focus Mode)");
        turnOn = false;
    }

    if (turnOn) {
        // 1. Reconnect the stream (Turns Camera Light ON)
        streamImg.src = "/video_feed";
        aiFeed.classList.remove('hidden');
    } else {
        // 2. Disconnect the stream (Turns Camera Light OFF)
        streamImg.src = "";
        aiFeed.classList.add('hidden');
    }
}

// --- HELPER: Stop the Alarm Instantly ---
function stopAlarm() {
    const audio = document.getElementById('alarm-audio');
    audio.pause();       // Stop sound
    audio.currentTime = 0; // Rewind to start

    // Remove the red warning border if it exists
    const aiFeed = document.getElementById('ai-feed');
    aiFeed.classList.remove('border-red-600', 'animate-pulse');
    aiFeed.classList.add('border-green-500');
}

// Toast Notification System
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = `fixed top-20 right-5 glass px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transform translate-x-full transition-all duration-300`;

    // Icon based on type
    const iconName = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    const bgColor = type === 'success' ? 'bg-green-500/20' : type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20';
    const textColor = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400';
    const iconColor = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400';

    toast.innerHTML = `
        <span class="material-icons ${iconColor}">${iconName}</span>
        <span class="${textColor} font-medium">${message}</span>
    `;
    toast.classList.add(bgColor);

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 8. YouTube URL Change Function
function changeYouTubeUrl(url) {
    if (!url || url.trim() === '') {
        showToast('Please enter a valid YouTube URL', 'error');
        return;
    }

    // Extract video ID from various YouTube URL formats
    let videoId = '';

    // Handle youtube.com/watch?v=ID
    if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
    }
    // Handle youtu.be/ID
    else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    // Handle youtube.com/embed/ID
    else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    }

    if (!videoId) {
        showToast('Could not extract video ID. Please use a valid YouTube link.', 'error');
        return;
    }

    // Build the embed URL with autoplay and loop
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}`;

    // Update the global URL
    window.LOFI_VIDEO_URL = embedUrl;

    // Save to localStorage
    localStorage.setItem('youtubeUrl', embedUrl);

    // If player is currently open, update it
    const musicPlayer = document.getElementById('music-player');
    const lofiPlayer = document.getElementById('lofi-player');

    if (!musicPlayer.classList.contains('hidden')) {
        lofiPlayer.src = embedUrl;
    }

    showToast('YouTube URL updated successfully!', 'success');
}

// Load saved YouTube URL on page load
window.addEventListener('load', function () {
    const savedUrl = localStorage.getItem('youtubeUrl');
    if (savedUrl) {
        window.LOFI_VIDEO_URL = savedUrl;
        document.getElementById('youtube-url').value = savedUrl;
    }
});



// 9. Background Preview Gallery Toggle
function toggleBackgroundPreview() {
    const gallery = document.getElementById('bg-preview-gallery');
    gallery.classList.toggle('hidden');
}

// 10. Select Background from Preview
function selectBackground(filename) {
    changeBackground(filename);
    document.getElementById('bg-selector').value = filename;
    showToast('Background changed!', 'success');
}

// 11. Keyboard Shortcuts
document.addEventListener('keydown', function (event) {
    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return;
    }

    const key = event.key.toLowerCase();

    switch (key) {
        case ' ':
            event.preventDefault();
            toggleTimer();
            break;
        case 'r':
            event.preventDefault();
            resetTimer();
            break;
        case '1':
            event.preventDefault();
            setMode('pomodoro');
            showToast('Pomodoro mode', 'info');
            break;
        case '2':
            event.preventDefault();
            setMode('short');
            showToast('Short break mode', 'info');
            break;
        case '3':
            event.preventDefault();
            setMode('long');
            showToast('Long break mode', 'info');
            break;
        case 'm':
            event.preventDefault();
            toggleMusic();
            break;
        case 's':
            event.preventDefault();
            toggleSettings();
            break;
        case 'escape':
            event.preventDefault();
            // Close settings if open
            const settingsModal = document.getElementById('settings-modal');
            if (!settingsModal.classList.contains('hidden')) {
                toggleSettings();
            }
            // Close music player if open
            const musicPlayer = document.getElementById('music-player');
            if (!musicPlayer.classList.contains('hidden')) {
                toggleMusic();
            }
            break;
    }
});

// Reset Timer Function
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    document.getElementById('start-btn').innerText = 'START';

    // Reset to current mode's time
    if (currentMode === 'pomodoro') timeLeft = 25 * 60;
    if (currentMode === 'short') timeLeft = 5 * 60;
    if (currentMode === 'long') timeLeft = 15 * 60;

    updateDisplay();
    stopAlarm();
    toggleCamera(false);
    showToast('Timer reset', 'info');
}

// 12. Toggle Keyboard Shortcuts Guide
function toggleShortcutsGuide() {
    const guide = document.getElementById('shortcuts-guide');
    const arrow = document.getElementById('shortcuts-arrow');

    guide.classList.toggle('hidden');

    // Rotate arrow icon
    if (guide.classList.contains('hidden')) {
        arrow.innerText = 'expand_more';
    } else {
        arrow.innerText = 'expand_less';
    }
}
