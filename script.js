/* ==========================================================================
   MASTER SCRIPT - DIGITAL WEDDING INVITATION
   ========================================================================== */

// ⚠️ GANTI DENGAN URL APPS SCRIPT WEB APP DARI GOOGLE SHEETS KAMU
const scriptURL = 'PASTE_URL_APLIKASI_WEB_APPS_SCRIPT_DI_SINI';

// Tanggal Acara Pernikahan (Format: YYYY-MM-DDTHH:mm:ss)
const weddingDate = new Date("2026-12-12T08:00:00").getTime();

// ==========================================================================
// 1. DOKUMEN SIAP (INITIALIZATION)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // A. Ambil nama tamu dari URL parameter (?to=Nama+Tamu)
  parseGuestName();

  // B. Jalankan Hitung Mundur
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // C. Muat ucapan & data dari Google Sheets
  loadDataWeb();
});

// ==========================================================================
// 2. PARSE NAMA TAMU DINAMIS
// ==========================================================================
function parseGuestName() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestNameParam = urlParams.get('to');

  if (guestNameParam) {
    // Bersihkan format nama dari simbol + atau %20
    const formattedName = decodeURIComponent(guestNameParam.replace(/\+/g, ' '));
    
    // Tampilkan di Cover
    const guestElement = document.querySelector('.guest-name');
    if (guestElement) guestElement.innerText = formattedName;

    // Isikan otomatis di Form RSVP
    const inputNama = document.getElementById('rsvp-nama');
    if (inputNama) inputNama.value = formattedName;
  }
}

// ==========================================================================
// 3. LOGIKA BUKA UNDANGAN & PEMUTAR MUSIK LATAR
// ==========================================================================
const btnOpen = document.getElementById('btn-open');
const cover = document.getElementById('cover');
const bgMusic = document.getElementById('bg-music');
const btnMusic = document.getElementById('btn-music');
let isPlaying = false;

if (btnOpen) {
  btnOpen.addEventListener('click', () => {
    // Sembunyikan Cover Overlay
    cover.classList.add('fade-out');
    document.body.classList.remove('no-scroll');

    // Putar Musik Otomatis saat Buka Undangan
    if (bgMusic) {
      bgMusic.play().then(() => {
        isPlaying = true;
        if (btnMusic) btnMusic.style.display = 'block';
      }).catch(err => {
        console.log("Autoplay musik diblokir browser:", err);
        if (btnMusic) btnMusic.style.display = 'block';
      });
    }

    // Refresh Animasi AOS setelah Cover Hilang
    if (typeof AOS !== 'undefined') {
      setTimeout(() => {
        AOS.refresh();
      }, 500);
    }
  });
}

// Tombol Toggle Play/Pause Musik Floating
if (btnMusic) {
  btnMusic.addEventListener('click', () => {
    if (isPlaying) {
      bgMusic.pause();
      btnMusic.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      isPlaying = false;
    } else {
      bgMusic.play();
      btnMusic.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
      isPlaying = true;
    }
  });
}

// ==========================================================================
// 4. COUNTDOWN TIMER (HITUNG MUNDUR)
// ==========================================================================
function updateCountdown() {
  const now = new Date().getTime();
  const timeDifference = weddingDate - now;

  const daysElement = document.getElementById("days");
  const hoursElement = document.getElementById("hours");
  const minutesElement = document.getElementById("minutes");
  const secondsElement = document.getElementById("seconds");

  if (timeDifference > 0) {
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    if (daysElement) daysElement.innerText = days.toString().padStart(2, '0');
    if (hoursElement) hoursElement.innerText = hours.toString().padStart(2, '0');
    if (minutesElement) minutesElement.innerText = minutes.toString().padStart(2, '0');
    if (secondsElement) secondsElement.innerText = seconds.toString().padStart(2, '0');
  } else {
    const container = document.getElementById("countdown");
    if (container) {
      container.innerHTML = '<h3 style="color: #ffffff; font-family: var(--font-heading); font-size: 1.8rem;">Acara Telah Berlangsung</h3>';
    }
  }
}

// ==========================================================================
// 5. AMPLOP DIGITAL - SALIN NO REKENING
// ==========================================================================
function copyText(textToCopy, statusElementId) {
  navigator.clipboard.writeText(textToCopy).then(() => {
    const statusEl = document.getElementById(statusElementId);
    if (statusEl) {
      statusEl.innerText = '✅ Berhasil disalin!';
      setTimeout(() => {
        statusEl.innerText = '';
      }, 3000);
    }
  }).catch(err => {
    console.error('Gagal menyalin:', err);
  });
}

