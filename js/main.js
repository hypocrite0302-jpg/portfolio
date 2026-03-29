document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    initCursor({ enabled: finePointer && !prefersReducedMotion });
    initAmbientCanvas({ enabled: !prefersReducedMotion });
    initNav();
    initRevealObserver({ reduced: prefersReducedMotion });
    initTerminal();
});

function initCursor({ enabled }) {
    const cursorMain = document.getElementById('cursor-main');
    const cursorFollower = document.getElementById('cursor-follower');

    if (!cursorMain || !cursorFollower || !enabled) {
        if (cursorMain) cursorMain.style.display = 'none';
        if (cursorFollower) cursorFollower.style.display = 'none';
        return;
    }

    let followerX = 0;
    let followerY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const move = (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        cursorMain.style.left = `${mouseX}px`;
        cursorMain.style.top = `${mouseY}px`;
    };

    document.addEventListener('mousemove', move);

    const animateFollower = () => {
        followerX += (mouseX - followerX) * 0.2;
        followerY += (mouseY - followerY) * 0.2;
        cursorFollower.style.left = `${followerX}px`;
        cursorFollower.style.top = `${followerY}px`;
        requestAnimationFrame(animateFollower);
    };

    requestAnimationFrame(animateFollower);

    const interactiveSelector = 'a, button, input, textarea, .project-card';
    document.querySelectorAll(interactiveSelector).forEach((element) => {
        element.addEventListener('mouseenter', () => {
            cursorFollower.style.transform = 'translate(-50%, -50%) scale(1.34)';
            cursorFollower.style.backgroundColor = 'color-mix(in oklab, var(--accent-cyan), transparent 85%)';
        });

        element.addEventListener('mouseleave', () => {
            cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorFollower.style.backgroundColor = 'transparent';
        });
    });
}

function initAmbientCanvas({ enabled }) {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !enabled) {
        if (canvas) canvas.style.display = 'none';
        return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    const particles = [];
    const maxParticles = window.innerWidth < 900 ? 34 : 56;

    const setSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.radius = Math.random() * 1.1 + 0.3;
            this.velocityX = Math.random() * 0.18 - 0.09;
            this.velocityY = Math.random() * 0.18 - 0.09;
            this.alpha = Math.random() * 0.4 + 0.15;
        }

        update() {
            this.x += this.velocityX;
            this.y += this.velocityY;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }

        draw() {
            context.beginPath();
            context.fillStyle = `rgba(151, 236, 255, ${this.alpha})`;
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.fill();
        }
    }

    const buildParticles = () => {
        particles.length = 0;
        for (let index = 0; index < maxParticles; index += 1) {
            particles.push(new Particle());
        }
    };

    const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
            particle.update();
            particle.draw();
        });
        requestAnimationFrame(render);
    };

    setSize();
    buildParticles();
    requestAnimationFrame(render);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setSize();
            buildParticles();
        }, 120);
    });
}

function initNav() {
    const nav = document.querySelector('.glass-nav');
    const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
    const navLinksContainer = document.getElementById('nav-links');
    const mobileToggle = document.getElementById('mobile-nav-toggle');

    if (!nav || !navLinksContainer || !mobileToggle) return;

    mobileToggle.addEventListener('click', () => {
        const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!expanded));
        navLinksContainer.classList.toggle('open');
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            mobileToggle.setAttribute('aria-expanded', 'false');
            navLinksContainer.classList.remove('open');
        });
    });

    const sectionTargets = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const activeId = entry.target.id;
                navLinks.forEach((link) => {
                    const isActive = link.getAttribute('href') === `#${activeId}`;
                    link.classList.toggle('active', isActive);
                });
            });
        },
        {
            threshold: 0.45,
            rootMargin: '-15% 0px -30% 0px'
        }
    );

    sectionTargets.forEach((section) => observer.observe(section));
}

