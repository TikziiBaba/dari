// Supabase Configuration
const SUPABASE_URL = 'https://uclcrkbvtvflnepnlevn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbGNya2J2dHZmbG5lcG5sZXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNjc2OTYsImV4cCI6MjA5OTg0MzY5Nn0.vfxAPZml_RUZQuI1xgLsW2MEDX2ttY4nyQgHH0xPFCw';

// Initialize Supabase Client (global so other scripts can use it)
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose globally so contact.js and admin.js can use it
window._supabase = supabase;

document.addEventListener('DOMContentLoaded', async () => {

    // --- Navbar Auth State Management ---
    const authNavItems = document.getElementById('auth-nav-items');

    // --- Home page CTA elements ---
    const homeAuthMsg  = document.getElementById('homeAuthMsg');
    const homeAuthBtns = document.getElementById('homeAuthBtns');
    const homeCta      = document.getElementById('homeCta');

    const checkAuthState = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // --- Navbar ---
            if (authNavItems) {
                if (session) {
                    authNavItems.innerHTML = `
                        <li class="nav-user-email">${session.user.email}</li>
                        <li><button id="logoutBtn" class="btn btn-outline btn-sm">Çıkış Yap</button></li>
                    `;
                    document.getElementById('logoutBtn').addEventListener('click', async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                    });
                } else {
                    authNavItems.innerHTML = `
                        <li><a href="login.html" class="btn btn-outline btn-sm">Giriş Yap</a></li>
                    `;
                }
            }

            // --- Home page CTA ---
            if (homeAuthBtns && homeCta) {
                if (session) {
                    homeAuthMsg.style.display  = 'none';
                    homeAuthBtns.style.display = 'none';
                    homeCta.style.display      = 'block';
                } else {
                    homeAuthMsg.style.display  = 'flex';
                    homeAuthBtns.style.display = 'block';
                    homeCta.style.display      = 'none';
                }
            }

        } catch (err) {
            console.error("Auth durumunu kontrol ederken hata oluştu:", err);
        }
    };

    await checkAuthState();

    // --- Authentication Listeners ---
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
                messageDiv.innerHTML = `<div class="alert alert-success">Kayıt başarılı! Giriş yapılıyor...</div>`;
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
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
