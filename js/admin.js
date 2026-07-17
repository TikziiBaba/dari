// Admin Panel Logic
document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window._supabase;

    const adminLoading = document.getElementById('adminLoading');
    const accessDenied = document.getElementById('accessDenied');
    const adminPanel   = document.getElementById('adminPanel');
    const adminEmailDisp = document.getElementById('adminEmailDisplay');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    // --- Admin yetkisi kontrol et (admins tablosundan) ---
    let currentUser = null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            adminLoading.style.display = 'none';
            accessDenied.style.display = 'flex';
            return;
        }

        // admins tablosunda bu email var mı?
        const { data: adminRow } = await supabase
            .from('admins')
            .select('email')
            .eq('email', session.user.email)
            .single();

        if (adminRow) {
            currentUser = session.user;
            adminEmailDisp.textContent = currentUser.email;
            adminLoading.style.display = 'none';
            adminPanel.style.display   = 'block';
            loadMessages();
        } else {
            adminLoading.style.display = 'none';
            accessDenied.style.display = 'flex';
        }
    } catch (err) {
        console.error('Admin auth hatası:', err);
        adminLoading.style.display = 'none';
        accessDenied.style.display = 'flex';
    }

    // --- Logout ---
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // --- Sidebar Navigation ---
    document.querySelectorAll('.admin-nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const page = document.getElementById(`page-${item.dataset.page}`);
            if (page) page.classList.add('active');

            // Sayfa değiştiğinde ilgili veriyi yükle
            if (item.dataset.page === 'messages') loadMessages();
            if (item.dataset.page === 'users') loadUsers();
            if (item.dataset.page === 'stats') loadStats();
        });
    });

    document.getElementById('refreshBtn')?.addEventListener('click', loadMessages);

    // =====================================================
    // MESAJLAR
    // =====================================================
    const serviceLabels = {
        kurumsal: 'Kurumsal Tanıtım',
        reklam: 'Reklam Filmi',
        drone: 'Drone Çekimi',
        emlak: 'Emlak Çekimi',
        restoran: 'Restoran Çekimi',
        otomotiv: 'Otomotiv Çekimi',
        dugun: 'Düğün Çekimi',
        sosyal: 'Sosyal Medya',
        diger: 'Diğer'
    };

    async function loadMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        container.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner"></i><p>Mesajlar yükleniyor...</p></div>`;

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            container.innerHTML = `<div class="no-data"><i class="fa-solid fa-triangle-exclamation"></i><p>Yüklenemedi: ${error.message}</p></div>`;
            return;
        }
        if (!messages || messages.length === 0) {
            container.innerHTML = `<div class="no-data"><i class="fa-solid fa-inbox"></i><p>Henüz mesaj yok.</p></div>`;
            return;
        }

        const rows = messages.map(msg => {
            const date = new Date(msg.created_at);
            const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const label = serviceLabels[msg.service] || msg.service || '-';
            return `
                <tr id="msg-row-${msg.id}">
                    <td class="email-cell">${msg.user_email || '-'}</td>
                    <td><span class="service-badge">${label}</span></td>
                    <td class="message-text">${msg.message || '-'}</td>
                    <td class="date-cell">${dateStr}<br><small>${timeStr}</small></td>
                    <td>
                        <button class="delete-btn" onclick="deleteMessage(${msg.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>E-Posta</th>
                        <th>Hizmet</th>
                        <th>Mesaj</th>
                        <th>Tarih</th>
                        <th>Sil</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        updateStats(messages);
    }

    // Mesaj silme (global olarak erişilebilir)
    window.deleteMessage = async (id) => {
        if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) {
            alert('Silinemedi: ' + error.message);
        } else {
            document.getElementById(`msg-row-${id}`)?.remove();
        }
    };

    // =====================================================
    // KULLANICILAR & ADMİN YÖNETİMİ
    // =====================================================
    window.loadUsersPublic = loadUsers;
    async function loadUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        container.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner"></i><p>Kullanıcılar yükleniyor...</p></div>`;

        const [profilesRes, adminsRes] = await Promise.all([
            supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('admins').select('email')
        ]);

        if (profilesRes.error) {
            container.innerHTML = `<div class="no-data"><i class="fa-solid fa-triangle-exclamation"></i><p>Yüklenemedi: ${profilesRes.error.message}</p></div>`;
            return;
        }

        const users = profilesRes.data || [];
        const adminEmails = new Set((adminsRes.data || []).map(a => a.email));

        if (users.length === 0) {
            container.innerHTML = `<div class="no-data"><i class="fa-solid fa-users"></i><p>Henüz kayıtlı kullanıcı yok.</p></div>`;
            return;
        }

        const rows = users.map(u => {
            const isAdmin = adminEmails.has(u.email);
            const date = u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-';
            return `
                <tr>
                    <td class="email-cell">${u.email || '-'}</td>
                    <td class="date-cell">${date}</td>
                    <td>
                        ${isAdmin
                            ? `<span class="admin-badge"><i class="fa-solid fa-shield-halved"></i> Admin</span>
                               ${u.email !== currentUser.email
                                   ? `<button class="remove-admin-btn" onclick="removeAdmin('${u.email}')"><i class="fa-solid fa-times"></i> Kaldır</button>`
                                   : ''
                               }`
                            : `<button class="make-admin-btn" onclick="makeAdmin('${u.email}')">
                                   <i class="fa-solid fa-shield-halved"></i> Admin Yap
                               </button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>E-Posta</th>
                        <th>Kayıt Tarihi</th>
                        <th>Yetki</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    window.makeAdmin = async (email) => {
        if (!confirm(`${email} kullanıcısını admin yapmak istediğinize emin misiniz?`)) return;
        const { error } = await supabase.from('admins').insert({ email });
        if (error) {
            alert('İşlem başarısız: ' + error.message);
        } else {
            loadUsers();
        }
    };

    window.removeAdmin = async (email) => {
        if (!confirm(`${email} kullanıcısının admin yetkisini kaldırmak istediğinize emin misiniz?`)) return;
        const { error } = await supabase.from('admins').delete().eq('email', email);
        if (error) {
            alert('İşlem başarısız: ' + error.message);
        } else {
            loadUsers();
        }
    };

    // =====================================================
    // İSTATİSTİKLER
    // =====================================================
    async function loadStats() {
        const { data: messages } = await supabase.from('messages').select('*');
        if (messages) updateStats(messages);
    }

    function updateStats(messages) {
        const statTotal = document.getElementById('statTotal');
        const statToday = document.getElementById('statToday');
        const statPopular = document.getElementById('statPopular');

        if (statTotal) statTotal.textContent = messages.length;

        if (statToday) {
            const todayCount = messages.filter(m => {
                if (!m.created_at) return false;
                const d = new Date(m.created_at);
                return d.toDateString() === new Date().toDateString();
            }).length;
            statToday.textContent = todayCount;
        }

        if (statPopular && messages.length > 0) {
            const counts = {};
            messages.forEach(m => { if (m.service) counts[m.service] = (counts[m.service] || 0) + 1; });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            statPopular.textContent = top ? (serviceLabels[top[0]] || top[0]) : '-';
        }
    }

});
