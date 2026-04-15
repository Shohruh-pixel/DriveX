# DriveX AI Assist запуск с Gemini/OpenAI

1. Создай файл `.env` в папке проекта `C:\Users\User\Desktop\DriveX`.

2. Вставь туда:

```env
PORT=8080
AI_MODE=llm_first
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-latest
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Замени `your_gemini_api_key_here` на настоящий Gemini API key.

4. Запусти сервер:

```powershell
cd C:\Users\User\Desktop\DriveX
& "C:\Program Files\nodejs\node.exe" server.js
```

5. Открой:

```text
http://localhost:8080/index.html
```

На телефоне:

```text
http://192.168.1.3:8080/index.html?v=6
```
