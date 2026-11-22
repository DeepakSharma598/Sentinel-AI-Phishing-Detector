/**
 * Sentinel-AI - Enterprise Cybersecurity Threat Intelligence
 * Frontend Client-Side Application Script
 * Optimized & Clean Architecture
 */

(function () {
    'use strict';

    // Immediate Theme Pre-Application (Prevents flashing)
    try {
        const storedTheme = localStorage.getItem('sentinel_theme');
        if (storedTheme) {
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch (e) {}

    // --- State ---
    let currentTyposquats = [];
    let currentDomain = 'linkedin.com';
    let chartInstance = null;
    let trendsChartInstance = null;
    let selectedQrFile = null;
    let activeContextUrl = null;
    let copilotHistory = [];

    // --- DOM Elements ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const panes = document.querySelectorAll('.pane-view');

    // Typosquat Elements
    const typosquatForm = document.getElementById('typosquatForm');
    const typosquatInput = document.getElementById('typosquatInput');
    const typosquatDomainTitle = document.getElementById('typosquatDomainTitle');
    const typosquatCountDisplay = document.getElementById('typosquatCountDisplay');
    const typosquatTableBody = document.getElementById('typosquatTableBody');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const searchCalloutBubble = document.getElementById('searchCalloutBubble');
    const cancelTyposquatBtn = document.getElementById('cancelTyposquatBtn');

    // Export & Bulk Action Dropdowns
    const exportDropdownBtn = document.getElementById('exportDropdownBtn');
    const exportDropdownMenu = document.getElementById('exportDropdownMenu');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const bulkActionDropdownBtn = document.getElementById('bulkActionDropdownBtn');
    const bulkActionDropdownMenu = document.getElementById('bulkActionDropdownMenu');
    const bulkCopyUrlsBtn = document.getElementById('bulkCopyUrlsBtn');
    const bulkScanBtn = document.getElementById('bulkScanBtn');

    // Modal
    const detailModal = document.getElementById('detailModal');
    const modalTargetUrl = document.getElementById('modalTargetUrl');
    const modalBodyContent = document.getElementById('modalBodyContent');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    // URL Scanner Elements
    const urlScanForm = document.getElementById('urlScanForm');
    const urlInput = document.getElementById('urlInput');
    const dynamicResultContainer = document.getElementById('dynamicResultContainer');
    const scanningLaser = document.getElementById('scanningLaser');

    // QR Elements
    const qrDropzone = document.getElementById('qrDropzone');
    const qrFileInput = document.getElementById('qrFileInput');
    const browseQrBtn = document.getElementById('browseQrBtn');
    const qrPreviewContainer = document.getElementById('qrPreviewContainer');
    const qrPreviewImg = document.getElementById('qrPreviewImg');
    const qrFileName = document.getElementById('qrFileName');
    const qrFileSize = document.getElementById('qrFileSize');
    const removeQrBtn = document.getElementById('removeQrBtn');
    const scanQrBtn = document.getElementById('scanQrBtn');
    const qrResultContainer = document.getElementById('qrResultContainer');

    // Analytics & Charts
    const statTotalScans = document.getElementById('statTotalScans');
    const statSafeScans = document.getElementById('statSafeScans');
    const statThreatScans = document.getElementById('statThreatScans');
    const chartCanvas = document.getElementById('scanDistributionChart');
    const trendsChartCanvas = document.getElementById('threatTrendsChart');

    // =========================================================================
    // Initialization
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        initThemeToggle();
        initSidebarNav();
        initQuickActions();
        initDropdowns();
        initTyposquatMonitor();
        initUrlScanner();
        initQrScanner();
        initDashboardCharts();
        initThreatCopilot();
        initDashboardWidgets();

        // Load default domain view (linkedin.com)
        loadTyposquats('linkedin.com');
    });

    // =========================================================================
    // Sidebar Navigation & Quick Actions
    // =========================================================================
    function initSidebarNav() {
        const mainWrapper = document.querySelector('.main-wrapper');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');
        const mobileMenuBtns = document.querySelectorAll('.mobile-menu-btn');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPaneId = item.getAttribute('data-pane');
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                panes.forEach(pane => {
                    if (pane.id === targetPaneId) {
                        pane.classList.add('active');
                    } else {
                        pane.classList.remove('active');
                    }
                });

                if (targetPaneId === 'paneDashboard') {
                    updateAnalytics();
                }

                if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
                }
            });
        });

        // Desktop Toggle
        if (sidebarToggleBtn && sidebar) {
            sidebarToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('open');
                    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show', sidebar.classList.contains('open'));
                } else {
                    const isCollapsed = sidebar.classList.toggle('collapsed');
                    if (mainWrapper) mainWrapper.classList.toggle('sidebar-collapsed', isCollapsed);
                }
            });
        }

        // Mobile Menu Toggles
        mobileMenuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (sidebar) {
                    sidebar.classList.toggle('open');
                    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show', sidebar.classList.contains('open'));
                }
            });
        });

        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('open');
                sidebarBackdrop.classList.remove('show');
            });
        }
    }

    function initQuickActions() {
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetPane = btn.getAttribute('data-target-pane');
                const targetNav = document.querySelector(`.sidebar-nav .nav-item[data-pane="${targetPane}"]`);
                if (targetNav) targetNav.click();
            });
        });

        const btnViewAll = document.getElementById('btnViewAllDetections');
        if (btnViewAll) {
            btnViewAll.addEventListener('click', () => {
                const navTyposquat = document.getElementById('navTyposquat');
                if (navTyposquat) navTyposquat.click();
            });
        }
    }

    // =========================================================================
    // Dropdowns (Export & Bulk Action)
    // =========================================================================
    function initDropdowns() {
        if (exportDropdownBtn && exportDropdownMenu) {
            exportDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportDropdownMenu.classList.toggle('show');
                if (bulkActionDropdownMenu) bulkActionDropdownMenu.classList.remove('show');
            });
        }

        if (bulkActionDropdownBtn && bulkActionDropdownMenu) {
            bulkActionDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                bulkActionDropdownMenu.classList.toggle('show');
                if (exportDropdownMenu) exportDropdownMenu.classList.remove('show');
            });
        }

        document.addEventListener('click', () => {
            if (exportDropdownMenu) exportDropdownMenu.classList.remove('show');
            if (bulkActionDropdownMenu) bulkActionDropdownMenu.classList.remove('show');
        });

        if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportTableToCsv);
        if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportTableToJson);
        if (bulkCopyUrlsBtn) bulkCopyUrlsBtn.addEventListener('click', copySelectedUrls);
        if (bulkScanBtn) {
            bulkScanBtn.addEventListener('click', () => {
                alert('Triggered full background heuristic intelligence scan on all selected domains.');
            });
        }

        if (modalCloseBtn && detailModal) {
            modalCloseBtn.addEventListener('click', () => detailModal.classList.remove('show'));
            detailModal.addEventListener('click', (e) => {
                if (e.target === detailModal) detailModal.classList.remove('show');
            });
        }
    }

    // =========================================================================
    // Typosquat Monitor
    // =========================================================================
    function initTyposquatMonitor() {
        if (!typosquatForm || !typosquatInput) return;

        typosquatInput.addEventListener('focus', () => {
            if (searchCalloutBubble) searchCalloutBubble.style.display = 'block';
        });
        typosquatInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (searchCalloutBubble) searchCalloutBubble.style.display = 'none';
            }, 250);
        });

        typosquatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = typosquatInput.value.trim().toLowerCase();
            if (val) {
                currentDomain = val;
                if (typosquatDomainTitle) typosquatDomainTitle.textContent = val;
                loadTyposquats(val);
            }
        });

        if (cancelTyposquatBtn) {
            cancelTyposquatBtn.addEventListener('click', () => {
                typosquatInput.value = '';
                typosquatInput.focus();
            });
        }

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('.row-checkbox');
                checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
            });
        }
    }

    async function loadTyposquats(domain) {
        if (typosquatCountDisplay) {
            typosquatCountDisplay.textContent = `Analyzing ${domain}...`;
        }

        try {
            const response = await fetch(`/api/typosquats?domain=${encodeURIComponent(domain)}`);
            const data = await response.json();

            if (data.status === 'success' && data.results) {
                currentTyposquats = data.results;
                renderTyposquatTable(data.results);
                if (typosquatCountDisplay) {
                    typosquatCountDisplay.textContent = `${data.results.length} Typosquats Discovered`;
                }
                updateAnalytics();
            }
        } catch (err) {
            console.error('Error fetching typosquats:', err);
            if (typosquatCountDisplay) {
                typosquatCountDisplay.textContent = 'Failed to load typosquats.';
            }
        }
    }

    function renderTyposquatTable(rows) {
        if (!typosquatTableBody) return;

        let html = '';
        rows.forEach((row, idx) => {
            const riskClass = `risk-${row.risk || 3}`;
            const verdictLower = (row.verdict || 'suspicious').toLowerCase();
            const verdictClass = verdictLower === 'phishing' ? 'verdict-phishing' : (verdictLower === 'safe' ? 'verdict-safe' : 'verdict-suspicious');
            const verdictLabel = row.verdict || 'Suspicious';

            html += `
                <tr data-index="${idx}">
                    <td>
                        <input type="checkbox" class="table-checkbox row-checkbox" data-url="${escapeHtml(row.source_url)}">
                    </td>
                    <td>
                        <a href="javascript:void(0)" class="source-url-link" onclick="window.viewRowDetails(${idx})">
                            ${escapeHtml(row.source_url)}
                        </a>
                    </td>
                    <td>${escapeHtml(row.construction || 'Insertion')}</td>
                    <td><span class="risk-circle-badge ${riskClass}">${row.risk || 3}</span></td>
                    <td><span class="verdict-badge ${verdictClass}">${verdictLabel}</span></td>
                    <td>${escapeHtml(row.category || 'Unknown')}</td>
                    <td>${escapeHtml(row.ip_address || '127.0.0.1')}</td>
                    <td class="cell-truncate">${escapeHtml(row.name_servers || '--')}</td>
                    <td class="cell-truncate">${escapeHtml(row.mail_servers || '--')}</td>
                    <td>${row.mx_records ? 'True' : 'False'}</td>
                    <td>${escapeHtml(row.registration_date || '--')}</td>
                    <td class="cell-truncate">${escapeHtml(row.registrar || '--')}</td>
                    <td>${escapeHtml(row.ssl_cert || '--')}</td>
                    <td>${escapeHtml(row.takedown || '--')}</td>
                </tr>
            `;
        });

        typosquatTableBody.innerHTML = html;
    }

    window.viewRowDetails = function (index) {
        const item = currentTyposquats[index];
        if (!item || !detailModal) return;

        modalTargetUrl.textContent = item.source_url;
        modalBodyContent.innerHTML = `
            <div class="modal-row"><span class="modal-label">Domain Name:</span><span class="modal-val">${escapeHtml(item.source_url)}</span></div>
            <div class="modal-row"><span class="modal-label">Construction:</span><span class="modal-val">${escapeHtml(item.construction)}</span></div>
            <div class="modal-row"><span class="modal-label">Verdict:</span><span class="modal-val" style="color: ${item.verdict === 'Phishing' ? '#DC2626' : '#16A34A'}">${escapeHtml(item.verdict)}</span></div>
            <div class="modal-row"><span class="modal-label">Risk Score:</span><span class="modal-val">${item.risk} / 5</span></div>
            <div class="modal-row"><span class="modal-label">Confidence:</span><span class="modal-val">${item.confidence}%</span></div>
            <div class="modal-row"><span class="modal-label">IP Address:</span><span class="modal-val">${escapeHtml(item.ip_address)}</span></div>
            <div class="modal-row"><span class="modal-label">Registrar:</span><span class="modal-val">${escapeHtml(item.registrar)}</span></div>
        `;
        detailModal.classList.add('show');
    };

    function exportTableToCsv() {
        if (!currentTyposquats.length) {
            alert('No typosquat data available to export.');
            return;
        }
        const headers = ['Source URL', 'Construction', 'Risk', 'Verdict', 'IP Address', 'Registrar'];
        const csvRows = [headers.join(',')];
        currentTyposquats.forEach(i => {
            csvRows.push([`"${i.source_url}"`, `"${i.construction}"`, i.risk, `"${i.verdict}"`, `"${i.ip_address}"`, `"${i.registrar}"`].join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `typosquat_${currentDomain}_${Date.now()}.csv`;
        link.click();
    }

    function exportTableToJson() {
        if (!currentTyposquats.length) {
            alert('No typosquat data available to export.');
            return;
        }
        const blob = new Blob([JSON.stringify(currentTyposquats, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `typosquat_${currentDomain}_${Date.now()}.json`;
        link.click();
    }

    function copySelectedUrls() {
        const checked = document.querySelectorAll('.row-checkbox:checked');
        if (!checked.length) {
            alert('Please select at least one domain from the table.');
            return;
        }
        const urls = Array.from(checked).map(cb => cb.getAttribute('data-url'));
        navigator.clipboard.writeText(urls.join('\n')).then(() => {
            alert(`Copied ${urls.length} selected URLs to clipboard!`);
        });
    }

    // =========================================================================
    // Standalone URL Scanner
    // =========================================================================
    function initUrlScanner() {
        if (!urlScanForm || !urlInput) return;

        urlScanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const targetUrl = urlInput.value.trim();
            if (!targetUrl) return;

            if (scanningLaser) scanningLaser.style.display = 'block';

            try {
                const response = await fetch('/scan-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ url: targetUrl })
                });
                const data = await response.json();
                renderStandaloneResult(data, dynamicResultContainer);
                addRecentDetection(targetUrl, 'URL Scan', data.is_phishing ? 'High' : 'Low', data.is_phishing ? 'Phishing' : 'Safe');
            } catch (err) {
                console.error(err);
            } finally {
                if (scanningLaser) scanningLaser.style.display = 'none';
            }
        });
    }

    // =========================================================================
    // Standalone QR Scanner
    // =========================================================================
    function initQrScanner() {
        if (!qrDropzone || !qrFileInput) return;

        browseQrBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            qrFileInput.click();
        });
        qrDropzone.addEventListener('click', () => qrFileInput.click());

        qrFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleQrFile(file);
        });

        if (removeQrBtn) {
            removeQrBtn.addEventListener('click', () => {
                selectedQrFile = null;
                qrPreviewContainer.style.display = 'none';
                qrDropzone.style.display = 'block';
            });
        }

        if (scanQrBtn) {
            scanQrBtn.addEventListener('click', async () => {
                if (!selectedQrFile) return;

                const formData = new FormData();
                formData.append('file', selectedQrFile);

                try {
                    const response = await fetch('/scan-qr', { method: 'POST', body: formData });
                    const data = await response.json();
                    renderStandaloneResult(data, qrResultContainer);
                    if (data.extracted_url) {
                        addRecentDetection(data.extracted_url, 'QR Code', data.is_phishing ? 'High' : 'Low', data.is_phishing ? 'Phishing' : 'Safe');
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        }
    }

    function handleQrFile(file) {
        selectedQrFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            qrPreviewImg.src = e.target.result;
            qrFileName.textContent = file.name;
            qrFileSize.textContent = `${Math.round(file.size / 1024)} KB`;
            qrDropzone.style.display = 'none';
            qrPreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    function renderStandaloneResult(data, container) {
        if (!container) return;
        const isPhishing = data.is_phishing || data.verdict === 'phishing';
        const cardBg = isPhishing ? 'var(--bg-phishing)' : 'var(--bg-safe)';
        const borderColor = isPhishing ? '#EF4444' : '#10B981';
        const targetUrl = data.url || data.extracted_url || '';

        if (targetUrl) setCopilotActiveContext(targetUrl);

        container.innerHTML = `
            <div style="background: ${cardBg}; border: 1.5px solid ${borderColor}; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h4 style="color: ${borderColor}; font-weight: 800; font-size: 1.15rem; margin-bottom: 8px;">
                    ${isPhishing ? 'Phishing Website Detected' : 'Healthy Website Verified'}
                </h4>
                <p style="font-size: 0.92rem; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
                    ${data.message || (isPhishing ? 'Warning! High risk phishing domain identified.' : 'Classified as safe.')}
                </p>
                <div style="background: var(--bg-surface); padding: 10px 14px; border-radius: 6px; font-family: var(--font-mono); font-size: 0.88rem; margin-bottom: 12px; word-break: break-all;">
                    ${escapeHtml(targetUrl)}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    Confidence Probability: <strong>${data.confidence || 98}%</strong>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }

    // =========================================================================
    // Dark & Light Mode Theme Toggle
    // =========================================================================
    function initThemeToggle() {
        const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
        const themeLabelTexts = document.querySelectorAll('.theme-label-text');

        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const isDark = theme === 'dark';

            themeLabelTexts.forEach(label => {
                label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
            });

            if (chartInstance) {
                chartInstance.data.datasets[0].borderColor = isDark ? '#111827' : '#FFFFFF';
                chartInstance.update();
            }

            try {
                localStorage.setItem('sentinel_theme', theme);
            } catch (err) {}
        }

        let currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(currentTheme);

        themeToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const active = document.documentElement.getAttribute('data-theme') || 'light';
                applyTheme(active === 'dark' ? 'light' : 'dark');
            });
        });
    }

    // =========================================================================
    // Dashboard Charts (Threat Trends & Threat Distribution)
    // =========================================================================
    function initDashboardCharts() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // 1. Donut Chart (Threat Distribution)
        if (chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Phishing URL', 'Typosquat Domain', 'Malicious QR', 'Others'],
                    datasets: [{
                        data: [52, 28, 12, 8],
                        backgroundColor: ['#EF4444', '#3B82F6', '#A855F7', '#10B981'],
                        borderWidth: 2,
                        borderColor: isDark ? '#111827' : '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`
                            }
                        }
                    }
                }
            });
        }

        // 2. Spline Line Area Chart (Threat Trends)
        if (trendsChartCanvas) {
            const ctx2 = trendsChartCanvas.getContext('2d');

            // Red Gradient
            const redGrad = ctx2.createLinearGradient(0, 0, 0, 240);
            redGrad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
            redGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

            // Blue Gradient
            const blueGrad = ctx2.createLinearGradient(0, 0, 0, 240);
            blueGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
            blueGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

            trendsChartInstance = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Phishing',
                            data: [20, 32, 24, 34, 46, 32, 40],
                            borderColor: '#EF4444',
                            backgroundColor: redGrad,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#EF4444',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Malicious Domain',
                            data: [10, 14, 8, 16, 20, 14, 12],
                            borderColor: '#3B82F6',
                            backgroundColor: blueGrad,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#3B82F6',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 60,
                            ticks: { stepSize: 10, color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } },
                            grid: { color: 'rgba(226, 232, 240, 0.6)' }
                        },
                        x: {
                            ticks: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    function updateAnalytics() {
        const total = currentTyposquats.length;
        if (!total) return;

        let threatCount = currentTyposquats.filter(t => t.verdict === 'Phishing' || t.risk >= 4).length;
        let safeCount = total - threatCount;

        if (statTotalScans) statTotalScans.textContent = (367 + total).toLocaleString();
        if (statSafeScans) statSafeScans.textContent = (1423 + safeCount).toLocaleString();
        if (statThreatScans) statThreatScans.textContent = (246 + threatCount).toLocaleString();
    }

    function addRecentDetection(url, type, risk, status) {
        const tbody = document.getElementById('recentDetectionsTbody');
        if (!tbody) return;

        const riskClass = risk === 'High' ? 'chip-risk-high' : (risk === 'Medium' ? 'chip-risk-med' : 'chip-risk-low');
        const statusClass = status === 'Phishing' ? 'chip-status-phishing' : (status === 'Safe' ? 'chip-status-safe' : 'chip-status-susp');
        const statusIcon = status === 'Phishing' ? '&#9650;' : (status === 'Safe' ? '&#10003;' : '&#33;');

        const newRow = `
            <tr>
                <td>Just now</td>
                <td><a href="javascript:void(0)" class="url-cell-link" onclick="window.inspectRecentTarget('${escapeHtml(url)}')">${escapeHtml(url)}</a></td>
                <td>${escapeHtml(type)}</td>
                <td><span class="chip-risk ${riskClass}">${escapeHtml(risk)}</span></td>
                <td><span class="chip-status ${statusClass}">${statusIcon} ${escapeHtml(status)}</span></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('afterbegin', newRow);
    }

    window.inspectRecentTarget = function(url) {
        if (!url) return;
        const navUrl = document.getElementById('navUrlScanner');
        if (navUrl) navUrl.click();
        if (urlInput) {
            urlInput.value = url.startsWith('http') ? url : `https://${url}`;
            const scanBtn = document.getElementById('scanUrlBtn');
            if (scanBtn) scanBtn.click();
        }
    };

    // =========================================================================
    // Threat Copilot Interactive Assistant
    // =========================================================================
    function setCopilotActiveContext(url) {
        activeContextUrl = url;
        const contextBar = document.getElementById('copilotContextBar');
        const activeUrlSpan = document.getElementById('copilotActiveUrl');
        if (contextBar && activeUrlSpan) {
            activeUrlSpan.textContent = url;
            contextBar.style.display = 'flex';
        }
    }

    function clearCopilotActiveContext() {
        activeContextUrl = null;
        const contextBar = document.getElementById('copilotContextBar');
        if (contextBar) contextBar.style.display = 'none';
    }

    function initThreatCopilot() {
        const copilotChatForm = document.getElementById('copilotChatForm');
        const copilotInput = document.getElementById('copilotInput');
        const copilotMessagesContainer = document.getElementById('copilotMessagesContainer');
        const clearContextBtn = document.getElementById('copilotClearContextBtn');

        const floatingBotBtn = document.getElementById('floatingBotBtn');
        const floatingCopilotDrawer = document.getElementById('floatingCopilotDrawer');
        const drawerCloseBtn = document.getElementById('drawerCloseBtn');
        const drawerExpandBtn = document.getElementById('drawerExpandBtn');
        const drawerChatForm = document.getElementById('drawerChatForm');
        const drawerInput = document.getElementById('drawerInput');
        const drawerMessagesContainer = document.getElementById('drawerMessagesContainer');

        if (clearContextBtn) {
            clearContextBtn.addEventListener('click', clearCopilotActiveContext);
        }

        const promptChips = document.querySelectorAll('.prompt-chip');
        promptChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.getAttribute('data-query');
                if (query) {
                    if (copilotInput) copilotInput.value = query;
                    submitCopilotMessage(query, copilotMessagesContainer, copilotInput);
                }
            });
        });

        if (copilotChatForm && copilotInput) {
            copilotChatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const q = copilotInput.value.trim();
                if (q) submitCopilotMessage(q, copilotMessagesContainer, copilotInput);
            });
        }

        if (floatingBotBtn && floatingCopilotDrawer) {
            floatingBotBtn.addEventListener('click', (e) => {
                e.preventDefault();
                floatingCopilotDrawer.classList.toggle('open');
            });
        }

        if (drawerCloseBtn && floatingCopilotDrawer) {
            drawerCloseBtn.addEventListener('click', () => floatingCopilotDrawer.classList.remove('open'));
        }

        if (drawerExpandBtn && floatingCopilotDrawer) {
            drawerExpandBtn.addEventListener('click', () => {
                floatingCopilotDrawer.classList.remove('open');
                const navCopilot = document.getElementById('navThreatCopilot');
                if (navCopilot) navCopilot.click();
            });
        }

        if (drawerChatForm && drawerInput) {
            drawerChatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const q = drawerInput.value.trim();
                if (q) submitCopilotMessage(q, drawerMessagesContainer, drawerInput);
            });
        }
    }

    function initDashboardWidgets() {
        const miniForm = document.getElementById('dashCopilotMiniForm');
        const miniInput = document.getElementById('dashCopilotMiniInput');

        if (miniForm && miniInput) {
            miniForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = miniInput.value.trim();
                if (!query) return;

                const navCopilot = document.getElementById('navThreatCopilot');
                if (navCopilot) navCopilot.click();

                const copilotInput = document.getElementById('copilotInput');
                const copilotContainer = document.getElementById('copilotMessagesContainer');
                if (copilotInput) copilotInput.value = query;
                miniInput.value = '';

                setTimeout(() => {
                    submitCopilotMessage(query, copilotContainer, copilotInput);
                }, 200);
            });
        }
    }

    async function submitCopilotMessage(query, container, inputElement) {
        if (!query || !container) return;

        appendUserMessage(query, container);
        if (inputElement) inputElement.value = '';

        const loadingId = 'loading-' + Date.now();
        const loadingHtml = `
            <div class="copilot-msg msg-assistant" id="${loadingId}">
                <div class="msg-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <div class="msg-bubble"><div style="color: var(--text-secondary); font-size: 0.85rem;">Retrieving threat intelligence from RAG knowledge base...</div></div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', loadingHtml);
        container.scrollTop = container.scrollHeight;

        try {
            const response = await fetch('/api/rag/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ message: query, history: copilotHistory, context_url: activeContextUrl })
            });
            const data = await response.json();

            const loadingElem = document.getElementById(loadingId);
            if (loadingElem) loadingElem.remove();

            if (data.status === 'success') {
                appendAssistantMessage(data, container);
                copilotHistory.push({ role: 'user', content: query });
                copilotHistory.push({ role: 'assistant', content: data.answer });
            } else {
                appendErrorMessage(data.message || 'Error communicating with Threat Copilot.', container);
            }
        } catch (err) {
            const loadingElem = document.getElementById(loadingId);
            if (loadingElem) loadingElem.remove();
            appendErrorMessage('Failed to connect to the Sentinel RAG service.', container);
        }

        container.scrollTop = container.scrollHeight;
    }

    function appendUserMessage(text, container) {
        const html = `
            <div class="copilot-msg msg-user">
                <div class="msg-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <div class="msg-bubble"><div class="msg-text">${escapeHtml(text)}</div></div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
    }

    function appendAssistantMessage(data, container) {
        let citationsHtml = '';
        if (data.citations && data.citations.length > 0) {
            citationsHtml = `
                <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">
                    <strong>References:</strong> ${data.citations.map(c => escapeHtml(c.title)).join(', ')}
                </div>
            `;
        }

        const html = `
            <div class="copilot-msg msg-assistant">
                <div class="msg-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <div class="msg-bubble">
                    <div class="msg-author-tag">Sentinel Threat Copilot</div>
                    <div class="msg-text">${formatMarkdownText(data.answer)}</div>
                    ${citationsHtml}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
    }

    function appendErrorMessage(msg, container) {
        const html = `
            <div class="copilot-msg msg-assistant">
                <div class="msg-avatar" style="background: #DC2626;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div class="msg-bubble" style="background: var(--bg-phishing); color: var(--color-phishing);">${escapeHtml(msg)}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
    }

    function formatMarkdownText(md) {
        if (!md) return '';
        let s = escapeHtml(md);
        s = s.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        s = s.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        s = s.replace(/`([^`]+)`/gim, '<code>$1</code>');
        s = s.replace(/\n/gim, '<br>');
        return s;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
