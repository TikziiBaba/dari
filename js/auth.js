// Supabase Configuration
// LÜTFEN AŞAĞIDAKİ BİLGİLERİ KENDİ SUPABASE PROJENİZLE DEĞİŞTİRİN
const SUPABASE_URL = 'https://uclcrkbvtvflnepnlevn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbGNya2J2dHZmbG5lcG5sZXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNjc2OTYsImV4cCI6MjA5OTg0MzY5Nn0.vfxAPZml_RUZQuI1xgLsW2MEDX2ttY4nyQgHH0xPFCw';

// Initialize Supabase Client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    // --- Navbar Auth State Management ---
    const authNavItems = document.getElementById('auth-nav-items');

    const checkAuthState = async () => {
        if (!authNavItems) return; // Navbar bulunamadıysa (örneğin auth sayfalarındaysak) atla

        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                // Kullanıcı giriş yapmış
                authNavItems.innerHTML = `
                    <li class="nav-user-email">${session.user.email}</li>
                    <li><button id="logoutBtn" class="btn btn-outline btn-sm">Çıkış Yap</button></li>
                `;

                // Logout Butonuna dinleyici ekle
                document.getElementById('logoutBtn').addEventListener('click', async () => {
                    await supabase.auth.signOut();
                    window.location.reload(); // Sayfayı yenile
                });

            } else {
                // Kullanıcı giriş yapmamış
                authNavItems.innerHTML = `
                    <li><a href="login.html" class="btn btn-outline btn-sm">Giriş Yap</a></li>
                `;
            }
        } catch (err) {
            console.error("Auth durumunu kontrol ederken hata oluştu:", err);
        }
    };

    await checkAuthState();

    // --- Authentication Listeners (Supabase Auth State Change) ---
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            checkAuthState();
        }
    });

    // --- Register Form Submission ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const messageDiv = document.getElementById('authMessage');

            if (password !== confirmPassword) {
                messageDiv.innerHTML = `<div class="alert alert-error">Şifreler eşleşmiyor!</div>`;
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                messageDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="alert alert-success">Kayıt başarılı! Lütfen giriş yapın. E-posta onayı gerekiyorsa gelen kutunuzu kontrol edin.</div>`;
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            }
        });
    }

    // --- Login Form Submission ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const messageDiv = document.getElementById('authMessage');

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                messageDiv.innerHTML = `<div class="alert alert-error">Giriş başarısız: ${error.message}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="alert alert-success">Giriş başarılı, yönlendiriliyorsunuz...</div>`;
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);
            }
        });
    }

});
