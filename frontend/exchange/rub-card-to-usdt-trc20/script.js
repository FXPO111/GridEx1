const API_BASE = "http://127.0.0.1:8000";

// ===============================
// DOM элементы
// ===============================

// сумма RUB (колонка 1)
const giveAmountInput = document.querySelectorAll(".gx-ex-card .gx-amount-input")[0];

// сумма USDT (колонка 2)
const getAmountInput = document.querySelectorAll(".gx-ex-card .gx-amount-input")[1];

// TRC20 адрес
const walletInput = document.getElementById("wallet-input");

// Email
const emailInput = document.querySelector('.gx-field-half input[type="email"]');

// Telegram
const tgInput = document.querySelector('.gx-field-half input[type="text"]');

// кнопки
const lockBtn = document.querySelector(".gx-actions .gx-btn-outline");
const submitBtn = document.querySelector(".gx-actions .gx-btn-primary");

// поля статуса
const rateLabel = document.getElementById("rate-label");
const feeLabel = document.getElementById("fee-label");
const lockTimer = document.getElementById("lock-timer");
const formStatus = document.getElementById("form-status");

// ===============================
// Глобальные переменные
// ===============================
let currentRate = null;
let lockedRate = null;
let lockUntil = null;
let lockInterval = null;

// ===============================
// Получить курс
// ===============================
async function fetchRate() {
    try {
        const res = await fetch(`${API_BASE}/api/rates/current`);
        const data = await res.json();

        currentRate = data.rate;

        // если курс не заблокирован — показываем текущий
        if (!lockedRate) {
            rateLabel.textContent = data.rate.toFixed(2);
        }

        updateGetAmount();
        updateFee();

    } catch (err) {
        rateLabel.textContent = "Ошибка";
    }
}

// ===============================
// Обновить «Получаешь»
// ===============================
function updateGetAmount() {
    const rub = parseFloat(giveAmountInput.value) || 0;
    const rate = lockedRate || currentRate;

    if (!rate) {
        getAmountInput.value = "";
        return;
    }

    getAmountInput.value = (rub / rate).toFixed(2);
}

// ===============================
// Комиссия сервиса
// ===============================
function updateFee() {
    const rub = parseFloat(giveAmountInput.value) || 0;
    const rate = lockedRate || currentRate;

    if (!rub || !rate) {
        feeLabel.textContent = "0.00 USDT";
        return;
    }

    const usdt = rub / rate;
    const fee = usdt * 0.01;

    feeLabel.textContent = `${fee.toFixed(2)} USDT`;
}

// ===============================
// Зафиксировать курс
// ===============================
function lockRate() {
    if (!currentRate || rateLabel.textContent === "Ошибка") return;

    lockedRate = currentRate;
    lockUntil = Date.now() + 120000; // 120 сек

    rateLabel.textContent = lockedRate.toFixed(2);
    lockTimer.textContent = "120 сек";

    if (lockInterval) clearInterval(lockInterval);
    lockInterval = setInterval(() => {
        const left = Math.max(0, Math.floor((lockUntil - Date.now()) / 1000));
        lockTimer.textContent = left + " сек";

        if (left <= 0) {
            clearInterval(lockInterval);
            lockedRate = null;
            lockTimer.textContent = "Не зафиксирован";
        }
    }, 1000);
}

// ===============================
// Создать заявку
// ===============================
async function createOrder(e) {
    e.preventDefault();
    formStatus.textContent = "";
    formStatus.className = "gx-status";

    const rub = parseFloat(giveAmountInput.value) || 0;
    const address = walletInput.value.trim();
    const email = emailInput.value.trim() || null;
    const tg = tgInput.value.trim() || null;
    const rate = lockedRate || currentRate;

    if (rub < 10000) {
        formStatus.textContent = "Минимальная сумма — 10000 RUB.";
        formStatus.classList.add("gx-error");
        return;
    }

    if (!address || !address.startsWith("T")) {
        formStatus.textContent = "Введите корректный TRC20 адрес.";
        formStatus.classList.add("gx-error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/exchange/create`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                amount_rub: rub,
                usdt_address: address,
                email: email,
                telegram: tg,
                rate: rate
            })
        });

        const data = await res.json();

        if (data.error) {
            formStatus.textContent = data.error;
            formStatus.classList.add("gx-error");
            return;
        }

        window.location.href = `/order/?id=${encodeURIComponent(data.order_id)}`;

    } catch (err) {
        formStatus.textContent = "Ошибка соединения с сервером.";
        formStatus.classList.add("gx-error");
    }
}

// ===============================
// События
// ===============================
giveAmountInput.addEventListener("input", () => {
    updateGetAmount();
    updateFee();
});

lockBtn.addEventListener("click", lockRate);
submitBtn.addEventListener("click", createOrder);

// ===============================
// Интервалы и первый запуск
// ===============================
setInterval(fetchRate, 1500);
fetchRate();