function initRevealObserver({ reduced }) {
    const revealItems = document.querySelectorAll('.reveal');
    if (!revealItems.length) return;

    revealItems.forEach((item) => {
        const delay = Number(item.dataset.revealDelay || 0);
        if (delay) {
            item.style.setProperty('--reveal-delay', `${Math.round(delay * 1000)}ms`);
        }
    });

    if (reduced) {
        revealItems.forEach((item) => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries, internalObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                internalObserver.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -12% 0px'
        }
    );

    revealItems.forEach((item) => observer.observe(item));
}

function initTerminal() {
    const terminal = document.getElementById('global-terminal');
    const terminalToggle = document.getElementById('terminal-toggle');
    const closeTerminal = document.getElementById('close-terminal');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    if (!terminal || !terminalToggle || !closeTerminal || !terminalInput || !terminalOutput) {
        return;
    }

    const openTerminal = () => {
        terminal.classList.remove('hidden');
        terminalToggle.setAttribute('aria-expanded', 'true');
        terminalInput.focus();
    };

    const closeTerminalPanel = () => {
        terminal.classList.add('hidden');
        terminalToggle.setAttribute('aria-expanded', 'false');
    };

    terminalToggle.addEventListener('click', () => {
        const isHidden = terminal.classList.contains('hidden');
        if (isHidden) {
            openTerminal();
        } else {
            closeTerminalPanel();
        }
    });

    closeTerminal.addEventListener('click', closeTerminalPanel);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeTerminalPanel();
        }
    });

    const commands = {
        help: () => [
            "Available commands:",
            "- help: list commands",
            "- whois: profile summary",
            "- projects: project quick view",
            "- experience: recent roles",
            "- contact: contact options",
            "- domain: live domain details",
            "- cd [section]: jump to section",
            "- clear: clear terminal"
        ].join('<br>'),
        whois: () => [
            "Mayank Attri",
            "AI-SOC Specialist | Detection Engineering | Security Automation",
            "Current focus: triage quality, rule tuning, SecEng troubleshooting, and AI workflows"
        ].join('<br>'),
        projects: () => [
            "1) SOC Triage and Incident Operations",
            "2) Detection Logic and Rule Fine-Tuning",
            "3) Security Engineering + AI Workflow Automation"
        ].join('<br>'),
        experience: () => [
            "ReliaQuest (2025-Present)",
            "Hack The Box (2024-Present)",
            "Insecsys (2023)"
        ].join('<br>'),
        contact: () => [
            "Use the Secure Contact section below.",
            "Or connect via LinkedIn/GitHub from Uplink panel."
        ].join('<br>'),
        domain: () => [
            "Primary domain: https://imayank.online",
            "Canonical configured for root portfolio URL."
        ].join('<br>'),
        clear: () => {
            terminalOutput.innerHTML = '';
            return null;
        }
    };

    terminalInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;

        const rawInput = terminalInput.value.trim();
        if (!rawInput) return;

        appendLine(terminalOutput, `<span class="prompt">$</span> ${escapeHtml(rawInput)}`);

        const [rawCommand, ...rest] = rawInput.toLowerCase().split(' ');
        const argument = rest.join(' ').trim();

        let response = '';

        if (rawCommand === 'cd' && argument) {
            const target = document.getElementById(argument);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                response = `<span class="success">navigating to #${escapeHtml(argument)}</span>`;
            } else {
                response = `<span class="error">unknown section: ${escapeHtml(argument)}</span>`;
            }
        } else if (commands[rawCommand]) {
            response = commands[rawCommand]();
        } else {
            response = `<span class="error">command not found: ${escapeHtml(rawCommand)}</span> <span class="dimmed">(type help)</span>`;
        }

        if (response) appendLine(terminalOutput, response);

        terminalInput.value = '';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    });
}

function appendLine(container, html) {
    const node = document.createElement('div');
    node.className = 'terminal-line';
    node.innerHTML = html;
    container.appendChild(node);
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
