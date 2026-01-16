// --- CONFIG & STATE ---
const Categories = {
    'cardio': { icon: '🏃', label: 'Cardio' },
    'strength': { icon: '💪', label: 'Strength' },
    'yoga': { icon: '🧘', label: 'Yoga' },
    'boxing': { icon: '🥊', label: 'Boxing' },
    'other': { icon: '⏱️', label: 'Other' }
};

let currentRoutine = {
    id: generateId(),
    name: "New Workout",
    category: "cardio",
    blocks: [
        { id: generateId(), type: 'interval', name: 'Warmup', duration: 5, unit: 'm', color: 'blue' },
        { id: generateId(), type: 'interval', name: 'Work', duration: 30, unit: 's', color: 'red' }
    ]
};

let rawData;
try {
    rawData = JSON.parse(localStorage.getItem('hiit_saved_routines'));
} catch (e) {
    rawData = [];
}

// If data exists but is the old "Object" format, we reset it to an empty Array to prevent crash
// If you want to keep old data, you would need to convert Object.values(rawData), but resetting is safer here.
let localRoutines = Array.isArray(rawData) ? rawData : []; 

let staticRoutines = []; 

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, dur, vol = 0.5) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}
const Sounds = {
    start: () => playTone(800, 'sine', 0.6, 0.5),
    beep: () => playTone(440, 'square', 0.2, 0.1),
    end: () => { playTone(150, 'sawtooth', 0.8, 0.5); setTimeout(() => playTone(150, 'sawtooth', 0.8, 0.5), 400); }
};

// --- INIT & LOADING ---
async function init() {
    renderEditor();
    
    // Attempt to fetch static JSON from folder
    try {
        const response = await fetch('presets.json');
        if (response.ok) {
            staticRoutines = await response.json();
        } else {
            console.log("No presets.json found, skipping.");
        }
    } catch (e) {
        console.log("Could not load presets.json (likely running locally without server).");
    }
}

// --- STORAGE & LIBRARY ---
function saveToLocal() {
    const name = document.getElementById('routine-name').value.trim();
    if(!name) return alert("Please enter a name");
    
    const cat = document.getElementById('routine-category').value;
    
    // Update current state meta
    currentRoutine.name = name;
    currentRoutine.category = cat;

    // Check if exists in local, if so update, else push
    const existingIdx = localRoutines.findIndex(r => r.name === name); // Simple name match
    if(existingIdx >= 0) {
        if(!confirm(`Overwrite "${name}"?`)) return;
        localRoutines[existingIdx] = JSON.parse(JSON.stringify(currentRoutine));
    } else {
        localRoutines.push(JSON.parse(JSON.stringify(currentRoutine)));
    }

    localStorage.setItem('hiit_saved_routines', JSON.stringify(localRoutines));
    alert("Saved to Browser Storage!");
}

function deleteLocal(idx) {
    if(confirm("Delete this workout?")) {
        localRoutines.splice(idx, 1);
        localStorage.setItem('hiit_saved_routines', JSON.stringify(localRoutines));
        openLibrary(); // Refresh
    }
}

function loadRoutine(source, idx) {
    if(source === 'local') {
        currentRoutine = JSON.parse(JSON.stringify(localRoutines[idx]));
    } else {
        currentRoutine = JSON.parse(JSON.stringify(staticRoutines[idx]));
        // Regenerate IDs so it doesn't conflict if we save it as a new local copy
        currentRoutine.id = generateId(); 
    }
    
    // Update inputs
    document.getElementById('routine-name').value = currentRoutine.name;
    document.getElementById('routine-category').value = currentRoutine.category || 'cardio';
    
    closeLibrary();
    renderEditor();
}

