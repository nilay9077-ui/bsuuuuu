let isSuper = false;

async function init() {
    try {
        // Load settings
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
            window.location.href = '/admin';
            return;
        }

        const settings = await response.json();
        populateSettings(settings);
        
        // Check if super admin
        checkSuperAdmin();
        
        // Load users
        loadUsers();
    } catch (error) {
        console.error('Init error:', error);
    }
}

function checkSuperAdmin() {
    // Try to access sub-admins to check if super
    fetch('/api/admin/sub-admins')
        .then(res => {
            if (res.ok) {
                isSuper = true;
                document.getElementById('subAdminsCard').style.display = 'block';
            } else {
                document.getElementById('subAdminsCard').style.display = 'none';
            }
        })
        .catch(() => {
            document.getElementById('subAdminsCard').style.display = 'none';
        });
}

function populateSettings(settings) {
    document.getElementById('filterWords').value = settings.filter_words || '';
    document.getElementById('topicInput').value = settings.topic_of_day || '';
    document.getElementById('rulesText').value = settings.rules_text || '';
    document.getElementById('aboutText').value = settings.about_text || '';
    
    document.getElementById('groupValue').value = settings.group_message_lifetime_value || 60;
    document.getElementById('groupUnit').value = settings.group_message_lifetime_unit || 'minutes';
    document.getElementById('privateValue').value = settings.private_message_lifetime_value || 30;
    document.getElementById('privateUnit').value = settings.private_message_lifetime_unit || 'minutes';
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    const section = document.getElementById(`${sectionName}Section`);
    if (section) {
        section.classList.remove('hidden');
        
        // Load data for specific sections
        if (sectionName === 'users') {
            loadUsers();
        } else if (sectionName === 'reported') {
            loadReportedUsers();
        } else if (sectionName === 'subadmins') {
            loadSubAdmins();
        }
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        document.getElementById('userCount').textContent = users.length;
        
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Ad Soyad</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Fakültə</th>
                <th>Dərəcə</th>
                <th>Kurs</th>
                <th>Status</th>
                <th>Əməliyyatlar</th>
            </tr>
            ${users.map(user => `
                <tr>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.faculty}</td>
                    <td>${user.degree}</td>
                    <td>${user.course}</td>
                    <td>
                        <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">
                            ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-action ${user.is_active ? 'btn-danger' : 'btn-success'}" 
                                onclick="toggleUser(${user.id})">
                            ${user.is_active ? 'Deaktiv et' : 'Aktiv et'}
                        </button>
                    </td>
                </tr>
            `).join('')}
        `;
        
        document.getElementById('usersTable').innerHTML = '';
        document.getElementById('usersTable').appendChild(table);
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function loadReportedUsers() {
    try {
        const response = await fetch('/api/admin/reported-users');
        const users = await response.json();
        
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Ad Soyad</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Fakültə</th>
                <th>Şikayət Sayı</th>
                <th>Status</th>
                <th>Əməliyyatlar</th>
            </tr>
            ${users.length > 0 ? users.map(user => `
                <tr>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.faculty}</td>
                    <td><span class="badge badge-danger">${user.report_count}</span></td>
                    <td>
                        <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">
                            ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-action ${user.is_active ? 'btn-danger' : 'btn-success'}" 
                                onclick="toggleUser(${user.id})">
                            ${user.is_active ? 'Deaktiv et' : 'Aktiv et'}
                        </button>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="7" style="text-align: center;">Şikayət edilən hesab yoxdur</td></tr>'}
        `;
        
        document.getElementById('reportedTable').innerHTML = '';
        document.getElementById('reportedTable').appendChild(table);
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function toggleUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/toggle`, {
            method: 'PUT'
        });

        if (response.ok) {
            showMessage('İstifadəçi statusu dəyişdirildi', 'success');
            loadUsers();
            loadReportedUsers();
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function saveFilters() {
    const filterWords = document.getElementById('filterWords').value;

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'filter_words', value: filterWords })
        });

        if (response.ok) {
            showMessage('Filtr sözləri yeniləndi', 'success');
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function saveTopic() {
    const topic = document.getElementById('topicInput').value;

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'topic_of_day', value: topic })
        });

        if (response.ok) {
            showMessage('Günün mövzusu yeniləndi', 'success');
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function saveMessageTimes() {
    const groupValue = document.getElementById('groupValue').value;
    const groupUnit = document.getElementById('groupUnit').value;
    const privateValue = document.getElementById('privateValue').value;
    const privateUnit = document.getElementById('privateUnit').value;

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'group_message_lifetime_value', value: groupValue })
        });

        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'group_message_lifetime_unit', value: groupUnit })
        });

        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'private_message_lifetime_value', value: privateValue })
        });

        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'private_message_lifetime_unit', value: privateUnit })
        });

        showMessage('Mesaj vaxtları yeniləndi', 'success');
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function saveRules() {
    const rules = document.getElementById('rulesText').value;

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'rules_text', value: rules })
        });

        if (response.ok) {
            showMessage('Qaydalar yeniləndi', 'success');
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function saveAbout() {
    const about = document.getElementById('aboutText').value;

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'about_text', value: about })
        });

        if (response.ok) {
            showMessage('Haqqında yeniləndi', 'success');
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function loadSubAdmins() {
    try {
        const response = await fetch('/api/admin/sub-admins');
        if (!response.ok) return;

        const admins = await response.json();
        
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>İstifadəçi adı</th>
                <th>Yaradılma tarixi</th>
                <th>Əməliyyatlar</th>
            </tr>
            ${admins.length > 0 ? admins.map(admin => `
                <tr>
                    <td>${admin.username}</td>
                    <td>${new Date(admin.created_at).toLocaleString('az-AZ')}</td>
                    <td>
                        <button class="btn-action btn-danger" onclick="deleteSubAdmin(${admin.id})">
                            Sil
                        </button>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="3" style="text-align: center;">Alt admin yoxdur</td></tr>'}
        `;
        
        document.getElementById('subadminsTable').innerHTML = '';
        document.getElementById('subadminsTable').appendChild(table);
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function createSubAdmin() {
    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value;

    if (!username || !password) {
        showMessage('Bütün xanaları doldurun', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/sub-admins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            showMessage('Alt admin yaradıldı', 'success');
            document.getElementById('newAdminUsername').value = '';
            document.getElementById('newAdminPassword').value = '';
            loadSubAdmins();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function deleteSubAdmin(adminId) {
    if (!confirm('Bu admini silmək istədiyinizə əminsiniz?')) return;

    try {
        const response = await fetch(`/api/admin/sub-admins/${adminId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Alt admin silindi', 'success');
            loadSubAdmins();
        }
    } catch (error) {
        showMessage('Xəta baş verdi', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        window.location.href = '/';
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

// Initialize
init();
