// js/api.js

const defaultApiKey = "";
let userApiKey = localStorage.getItem('gemini_api_key') || defaultApiKey;

function setApiKey() {
    const key = prompt("請輸入您的 Google Gemini API Key:", userApiKey);
    if (key !== null) {
        userApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        alert("API Key 已儲存");
    }
}

async function callGemini(prompt, systemInstruction = "") {
    const apiKey = userApiKey || defaultApiKey;
    if (!apiKey) {
        const key = prompt("請輸入您的 Gemini API Key 以使用 AI 功能:");
        if(key) {
            userApiKey = key;
            localStorage.setItem('gemini_api_key', key);
        } else {
            throw new Error("需要 API Key 才能使用 AI 功能");
        }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${userApiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    // Retry logic
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
}