function exportJSON() {
    // Allows user to download current routine to put in the folder
    currentRoutine.name = document.getElementById('routine-name').value || "My Workout";
    currentRoutine.category = document.getElementById('routine-category').value;
    
    // We create a single object array for format consistency with presets.json
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([currentRoutine], null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", currentRoutine.name.replace(/\s+/g, '_') + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// --- UI: LIBRARY MODAL ---
function openLibrary() {
    document.getElementById('library-modal').classList.remove('hidden');
    renderLibraryGrid('lib-list-local', localRoutines, 'local');
    renderLibraryGrid('lib-list-static', staticRoutines, 'static');
}

function closeLibrary() {
    document.getElementById('library-modal').classList.add('hidden');
}

function renderLibraryGrid(elementId, dataArray, source) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    
    if(dataArray.length === 0) {
        el.innerHTML = '<div class="muted">No workouts found.</div>';
        return;
    }

    dataArray.forEach((routine, idx) => {
        const catKey = routine.category || 'other';
        const catInfo = Categories[catKey] || Categories['other'];
        
        // Calculate total time for display
        const totalSec = calculateTotalRecursive(routine.blocks);
        const timeStr = fmtTime(totalSec);

        const card = document.createElement('div');
        card.className = `lib-card cat-${catKey}`;
        card.innerHTML = `
            <div class="lib-info">
                <div class="lib-name">${catInfo.icon} ${routine.name}</div>
                <div class="lib-meta">${timeStr} • ${routine.blocks.length} blocks</div>
            </div>
            <div class="lib-actions">
                <button class="btn-primary btn-sm" onclick="loadRoutine('${source}', ${idx})">Load</button>
                ${source === 'local' ? `<button class="btn-danger btn-sm" onclick="deleteLocal(${idx})">🗑</button>` : ''}
            </div>
        `;
        el.appendChild(card);
    });
}

// --- EDITOR CORE ---
function renderEditor() {
    const container = document.getElementById('routine-container');
    container.innerHTML = '';
    
    // Sync inputs at top
    document.getElementById('routine-name').value = currentRoutine.name;
    document.getElementById('routine-category').value = currentRoutine.category || 'cardio';

    currentRoutine.blocks.forEach(item => container.appendChild(createBlockDOM(item)));
    updateTotalDisplay();
}

function updateTotalDisplay() {
    const total = calculateTotalRecursive(currentRoutine.blocks);
    document.getElementById('total-time').innerText = fmtTime(total);
}

function calculateTotalRecursive(blocks) {
    let seconds = 0;
    blocks.forEach(i => {
        if(i.type === 'interval') seconds += getDurationSeconds(i);
        if(i.type === 'loop') {
            const loopDur = calculateTotalRecursive(i.children);
            seconds += (loopDur * i.iterations);
        }
    });
    return seconds;
}

// --- DOM CREATION (Simplified from previous version) ---
function createBlockDOM(item) {
    const isMin = item.unit === 'm';
    const unitLabel = isMin ? 'MIN' : 'SEC';
    const unitClass = isMin ? 'unit-m' : 'unit-s';
    if(!item.color) item.color = 'red';
    const colorClass = `dot-${item.color}`;
    const borderStyle = item.color === 'red' ? '#ef4444' : (item.color === 'green' ? '#22c55e' : '#3b82f6');

    if (item.type === 'interval') {
        const div = document.createElement('div');
        div.className = 'block';
        div.style.borderLeftColor = borderStyle;
        div.innerHTML = `
            <div class="block-content">
                <div class="color-dot ${colorClass}" onclick="cycleColor('${item.id}')"></div>
                <input type="text" value="${item.name}" onchange="updateProp('${item.id}', 'name', this.value)" placeholder="Name">
                <input type="number" value="${item.duration}" onchange="updateProp('${item.id}', 'duration', this.value)" placeholder="0">
                <button class="unit-toggle ${unitClass}" onclick="toggleUnit('${item.id}')">${unitLabel}</button>
            </div>
            <button class="btn-danger btn-sm" onclick="removeItem('${item.id}')">✕</button>
        `;
        return div;
    } else {
        const div = document.createElement('div');
        div.className = 'loop-block';
        div.innerHTML = `
            <div class="loop-header">
                <div class="loop-controls">
                    <span>Loop</span>
                    <input type="number" value="${item.iterations}" onchange="updateProp('${item.id}', 'iterations', this.value)" style="width:60px;">
                    <span>times</span>
                </div>
                <div class="loop-controls">
                     <button class="btn-ghost btn-sm" onclick="addChild('${item.id}')">+ Child</button>
                     <button class="btn-danger btn-sm" onclick="removeItem('${item.id}')">✕</button>
                </div>
            </div>
            <div class="loop-children" id="children-${item.id}"></div>
        `;
        const childContainer = div.querySelector(`#children-${item.id}`);
        item.children.forEach(c => childContainer.appendChild(createBlockDOM(c)));
        return div;
    }
}

// --- HELPERS (CRUD) ---
function generateId() { return Math.random().toString(36).substr(2, 9); }

function findItem(blocks, id) {
    for(let i=0; i<blocks.length; i++) {
        if(blocks[i].id === id) return { parent: blocks, idx: i, item: blocks[i] };
        if(blocks[i].children) {
            const res = findItem(blocks[i].children, id);
            if(res) return res;
        }
    }
    return null;
}

function updateProp(id, key, val) {
    const res = findItem(currentRoutine.blocks, id);
    if(res) {
        if(key === 'duration' || key === 'iterations') val = parseInt(val) || 0;
        res.item[key] = val;
        renderEditor();
    }
}
function toggleUnit(id) {
    const res = findItem(currentRoutine.blocks, id);
    if(res) { res.item.unit = res.item.unit === 'm' ? 's' : 'm'; renderEditor(); }
}
function cycleColor(id) {
    const res = findItem(currentRoutine.blocks, id);
    if(res) {
        const map = { 'red': 'green', 'green': 'blue', 'blue': 'red' };
        res.item.color = map[res.item.color] || 'red';
        renderEditor();
    }
}
function addInterval() {
    currentRoutine.blocks.push({ id: generateId(), type: 'interval', name: 'Work', duration: 30, unit: 's', color: 'red' });
    renderEditor();
}
function addLoop() {
    currentRoutine.blocks.push({ id: generateId(), type: 'loop', iterations: 3, children: [] });
    renderEditor();
}
function addChild(parentId) {
    const res = findItem(currentRoutine.blocks, parentId);
    if(res) {
        res.item.children.push({ id: generateId(), type: 'interval', name: 'Action', duration: 20, unit: 's', color: 'red' });
        renderEditor();
    }
}
function removeItem(id) {
    const res = findItem(currentRoutine.blocks, id);
    if(res) {
        res.parent.splice(res.idx, 1);
        renderEditor();
    }
}
function getDurationSeconds(item) {
    if(item.type !== 'interval') return 0;
    return item.unit === 'm' ? item.duration * 60 : item.duration;
}
function fmtTime(s) {
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
}

// --- PLAYER LOGIC ---
let timeline = [];
let currentIndex = 0;
let timer = null;
let timeLeft = 0;
let isPaused = false;
let totalTimeInitial = 0;

function compileTimeline(blocks) {
    let q = [];
    blocks.forEach(i => {
        if(i.type === 'interval') {
            q.push({ 
                name: i.name, 
                duration: getDurationSeconds(i),
                unit: i.unit,
                color: i.color || 'red'
            });
        }
        if(i.type === 'loop') {
            for(let k=0; k<i.iterations; k++) {
                q = q.concat(compileTimeline(i.children));
            }
        }
    });
    return q;
}

function startWorkout() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    timeline = compileTimeline(currentRoutine.blocks);
    if(timeline.length === 0) return alert("Empty routine");

    totalTimeInitial = calculateTotalRecursive(currentRoutine.blocks);
    
    // Render timeline
    const list = document.getElementById('timeline-list');
    list.innerHTML = '';
    timeline.forEach((step, idx) => {
        const row = document.createElement('div');
        row.className = 'timeline-item';
        row.id = `step-${idx}`;
        row.onclick = () => jumpTo(idx);
        row.innerHTML = `<span>${idx+1}. ${step.name}</span><span class="timeline-time">${fmtTime(step.duration)}</span>`;
        list.appendChild(row);
    });

    document.getElementById('editor').classList.add('hidden');
    document.getElementById('player').classList.remove('hidden');
    
    currentIndex = 0;
    isPaused = false;
    startStep(currentIndex);
}

