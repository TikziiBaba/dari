// Supabase Configuration
const SUPABASE_URL = 'https://uclcrkbvtvflnepnlevn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbGNya2J2dHZmbG5lcG5sZXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNjc2OTYsImV4cCI6MjA5OTg0MzY5Nn0.vfxAPZml_RUZQuI1xgLsW2MEDX2ttY4nyQgHH0xPFCw';

// CDN UMD build window.supabase olarak inject eder
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Diğer script'lerin (contact.js, admin.js) kullanması için global'e yaz
window._supabase = sb;

document.addEventListener('DOMContentLoaded', async () => {

    const authNavItems = document.getElementById('auth-nav-items');
    const homeAuthMsg  = document.getElementById('homeAuthMsg');
    const homeAuthBtns = document.getElementById('homeAuthBtns');
    const homeCta      = document.getElementById('homeCta');

    const checkAuthState = async () => {
        try {
            const { data: { session } } = await sb.auth.getSession();

            // Navbar güncelle
            if (authNavItems) {
                if (session) {
                    authNavItems.innerHTML = `
                        <li class="nav-user-email">${session.user.email}</li>
                        <li><button id="logoutBtn" class="btn btn-outline btn-sm">Çıkış Yap</button></li>
                    `;
                    document.getElementById('logoutBtn').addEventListener('click', async () => {
                        await sb.auth.signOut();
                        window.location.reload();
                    });
                } else {
                    authNavItems.innerHTML = `
                        <li><a href="login.html" class="btn btn-outline btn-sm">Giriş Yap</a></li>
                    `;
                }
            }

            // Anasayfa CTA
            if (homeAuthBtns && homeCta) {
                if (session) {
                    if (homeAuthMsg) homeAuthMsg.style.display = 'none';
                    homeAuthBtns.style.display = 'none';
                    homeCta.style.display      = 'block';
                } else {
                    if (homeAuthMsg) homeAuthMsg.style.display = 'flex';
                    homeAuthBtns.style.display = 'block';
                    homeCta.style.display      = 'none';
                }
            }

        } catch (err) {
            console.error('Auth durumu kontrol hatası:', err);
        }
    };

    await checkAuthState();

    sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            checkAuthState();
        }
    });

    // --- Kayıt Formu ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email           = document.getElementById('registerEmail').value.trim();
            const password        = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const messageDiv      = document.getElementById('authMessage');

            if (password !== confirmPassword) {
                messageDiv.innerHTML = `<div class="alert alert-error">Şifreler eşleşmiyor!</div>`;
                return;
            }

            messageDiv.innerHTML = `<div class="alert" style="color:var(--clr-text-muted);">Kayıt yapılıyor...</div>`;

            const { data, error } = await sb.auth.signUp({ email, password });

            if (error) {
                messageDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="alert alert-success">Kayıt başarılı! Yönlendiriliyorsunuz...</div>`;
                registerForm.reset();
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            }
        });
    }

    // --- Giriş Formu ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email      = document.getElementById('loginEmail').value.trim();
            const password   = document.getElementById('loginPassword').value;
            const messageDiv = document.getElementById('authMessage');

            messageDiv.innerHTML = `<div class="alert" style="color:var(--clr-text-muted);">Giriş yapılıyor...</div>`;

            const { data, error } = await sb.auth.signInWithPassword({ email, password });

            if (error) {
                messageDiv.innerHTML = `<div class="alert alert-error">Giriş başarısız: ${error.message}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="alert alert-success">Giriş başarılı, yönlendiriliyorsunuz...</div>`;
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            }
        });
    }

});
