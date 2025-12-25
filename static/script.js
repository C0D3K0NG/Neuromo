// Variables
let timerInterval;
let timeLeft = 25 * 60; // 25 mins default
let isRunning = false;
let currentMode = 'pomodoro';

let sessionCount = 0; // Track completed focus sessions

// TASK SYSTEM STATE
let tasks = [];
let currentTaskId = null;
let newTaskPriority = 1;

// 1. Loading Screen (3 Sec Fake Load)
// 1. Loading Screen (3 Sec Fake Load)
window.onload = function () {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 1000);
    }, 3000);

    // ANALYTICS: Generate/Retrieve User Token
    if (!localStorage.getItem('user_token')) {
        // Simple UUID generator fallback
        const token = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_token', token);
        console.log("🔑 New User Token Generated:", token);
    } else {
        console.log("🔑 User Token Found:", localStorage.getItem('user_token'));
    }

    // Set default alarm
    const alarmSelect = document.getElementById('alarm-selector');
    if (alarmSelect.options.length > 0) {
        changeAlarm(alarmSelect.options[0].value);
    }
    if (alarmSelect.options.length > 0) {
        changeAlarm(alarmSelect.options[0].value);
    }
    updateStreakDisplay();

    // TASK SYSTEM: Load Tasks
    fetchTasks();
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
        sessionCount++;
        updateStreakDisplay();

        // ANALYTICS: Save Session
        saveSessionToDB('pomodoro', 25 * 60);

        // TASK SYSTEM: Track Time
        if (currentTaskId) {
            updateTaskTime(currentTaskId, 25 * 60);
        }

        setMode('short');
        showToast("Break Time! Relax.", "info");
        sendNotification("Break Time! Relax.");
        // Auto-Start
        setTimeout(() => toggleTimer(), 1000);
    } else if (currentMode === 'short') {
        // ANALYTICS: Save Session
        saveSessionToDB('short', 5 * 60);

        // Short Break -> Focus
        setMode('pomodoro');
        showToast("Focus Time! Let's go.", "success");
        sendNotification("Focus Time! Let's go.");
        // Auto-Start
        setTimeout(() => toggleTimer(), 1000);
    } else {
        // ANALYTICS: Save Session
        saveSessionToDB('long', 15 * 60);

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
        syncStats(); // Sync stats on pause

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
    const mainInterface = document.getElementById('main-interface');

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

        // Sync stats every 30 seconds (approx)
        const now = Date.now();
        if (!window.lastSyncTime || (now - window.lastSyncTime > 30000)) {
            syncStats();
            window.lastSyncTime = now;
        }
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

// 13. Update Streak Display
function updateStreakDisplay() {
    const container = document.getElementById('streak-container');
    if (!container) return;

    // Clear current dots (keep the label if possible, but easier to rebuild)
    container.innerHTML = '<span class="text-xs text-gray-500 font-mono mr-2">SESSION</span>';

    // Max dots to show (e.g., 4 per set)
    const totalDots = 4;
    const filledDots = sessionCount % totalDots; // Cycle every 4

    // If we just finished a set of 4, show all filled
    const displayFilled = (sessionCount > 0 && filledDots === 0) ? 4 : filledDots;

    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('div');
        if (i < displayFilled) {
            // Filled Dot
            dot.className = "w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]";
        } else {
            // Empty Dot
            dot.className = "w-3 h-3 rounded-full bg-white/20 border border-white/30";
        }
        container.appendChild(dot);
    }
}

// ==========================================
// 14. ANALYTICS (SPA LOGIC)
// ==========================================

let analyticsFilter = 'today';
let analyticsCharts = {};

function toggleAnalyticsView() {
    const view = document.getElementById('analytics-view');
    const mainInterface = document.getElementById('main-interface');

    if (view.classList.contains('hidden')) {
        // OPEN
        view.classList.remove('hidden');
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => {
            view.classList.remove('opacity-0', 'scale-95');
        }, 10);

        // Blur background
        mainInterface.classList.add('blur-sm', 'brightness-50');

        // Fetch Data
        fetchAnalyticsData();
    } else {
        // CLOSE
        view.classList.add('opacity-0', 'scale-95');
        mainInterface.classList.remove('blur-sm', 'brightness-50');

        // Wait for transition to finish before hiding
        setTimeout(() => {
            view.classList.add('hidden');
        }, 300);
    }
}

function setFilter(filter) {
    analyticsFilter = filter;

    // Update Buttons
    const btnToday = document.getElementById('btn-today');
    const btnAll = document.getElementById('btn-all');

    if (filter === 'today') {
        btnToday.className = "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition bg-white/20 text-white shadow-sm";
        btnAll.className = "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition";
    } else {
        btnAll.className = "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition bg-white/20 text-white shadow-sm";
        btnToday.className = "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition";
    }

    fetchAnalyticsData();
}

