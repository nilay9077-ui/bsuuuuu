const socket = io();

const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=ffd966',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=93c5fd',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy&backgroundColor=86efac',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=fbbf24',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=c4b5fd',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=93c5fd',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=fda4af',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=fde68a',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=93c5fd',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=fda4af',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=86efac',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah&backgroundColor=fde68a',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava&backgroundColor=fda4af',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan&backgroundColor=fbbf24',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=fda4af',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben&backgroundColor=86efac'
];

const faculties = [
    "Mexanika-riyaziyyat",
    "Tətbiqi riyaziyyat və kibernetika",
    "Fizika",
    "Kimya",
    "Biologiya",
    "Ekologiya və torpaqşünaslıq",
    "Coğrafiya",
    "Geologiya",
    "Filologiya",
    "Tarix",
    "Beynəlxalq münasibətlər və iqtisadiyyat",
    "Hüquq",
    "Jurnalistika",
    "İnformasiya və sənəd menecmenti",
    "Şərqşünaslıq",
    "Sosial elmlər və psixologiya"
];

let currentUser = null;
let currentChat = { type: 'faculty', data: null };
let selectedUserId = null;
let facultyUsers = [];
let editSelectedAvatar = 1;

// Initialize
async function init() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }

        currentUser = await response.json();
        
        // Connect socket
        socket.emit('user_connected', currentUser.id);
        
        // Load UI
        loadUserInfo();
        loadPublicSettings();
        loadFacultyChat();
        loadFacultyUsers();
        
        // Setup socket listeners
        setupSocketListeners();
    } catch (error) {
        console.error('Init error:', error);
        window.location.href = '/';
    }
}

function setupSocketListeners() {
    socket.on('new_message', (message) => {
        if (currentChat.type === 'faculty' && !message.isPrivate) {
            appendMessage(message);
        } else if (currentChat.type === 'private' && message.isPrivate) {
            if (message.sender.id === currentChat.data || message.sender.id === currentUser.id) {
                appendMessage(message);
            }
        }
    });

    socket.on('messages_loaded', (messages) => {
        displayMessages(messages);
    });

    socket.on('faculty_users_loaded', (users) => {
        facultyUsers = users;
        displayFacultyUsers(users);
    });

    socket.on('settings_updated', ({ key, value }) => {
        if (key === 'topic_of_day') {
            document.querySelector('#topicOfDay p').textContent = value;
        }
    });

    socket.on('error', (data) => {
        alert(data.message);
    });
}

function loadUserInfo() {
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userFaculty').textContent = `${currentUser.faculty} - ${currentUser.degree} ${currentUser.course}`;
    document.getElementById('userAvatar').innerHTML = `<img src="${avatars[currentUser.avatar - 1]}" alt="Avatar">`;
    document.getElementById('facultyButton').textContent = currentUser.faculty;
}

async function loadPublicSettings() {
    try {
        const response = await fetch('/api/settings/public');
        const settings = await response.json();
        
        document.querySelector('#topicOfDay p').textContent = settings.topic_of_day || 'Xoş gəlmisiniz!';
    } catch (error) {
        console.error('Load settings error:', error);
    }
}

function loadFacultyChat() {
    currentChat = { type: 'faculty', data: null };
    document.getElementById('chatTitle').textContent = `${currentUser.faculty} - Fakültə Söhbəti`;
    socket.emit('get_messages', { faculty: currentUser.faculty, isPrivate: false });
}

function loadFacultyUsers() {
    socket.emit('get_faculty_users', currentUser.faculty);
}

function displayFacultyUsers(users) {
    const container = document.getElementById('facultyUsersList');
    container.innerHTML = '';

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.onclick = () => showUserModal(user);
        userDiv.innerHTML = `
            <div class="avatar">
                <img src="${avatars[user.avatar - 1]}" alt="Avatar">
            </div>
            <div class="user-item-info">
                <h4>${user.full_name}</h4>
                <p>${user.degree} ${user.course}</p>
            </div>
        `;
        container.appendChild(userDiv);
    });
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    messages.forEach(message => {
        appendMessage(message, false);
    });

    scrollToBottom();
}

