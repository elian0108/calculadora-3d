/**
 * Main Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    chart: null,

    init: function () {
        this.setupNavigation();
        this.setupTheme(); // New theme handler
        this.setupPrinters();
        this.setupMaterials();
        this.setupCalculator();
        this.setupSettings();
        this.loadDashboard();
        this.setupPWA();

        // Load initial data for selectors
        this.updateSelectors();
    },

    // --- Theme ---
    setupTheme: function () {
        const toggleBtn = document.getElementById('theme-toggle');
        const savedTheme = localStorage.getItem('theme');

        // Apply saved or system preference
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.setAttribute('data-theme', 'dark');
            if (toggleBtn) toggleBtn.textContent = '☀️ Modo Claro';
        } else {
            if (toggleBtn) toggleBtn.textContent = '🌙 Modo Escuro';
        }

        toggleBtn.addEventListener('click', () => {
            if (document.body.getAttribute('data-theme') === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                toggleBtn.textContent = '🌙 Modo Escuro';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                toggleBtn.textContent = '☀️ Modo Claro';
            }
        });
    },

    // --- PWA ---
    setupPWA: function () {
        let deferredPrompt;
        const btnInstall = document.createElement('button');
        btnInstall.textContent = '📲 Instalar App';
        btnInstall.className = 'btn-secondary';
        btnInstall.style.display = 'none';
        btnInstall.style.marginLeft = '10px';

        // Add to dashboard header if exists, or navbar
        const dbHeader = document.querySelector('#dashboard header');
        if (dbHeader) {
            dbHeader.appendChild(btnInstall);
        } else {
            console.warn('Dashboard header not found for Install button');
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            btnInstall.style.display = 'inline-block';
        });

        btnInstall.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    deferredPrompt = null;
                    btnInstall.style.display = 'none';
                }
            }
        });

        window.addEventListener('appinstalled', () => {
            btnInstall.style.display = 'none';
            deferredPrompt = null;
        });
    },

    // --- Navigation ---
    setupNavigation: function () {
        const navLinks = document.querySelectorAll('.nav-links li');
        const screens = document.querySelectorAll('.screen');
        const btnNewShortcut = document.getElementById('btn-new-print-shortcut');

        const switchScreen = (targetId) => {
            // Update Menu
            navLinks.forEach(link => {
                if (link.dataset.target === targetId) link.classList.add('active');
                else link.classList.remove('active');
            });

            // Update Screen
            screens.forEach(screen => {
                if (screen.id === targetId) screen.classList.add('active');
                else screen.classList.remove('active');
            });

            // Specific refresh actions
            if (targetId === 'dashboard') this.loadDashboard();
            if (targetId === 'configuracoes') this.loadSettings();
        };

        navLinks.forEach(link => {
            link.addEventListener('click', () => switchScreen(link.dataset.target));
        });

        if (btnNewShortcut) {
            btnNewShortcut.addEventListener('click', () => switchScreen('calculadora'));
        }
    },

    // --- Dashboard ---
    loadDashboard: function () {
        const projects = StorageManager.getProjects();
        document.getElementById('total-projects').textContent = projects.length;

        // Calculate average cost
        if (projects.length > 0) {
            const total = projects.reduce((acc, p) => acc + (p.costs?.total || 0), 0);
            const avg = total / projects.length;
            document.getElementById('avg-cost').textContent = this.formatCurrency(avg);
        } else {
            document.getElementById('avg-cost').textContent = this.formatCurrency(0);
        }

        // Recent List
        const list = document.getElementById('recent-list');
        list.innerHTML = '';

        if (projects.length === 0) {
            list.innerHTML = '<li class="empty-state">Nenhum projeto salvo.</li>';
            return;
        }

        projects.slice(0, 5).forEach(p => {
            const li = document.createElement('li');
            li.className = 'list-item';
            // Add click-to-open capability
            li.style.cursor = 'pointer';
            li.onclick = () => this.loadProject(p.id);

            // Safe DOM creation
            const divInfo = document.createElement('div');

            const strongName = document.createElement('strong');
            strongName.textContent = p.name;

            const br = document.createElement('br');

            const smallDate = document.createElement('small');
            smallDate.textContent = new Date(p.updatedAt).toLocaleDateString();

            divInfo.appendChild(strongName);
            divInfo.appendChild(br);
            divInfo.appendChild(smallDate);

            const divCost = document.createElement('div');
            const strongCost = document.createElement('strong');
            strongCost.textContent = this.formatCurrency(p.costs?.total || 0);
            divCost.appendChild(strongCost);

            li.appendChild(divInfo);
            li.appendChild(divCost);

            list.appendChild(li);
        });
    },

    // --- Printers ---
    setupPrinters: function () {
        const listContainer = document.getElementById('printers-list');
        const modal = document.getElementById('modal-printer');
        const btnAdd = document.getElementById('btn-add-printer');
        const btnClose = modal.querySelector('.close');
        const form = document.getElementById('form-printer');

        // Render List
        const render = () => {
            const printers = StorageManager.getPrinters();
            listContainer.innerHTML = '';

            if (printers.length === 0) {
                listContainer.innerHTML = '<p class="empty-state">Nenhuma impressora cadastrada.</p>';
            }

            printers.forEach(p => {
                const card = document.createElement('div');
                card.className = 'printer-card';

                const h4 = document.createElement('h4');
                h4.textContent = p.name;

                const pCons = document.createElement('p');
                pCons.textContent = `Consumo: ${p.consumption} kW`;

                const pLife = document.createElement('p');
                pLife.textContent = `Vida Útil: ${p.lifespan}h`;

                const divActions = document.createElement('div');
                divActions.className = 'card-actions';

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn-delete';
                btnDelete.dataset.id = p.id;
                btnDelete.textContent = 'Excluir';

                divActions.appendChild(btnDelete);

                card.appendChild(h4);
                card.appendChild(pCons);
                card.appendChild(pLife);
                card.appendChild(divActions);

                // Delete Event
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent bubbling if needed
                    if (confirm('Excluir impressora?')) {
                        StorageManager.deletePrinter(p.id);
                        render();
                        this.updateSelectors();
                    }
                });
                listContainer.appendChild(card);
            });
        };

        // Modal Logic
        btnAdd.addEventListener('click', () => {
            form.reset();
            document.getElementById('printer-id').value = '';
            modal.classList.remove('hidden');
        });

        btnClose.addEventListener('click', () => modal.classList.add('hidden'));
        window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

        // Save
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('printer-name').value;
            const price = parseFloat(document.getElementById('printer-price').value);

            if (!name || isNaN(price)) {
                alert('Preencha os campos obrigatórios corretamente.');
                return;
            }

            const printer = {
                id: document.getElementById('printer-id').value || null,
                name: name,
                price: price,
                consumption: parseFloat(document.getElementById('printer-consumption').value) || 0,
                lifespan: parseFloat(document.getElementById('printer-lifespan').value) || 2000,
                maintenance: parseFloat(document.getElementById('printer-maintenance').value) || 0
            };
            StorageManager.savePrinter(printer);
            modal.classList.add('hidden');
            render();
            this.updateSelectors();
        });

        render();
    },

    // --- Materials ---
    setupMaterials: function () {
        const listContainer = document.getElementById('materials-list');
        const modal = document.getElementById('modal-material');
        const btnAdd = document.getElementById('btn-add-material');
        const btnClose = modal.querySelector('.close');
        const form = document.getElementById('form-material');

        const render = () => {
            const materials = StorageManager.getMaterials();
            listContainer.innerHTML = '';

            if (materials.length === 0) {
                listContainer.innerHTML = '<p class="empty-state">Nenhum material cadastrado.</p>';
            }

            materials.forEach(m => {
                const card = document.createElement('div');
                card.className = 'material-card';

                const h4 = document.createElement('h4');
                h4.textContent = `${m.name} (${m.type})`;

                const pPrice = document.createElement('p');
                pPrice.textContent = `Preço: ${this.formatCurrency(m.price)}`;

                const pWeight = document.createElement('p');
                pWeight.textContent = `Peso: ${m.weight}g`;

                const pCost = document.createElement('p');
                const strongCost = document.createElement('strong');
                strongCost.textContent = `Custo/g: ${this.formatCurrency(m.price / m.weight)}`;
                pCost.appendChild(strongCost);

                const divActions = document.createElement('div');
                divActions.className = 'card-actions';

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn-delete';
                btnDelete.dataset.id = m.id;
                btnDelete.textContent = 'Excluir';

                divActions.appendChild(btnDelete);

                card.appendChild(h4);
                card.appendChild(pPrice);
                card.appendChild(pWeight);
                card.appendChild(pCost);
                card.appendChild(divActions);

                btnDelete.addEventListener('click', () => {
                    if (confirm('Excluir material?')) {
                        StorageManager.deleteMaterial(m.id);
                        render();
                        this.updateSelectors();
                    }
                });
                listContainer.appendChild(card);
            });
        };

        btnAdd.addEventListener('click', () => {
            form.reset();
            document.getElementById('material-id').value = '';
            modal.classList.remove('hidden');
        });

        btnClose.addEventListener('click', () => modal.classList.add('hidden'));
        window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('material-name').value;
            const price = parseFloat(document.getElementById('material-price').value);
            const weight = parseFloat(document.getElementById('material-weight').value);

            if (!name || isNaN(price) || isNaN(weight)) {
                alert('Preencha os campos obrigatórios corretamente.');
                return;
            }

            const material = {
                id: document.getElementById('material-id').value || null,
                name: name,
                type: document.getElementById('material-type').value,
                price: price,
                weight: weight
            };
            StorageManager.saveMaterial(material);
            modal.classList.add('hidden');
            render();
            this.updateSelectors();
        });

        render();
    },

    // --- Calculator ---
    setupCalculator: function () {
        const btnCalc = document.getElementById('btn-calculate');
        const btnSave = document.getElementById('btn-save-project');

        // Initialize Chart
        const ctx = document.getElementById('costChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Material', 'Energia', 'Depreciação', 'Mão de Obra'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#007bff', '#ffc107', '#dc3545', '#28a745']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        const performCalculation = () => {
            // Get inputs
            const printerId = document.getElementById('calc-printer').value;
            const materialId = document.getElementById('calc-material').value;
            const weight = parseFloat(document.getElementById('calc-weight').value) || 0;
            const timeD = parseFloat(document.getElementById('calc-time-d').value) || 0;
            const timeH = parseFloat(document.getElementById('calc-time-h').value) || 0;
            const timeM = parseFloat(document.getElementById('calc-time-m').value) || 0;
            const laborTime = parseFloat(document.getElementById('calc-labor-time').value) || 0;
            const failRate = parseFloat(document.getElementById('calc-fail-rate').value) || 0;

            if (!printerId || !materialId) {
                alert('Selecione uma impressora e um material.');
                return null;
            }

            // Get Data Objects
            const printer = StorageManager.getPrinters().find(p => p.id === printerId);
            const material = StorageManager.getMaterials().find(m => m.id === materialId);
            const settings = StorageManager.getSettings();

            if (!printer || !material) {
                console.error("Printer or Material not found in storage", { printerId, materialId });
                alert('Erro interno: Impressora ou Material não encontrado. Tente recarregar a página.');
                return null;
            }

            // Calculations
            const totalHours = Calculator.calculateTotalHours(timeD, timeH, timeM);
            const costMaterial = Calculator.calculateMaterialCost(weight, material.price, material.weight);
            const costEnergy = Calculator.calculateEnergyCost(totalHours, printer.consumption, settings.kwhCost);
            const costDepreciation = Calculator.calculateDepreciation(totalHours, printer.price, printer.lifespan, printer.maintenance);
            const costLabor = Calculator.calculateLaborCost(laborTime, settings.laborCost);

            const subtotal = costMaterial + costEnergy + costDepreciation + costLabor;
            // Apply failure to the subtotal
            const totalWithFailure = Calculator.calculateTotalWithFailures(subtotal, failRate);

            // Calculate final price
            const sellPrice = Calculator.calculateSellPrice(totalWithFailure, settings.markup);

            // Update UI
            document.getElementById('res-material').textContent = this.formatCurrency(costMaterial);
            document.getElementById('res-energy').textContent = this.formatCurrency(costEnergy);
            document.getElementById('res-depreciation').textContent = this.formatCurrency(costDepreciation);
            document.getElementById('res-labor').textContent = this.formatCurrency(costLabor);
            document.getElementById('res-total').textContent = this.formatCurrency(totalWithFailure);
            document.getElementById('res-price').textContent = this.formatCurrency(sellPrice);

            // Update Chart
            this.chart.data.datasets[0].data = [
                costMaterial,
                costEnergy,
                costDepreciation,
                costLabor
            ];
            this.chart.update();

            btnSave.disabled = false;

            return {
                name: document.getElementById('project-name').value || 'Projeto Sem Nome',
                printerId,
                materialId,
                weight,
                totalHours,
                timeD, // Save breakdown
                timeH,
                timeM,
                laborTime,
                failRate,
                costs: {
                    material: costMaterial,
                    energy: costEnergy,
                    depreciation: costDepreciation,
                    labor: costLabor,
                    total: totalWithFailure,
                    suggestedPrice: sellPrice
                }
            };
        };

        btnCalc.addEventListener('click', performCalculation);

        btnSave.addEventListener('click', () => {
            const projectData = performCalculation();
            if (projectData) {
                StorageManager.saveProject(projectData);
                alert('Projeto salvo com sucesso!');
                this.loadDashboard(); // Refresh dashboard data
            }
        });
    },

    // --- Settings ---
    setupSettings: function () {
        const form = document.getElementById('settings-form');

        this.loadSettings = () => {
            const settings = StorageManager.getSettings();
            document.getElementById('conf-kwh').value = settings.kwhCost;
            document.getElementById('conf-labor-cost').value = settings.laborCost;
            document.getElementById('conf-markup').value = settings.markup;
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                kwhCost: parseFloat(document.getElementById('conf-kwh').value),
                laborCost: parseFloat(document.getElementById('conf-labor-cost').value),
                markup: parseFloat(document.getElementById('conf-markup').value),
                currency: 'BRL'
            };
            StorageManager.saveSettings(settings);
            alert('Configurações salvas!');
        });

        // Export
        document.getElementById('btn-export').addEventListener('click', () => {
            const dataStr = StorageManager.exportData();
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `calc3d_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Import
        const fileInput = document.getElementById('file-import');
        document.getElementById('btn-import-trigger').addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = StorageManager.importData(event.target.result);
                if (success) {
                    alert('Dados restaurados com sucesso! A página será recarregada.');
                    location.reload();
                } else {
                    alert('Erro ao importar dados. Verifique o arquivo.');
                }
            };
            reader.readAsText(file);
        });
    },

    // --- Shared ---
    updateSelectors: function () {
        const printers = StorageManager.getPrinters();
        const materials = StorageManager.getMaterials();

        const selPrinter = document.getElementById('calc-printer');
        const selMaterial = document.getElementById('calc-material');

        selPrinter.innerHTML = '<option value="">Selecione...</option>';
        printers.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            selPrinter.appendChild(opt);
        });

        selMaterial.innerHTML = '<option value="">Selecione...</option>';
        materials.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.name} (${m.type})`;
            selMaterial.appendChild(opt);
        });
    },

    // --- Load Project ---
    loadProject: function (id) {
        const projects = StorageManager.getProjects();
        const project = projects.find(p => p.id === id);

        if (!project) return;

        // Populate Form
        document.getElementById('project-name').value = project.name;
        document.getElementById('calc-printer').value = project.printerId;
        document.getElementById('calc-material').value = project.materialId;
        document.getElementById('calc-weight').value = project.weight;
        document.getElementById('calc-labor-time').value = project.laborTime;
        document.getElementById('calc-fail-rate').value = project.failRate;

        // Time Breakdown (Legacy support: if D/H/M missing, approx from totalHours)
        if (project.timeD !== undefined) {
            document.getElementById('calc-time-d').value = project.timeD;
            document.getElementById('calc-time-h').value = project.timeH;
            document.getElementById('calc-time-m').value = project.timeM;
        } else {
            // Fallback for old projects
            document.getElementById('calc-time-d').value = 0;
            document.getElementById('calc-time-h').value = Math.floor(project.totalHours);
            document.getElementById('calc-time-m').value = Math.round((project.totalHours % 1) * 60);
        }

        // Switch Screen
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        document.querySelector('[data-target="calculadora"]').classList.add('active');
        document.getElementById('calculadora').classList.add('active');

        // Trigger Calculate
        document.getElementById('btn-calculate').click();
    },

    formatCurrency: function (value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
};
