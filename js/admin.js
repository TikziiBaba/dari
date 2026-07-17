// Admin Panel Logic
// Admin e-posta adresi — kendi adresinizle değiştirin
const ADMIN_EMAIL = 'dedyusuf99@gmail.com'; // <-- BURASINı KENDİ ADMIN E-POSTANIZLA DEĞİŞTİRİN

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window._supabase;

    const adminLoading   = document.getElementById('adminLoading');
    const accessDenied   = document.getElementById('accessDenied');
    const adminPanel     = document.getElementById('adminPanel');
    const adminEmailDisp = document.getElementById('adminEmailDisplay');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    // --- Check Admin Auth ---
    let currentUser = null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.email === ADMIN_EMAIL) {
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
            document.getElementById(`page-${item.dataset.page}`).classList.add('active');
        });
    });

    // --- Refresh Button ---
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadMessages());
    }

    // --- Load Messages ---
    async function loadMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner"></i><p>Mesajlar yükleniyor...</p></div>`;

        try {
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!messages || messages.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fa-solid fa-inbox"></i>
                        <p>Henüz hiç mesaj gönderilmemiş.</p>
                    </div>`;
                return;
            }

            // Build table
            const serviceLabels = {
                kurumsal: 'Kurumsal Tanıtım',
                reklam:   'Reklam Filmi',
                drone:    'Drone Çekimi',
                emlak:    'Emlak Çekimi',
                restoran: 'Restoran Çekimi',
                otomotiv: 'Otomotiv Çekimi',
                dugun:    'Düğün Çekimi',
                sosyal:   'Sosyal Medya',
                diger:    'Diğer'
            };

            const rows = messages.map(msg => {
                const date = new Date(msg.created_at);
                const dateStr = date.toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' });
                const timeStr = date.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
                const label = serviceLabels[msg.service] || msg.service;
                return `
                    <tr>
                        <td>${msg.user_email || '-'}</td>
                        <td><span class="service-badge">${label}</span></td>
                        <td class="message-text">${msg.message || '-'}</td>
                        <td class="date-cell">${dateStr}<br><small>${timeStr}</small></td>
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
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;

            // Update Stats
            updateStats(messages, serviceLabels);

        } catch (err) {
            console.error('Mesajlar yüklenirken hata:', err);
            container.innerHTML = `<div class="no-data"><i class="fa-solid fa-triangle-exclamation"></i><p>Mesajlar yüklenemedi: ${err.message}</p></div>`;
        }
    }

    function updateStats(messages, serviceLabels) {
        const statTotal   = document.getElementById('statTotal');
        const statToday   = document.getElementById('statToday');
        const statPopular = document.getElementById('statPopular');

        if (statTotal) statTotal.textContent = messages.length;

        if (statToday) {
            const todayCount = messages.filter(m => {
                const d = new Date(m.created_at);
                const now = new Date();
                return d.toDateString() === now.toDateString();
            }).length;
            statToday.textContent = todayCount;
        }

        if (statPopular && messages.length > 0) {
            const counts = {};
            messages.forEach(m => { counts[m.service] = (counts[m.service] || 0) + 1; });
            const topService = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            statPopular.textContent = serviceLabels[topService[0]] || topService[0];
        }
    }
});
