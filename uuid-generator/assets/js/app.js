// UUID Generator App
// Production-ready UUID v1, v4, v5, v7 generator with validation and export

class UUIDGenerator {
    constructor() {
        this.generatedUUIDs = [];
        this.history = this.loadHistory();
        this.init();
    }

    init() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }

        // Version selection
        document.querySelectorAll('input[name="version"]').forEach(input => {
            input.addEventListener('change', () => this.onVersionChange());
        });

        // Tab switching
        this.renderHistory();
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    onVersionChange() {
        const version = document.querySelector('input[name="version"]:checked').value;
        const v5Options = document.getElementById('v5Options');
        if (version === '5') {
            v5Options.style.display = 'block';
        } else {
            v5Options.style.display = 'none';
        }
    }

    // UUID v1: Time-based UUID (timestamp + MAC address simulation)
    generateV1() {
        const now = Date.now();
        const rand = crypto.getRandomValues(new Uint8Array(8));
        
        // Simulate timestamp-based UUID
        const hi = (now >>> 32) & 0xffffffff;
        const mid = (now >>> 16) & 0xffff;
        const lo = (now & 0xffff) | 0x1000; // version 1

        return `${this.padHex(hi, 8)}-${this.padHex(mid, 4)}-${this.padHex(lo, 4)}-${this.padHex((rand[0] << 8) | rand[1], 4)}-${Array.from(rand.slice(2)).map(b => this.padHex(b, 2)).join('')}`;
    }

    // UUID v4: Random UUID
    generateV4() {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        
        // Set version 4 (random) and variant (RFC 4122)
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

        const hex = Array.from(bytes).map(b => this.padHex(b, 2)).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // UUID v5: Name-based UUID using SHA-1
    async generateV5(namespace, name) {
        const namespaceUUIDs = {
            dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
            oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
            x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
        };

        const ns = namespaceUUIDs[namespace] || namespaceUUIDs.dns;
        
        // Convert namespace UUID to bytes
        const nsBytes = this.uuidToBytes(ns);
        
        // Convert name to UTF-8 bytes
        const nameBytes = new TextEncoder().encode(name);
        
        // Combine namespace and name
        const combined = new Uint8Array(nsBytes.length + nameBytes.length);
        combined.set(nsBytes);
        combined.set(nameBytes, nsBytes.length);
        
        // SHA-1 hash
        const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
        const hashArray = new Uint8Array(hashBuffer);
        
        // Set version 5 and variant
        hashArray[6] = (hashArray[6] & 0x0f) | 0x50; // version 5
        hashArray[8] = (hashArray[8] & 0x3f) | 0x80; // variant

        const hex = Array.from(hashArray.slice(0, 16)).map(b => this.padHex(b, 2)).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // UUID v7: Time-based, sortable UUID (RFC 4122 draft)
    generateV7() {
        const now = Date.now();
        const rand = crypto.getRandomValues(new Uint8Array(10));

        // Timestamp in milliseconds (48 bits)
        const timestamp = [
            (now >>> 40) & 0xff,
            (now >>> 32) & 0xff,
            (now >>> 24) & 0xff,
            (now >>> 16) & 0xff,
            (now >>> 8) & 0xff,
            now & 0xff
        ];

        // Version 7 and variant bits
        const versionBits = (rand[0] & 0x0f) | 0x70; // version 7
        const variantBits = (rand[1] & 0x3f) | 0x80; // variant

        const bytes = [
            ...timestamp,
            versionBits,
            rand[2],
            variantBits,
            rand[3],
            ...rand.slice(4)
        ];

        const hex = bytes.map(b => this.padHex(b, 2)).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // Utility: Convert UUID string to bytes
    uuidToBytes(uuid) {
        const hex = uuid.replace(/-/g, '');
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    // Utility: Pad hex string
    padHex(num, length) {
        return num.toString(16).padStart(length, '0');
    }

    // Format UUID with separator
    formatUUID(uuid, separator) {
        const clean = uuid.replace(/-/g, '');
        switch (separator) {
            case 'braces':
                return `{${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}}`;
            case 'none':
                return clean;
            default:
                return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
        }
    }

    // Validate UUID
    validateUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    // Detect UUID version
    detectVersion(uuid) {
        const clean = uuid.replace(/-/g, '');
        if (clean.length !== 32) return null;

        const versionNibble = parseInt(clean[12], 16);
        const variantBits = parseInt(clean[16], 16).toString(2).padStart(4, '0').slice(0, 2);

        const versions = {
            1: 'UUID v1 (Time-based)',
            2: 'UUID v2 (DCE Security)',
            3: 'UUID v3 (MD5 Hash)',
            4: 'UUID v4 (Random)',
            5: 'UUID v5 (SHA-1 Hash)',
            6: 'UUID v6 (Time-based, Sortable)',
            7: 'UUID v7 (Time-based, Unix Epoch)',
            8: 'UUID v8 (Custom)'
        };

        return versions[versionNibble] || 'UUID (version unknown)';
    }

    // Generate UUIDs
    async generate() {
        const version = document.querySelector('input[name="version"]:checked').value;
        const count = parseInt(document.getElementById('count').value) || 1;
        const separator = document.getElementById('separator').value;

        if (count < 1 || count > 1000) {
            this.showAlert('Count must be between 1 and 1000', 'error');
            return;
        }

        this.generatedUUIDs = [];

        try {
            if (version === '5') {
                const namespace = document.getElementById('namespace').value;
                const name = document.getElementById('nameInput').value;

                if (!name.trim()) {
                    this.showAlert('Please enter a name for v5 UUID generation', 'error');
                    return;
                }

                for (let i = 0; i < count; i++) {
                    const uuid = await this.generateV5(namespace, `${name}-${i}`);
                    const formatted = this.formatUUID(uuid, separator);
                    this.generatedUUIDs.push(formatted);
                }
            } else {
                for (let i = 0; i < count; i++) {
                    let uuid;
                    if (version === '1') {
                        uuid = this.generateV1();
                    } else if (version === '4') {
                        uuid = this.generateV4();
                    } else if (version === '7') {
                        uuid = this.generateV7();
                    }
                    
                    const formatted = this.formatUUID(uuid, separator);
                    this.generatedUUIDs.push(formatted);
                }
            }

            this.addToHistory(this.generatedUUIDs);
            this.renderResults();
            this.showAlert(`Generated ${count} UUID(s)`, 'success');
        } catch (error) {
            this.showAlert(`Error: ${error.message}`, 'error');
        }
    }

    // Render results
    renderResults() {
        const container = document.getElementById('generateResults');
        container.style.display = 'block';
        container.innerHTML = '';

        this.generatedUUIDs.forEach((uuid, index) => {
            const item = document.createElement('div');
            item.className = 'uuid-item';
            item.innerHTML = `
                <span style="flex: 1; word-break: break-all;">${uuid}</span>
                <button class="btn-success btn-small" onclick="app.copySingleUUID('${uuid}')" title="Copy to clipboard">Copy</button>
            `;
            container.appendChild(item);
        });

        document.getElementById('copyAllBtn').style.display = 'block';
        document.getElementById('downloadBtn').style.display = 'block';
    }

    // Copy single UUID
    copySingleUUID(uuid) {
        navigator.clipboard.writeText(uuid).then(() => {
            this.showCopyFeedback('Copied to clipboard!');
        }).catch(() => {
            this.showAlert('Failed to copy', 'error');
        });
    }

    // Copy all UUIDs
    copyAllUUIDs() {
        const text = this.generatedUUIDs.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.showCopyFeedback('All UUIDs copied to clipboard!');
        }).catch(() => {
            this.showAlert('Failed to copy', 'error');
        });
    }

    // Show copy feedback
    showCopyFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    // Validation
    validate() {
        const input = document.getElementById('validateInput').value.trim();
        const resultDiv = document.getElementById('validationResult');

        if (!input) {
            resultDiv.innerHTML = '';
            return;
        }

        const isValid = this.validateUUID(input);
        const version = isValid ? this.detectVersion(input) : null;

        if (isValid) {
            const clean = input.replace(/-/g, '');
            const formatted = `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
            
            resultDiv.innerHTML = `
                <div class="validation-result valid">
                    <strong>✓ Valid UUID</strong>
                    <p style="margin: 10px 0 0 0; font-size: 0.9rem;">${version}</p>
                    <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 0.85rem; word-break: break-all;">${formatted}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="validation-result invalid">
                    <strong>✗ Invalid UUID</strong>
                    <p style="margin: 8px 0 0 0; font-size: 0.9rem;">The input is not a valid UUID format.</p>
                </div>
            `;
        }
    }

    // History management
    addToHistory(uuids) {
        const timestamp = new Date().toLocaleTimeString();
        uuids.forEach(uuid => {
            this.history.unshift({ uuid, timestamp });
        });
        
        // Keep only last 50
        this.history = this.history.slice(0, 50);
        this.saveHistory();
        this.renderHistory();
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem('uuidHistory');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('uuidHistory', JSON.stringify(this.history));
        } catch {
            console.warn('Failed to save history');
        }
    }

    renderHistory() {
        const container = document.getElementById('historyContainer');
        const clearBtn = document.getElementById('clearHistoryBtn');

        if (this.history.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); text-align: center;">No history yet</p>';
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        container.innerHTML = '';

        this.history.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'uuid-item';
            div.innerHTML = `
                <div>
                    <div style="font-family: monospace; font-size: 0.85rem; margin-bottom: 4px; word-break: break-all;">${item.uuid}</div>
                    <div style="font-size: 0.75rem; color: var(--text-light);">${item.timestamp}</div>
                </div>
                <button class="btn-success btn-small" onclick="app.copySingleUUID('${item.uuid}')" title="Copy">Copy</button>
            `;
            container.appendChild(div);
        });
    }

    clearHistory() {
        if (confirm('Clear all history? This cannot be undone.')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            this.showAlert('History cleared', 'success');
        }
    }

    // Export functions
    downloadJSON() {
        const data = {
            generated: new Date().toISOString(),
            count: this.generatedUUIDs.length,
            uuids: this.generatedUUIDs
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, 'uuids.json');
        this.closeDownloadModal();
    }

    downloadCSV() {
        const csv = ['UUID', ...this.generatedUUIDs].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadFile(blob, 'uuids.csv');
        this.closeDownloadModal();
    }

    downloadText() {
        const text = this.generatedUUIDs.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        this.downloadFile(blob, 'uuids.txt');
        this.closeDownloadModal();
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showAlert(`Downloaded ${filename}`, 'success');
    }

    // UI Helpers
    showAlert(message, type) {
        // Find or create alert container
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.style.position = 'fixed';
            alertContainer.style.top = '20px';
            alertContainer.style.left = '20px';
            alertContainer.style.zIndex = '999';
            document.body.appendChild(alertContainer);
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alertContainer.appendChild(alert);

        setTimeout(() => alert.remove(), 3000);
    }

    closeDownloadModal() {
        document.getElementById('downloadModal').style.display = 'none';
    }
}

// Global app instance
const app = new UUIDGenerator();

// Global functions for HTML onclick handlers
function generateUUIDs() {
    app.generate();
}

function validateUUID() {
    app.validate();
}

function copyAllUUIDs() {
    app.copyAllUUIDs();
}

function showDownloadOptions() {
    document.getElementById('downloadModal').style.display = 'flex';
}

function closeDownloadModal() {
    app.closeDownloadModal();
}

function downloadJSON() {
    app.downloadJSON();
}

function downloadCSV() {
    app.downloadCSV();
}

function downloadText() {
    app.downloadText();
}

function clearHistory() {
    app.clearHistory();
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Input event listeners for validation
document.addEventListener('DOMContentLoaded', () => {
    const validateInput = document.getElementById('validateInput');
    if (validateInput) {
        validateInput.addEventListener('input', () => app.validate());
    }

    // Close modal when clicking outside
    document.getElementById('downloadModal').addEventListener('click', (e) => {
        if (e.target.id === 'downloadModal') {
            app.closeDownloadModal();
        }
    });
});