function jumpTo(idx) {
    if (idx >= timeline.length) return;
    clearInterval(timer);
    currentIndex = idx;
    startStep(currentIndex);
}

function startStep(idx) {
    if(idx >= timeline.length) return finish();

    document.querySelectorAll('.timeline-item').forEach(d => d.classList.remove('active'));
    const activeRow = document.getElementById(`step-${idx}`);
    if(activeRow) {
        activeRow.classList.add('active');
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const step = timeline[idx];
    const playerEl = document.getElementById('player');
    playerEl.className = ''; 
    playerEl.classList.add(`bg-${step.color}`);
    
    timeLeft = step.duration;
    updateDisplay();
    Sounds.start();

    clearInterval(timer);
    timer = setInterval(() => {
        if(!isPaused) {
            timeLeft--;
            updateDisplay();
            if(timeLeft <= 3 && timeLeft > 0) Sounds.beep();
            if(timeLeft <= 0) {
                clearInterval(timer);
                currentIndex++;
                startStep(currentIndex);
            }
        }
    }, 1000);
}

function updateDisplay() {
    const step = timeline[currentIndex];
    document.getElementById('play-name').innerText = step ? step.name : "DONE";
    document.getElementById('play-timer').innerText = step ? fmtTime(timeLeft) : "00:00";
    if(step) {
        const pct = (timeLeft / step.duration) * 100;
        document.getElementById('play-bar').style.width = pct + "%";
    }
    
    let elapsed = 0;
    for(let i=0; i<currentIndex; i++) elapsed += timeline[i].duration;
    if(step) elapsed += (step.duration - timeLeft);
    document.getElementById('play-total-progress').innerText = `${fmtTime(elapsed)} / ${fmtTime(totalTimeInitial)}`;
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('btn-pause').innerText = isPaused ? "▶ Resume" : "⏸ Pause";
}

function stopWorkout() {
    clearInterval(timer);
    document.getElementById('player').classList.add('hidden');
    document.getElementById('player').className = 'hidden'; // reset color
    document.getElementById('editor').classList.remove('hidden');
}

function finish() {
    Sounds.end();
    document.getElementById('play-name').innerText = "COMPLETE";
    document.getElementById('play-timer').innerText = "00:00";
    document.getElementById('play-bar').style.width = "0%";
    document.getElementById('player').className = 'bg-blue';
    clearInterval(timer);
}

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeLibrary();
    }
});

// Start app
init();