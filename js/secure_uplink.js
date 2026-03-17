// Append this to existing main.js logic
document.addEventListener('DOMContentLoaded', () => {
    // --- 5. Uplink Array (Socials) ---
    const uplinkHeader = document.querySelector('.uplink-header');
    const uplinkMenu = document.getElementById('uplink-menu');
    
    if(uplinkHeader) {
        uplinkHeader.addEventListener('click', () => {
            uplinkMenu.classList.toggle('hidden');
        });
    }

    // --- 6. Blog Feed Loader ---
    const blogList = document.getElementById('blog-posts');
    if (blogList) {
        fetch('data/feed.json')
            .then(response => response.json())
            .then(data => {
                blogList.innerHTML = ''; // Clear placeholder
                data.slice(0, 3).forEach(post => {
                    const article = document.createElement('article');
                    article.className = 'blog-card';
                    article.innerHTML = `
                        <div class="blog-date">${post.date}</div>
                        <h5>${post.title}</h5>
                        <p>${post.summary}</p>
                        <a href="${post.url}" class="read-more">READ_FULL_REPORT ></a>
                    `;
                    blogList.appendChild(article);
                });
            })
            .catch(err => {
                console.error('Failed to load feed:', err);
                blogList.innerHTML = '<p class="error">Secure Feed Offline.</p>';
            });
    }

    // --- 7. Secure Channel (Discord Hook) ---
    const sendBtn = document.getElementById('send-signal-btn');
    const msgInput = document.getElementById('signal-message');
    const contactInput = document.getElementById('signal-contact');
    const responseDiv = document.getElementById('signal-response');
    const slotsDisplay = document.getElementById('slots');

    // Load available slots (Mock persistence)
    let slots = parseInt(localStorage.getItem('signal_slots') || '10');
    if(slotsDisplay) slotsDisplay.innerText = `${slots}/10`;

    if(sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const message = msgInput.value.trim();
            const contact = contactInput.value.trim();

            if (!message || !contact) {
                responseDiv.innerHTML = '<span class="error">ERROR: EMPTY_BUFFER. Please provide message and return path.</span>';
                return;
            }

            if (slots <= 0) {
                responseDiv.innerHTML = '<span class="error">ERROR: CAPACITY_REACHED. Try again later.</span>';
                return;
            }

            // --- DISCORD WEBHOOK LOGIC ---
            // Replace with your actual Webhook URL
            const WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1483488749970260139/QUj7-xsJpBhBXpCwxx-noz9xwmcUW25Q2Xs1YDkHPShqUAK23XzCAAVflfP-vTUTLE8B'; 
            
            const payload = {
                content: `**[SECURE CHANNEL SIGNAL]**\n**From:** ${contact}\n**Message:** ${message}`
            };

            sendBtn.innerText = 'TRANSMITTING...';
            sendBtn.disabled = true;

            try {
                // Check if user actually replaced the placeholder
                if(WEBHOOK_URL.includes('YOUR_DISCORD_WEBHOOK_URL')) {
                    throw new Error("Webhook not configured.");
                }

                const response = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    slots--;
                    localStorage.setItem('signal_slots', slots);
                    if(slotsDisplay) slotsDisplay.innerText = `${slots}/10`;
                    
                    responseDiv.innerHTML = '<span class="success">SIGNAL_ACKNOWLEDGED. Encryption Key Exchanged.</span>';
                    msgInput.value = '';
                    contactInput.value = '';
                } else {
                    throw new Error('Transmission rejected.');
                }
            } catch (error) {
                console.error(error);
                // Fallback for demo purposes if webhook isn't set
                responseDiv.innerHTML = '<span class="error">TRANSMISSION_FAILURE: Network unreachable (Check Webhook Config).</span>';
            } finally {
                sendBtn.innerText = 'TRANSMIT_SIGNAL';
                sendBtn.disabled = false;
            }
        });
    }
});