async function fetchAnalyticsData() {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
        const headers = { 'X-User-Token': token };

        // A. Get Aggregated Stats
        const statsResponse = await fetch('/api/stats', { headers });
        const statsData = await statsResponse.json();

        // B. Get History
        const historyResponse = await fetch('/api/session/history', { headers });
        const historyData = await historyResponse.json();

        updateAnalyticsUI(statsData, historyData);

    } catch (e) {
        console.error("Failed to load analytics:", e);
    }
}

function updateAnalyticsUI(stats, history) {
    let filteredHistory = history;

    // Client-side filtering for History Chart
    if (analyticsFilter === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        filteredHistory = history.filter(item => new Date(item.timestamp) >= startOfDay);
    }

    // Update Counters
    document.getElementById('stat-distractions').innerText = stats.distracted || 0;
    document.getElementById('stat-sleep').innerText = stats.sleep || 0;

    // Render Charts
    renderPieChart(stats);
    renderHistoryChart(filteredHistory);
}

function renderPieChart(stats) {
    const ctx = document.getElementById('chart-pie').getContext('2d');

    if (analyticsCharts.pie) analyticsCharts.pie.destroy();

    analyticsCharts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Distracted', 'Sleepy', 'Focused (Est)'],
            datasets: [{
                data: [stats.distracted, stats.sleep, Math.max(10, 100 - stats.distracted - stats.sleep)],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(34, 197, 94, 0.6)'
                ],
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#9ca3af', font: { family: 'monospace' } } }
            }
        }
    });
}

function renderHistoryChart(history) {
    const ctx = document.getElementById('chart-history').getContext('2d');
    if (analyticsCharts.history) analyticsCharts.history.destroy();

    const labels = history.map(item => {
        const d = new Date(item.timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }).reverse();

    const dataPoints = history.map(item => Math.round(item.duration / 60)).reverse();
    const colors = history.map(item => {
        if (item.type === 'pomodoro') return 'rgba(34, 197, 94, 0.5)';
        if (item.type === 'short') return 'rgba(59, 130, 246, 0.5)';
        return 'rgba(168, 85, 247, 0.5)';
    }).reverse();

    analyticsCharts.history = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Session Duration (Minutes)',
                data: dataPoints,
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 10,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#6b7280', stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#6b7280' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==========================================
// 15. ADVANCED TASK SYSTEM
// ==========================================

function toggleTaskSidebar() {
    const sidebar = document.getElementById('task-sidebar');
    if (sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
    } else {
        sidebar.classList.add('translate-x-full');
    }
}

function toggleTaskView() {
    const view = document.getElementById('task-view');
    const mainInterface = document.getElementById('main-interface');

    // Close Sidebar if open
    document.getElementById('task-sidebar').classList.add('translate-x-full');

    if (view.classList.contains('hidden')) {
        // OPEN
        view.classList.remove('hidden');
        setTimeout(() => view.classList.remove('opacity-0', 'scale-95'), 10);
        mainInterface.classList.add('blur-sm', 'brightness-50');
    } else {
        // CLOSE
        view.classList.add('opacity-0', 'scale-95');
        mainInterface.classList.remove('blur-sm', 'brightness-50');
        setTimeout(() => view.classList.add('hidden'), 300);
    }
}

// --- DATA LOGIC ---

async function fetchTasks() {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
        const res = await fetch('/api/tasks', { headers: { 'X-User-Token': token } });
        tasks = await res.json();
        renderTasks(); // Updates both Sidebar and Overlay
    } catch (e) {
        console.error("Failed to fetch tasks:", e);
    }
}

async function addTask() {
    const input = document.getElementById('new-task-input');
    const title = input.value.trim();
    if (!title) return showToast("Enter a task title!", "error");

    const token = localStorage.getItem('user_token');

    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Token': token },
            body: JSON.stringify({ title: title, priority: newTaskPriority })
        });

        if (res.ok) {
            input.value = ""; // Clear input
            showToast("Task added!", "success");
            fetchTasks(); // Reload
        }
    } catch (e) {
        console.error("Add task failed:", e);
    }
}

async function toggleTaskComplete(id, currentStatus) {
    const token = localStorage.getItem('user_token');
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Token': token },
            body: JSON.stringify({ is_completed: !currentStatus })
        });
        fetchTasks(); // Refresh to re-sort/move
    } catch (e) {
        console.error("Update failed:", e);
    }
}

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    const token = localStorage.getItem('user_token');
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'X-User-Token': token }
        });
        fetchTasks();
        showToast("Task deleted", "success");
    } catch (e) {
        console.error("Delete failed:", e);
    }
}

async function updateTaskTime(id, seconds) {
    const token = localStorage.getItem('user_token');
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Token': token },
            body: JSON.stringify({ add_seconds: seconds })
        });
        console.log(`⏱️ Added ${seconds}s to Task ${id}`);
        // We do NOT call fetchTasks() here to avoid re-rendering entire UI during focus session end
        // But maybe we should to update the sidebar time? Yes.
        fetchTasks();
    } catch (e) {
        console.error("Time update failed:", e);
    }
}

// --- HELPER: Save Session to DB ---
async function saveSessionToDB(type, duration) {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
        await fetch('/api/session/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Token': token },
            body: JSON.stringify({ type: type, duration: duration })
        });
        console.log(`💾 Session saved: ${type} (${duration}s)`);
    } catch (e) {
        console.error("Save session failed:", e);
    }
}

