// Variables
let timerInterval;
let timeLeft = 25 * 60; // 25 mins default
let isRunning = false;
let currentMode = 'pomodoro';

// 1. Loading Screen (3 Sec Fake Load)
window.onload = function() {
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
}

function toggleTimer() {
    const btn = document.getElementById('start-btn');
    const aiFeed = document.getElementById('ai-feed');
    
    if (isRunning) {
        // PAUSE
        clearInterval(timerInterval);
        isRunning = false;
        btn.innerText = "START";
        aiFeed.classList.add('hidden'); // Hide AI Camera
    } else {
        // START
        isRunning = true;
        btn.innerText = "PAUSE";
        aiFeed.classList.remove('hidden'); // Show AI Camera
        
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                // Time's up!
                clearInterval(timerInterval);
                document.getElementById('alarm-audio').play(); // Play selected alarm
                aiFeed.classList.add('hidden');
                isRunning = false;
                btn.innerText = "START";
                alert("Session Complete! Take a break.");
            }
        }, 1000);
    }
}

// 5. Mode Switcher (Pomodoro / Short / Long)
function setMode(mode) {
    clearInterval(timerInterval);
    isRunning = false;
    document.getElementById('start-btn').innerText = "START";
    document.getElementById('ai-feed').classList.add('hidden');
    
    if (mode === 'pomodoro') timeLeft = 25 * 60;
    if (mode === 'short') timeLeft = 5 * 60;
    if (mode === 'long') timeLeft = 15 * 60;
    
    updateDisplay();
}

// 6. Settings Toggle
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('hidden');
}