document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window._supabase; // auth.js tarafından oluşturulan client
    const contactForm = document.getElementById('contactForm');
    const authRequiredMessage = document.getElementById('authRequiredMessage');
    const contactMessageDiv = document.getElementById('contactMessage');

    // Supabase has already been initialized in auth.js (which must be loaded first)

    // Check if user is logged in
    let currentUser = null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            // Kullanıcı giriş yapmış, formu göster
            if (contactForm) contactForm.style.display = 'block';
            if (authRequiredMessage) authRequiredMessage.style.display = 'none';
        } else {
            // Kullanıcı giriş yapmamış, uyarıyı göster
            if (contactForm) contactForm.style.display = 'none';
            if (authRequiredMessage) authRequiredMessage.style.display = 'block';
        }
    } catch (err) {
        console.error("Oturum kontrolünde hata:", err);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value;
            const btn = document.getElementById('sendMessageBtn');

            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...`;

            try {
                const { data, error } = await supabase
                    .from('messages')
                    .insert([
                        {
                            user_id: currentUser.id,
                            user_email: currentUser.email,
                            service: service,
                            message: message
                        }
                    ]);

                if (error) throw error;

                contactMessageDiv.innerHTML = `<div class="alert alert-success">Mesajınız başarıyla alındı. En kısa sürede size geri dönüş yapacağız.</div>`;
                contactForm.reset();

            } catch (error) {
                console.error('Mesaj gönderme hatası:', error);
                contactMessageDiv.innerHTML = `<div class="alert alert-error">Mesaj gönderilirken bir hata oluştu: ${error.message}</div>`;
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i>&nbsp; Mesaj Gönder`;
            }
        });
    }
});