function appendMessage(message, scroll = true) {
    const container = document.getElementById('messagesContainer');
    const isOwn = message.sender.id === currentUser.id;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (isOwn ? ' own' : '');
    
    const date = new Date(message.createdAt);
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    messageDiv.innerHTML = `
        <div class="avatar" onclick='showUserModal(${JSON.stringify(message.sender)})'>
            <img src="${avatars[message.sender.avatar - 1]}" alt="Avatar">
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.sender.full_name}</span>
                <span class="message-info">${message.sender.degree} ${message.sender.course}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-bubble">${escapeHtml(message.message)}</div>
            ${!isOwn ? `
                <div class="message-actions">
                    <button class="btn-action" onclick='showUserModal(${JSON.stringify(message.sender)})' title="Daha çox">⋮</button>
                </div>
            ` : ''}
        </div>
    `;

    container.appendChild(messageDiv);

    if (scroll) {
        scrollToBottom();
    }
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    const data = {
        message,
        isPrivate: currentChat.type === 'private',
        faculty: currentChat.type === 'faculty' ? currentUser.faculty : null,
        receiverId: currentChat.type === 'private' ? currentChat.data : null
    };

    socket.emit('send_message', data);
    input.value = '';
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function showUserModal(user) {
    selectedUserId = user.id;
    
    document.getElementById('modalAvatar').innerHTML = `<img src="${avatars[user.avatar - 1]}" alt="Avatar">`;
    document.getElementById('modalUserName').textContent = user.full_name;
    document.getElementById('modalUserInfo').textContent = `${user.faculty} - ${user.degree} ${user.course}`;
    
    document.getElementById('userModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('userModal').classList.add('hidden');
}

function startPrivateChat() {
    closeModal();
    
    const user = facultyUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    currentChat = { type: 'private', data: selectedUserId };
    document.getElementById('chatTitle').textContent = `${user.full_name} - Şəxsi Söhbət`;
    
    socket.emit('get_messages', { receiverId: selectedUserId, isPrivate: true });
}

async function blockUser() {
    if (!confirm('Bu istifadəçini bloklamaq istədiyinizə əminsiniz?')) return;

    try {
        const response = await fetch(`/api/block/${selectedUserId}`, { method: 'POST' });
        
        if (response.ok) {
            alert('İstifadəçi bloklandı');
            closeModal();
            loadFacultyUsers();
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

async function reportUser() {
    if (!confirm('Bu istifadəçini şikayət etmək istədiyinizə əminsiniz?')) return;

    try {
        const response = await fetch(`/api/report/${selectedUserId}`, { method: 'POST' });
        
        if (response.ok) {
            alert('Şikayət göndərildi');
            closeModal();
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

function showRules() {
    loadPublicSettings().then(async () => {
        const response = await fetch('/api/settings/public');
        const settings = await response.json();
        
        document.getElementById('infoModalTitle').textContent = 'Qaydalar';
        document.getElementById('infoModalContent').innerHTML = `<p style="white-space: pre-wrap;">${escapeHtml(settings.rules_text || '')}</p>`;
        document.getElementById('infoModal').classList.remove('hidden');
    });
}

function showAbout() {
    loadPublicSettings().then(async () => {
        const response = await fetch('/api/settings/public');
        const settings = await response.json();
        
        document.getElementById('infoModalTitle').textContent = 'Haqqında';
        document.getElementById('infoModalContent').innerHTML = `<p style="white-space: pre-wrap;">${escapeHtml(settings.about_text || '')}</p>`;
        document.getElementById('infoModal').classList.remove('hidden');
    });
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.add('hidden');
}

function showEditProfile() {
    // Populate form
    document.getElementById('editFullName').value = currentUser.full_name;
    document.getElementById('editDegree').value = currentUser.degree;
    document.getElementById('editCourse').value = currentUser.course;
    
    // Populate faculty select
    const facultySelect = document.getElementById('editFaculty');
    facultySelect.innerHTML = faculties.map(f => `<option value="${f}">${f}</option>`).join('');
    facultySelect.value = currentUser.faculty;
    
    // Populate avatars
    const grid = document.getElementById('editAvatarGrid');
    grid.innerHTML = '';
    editSelectedAvatar = currentUser.avatar;
    
    avatars.forEach((avatar, index) => {
        const div = document.createElement('div');
        div.className = 'avatar-option-small' + (index + 1 === currentUser.avatar ? ' selected' : '');
        div.innerHTML = `<img src="${avatar}" alt="Avatar ${index + 1}">`;
        div.onclick = () => selectEditAvatar(index + 1);
        grid.appendChild(div);
    });
    
    document.getElementById('editProfileModal').classList.remove('hidden');
}

function selectEditAvatar(avatarId) {
    editSelectedAvatar = avatarId;
    document.querySelectorAll('.avatar-option-small').forEach((opt, index) => {
        opt.classList.toggle('selected', index + 1 === avatarId);
    });
}

async function saveProfile() {
    const fullName = document.getElementById('editFullName').value.trim();
    const faculty = document.getElementById('editFaculty').value;
    const degree = document.getElementById('editDegree').value;
    const course = document.getElementById('editCourse').value;

    if (!fullName || !faculty || !degree || !course) {
        showError('editError', 'Bütün xanaları doldurun');
        return;
    }

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName, faculty, degree, course,
                avatar: editSelectedAvatar
            })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const data = await response.json();
            showError('editError', data.error);
        }
    } catch (error) {
        showError('editError', 'Xəta baş verdi');
    }
}

function closeEditProfile() {
    document.getElementById('editProfileModal').classList.add('hidden');
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        window.location.href = '/';
    }
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app
init();