// ==========================================================================
// 6. FORM RSVP & BUKU TAMU (KIRIM DATA KE GOOGLE SHEETS)
// ==========================================================================
const rsvpForm = document.getElementById('rsvp-form');

if (rsvpForm) {
  rsvpForm.addEventListener('submit', e => {
    e.preventDefault();

    const btnSubmit = document.getElementById('btn-submit');
    const statusDiv = document.getElementById('rsvp-status');

    // Ubah status tombol saat mengirim
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
    statusDiv.style.color = "#4A4A4A";
    statusDiv.innerText = "Sedang memproses konfirmasi Anda...";

    const payload = {
      nama: document.getElementById('rsvp-nama').value,
      kehadiran: document.getElementById('rsvp-kehadiran').value,
      jumlah: document.getElementById('rsvp-jumlah').value,
      ucapan: document.getElementById('rsvp-ucapan').value
    };

    fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(response => {
      statusDiv.style.color = "green";
      statusDiv.innerText = "✅ Terima kasih! Konfirmasi & ucapan Anda berhasil terkirim.";
      
      // Reset Form
      rsvpForm.reset();
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Konfirmasi';

      // Re-fill nama dari URL jika ada
      parseGuestName();

      // Muat ulang daftar ucapan terbaru
      loadDataWeb();
    })
    .catch(error => {
      statusDiv.style.color = "red";
      statusDiv.innerText = "❌ Gagal mengirim. Silakan periksa koneksi internet Anda.";
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Konfirmasi';
      console.error('Error!', error.message);
    });
  });
}

// ==========================================================================
// 7. AMBIL DAFTAR UCAPAN & PENGATURAN DARI GOOGLE SHEETS
// ==========================================================================
function loadDataWeb() {
  const listContainer = document.getElementById('ucapan-list');
  if (!listContainer) return;

  if (scriptURL === 'PASTE_URL_APLIKASI_WEB_APPS_SCRIPT_DI_SINI' || !scriptURL) {
    listContainer.innerHTML = '<p style="color: #777; font-size: 0.85rem; font-style: italic;">Sistem database ucapan belum dihubungkan ke Google Sheets.</p>';
    return;
  }

  fetch(scriptURL)
    .then(response => response.json())
    .then(data => {
      // --- A. JIKA ADA FITUR PENGATURAN CONFIG DARI SHEETS ---
      if (data.config) {
        applyConfigFromSheets(data.config);
      }

      // --- B. TAMPILKAN LIST UCAPAN TAMU ---
      const ucapanData = data.ucapan || data; // Mendukung format lama / baru
      listContainer.innerHTML = '';

      if (!Array.isArray(ucapanData) || ucapanData.length === 0) {
        listContainer.innerHTML = '<p style="color: #888; font-size: 0.85rem; text-align: center;">Belum ada ucapan. Jadilah yang pertama memberikan ucapan!</p>';
        return;
      }

      ucapanData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'ucapan-card';
        card.style.cssText = `
          background: #ffffff;
          padding: 15px 18px;
          border-radius: 12px;
          margin-bottom: 12px;
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        `;

        const badgeColor = item.kehadiran === 'Hadir' ? '#2e7d32' : '#c62828';
        const badgeBg = item.kehadiran === 'Hadir' ? '#e8f5e9' : '#ffebee';

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: var(--dark-color); font-size: 0.95rem;">${escapeHtml(item.nama)}</strong>
            <span style="font-size: 0.72rem; font-weight: 500; background: ${badgeBg}; color: ${badgeColor}; padding: 3px 10px; border-radius: 12px;">
              ${escapeHtml(item.kehadiran)}
            </span>
          </div>
          <p style="margin: 0; color: #555555; font-size: 0.88rem; line-height: 1.5;">${escapeHtml(item.ucapan)}</p>
        `;
        listContainer.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Gagal memuat data ucapan:', error);
      listContainer.innerHTML = '<p style="color: #888; font-size: 0.85rem; text-align: center;">Gagal memuat ucapan.</p>';
    });
}

// Fungsi Keamanan sanitasi input HTML sederhana
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Opsional: Pengaturan Teks/Foto Otomatis jika dikontrol dari Google Sheets
function applyConfigFromSheets(cfg) {
  if (cfg.nama_pria && cfg.nama_wanita) {
    const coupleElements = document.querySelectorAll('.couple-name, .couple-name-cover, .couple-name-footer');
    coupleElements.forEach(el => el.innerText = `${cfg.nama_pria} & ${cfg.nama_wanita}`);
  }
  if (cfg.url_foto) {
    const cover = document.querySelector('.cover-screen');
    const hero = document.querySelector('.hero');
    if (cover) cover.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${cfg.url_foto}')`;
    if (hero) hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${cfg.url_foto}')`;
  }
}
