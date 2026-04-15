(() => {
  const KEY = "drivex.partner.auth.v2"; // отдельный ключ, не конфликтует с seller

  function getSession() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveSession(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  }

  function buildLogin() {
    const wrapper = document.createElement("div");
    wrapper.id = "partner-login-overlay";
    Object.assign(wrapper.style, {
      position: "fixed",
      inset: "0",
      zIndex: "9999",
      background: "var(--drivex-black)",
      overflowY: "auto"
    });

    wrapper.innerHTML = `
      <div class="min-h-screen max-w-[480px] mx-auto px-6 py-8" style="background: var(--drivex-black);">
        <div class="glass-card-light rounded-3xl p-6 mb-6" style="border:1px solid rgba(6,182,212,0.18);">
          <p class="text-xs font-semibold" style="color: var(--drivex-neon-cyan); letter-spacing:0.22em;">DRIVEX PARTNER</p>
          <h1 class="text-2xl font-bold mt-3" style="color: var(--drivex-white);">Вход в partner CRM</h1>
          <p class="mt-3 text-sm" style="color: var(--drivex-silver);">
            Войдите по телефону или email и управляйте сервисом без повторной регистрации.
          </p>
        </div>

        <form id="partner-login-form" class="space-y-4">
          <div class="glass-card-light rounded-2xl p-4">
            <label class="block text-sm mb-2" style="color: var(--drivex-silver);">Телефон или email</label>
            <input id="partner-login-identifier" class="w-full p-3 rounded-xl dx-input" placeholder="mail@example.com" />
          </div>
          <div class="glass-card-light rounded-2xl p-4">
            <label class="block text-sm mb-2" style="color: var(--drivex-silver);">Пароль</label>
            <input type="password" id="partner-login-pass" class="w-full p-3 rounded-xl dx-input" placeholder="Ваш пароль" />
          </div>
          <button type="submit" class="w-full py-4 rounded-2xl font-bold text-lg dx-btn">Войти</button>
          <button type="button" id="partner-login-register" class="w-full py-4 rounded-2xl font-bold text-lg" style="background: var(--glass-bg); color: var(--drivex-neon-cyan); border: 1px solid rgba(6,182,212,0.18);">
            Зарегистрироваться
          </button>
          <button type="button" id="partner-login-skip" class="w-full py-4 rounded-2xl font-bold text-lg" style="background: var(--glass-bg); color: var(--drivex-white);">
            Я партнёр, войти позже
          </button>
        </form>
      </div>
    `;

    const form = wrapper.querySelector("#partner-login-form");
    const idInput = wrapper.querySelector("#partner-login-identifier");
    const passInput = wrapper.querySelector("#partner-login-pass");
    const skipBtn = wrapper.querySelector("#partner-login-skip");
    const registerBtn = wrapper.querySelector("#partner-login-register");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const identifier = idInput.value.trim();
      const password = passInput.value.trim();
      if (!identifier || !password) {
        alert("Введите телефон/email и пароль");
        return;
      }
      const repo = window.DrivexPartnerRepository;
      const fallback = () => {
        saveSession({ email: identifier, ts: Date.now() });
        wrapper.remove();
        window.location.hash = "#/partner";
      };
      if (repo && repo.login) {
        repo
          .login(identifier, password)
          .then((session) => {
            saveSession(session || { email: identifier, ts: Date.now() });
            wrapper.remove();
            window.location.hash = "#/partner";
          })
          .catch(() => {
            alert("Ошибка входа");
            fallback();
          });
      } else {
        fallback();
      }
    });

    skipBtn.addEventListener("click", () => {
      wrapper.remove();
      window.location.hash = "#/partner";
    });

    registerBtn.addEventListener("click", () => {
      wrapper.remove();
      window.location.hash = "#/partner/register";
    });

    document.body.appendChild(wrapper);
  }

  if (!getSession()) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      buildLogin();
    } else {
      document.addEventListener("DOMContentLoaded", buildLogin);
    }
  }
})();