// --- HELPER: Sync Stats (Incremental Save) ---
async function syncStats() {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
        await fetch('/api/stats/sync', {
            method: 'POST',
            headers: { 'X-User-Token': token }
        });
        // Console log optional, keeping it quiet for periodic syncs
    } catch (e) {
        console.error("Sync stats failed:", e);
    }
}

// --- UI RENDERING ---

function setNewTaskPriority(p) {
    newTaskPriority = p;
    // Update UI stars
    document.querySelectorAll('.star-btn').forEach(btn => {
        const val = parseInt(btn.dataset.val);
        if (val <= p) btn.classList.add('text-yellow-400');
        else btn.classList.remove('text-yellow-400');
    });
}

function setActiveTask(id) {
    currentTaskId = id;
    renderTasks(); // Re-render to show active state

    // Update Dashboard UI (Show toast)
    const task = tasks.find(t => t.id === id);
    if (task) {
        showToast(`Focusing on: ${task.title}`, "info");
    }
}

function formatTime(seconds) {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function renderTasks() {
    const sidebarList = document.getElementById('sidebar-task-list');
    const fullList = document.getElementById('full-task-list');

    if (!sidebarList || !fullList) return;

    sidebarList.innerHTML = '';
    fullList.innerHTML = '';

    // Sort: Active first, then by Priority

    if (tasks.length === 0) {
        sidebarList.innerHTML = '<p class="text-xs text-gray-500 text-center italic mt-10">No active tasks.</p>';
        fullList.innerHTML = '<p class="text-gray-500 text-center col-span-2 italic mt-10">No tasks created yet.</p>';
        return;
    }

    // Clone tasks to avoid mutating state order if we want, but sort is fine
    // Sort orders: Uncompleted first, then Priority DESC, then ID DESC
    // BUT Active task should be topmost in Sidebar

    // We already get sorted data from API mostly, but Active Task styling handles visibility.

    tasks.forEach(task => {
        // 1. SIDEBAR ITEM
        if (!task.is_completed) {
            const isActive = task.id === currentTaskId;
            const sidebarItem = document.createElement('div');
            sidebarItem.className = `relative glass p-3 rounded-lg flex items-center gap-3 transition cursor-pointer group ${isActive ? 'border-l-4 border-green-400 bg-white/10' : 'hover:bg-white/5'}`;
            sidebarItem.innerHTML = `
                <button onclick="event.stopPropagation(); toggleTaskComplete(${task.id}, ${task.is_completed})" class="text-gray-500 hover:text-green-400 transition z-10">
                    <span class="material-icons text-lg">radio_button_unchecked</span>
                </button>
                <div class="flex-grow min-w-0" onclick="setActiveTask(${task.id})">
                    <h4 class="text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-gray-300 group-hover:text-white'}">${task.title}</h4>
                    <div class="flex items-center gap-2">
                         <span class="flex text-[8px] text-yellow-500 tracking-tighter">${'★'.repeat(task.priority)}</span>
                         <span class="text-[10px] text-gray-500 ml-auto">${formatTime(task.total_seconds)}</span>
                    </div>
                </div>
            `;
            sidebarList.appendChild(sidebarItem);
        }

        // 2. FULL OVERLAY ITEM
        const fullItem = document.createElement('div');
        fullItem.className = `relative glass p-4 rounded-xl flex items-center justify-between group ${task.is_completed ? 'opacity-50' : ''}`;
        fullItem.innerHTML = `
            <div class="flex items-center gap-4 flex-grow">
                <button onclick="toggleTaskComplete(${task.id}, ${task.is_completed})" class="text-gray-400 hover:text-green-400 transition">
                    <span class="material-icons text-2xl">${task.is_completed ? 'check_circle' : 'radio_button_unchecked'}</span>
                </button>
                <div>
                     <h3 class="text-lg font-bold ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}">${task.title}</h3>
                     <div class="flex items-center gap-3 mt-1">
                        <span class="flex text-yellow-500 text-xs">${'★'.repeat(task.priority)}</span>
                        <span class="text-xs font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded">⏱ ${formatTime(task.total_seconds)}</span>
                     </div>
                </div>
            </div>
            <button onclick="event.stopPropagation(); window.deleteTask(${task.id})" class="text-gray-500 hover:text-red-400 transition bg-white/5 hover:bg-white/10 p-2 rounded-full absolute right-4 opacity-100">
                <span class="material-icons text-sm">delete</span>
            </button>
        `;
        fullList.appendChild(fullItem);
    });
}

// --- EXPOSE GLOBALS ---
window.toggleTaskSidebar = toggleTaskSidebar;
window.toggleTaskView = toggleTaskView;
window.fetchTasks = fetchTasks;
window.addTask = addTask;
window.toggleTaskComplete = toggleTaskComplete;
window.deleteTask = deleteTask;
window.updateTaskTime = updateTaskTime;
window.setNewTaskPriority = setNewTaskPriority;
window.setActiveTask = setActiveTask;
