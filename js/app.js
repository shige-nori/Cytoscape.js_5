/**
 * App - メインアプリケーション
 */
class App {
    constructor() {
        this.networkFileData = null;
        this.tableFileData = null;
        this.currentFileHandle = null; // 現在開いている/保存したファイルのハンドル
        this.dataTypes = [
            { value: 'string', label: 'String' },
            { value: 'number', label: 'Integer' },
            { value: 'float', label: 'Float' },
            { value: 'boolean', label: 'Y/N (Boolean)' },
            { value: 'string[]', label: 'String Array' },
            { value: 'number[]', label: 'Integer Array' },
            { value: 'float[]', label: 'Float Array' },
            { value: 'boolean[]', label: 'Boolean Array' }
        ];
    }

    /**
     * カラムの値が全て整数かどうかを判定
     * @param {any[][]} data - データ行
     * @param {number} columnIndex - カラムインデックス
     * @returns {boolean}
     */
    isColumnAllIntegers(data, columnIndex) {
        for (const row of data) {
            const value = row[columnIndex];
            if (value === undefined || value === null || value === '') {
                continue; // 空の値はスキップ
            }
            const strValue = String(value).trim();
            if (strValue === '') continue;
            
            // 整数かどうかをチェック（小数点なし、数値のみ）
            if (!/^-?\d+$/.test(strValue)) {
                return false;
            }
        }
        return true;
    }

    /**
     * カラムのデータ型を自動判定
     * @param {any[][]} data - データ行
     * @param {number} columnIndex - カラムインデックス
     * @returns {string} - データ型
     */
    detectColumnDataType(data, columnIndex) {
        if (this.isColumnAllIntegers(data, columnIndex)) {
            return 'number';
        }
        return 'string';
    }

    /**
     * アプリケーションを初期化
     */
    initialize() {
        // NetworkManager初期化
        networkManager.initialize();

        // LayoutTools初期化
        layoutTools.initialize();

        // イベントリスナーを設定
        this.setupEventListeners();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // メニュー: Style - Node
        document.getElementById('menu-style-node').addEventListener('click', () => {
            const panel = new StylePanel('node');
            panel.initialize();
        });

        // メニュー: Style - Edge
        document.getElementById('menu-style-edge').addEventListener('click', () => {
            const panel = new StylePanel('edge');
            panel.initialize();
        });

        // メニュー: View - Data Table
        document.getElementById('menu-view-data-table').addEventListener('click', () => {
            this.openDataTableInNewWindow();
        });

                // メニュー: Close
                document.getElementById('menu-close').addEventListener('click', (e) => {
                    const menuItem = document.getElementById('menu-close');
                    if (menuItem.classList.contains('disabled')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    // ネットワーク図が存在する場合のみクリア
                    if (networkManager.cy && networkManager.cy.nodes().length > 0) {
                        networkManager.clear();
                        // ファイルハンドルをクリア
                        this.currentFileHandle = null;
                        // Save/Save As/Table File/Closeメニューを無効化
                        document.getElementById('menu-save').classList.add('disabled');
                        document.getElementById('menu-save-as').classList.add('disabled');
                        document.getElementById('menu-table-file').classList.add('disabled');
                        document.getElementById('menu-close').classList.add('disabled');
                    }
                });
        // メニュー: Network File
        document.getElementById('menu-network-file').addEventListener('click', () => {
            // ネットワーク図がすでに存在する場合は確認モーダルを表示
            if (networkManager.cy && networkManager.cy.nodes().length > 0) {
                this.showConfirmModal(
                    '現在のネットワーク図は失われます。<br>新しいネットワーク図を読み込みますか？',
                    () => {
                        // 既存のネットワークをクリア
                        networkManager.clear();
                        // Table Fileメニューを無効化
                        document.getElementById('menu-table-file').classList.add('disabled');
                        // Save/Save As/Closeメニューを無効化
                        document.getElementById('menu-save').classList.add('disabled');
                        document.getElementById('menu-save-as').classList.add('disabled');
                        document.getElementById('menu-close').classList.add('disabled');
                        document.getElementById('network-file-input').click();
                    }
                );
                return;
            }
            document.getElementById('network-file-input').click();
        });

        // メニュー: Table File
        document.getElementById('menu-table-file').addEventListener('click', (e) => {
            const menuItem = document.getElementById('menu-table-file');
            if (menuItem.classList.contains('disabled')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            document.getElementById('table-file-input').click();
        });

        // メニュー: Save（上書き保存）
        document.getElementById('menu-save').addEventListener('click', (e) => {
            const menuItem = document.getElementById('menu-save');
            if (menuItem.classList.contains('disabled')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.saveNetwork();
        });

        // メニュー: Save As（名前を付けて保存）
        document.getElementById('menu-save-as').addEventListener('click', (e) => {
            const menuItem = document.getElementById('menu-save-as');
            if (menuItem.classList.contains('disabled')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.saveNetworkAs();
        });

        // メニュー: Open
        document.getElementById('menu-open').addEventListener('click', () => {
            // ネットワーク図がすでに存在する場合は確認モーダルを表示
            if (networkManager.cy && networkManager.cy.nodes().length > 0) {
                this.showConfirmModal(
                    '現在のネットワーク図は失われます。<br>保存したネットワーク図を開きますか？',
                    () => {
                        // 既存のネットワークをクリア
                        networkManager.clear();
                        // ファイルハンドルをクリア
                        this.currentFileHandle = null;
                        // Table Fileメニューを無効化
                        document.getElementById('menu-table-file').classList.add('disabled');
                        // Saveメニューを無効化
                        document.getElementById('menu-save').classList.add('disabled');
                        // Save Asメニューを無効化
                        document.getElementById('menu-save-as').classList.add('disabled');
                        // Closeメニューを無効化
                        document.getElementById('menu-close').classList.add('disabled');
                        this.openNetworkWithPicker();
                    }
                );
                return;
            }
            this.openNetworkWithPicker();
        });

        // ファイル入力: Open File（フォールバック用）
        document.getElementById('open-file-input').addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await this.openNetwork(e.target.files[0], null);
                e.target.value = ''; // リセット
            }
        });

        // ファイル入力: Network File
        document.getElementById('network-file-input').addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await this.handleNetworkFile(e.target.files[0]);
                e.target.value = ''; // リセット
            }
        });

        // ファイル入力: Table File
        document.getElementById('table-file-input').addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await this.handleTableFile(e.target.files[0]);
                e.target.value = ''; // リセット
            }
        });

        // Network Modal
        document.getElementById('network-modal-close').addEventListener('click', () => {
            this.closeModal('network-modal');
        });
        document.getElementById('network-cancel').addEventListener('click', () => {
            this.closeModal('network-modal');
        });
        document.getElementById('network-import').addEventListener('click', () => {
            this.importNetworkData();
        });

        // Table Modal
        document.getElementById('table-modal-close').addEventListener('click', () => {
            this.closeModal('table-modal');
        });
        document.getElementById('table-cancel').addEventListener('click', () => {
            this.closeModal('table-modal');
        });
        document.getElementById('table-import').addEventListener('click', () => {
            this.importTableData();
        });

        // モーダル背景クリックで閉じる
        document.getElementById('network-modal').addEventListener('click', (e) => {
            if (e.target.id === 'network-modal') {
                this.closeModal('network-modal');
            }
        });
        document.getElementById('table-modal').addEventListener('click', (e) => {
            if (e.target.id === 'table-modal') {
                this.closeModal('table-modal');
            }
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('network-modal');
                this.closeModal('table-modal');
            }
        });
    }

    /**
     * Network Fileの処理
     * @param {File} file 
     */
    async handleNetworkFile(file) {
        try {
            this.networkFileData = await fileHandler.readFile(file);
            this.networkFileData.fileName = file.name;
            this.showNetworkModal();
            // Closeメニューを有効化
            document.getElementById('menu-close').classList.remove('disabled');
        } catch (error) {
            alert(`Error reading file: ${error.message}`);
        }
    }

    /**
     * Table Fileの処理
     * @param {File} file 
     */
    async handleTableFile(file) {
        try {
            this.tableFileData = await fileHandler.readFile(file);
            this.tableFileData.fileName = file.name;
            this.showTableModal();
            // Closeメニューを有効化
            document.getElementById('menu-close').classList.remove('disabled');
        } catch (error) {
            alert(`Error reading file: ${error.message}`);
        }
    }

    /**
     * Network Fileモーダルを表示
     */
    showNetworkModal() {
        const { headers, data, fileName } = this.networkFileData;

        // ファイル名を表示
        document.getElementById('network-file-name').textContent = `📁 ${fileName} (${data.length} rows)`;

        // カラム設定を作成
        this.createNetworkColumnSettings(headers, data);

        // ローディング状態をリセット
        this.setLoadingState('network', false);

        // モーダルを表示
        this.openModal('network-modal');
    }

    /**
     * Table Fileモーダルを表示
     */
    showTableModal() {
        const { headers, data, fileName } = this.tableFileData;

        // ファイル名を表示
        document.getElementById('table-file-name').textContent = `📁 ${fileName} (${data.length} rows)`;

        // カラム設定を作成
        this.createTableColumnSettings(headers, data);

        // ローディング状態をリセット
        this.setLoadingState('table', false);

        // モーダルを表示
        this.openModal('table-modal');
    }

    /**
     * ローディング状態を設定
     * @param {string} type - 'network' or 'table'
     * @param {boolean} isLoading - ローディング中かどうか
     */
    setLoadingState(type, isLoading) {
        const importBtn = document.getElementById(`${type}-import`);
        const cancelBtn = document.getElementById(`${type}-cancel`);
        const loadingMsg = document.getElementById(`${type}-loading-message`);

        if (isLoading) {
            importBtn.classList.add('loading');
            importBtn.disabled = true;
            cancelBtn.disabled = true;
            loadingMsg.classList.add('active');
        } else {
            importBtn.classList.remove('loading');
            importBtn.disabled = false;
            cancelBtn.disabled = false;
            loadingMsg.classList.remove('active');
        }
    }

    /**
     * Network Fileのカラム設定UIを作成（テーブル形式）
     * @param {string[]} headers 
     * @param {any[][]} data
     */
    createNetworkColumnSettings(headers, data) {
        const table = document.getElementById('network-column-settings');
        
        let html = `
            <thead>
                <tr>
                    <th>Column Name</th>
                    <th>Role</th>
                    <th>Data Type</th>
                    <th>Delimiter</th>
                </tr>
            </thead>
            <tbody>
        `;

        headers.forEach((header, index) => {
            const defaultRole = index === 0 ? 'source' : (index === 1 ? 'target' : 'attribute');
            const isAttribute = defaultRole === 'attribute';
            const detectedType = isAttribute ? this.detectColumnDataType(data, index) : 'string';
            
            html += `
                <tr data-index="${index}">
                    <td class="column-name" title="${this.escapeHtml(header)}">${this.escapeHtml(header)}</td>
                    <td>
                        <select class="role-select" data-index="${index}">
                            <option value="source" ${defaultRole === 'source' ? 'selected' : ''}>Source</option>
                            <option value="target" ${defaultRole === 'target' ? 'selected' : ''}>Target</option>
                            <option value="attribute" ${defaultRole === 'attribute' ? 'selected' : ''}>Attribute</option>
                            <option value="ignore">Ignore</option>
                        </select>
                    </td>
                    <td class="datatype-cell ${!isAttribute ? 'hidden-cell' : ''}">
                        <select class="datatype-select" data-index="${index}">
                            ${this.dataTypes.map(dt => `<option value="${dt.value}" ${dt.value === detectedType ? 'selected' : ''}>${dt.label}</option>`).join('')}
                        </select>
                    </td>
                    <td class="delimiter-cell ${!isAttribute ? 'hidden-cell' : ''}">
                        <input type="text" class="delimiter-input" data-index="${index}" value="," placeholder=",">
                    </td>
                </tr>
            `;
        });

        html += '</tbody>';
        table.innerHTML = html;

        // Role変更時のイベント
        table.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleNetworkRoleChange(e.target);
            });
        });
    }

    /**
     * Network FileのRole変更ハンドラ
     * @param {HTMLSelectElement} select 
     */
    handleNetworkRoleChange(select) {
        const role = select.value;
        const row = select.closest('tr');
        const dataTypeCell = row.querySelector('.datatype-cell');
        const delimiterCell = row.querySelector('.delimiter-cell');

        if (role === 'attribute') {
            dataTypeCell.classList.remove('hidden-cell');
            delimiterCell.classList.remove('hidden-cell');
        } else {
            dataTypeCell.classList.add('hidden-cell');
            delimiterCell.classList.add('hidden-cell');
        }

        // Source/Targetは1つずつしか選択できないように
        if (role === 'source' || role === 'target') {
            const allSelects = document.querySelectorAll('#network-column-settings .role-select');
            allSelects.forEach(otherSelect => {
                if (otherSelect !== select && otherSelect.value === role) {
                    otherSelect.value = 'attribute';
                    this.handleNetworkRoleChange(otherSelect);
                }
            });
        }
    }

    /**
     * Table Fileのカラム設定UIを作成（テーブル形式）
     * @param {string[]} headers 
     * @param {any[][]} data
     */
    createTableColumnSettings(headers, data) {
        const table = document.getElementById('table-column-settings');
        
        let html = `
            <thead>
                <tr>
                    <th>Column Name</th>
                    <th>Role</th>
                    <th>Data Type</th>
                    <th>Delimiter</th>
                </tr>
            </thead>
            <tbody>
        `;

        headers.forEach((header, index) => {
            const defaultRole = index === 0 ? 'node' : 'attribute';
            const isAttribute = defaultRole === 'attribute';
            const detectedType = isAttribute ? this.detectColumnDataType(data, index) : 'string';
            
            html += `
                <tr data-index="${index}">
                    <td class="column-name" title="${this.escapeHtml(header)}">${this.escapeHtml(header)}</td>
                    <td>
                        <select class="role-select" data-index="${index}">
                            <option value="node" ${defaultRole === 'node' ? 'selected' : ''}>Node</option>
                            <option value="attribute" ${defaultRole === 'attribute' ? 'selected' : ''}>Attribute</option>
                            <option value="ignore">Ignore</option>
                        </select>
                    </td>
                    <td class="datatype-cell ${!isAttribute ? 'hidden-cell' : ''}">
                        <select class="datatype-select" data-index="${index}">
                            ${this.dataTypes.map(dt => `<option value="${dt.value}" ${dt.value === detectedType ? 'selected' : ''}>${dt.label}</option>`).join('')}
                        </select>
                    </td>
                    <td class="delimiter-cell ${!isAttribute ? 'hidden-cell' : ''}">
                        <input type="text" class="delimiter-input" data-index="${index}" value="," placeholder=",">
                    </td>
                </tr>
            `;
        });

        html += '</tbody>';
        table.innerHTML = html;

        // Role変更時のイベント
        table.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleTableRoleChange(e.target);
            });
        });
    }

    /**
     * Table FileのRole変更ハンドラ
     * @param {HTMLSelectElement} select 
     */
    handleTableRoleChange(select) {
        const role = select.value;
        const row = select.closest('tr');
        const dataTypeCell = row.querySelector('.datatype-cell');
        const delimiterCell = row.querySelector('.delimiter-cell');

        if (role === 'attribute') {
            dataTypeCell.classList.remove('hidden-cell');
            delimiterCell.classList.remove('hidden-cell');
        } else {
            dataTypeCell.classList.add('hidden-cell');
            delimiterCell.classList.add('hidden-cell');
        }

        // Nodeは1つしか選択できないように
        if (role === 'node') {
            const allSelects = document.querySelectorAll('#table-column-settings .role-select');
            allSelects.forEach(otherSelect => {
                if (otherSelect !== select && otherSelect.value === 'node') {
                    otherSelect.value = 'attribute';
                    this.handleTableRoleChange(otherSelect);
                }
            });
        }
    }

    /**
     * Network Dataをインポート
     */
    async importNetworkData() {
        const table = document.getElementById('network-column-settings');
        const rows = table.querySelectorAll('tbody tr');
        const { headers, data } = this.networkFileData;

        let sourceCol = null;
        let targetCol = null;
        const attributes = [];

        rows.forEach(row => {
            const index = parseInt(row.dataset.index);
            const role = row.querySelector('.role-select').value;
            const dataType = row.querySelector('.datatype-select').value;
            const delimiter = row.querySelector('.delimiter-input').value || ',';

            if (role === 'source') {
                sourceCol = { index, name: headers[index] };
            } else if (role === 'target') {
                targetCol = { index, name: headers[index] };
            } else if (role === 'attribute') {
                attributes.push({
                    index,
                    name: headers[index],
                    dataType,
                    delimiter
                });
            }
        });

        if (!sourceCol || !targetCol) {
            alert('Please select Source and Target columns.');
            return;
        }

        // ローディング状態を開始
        this.setLoadingState('network', true);

        // 非同期処理でUIを更新させる
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // NetworkManagerにデータをインポート
            networkManager.importNetworkData({
                data,
                columnSettings: {
                    source: sourceCol,
                    target: targetCol,
                    attributes
                }
            });

            this.closeModal('network-modal');

            // Table Fileメニューを有効化
            document.getElementById('menu-table-file').classList.remove('disabled');
            // Save Asメニューを有効化（新規インポートなのでSaveは無効のまま）
            document.getElementById('menu-save-as').classList.remove('disabled');
            // ファイルハンドルをクリア
            this.currentFileHandle = null;

            // 統計を表示
            const stats = networkManager.getStats();
            console.log(`Imported: ${stats.nodeCount} nodes, ${stats.edgeCount} edges`);
        } finally {
            this.setLoadingState('network', false);
        }
    }

    /**
     * Table Dataをインポート
     */
    async importTableData() {
        const table = document.getElementById('table-column-settings');
        const rows = table.querySelectorAll('tbody tr');
        const { headers, data } = this.tableFileData;

        let nodeCol = null;
        const attributes = [];

        rows.forEach(row => {
            const index = parseInt(row.dataset.index);
            const role = row.querySelector('.role-select').value;
            const dataType = row.querySelector('.datatype-select').value;
            const delimiter = row.querySelector('.delimiter-input').value || ',';

            if (role === 'node') {
                nodeCol = { index, name: headers[index] };
            } else if (role === 'attribute') {
                attributes.push({
                    index,
                    name: headers[index],
                    dataType,
                    delimiter
                });
            }
        });

        if (!nodeCol) {
            alert('Please select a Node column.');
            return;
        }

        // ローディング状態を開始
        this.setLoadingState('table', true);

        // 非同期処理でUIを更新させる
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // NetworkManagerにデータをインポート
            networkManager.importTableData({
                data,
                columnSettings: {
                    node: nodeCol,
                    attributes
                }
            });

            this.closeModal('table-modal');

            // 統計を表示
            const stats = networkManager.getStats();
            console.log(`Updated: ${stats.nodeCount} nodes, ${stats.edgeCount} edges`);
        } finally {
            this.setLoadingState('table', false);
        }
    }

    /**
     * モーダルを開く
     * @param {string} modalId 
     */
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    /**
     * モーダルを閉じる
     * @param {string} modalId 
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    /**
     * 確認モーダルを表示
     * @param {string} message - 表示するメッセージ
     * @param {Function} onConfirm - OKクリック時のコールバック
     */
    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-modal-message');
        const okBtn = document.getElementById('confirm-modal-ok');
        const cancelBtn = document.getElementById('confirm-modal-cancel');

        messageEl.innerHTML = message;
        modal.classList.add('active');

        // 既存のイベントリスナーを削除（重複防止）
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // OKボタン
        newOkBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (onConfirm) {
                onConfirm();
            }
        });

        // キャンセルボタン
        newCancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    /**
     * HTMLエスケープ
     * @param {string} str 
     * @returns {string}
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * ネットワークを上書き保存
     */
    async saveNetwork() {
        if (!this.currentFileHandle) {
            // ファイルハンドルがない場合は何もしない（メニューが無効化されているはず）
            return;
        }

        const data = networkManager.exportToJSON();
        if (!data) {
            alert('保存するネットワークがありません。');
            return;
        }

        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const writable = await this.currentFileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            console.error('Save error:', err);
            alert('保存に失敗しました。\n' + err.message);
        }
    }

    /**
     * ネットワークを名前を付けて保存
     */
    async saveNetworkAs() {
        const data = networkManager.exportToJSON();
        if (!data) {
            alert('保存するネットワークがありません。');
            return;
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // File System Access API をサポートしているかチェック
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'network.cynet',
                    types: [{
                        description: 'Cytoscape Network File',
                        accept: { 'application/json': ['.cynet'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();

                // ファイルハンドルを保存（上書き保存用）
                this.currentFileHandle = handle;
                // Saveメニューを有効化
                document.getElementById('menu-save').classList.remove('disabled');
                return;
            } catch (err) {
                // ユーザーがキャンセルした場合
                if (err.name === 'AbortError') {
                    return;
                }
                console.error('Save error:', err);
            }
        }

        // フォールバック: 従来のダウンロード方式（上書き保存は不可）
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'network.cynet';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * ファイルピッカーを使ってネットワークファイルを開く
     */
    async openNetworkWithPicker() {
        // File System Access API をサポートしているかチェック
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Cytoscape Network File',
                        accept: { 'application/json': ['.cynet'] }
                    }]
                });
                const file = await handle.getFile();
                await this.openNetwork(file, handle);
                return;
            } catch (err) {
                // ユーザーがキャンセルした場合
                if (err.name === 'AbortError') {
                    return;
                }
                console.error('Open error:', err);
            }
        }

        // フォールバック: 従来のファイル入力
        document.getElementById('open-file-input').click();
    }

    /**
     * ネットワークファイルを開く
     * @param {File} file - 開くファイル
     * @param {FileSystemFileHandle|null} handle - ファイルハンドル
     */
    async openNetwork(file, handle = null) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const success = networkManager.importFromJSON(data);
            if (success) {
                // Table Fileメニューを有効化
                document.getElementById('menu-table-file').classList.remove('disabled');
                // Save Asメニューを有効化
                document.getElementById('menu-save-as').classList.remove('disabled');
                // Closeメニューを有効化
                document.getElementById('menu-close').classList.remove('disabled');

                // ファイルハンドルがある場合はSaveも有効化
                if (handle) {
                    this.currentFileHandle = handle;
                    document.getElementById('menu-save').classList.remove('disabled');
                }

                const stats = networkManager.getStats();
                console.log(`Opened: ${stats.nodeCount} nodes, ${stats.edgeCount} edges`);
            } else {
                alert('ファイルの読み込みに失敗しました。');
            }
        } catch (error) {
            console.error('Open error:', error);
            alert('ファイルの読み込みに失敗しました。\n' + error.message);
        }
    }

    /**
     * データテーブルパネルを開く
     */
    openDataTablePanel() {
        // 既存パネルがあれば削除
        const oldPanel = document.getElementById('data-table-panel');
        if (oldPanel) {
            oldPanel.remove();
        }

        // パネル作成
        const panel = document.createElement('div');
        panel.className = 'data-table-panel tools-panel';
        panel.id = 'data-table-panel';
        panel.innerHTML = `
            <div class="data-table-panel-header">
                <h3>Data Table</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button id="panel-popout-btn" style="padding: 4px 12px; font-size: 12px; border: 1px solid var(--border-color); background: white; border-radius: 4px; cursor: pointer;" title="Open in new window">↗ Pop Out</button>
                    <span class="data-table-panel-close">&times;</span>
                </div>
            </div>
            <div class="data-table-tabs">
                <button class="data-table-tab active" id="panel-tab-node">Node Table</button>
                <button class="data-table-tab" id="panel-tab-edge">Edge Table</button>
                <button class="data-table-tab" id="panel-tab-columns" style="margin-left: auto;">⚙ Columns</button>
            </div>
            <div class="data-table-panel-body">
                <div class="data-table-content" id="panel-node-table-content">
                    <table id="panel-node-table" class="data-table">
                        <thead id="panel-node-table-head"></thead>
                        <tbody id="panel-node-table-body"></tbody>
                    </table>
                </div>
                <div class="data-table-content" id="panel-edge-table-content" style="display: none;">
                    <table id="panel-edge-table" class="data-table">
                        <thead id="panel-edge-table-head"></thead>
                        <tbody id="panel-edge-table-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="data-table-panel-resize-handle"></div>
        `;
        
        document.body.appendChild(panel);
        panel.classList.add('active');

        // 非表示カラムの状態を保持
        this.hiddenColumns = { node: new Set(), edge: new Set() };

        // イベントリスナー設定
        this.setupDataTablePanelListeners(panel);

        // 初期データ表示
        this.updatePanelDataTable();

        // Cytoscapeの選択イベントをリスン
        if (networkManager.cy) {
            // 既存のリスナーをクリア
            networkManager.cy.off('select.datatable unselect.datatable');
            
            // 選択/非選択時にテーブルを更新
            networkManager.cy.on('select.datatable unselect.datatable', () => {
                this.updatePanelDataTable();
            });
        }

        // ドラッグ移動を有効化
        this.makePanelDraggable(panel);
        
        // リサイズを有効化
        this.makePanelResizable(panel);
    }

    /**
     * データテーブルパネルのイベントリスナーを設定
     */
    setupDataTablePanelListeners(panel) {
        // 閉じるボタン
        panel.querySelector('.data-table-panel-close').addEventListener('click', () => {
            if (networkManager.cy) {
                networkManager.cy.off('select.datatable unselect.datatable');
            }
            panel.remove();
        });

        // Pop Outボタン
        document.getElementById('panel-popout-btn').addEventListener('click', () => {
            this.openDataTableInNewWindow();
            // 元のパネルを閉じる
            if (networkManager.cy) {
                networkManager.cy.off('select.datatable unselect.datatable');
            }
            panel.remove();
        });

        // タブ切り替え
        document.getElementById('panel-tab-node').addEventListener('click', () => {
            document.getElementById('panel-tab-node').classList.add('active');
            document.getElementById('panel-tab-edge').classList.remove('active');
            document.getElementById('panel-node-table-content').style.display = 'block';
            document.getElementById('panel-edge-table-content').style.display = 'none';
        });

        document.getElementById('panel-tab-edge').addEventListener('click', () => {
            document.getElementById('panel-tab-edge').classList.add('active');
            document.getElementById('panel-tab-node').classList.remove('active');
            document.getElementById('panel-edge-table-content').style.display = 'block';
            document.getElementById('panel-node-table-content').style.display = 'none';
        });

        // カラム表示/非表示メニュー
        document.getElementById('panel-tab-columns').addEventListener('click', () => {
            this.showColumnVisibilityMenu();
        });
    }

    /**
     * パネルをドラッグ可能にする
     */
    makePanelDraggable(panel) {
        const header = panel.querySelector('.data-table-panel-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('data-table-panel-close')) return;
            
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            // transformをクリアして通常の位置指定に切り替え
            panel.style.transform = 'none';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            panel.style.bottom = 'auto';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            panel.style.left = currentX + 'px';
            panel.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * パネルをリサイズ可能にする
     */
    makePanelResizable(panel) {
        const resizeHandle = panel.querySelector('.data-table-panel-resize-handle');
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = panel.offsetWidth;
            startHeight = panel.offsetHeight;
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(400, startWidth + deltaX);
            const newHeight = Math.max(200, startHeight + deltaY);

            panel.style.width = newWidth + 'px';
            panel.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
            }
        });
    }

    /**
     * カラム表示/非表示メニューを表示
     */
    showColumnVisibilityMenu() {
        // 既存のメニューを削除
        const oldMenu = document.getElementById('column-visibility-menu');
        if (oldMenu) {
            oldMenu.remove();
            return;
        }

        const currentTab = document.getElementById('panel-tab-node').classList.contains('active') ? 'node' : 'edge';
        const tableId = currentTab === 'node' ? 'panel-node-table' : 'panel-edge-table';
        const table = document.getElementById(tableId);
        const headers = table.querySelectorAll('thead th');

        if (headers.length === 0) {
            alert('テーブルにデータがありません');
            return;
        }

        // カラム名を取得
        const columns = Array.from(headers).map((th, index) => ({
            name: th.textContent.trim(),
            index: index,
            visible: !this.hiddenColumns[currentTab].has(th.textContent.trim())
        }));

        // メニュー作成
        const menu = document.createElement('div');
        menu.id = 'column-visibility-menu';
        menu.className = 'column-visibility-menu';
        menu.innerHTML = columns.map(col => `
            <div class="column-visibility-menu-item">
                <input type="checkbox" id="col-${col.index}" ${col.visible ? 'checked' : ''}>
                <label for="col-${col.index}">${col.name}</label>
            </div>
        `).join('');

        // 位置を設定
        const columnsBtn = document.getElementById('panel-tab-columns');
        const rect = columnsBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.right = '20px';

        document.body.appendChild(menu);

        // チェックボックスのイベント
        columns.forEach(col => {
            const checkbox = document.getElementById(`col-${col.index}`);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.hiddenColumns[currentTab].delete(col.name);
                } else {
                    this.hiddenColumns[currentTab].add(col.name);
                }
                this.updatePanelDataTable();
            });
        });

        // 外側クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== columnsBtn) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    /**
     * パネルのデータテーブルを更新（選択されたノード/エッジのみ表示）
     */
    updatePanelDataTable() {
        if (!networkManager.cy) return;

        const selectedNodes = networkManager.cy.nodes(':selected');
        const selectedEdges = networkManager.cy.edges(':selected');

        // 選択がなければ全データ表示、選択があれば選択データのみ表示
        const nodesToShow = selectedNodes.length > 0 ? selectedNodes : networkManager.cy.nodes();
        const edgesToShow = selectedEdges.length > 0 ? selectedEdges : networkManager.cy.edges();

        this.renderPanelNodeTable(nodesToShow);
        this.renderPanelEdgeTable(edgesToShow);
    }

    /**
     * パネルのノードテーブルを描画
     */
    renderPanelNodeTable(nodes) {
        const thead = document.getElementById('panel-node-table-head');
        const tbody = document.getElementById('panel-node-table-body');

        if (!thead || !tbody) return;

        if (nodes.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: var(--text-light);">No data available</td></tr>';
            return;
        }

        // 全ノードの属性を収集
        const allKeys = new Set();
        nodes.forEach(node => {
            Object.keys(node.data()).forEach(key => allKeys.add(key));
        });

        // id, label, groupを先頭に、それ以外をアルファベット順に
        const columns = ['id', 'label', 'group'].filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        // 非表示カラムをフィルタ
        const visibleColumns = columns.filter(col => !this.hiddenColumns.node.has(col));

        // ヘッダー作成（リサイズハンドル付き）
        thead.innerHTML = `<tr>${visibleColumns.map((col, index) => `
            <th class="resizable" data-column="${col}" style="min-width: 80px;">
                <div class="column-header-content">
                    <span>${col}</span>
                </div>
                <div class="column-resizer" data-column-index="${index}"></div>
            </th>
        `).join('')}</tr>`;

        // ボディ作成
        tbody.innerHTML = nodes.map(node => {
            const data = node.data();
            const isSelected = node.selected();
            return `<tr class="${isSelected ? 'selected' : ''}">${visibleColumns.map(col => {
                const value = data[col];
                return `<td>${value !== undefined ? value : ''}</td>`;
            }).join('')}</tr>`;
        }).join('');

        // カラムリサイズのイベントリスナーを追加
        this.setupColumnResizers('panel-node-table');
    }

    /**
     * パネルのエッジテーブルを描画
     */
    renderPanelEdgeTable(edges) {
        const thead = document.getElementById('panel-edge-table-head');
        const tbody = document.getElementById('panel-edge-table-body');

        if (!thead || !tbody) return;

        if (edges.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: var(--text-light);">No data available</td></tr>';
            return;
        }

        // 全エッジの属性を収集
        const allKeys = new Set();
        edges.forEach(edge => {
            Object.keys(edge.data()).forEach(key => allKeys.add(key));
        });

        // id, source, targetを先頭に、それ以外をアルファベット順に
        const columns = ['id', 'source', 'target'].filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        // 非表示カラムをフィルタ
        const visibleColumns = columns.filter(col => !this.hiddenColumns.edge.has(col));

        // ヘッダー作成（リサイズハンドル付き）
        thead.innerHTML = `<tr>${visibleColumns.map((col, index) => `
            <th class="resizable" data-column="${col}" style="min-width: 80px;">
                <div class="column-header-content">
                    <span>${col}</span>
                </div>
                <div class="column-resizer" data-column-index="${index}"></div>
            </th>
        `).join('')}</tr>`;

        // ボディ作成
        tbody.innerHTML = edges.map(edge => {
            const data = edge.data();
            const isSelected = edge.selected();
            return `<tr class="${isSelected ? 'selected' : ''}">${visibleColumns.map(col => {
                const value = data[col];
                return `<td>${value !== undefined ? value : ''}</td>`;
            }).join('')}</tr>`;
        }).join('');

        // カラムリサイズのイベントリスナーを追加
        this.setupColumnResizers('panel-edge-table');
    }

    /**
     * カラムのリサイズ機能を設定
     */
    setupColumnResizers(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const resizers = table.querySelectorAll('.column-resizer');
        resizers.forEach(resizer => {
            let isResizing = false;
            let startX;
            let startWidth;
            let th;

            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                th = resizer.parentElement;
                startX = e.clientX;
                startWidth = th.offsetWidth;
                e.preventDefault();
                e.stopPropagation();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const newWidth = Math.max(50, startWidth + deltaX);
                th.style.width = newWidth + 'px';
                th.style.minWidth = newWidth + 'px';
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                }
            });
        });
    }

    /**
     * Data Tableを新しいウィンドウで開く
     */
    openDataTableInNewWindow() {
        // 既に開いている場合はフォーカス
        if (this.dataTableWindow && !this.dataTableWindow.closed) {
            this.dataTableWindow.focus();
            return;
        }

        // 新しいウィンドウを開く
        const newWindow = window.open('', 'DataTable', 'width=1000,height=600,resizable=yes,scrollbars=yes');
        
        if (!newWindow) {
            alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
            return;
        }

        // 状態を初期化
        if (!this.hiddenColumnsExternal) {
            this.hiddenColumnsExternal = { node: new Set(), edge: new Set() };
        }
        this.externalFilters = { node: {}, edge: {} };
        this.externalSort = { node: { column: null, order: 'asc' }, edge: { column: null, order: 'asc' } };
        // デフォルトは自動同期モード（trueまたはundefinedで選択されたもののみ表示）
        this.showSelectedOnly = { node: true, edge: true };

        // ウィンドウのHTMLを構築
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Data Table - Network Visualizer</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: #f8fafc;
                        padding: 16px;
                        height: 100vh;
                        overflow: hidden;
                    }
                    .container {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 32px);
                        overflow: hidden;
                    }
                    .header {
                        background: #f8fafc;
                        padding: 12px 16px;
                        border-bottom: 1px solid #e2e8f0;
                        flex-shrink: 0;
                    }
                    .header h2 {
                        font-size: 18px;
                        color: #1e293b;
                    }
                    .toolbar {
                        display: flex;
                        gap: 8px;
                        padding: 8px 16px;
                        border-bottom: 1px solid #e2e8f0;
                        background: white;
                        flex-shrink: 0;
                        flex-wrap: wrap;
                        align-items: center;
                    }
                    .tab {
                        padding: 6px 14px;
                        font-size: 13px;
                        border: none;
                        background: white;
                        color: #64748b;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: all 0.2s;
                    }
                    .tab:hover {
                        background: #e2e8f0;
                        color: #1e293b;
                    }
                    .tab.active {
                        background: #2563eb;
                        color: white;
                    }
                    .toolbar-right {
                        margin-left: auto;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    }
                    .toolbar-btn {
                        padding: 6px 12px;
                        font-size: 12px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        color: #64748b;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: all 0.2s;
                    }
                    .toolbar-btn:hover {
                        background: #f1f5f9;
                        color: #1e293b;
                    }
                    .toolbar-btn.active {
                        background: #dbeafe;
                        border-color: #2563eb;
                        color: #2563eb;
                    }
                    .table-wrapper {
                        flex: 1;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                    }
                    .table-content {
                        display: none;
                        flex: 1;
                        overflow: hidden;
                        flex-direction: column;
                    }
                    .table-content.active {
                        display: flex;
                    }
                    .table-scroll {
                        flex: 1;
                        overflow: auto;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                    }
                    .data-table thead {
                        position: sticky;
                        top: 0;
                        z-index: 10;
                    }
                    .data-table thead tr.header-row {
                        background: #1e293b;
                    }
                    .data-table thead tr.filter-row {
                        background: #f1f5f9;
                    }
                    .data-table th {
                        padding: 0;
                        text-align: left;
                        font-weight: 600;
                        color: white;
                        white-space: nowrap;
                        position: relative;
                        min-width: 80px;
                        background: #1e293b;
                    }
                    .data-table th .th-content {
                        padding: 10px 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        cursor: pointer;
                        user-select: none;
                    }
                    .data-table th .th-content:hover {
                        background: #334155;
                    }
                    .data-table th .sort-icon {
                        font-size: 10px;
                        opacity: 0.5;
                    }
                    .data-table th .sort-icon.active {
                        opacity: 1;
                    }
                    .data-table th .column-resizer {
                        position: absolute;
                        right: 0;
                        top: 0;
                        width: 5px;
                        height: 100%;
                        cursor: col-resize;
                        background: transparent;
                    }
                    .data-table th .column-resizer:hover {
                        background: #3b82f6;
                    }
                    .data-table th.resizing .column-resizer {
                        background: #3b82f6;
                    }
                    .data-table th.filter-cell {
                        background: #f1f5f9;
                        padding: 4px 6px;
                    }
                    .data-table th.filter-cell input {
                        width: 100%;
                        padding: 4px 8px;
                        font-size: 12px;
                        border: 1px solid #cbd5e1;
                        border-radius: 3px;
                        outline: none;
                    }
                    .data-table th.filter-cell input:focus {
                        border-color: #2563eb;
                        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
                    }
                    .data-table td {
                        padding: 8px 12px;
                        border-bottom: 1px solid #e2e8f0;
                        color: #1e293b;
                        background: white;
                    }
                    .data-table tbody tr:hover td {
                        background: #f8fafc;
                    }
                    .data-table tbody tr.selected td {
                        background: #dbeafe;
                    }
                    .data-table tbody tr.filtered td {
                        background: #fef3c7;
                    }
                    .column-visibility-menu {
                        position: absolute;
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                        padding: 8px;
                        z-index: 2000;
                        min-width: 150px;
                        max-height: 300px;
                        overflow-y: auto;
                    }
                    .column-visibility-menu-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 6px 8px;
                        cursor: pointer;
                        font-size: 13px;
                        border-radius: 3px;
                        transition: background 0.2s;
                    }
                    .column-visibility-menu-item:hover {
                        background: #f8fafc;
                    }
                    .column-visibility-menu-item input[type="checkbox"] {
                        cursor: pointer;
                    }
                    .status-bar {
                        padding: 8px 16px;
                        background: #f8fafc;
                        border-top: 1px solid #e2e8f0;
                        font-size: 12px;
                        color: #64748b;
                        flex-shrink: 0;
                    }
                    .sync-indicator {
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #22c55e;
                        margin-right: 6px;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Data Table <span class="sync-indicator" title="ネットワーク選択と同期中"></span></h2>
                    </div>
                    <div class="toolbar">
                        <button class="tab active" id="tab-node">Node Table</button>
                        <button class="tab" id="tab-edge">Edge Table</button>
                        <div class="toolbar-right">
                            <button class="toolbar-btn" id="btn-show-all" title="全データを表示（選択を無視）">📋 Show All</button>
                            <button class="toolbar-btn" id="btn-clear-filter" title="フィルターをクリア">🗑 Clear Filter</button>
                            <button class="toolbar-btn" id="btn-apply-to-network" title="フィルター結果をネットワークで選択">🔗 Apply to Network</button>
                            <button class="toolbar-btn" id="tab-columns">⚙ Columns</button>
                        </div>
                    </div>
                    <div class="table-wrapper">
                        <div class="table-content active" id="node-content">
                            <div class="table-scroll">
                                <table class="data-table" id="node-table">
                                    <thead id="node-thead"></thead>
                                    <tbody id="node-tbody"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="table-content" id="edge-content">
                            <div class="table-scroll">
                                <table class="data-table" id="edge-table">
                                    <thead id="edge-thead"></thead>
                                    <tbody id="edge-tbody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="status-bar" id="status-bar">🔗 ネットワーク選択と同期中</div>
                </div>
                <script>
                    let currentTab = 'node';
                    
                    // タブ切り替え
                    document.getElementById('tab-node').addEventListener('click', function() {
                        currentTab = 'node';
                        document.getElementById('tab-node').classList.add('active');
                        document.getElementById('tab-edge').classList.remove('active');
                        document.getElementById('node-content').classList.add('active');
                        document.getElementById('edge-content').classList.remove('active');
                        window.opener.postMessage({ type: 'tabChanged', currentTab: currentTab }, '*');
                    });
                    document.getElementById('tab-edge').addEventListener('click', function() {
                        currentTab = 'edge';
                        document.getElementById('tab-edge').classList.add('active');
                        document.getElementById('tab-node').classList.remove('active');
                        document.getElementById('edge-content').classList.add('active');
                        document.getElementById('node-content').classList.remove('active');
                        window.opener.postMessage({ type: 'tabChanged', currentTab: currentTab }, '*');
                    });

                    // カラム表示/非表示メニュー
                    document.getElementById('tab-columns').addEventListener('click', function(e) {
                        window.opener.postMessage({ type: 'showColumnMenu', currentTab: currentTab }, '*');
                    });

                    // Show Allボタン（トグル：全データ表示 / 選択のみ表示）
                    document.getElementById('btn-show-all').addEventListener('click', function() {
                        this.classList.toggle('active');
                        const showAll = this.classList.contains('active');
                        this.textContent = showAll ? '📌 Selected Only' : '📋 Show All';
                        this.title = showAll ? '選択されたアイテムのみ表示に戻す' : '全データを表示（選択を無視）';
                        window.opener.postMessage({ type: 'toggleShowAll', currentTab: currentTab, showAll: showAll }, '*');
                    });

                    // Clear Filterボタン
                    document.getElementById('btn-clear-filter').addEventListener('click', function() {
                        window.opener.postMessage({ type: 'clearFilter', currentTab: currentTab }, '*');
                    });

                    // Apply to Networkボタン
                    document.getElementById('btn-apply-to-network').addEventListener('click', function() {
                        window.opener.postMessage({ type: 'applyFilterToNetwork', currentTab: currentTab }, '*');
                    });

                    // 親ウィンドウからのメッセージを受信
                    window.addEventListener('message', function(event) {
                        if (event.data.type === 'updateSelectedOnlyButton') {
                            const btn = document.getElementById('btn-selected-only');
                            if (event.data.active) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        } else if (event.data.type === 'updateStatus') {
                            document.getElementById('status-bar').textContent = event.data.message;
                        }
                    });
                </script>
            </body>
            </html>
        `);
        newWindow.document.close();

        // 参照を保存
        this.dataTableWindow = newWindow;
        this.currentExternalTab = 'node';

        // メッセージリスナーを設定
        this.handleExternalMessage = (event) => {
            if (event.data.type === 'showColumnMenu') {
                this.showExternalColumnVisibilityMenu(event.data.currentTab);
            } else if (event.data.type === 'toggleColumn') {
                const { currentTab, columnName, visible } = event.data;
                if (visible) {
                    this.hiddenColumnsExternal[currentTab].delete(columnName);
                } else {
                    this.hiddenColumnsExternal[currentTab].add(columnName);
                }
                this.updateExternalDataTable();
            } else if (event.data.type === 'tabChanged') {
                this.currentExternalTab = event.data.currentTab;
            } else if (event.data.type === 'filterChanged') {
                const { currentTab, column, value } = event.data;
                this.externalFilters[currentTab][column] = value;
                this.updateExternalDataTable();
            } else if (event.data.type === 'sortChanged') {
                const { currentTab, column } = event.data;
                const sort = this.externalSort[currentTab];
                if (sort.column === column) {
                    sort.order = sort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    sort.column = column;
                    sort.order = 'asc';
                }
                this.updateExternalDataTable();
            } else if (event.data.type === 'toggleShowAll') {
                // Show All: trueなら全データ表示、falseならネットワーク選択と同期
                this.showSelectedOnly[event.data.currentTab] = !event.data.showAll;
                this.updateExternalDataTable();
            } else if (event.data.type === 'clearFilter') {
                this.externalFilters[event.data.currentTab] = {};
                this.updateExternalDataTable();
            } else if (event.data.type === 'applyFilterToNetwork') {
                this.applyFilterToNetwork(event.data.currentTab);
            }
        };
        
        // 既存のリスナーを削除
        if (this.previousMessageHandler) {
            window.removeEventListener('message', this.previousMessageHandler);
        }
        window.addEventListener('message', this.handleExternalMessage);
        this.previousMessageHandler = this.handleExternalMessage;

        // 初期データを表示
        this.updateExternalDataTable();

        // Cytoscapeの選択イベントをリスン（確実に設定）
        this.setupDataTableSelectionListener();

        // network:loadedイベント時にリスナーを再設定
        const networkLoadedHandler = () => {
            this.setupDataTableSelectionListener();
            this.updateExternalDataTable();
        };
        document.addEventListener('network:loaded', networkLoadedHandler);

        // ウィンドウが閉じられたらイベントリスナーをクリア
        const checkClosed = setInterval(() => {
            if (newWindow.closed) {
                if (networkManager.cy) {
                    networkManager.cy.off('select.datatableext unselect.datatableext');
                }
                if (this.previousMessageHandler) {
                    window.removeEventListener('message', this.previousMessageHandler);
                    this.previousMessageHandler = null;
                }
                document.removeEventListener('network:loaded', networkLoadedHandler);
                this.dataTableWindow = null;
                clearInterval(checkClosed);
            }
        }, 1000);
    }

    /**
     * Data Table用の選択イベントリスナーを設定
     */
    setupDataTableSelectionListener() {
        if (!networkManager.cy) {
            console.log('networkManager.cy is not available yet');
            return;
        }

        // 既存のリスナーをクリア
        networkManager.cy.off('select.datatableext unselect.datatableext');
        
        // 選択/非選択時にテーブルを更新
        networkManager.cy.on('select.datatableext unselect.datatableext', (e) => {
            console.log('Selection changed:', e.type, e.target.id());
            this.updateExternalDataTable();
        });

        console.log('Data table selection listener setup complete');
    }

    /**
     * 外部ウィンドウのデータテーブルを更新
     */
    updateExternalDataTable() {
        if (!this.dataTableWindow || this.dataTableWindow.closed || !networkManager.cy) {
            return;
        }

        // 選択状態を取得
        const selectedNodes = networkManager.cy.nodes(':selected');
        const selectedEdges = networkManager.cy.edges(':selected');

        // showSelectedOnly: true（デフォルト）= 選択があれば選択のみ、なければ全データ
        // showSelectedOnly: false = 常に全データ表示
        let nodesToShow, edgesToShow;
        
        if (this.showSelectedOnly.node !== false && selectedNodes.length > 0) {
            // 自動同期モードで選択がある場合は選択されたもののみ
            nodesToShow = selectedNodes;
        } else {
            // 全データ表示モード、または選択がない場合
            nodesToShow = networkManager.cy.nodes();
        }
        
        if (this.showSelectedOnly.edge !== false && selectedEdges.length > 0) {
            // 自動同期モードで選択がある場合は選択されたもののみ
            edgesToShow = selectedEdges;
        } else {
            // 全データ表示モード、または選択がない場合
            edgesToShow = networkManager.cy.edges();
        }

        // 現在の選択状態を保持（ハイライト表示用）
        const selectedNodeIds = new Set(selectedNodes.map(n => n.id()));
        const selectedEdgeIds = new Set(selectedEdges.map(e => e.id()));

        this.renderExternalNodeTable(nodesToShow, selectedNodeIds);
        this.renderExternalEdgeTable(edgesToShow, selectedEdgeIds);

        // ステータスバーを更新
        this.updateExternalStatusBar();
    }

    /**
     * ステータスバーを更新
     */
    updateExternalStatusBar() {
        if (!this.dataTableWindow || this.dataTableWindow.closed) return;

        const nodeCount = networkManager.cy.nodes().length;
        const edgeCount = networkManager.cy.edges().length;
        const selectedNodes = networkManager.cy.nodes(':selected').length;
        const selectedEdges = networkManager.cy.edges(':selected').length;

        const nodeFilters = Object.keys(this.externalFilters.node || {}).filter(k => this.externalFilters.node[k]).length;
        const edgeFilters = Object.keys(this.externalFilters.edge || {}).filter(k => this.externalFilters.edge[k]).length;

        let message = `Nodes: ${nodeCount} | Edges: ${edgeCount}`;
        if (selectedNodes > 0 || selectedEdges > 0) {
            message += ` | Showing selected: ${selectedNodes} nodes, ${selectedEdges} edges`;
        }
        if (nodeFilters > 0 || edgeFilters > 0) {
            message += ` | Filters: ${nodeFilters + edgeFilters}`;
        }

        this.dataTableWindow.postMessage({ type: 'updateStatus', message: message }, '*');
    }

    /**
     * フィルター結果をネットワークに適用（選択）
     */
    applyFilterToNetwork(tabType) {
        if (!networkManager.cy) return;

        const elements = tabType === 'node' ? networkManager.cy.nodes() : networkManager.cy.edges();
        const filters = this.externalFilters[tabType] || {};
        
        // まず全選択解除
        networkManager.cy.elements().unselect();

        // フィルターに一致する要素を選択
        let matchCount = 0;
        elements.forEach(el => {
            const data = el.data();
            let matches = true;

            for (const [column, filterValue] of Object.entries(filters)) {
                if (filterValue && filterValue.trim() !== '') {
                    const cellValue = String(data[column] || '').toLowerCase();
                    if (!cellValue.includes(filterValue.toLowerCase())) {
                        matches = false;
                        break;
                    }
                }
            }

            if (matches && Object.keys(filters).some(k => filters[k] && filters[k].trim() !== '')) {
                el.select();
                matchCount++;
            }
        });

        // フィルターがない場合は何もしない
        if (!Object.keys(filters).some(k => filters[k] && filters[k].trim() !== '')) {
            this.dataTableWindow.postMessage({ 
                type: 'updateStatus', 
                message: 'No filter applied. Enter filter values first.' 
            }, '*');
            return;
        }

        this.dataTableWindow.postMessage({ 
            type: 'updateStatus', 
            message: `Applied filter: ${matchCount} ${tabType}s selected in network` 
        }, '*');
    }

    /**
     * 外部ウィンドウのカラム表示/非表示メニューを表示
     */
    showExternalColumnVisibilityMenu(currentTab) {
        if (!this.dataTableWindow || this.dataTableWindow.closed) return;

        const doc = this.dataTableWindow.document;
        
        // 既存のメニューを削除
        const oldMenu = doc.getElementById('column-visibility-menu');
        if (oldMenu) {
            oldMenu.remove();
            return;
        }

        // 全カラム一覧を取得（非表示カラムも含む）
        const allColumns = this.getAllColumnsForTab(currentTab);
        
        if (allColumns.length === 0) {
            this.dataTableWindow.alert('データがありません');
            return;
        }

        // カラム名を取得
        const columns = allColumns.map((name, index) => ({
            name: name,
            index: index,
            visible: !this.hiddenColumnsExternal[currentTab].has(name)
        }));

        // メニュー作成
        const menu = doc.createElement('div');
        menu.id = 'column-visibility-menu';
        menu.className = 'column-visibility-menu';
        menu.innerHTML = columns.map(col => `
            <div class="column-visibility-menu-item" data-column="${col.name}">
                <input type="checkbox" id="col-${col.index}" ${col.visible ? 'checked' : ''}>
                <label for="col-${col.index}">${col.name}</label>
            </div>
        `).join('');

        // 位置を設定
        const columnsBtn = doc.getElementById('tab-columns');
        const rect = columnsBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.right = '20px';

        doc.body.appendChild(menu);

        // 参照を保持（クロージャ内でthisを使うため）
        const self = this;

        // チェックボックスのイベント
        columns.forEach(col => {
            const menuItem = doc.querySelector(`.column-visibility-menu-item[data-column="${col.name}"]`);
            const checkbox = doc.getElementById(`col-${col.index}`);
            
            const handleChange = (checked) => {
                // 直接メインウィンドウの状態を更新
                if (checked) {
                    self.hiddenColumnsExternal[currentTab].delete(col.name);
                } else {
                    self.hiddenColumnsExternal[currentTab].add(col.name);
                }
                // テーブルを再描画
                self.updateExternalDataTable();
            };
            
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                handleChange(e.target.checked);
            });
            
            menuItem.addEventListener('click', (e) => {
                if (e.target !== checkbox && e.target.tagName !== 'LABEL') {
                    checkbox.checked = !checkbox.checked;
                    handleChange(checkbox.checked);
                }
            });
        });

        // 外側クリックで閉じる
        setTimeout(() => {
            doc.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== columnsBtn) {
                    menu.remove();
                    doc.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    /**
     * 指定タブの全カラム一覧を取得
     */
    getAllColumnsForTab(tabType) {
        if (!networkManager.cy) return [];
        
        const elements = tabType === 'node' ? networkManager.cy.nodes() : networkManager.cy.edges();
        const allKeys = new Set();
        
        elements.forEach(el => {
            Object.keys(el.data()).forEach(key => allKeys.add(key));
        });

        // 優先カラムを先頭に
        const priorityColumns = tabType === 'node' 
            ? ['id', 'label', 'group'] 
            : ['id', 'source', 'target'];
        
        const columns = priorityColumns.filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        return columns;
    }

    /**
     * 外部ウィンドウのノードテーブルを描画
     */
    renderExternalNodeTable(nodes, selectedNodeIds) {
        if (!this.dataTableWindow || this.dataTableWindow.closed) return;

        const doc = this.dataTableWindow.document;
        const thead = doc.getElementById('node-thead');
        const tbody = doc.getElementById('node-tbody');

        if (!thead || !tbody) return;

        if (nodes.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #64748b;">No data available</td></tr>';
            return;
        }

        const allKeys = new Set();
        nodes.forEach(node => {
            Object.keys(node.data()).forEach(key => allKeys.add(key));
        });

        const columns = ['id', 'label', 'group'].filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        // 非表示カラムをフィルタ
        const visibleColumns = columns.filter(col => !this.hiddenColumnsExternal.node.has(col));

        // カラム幅を保持
        const columnWidths = {};
        const existingHeaders = thead.querySelectorAll('th[data-column]');
        existingHeaders.forEach(th => {
            const colName = th.getAttribute('data-column');
            if (colName && th.style.width) {
                columnWidths[colName] = th.style.width;
            }
        });

        // フィルター値を保持
        const filters = this.externalFilters.node || {};
        
        // ソート状態
        const sort = this.externalSort.node;

        // ヘッダー行とフィルター行を作成
        thead.innerHTML = `
            <tr class="header-row">${visibleColumns.map(col => {
                const width = columnWidths[col] || '';
                const sortIcon = sort.column === col 
                    ? (sort.order === 'asc' ? '▲' : '▼')
                    : '⇅';
                const isActive = sort.column === col ? 'active' : '';
                return `<th data-column="${col}" style="${width ? 'width:' + width + ';min-width:' + width + ';' : 'min-width:80px;'}">
                    <div class="th-content" data-sort-column="${col}">
                        <span>${col}</span>
                        <span class="sort-icon ${isActive}">${sortIcon}</span>
                    </div>
                    <div class="column-resizer"></div>
                </th>`;
            }).join('')}</tr>
            <tr class="filter-row">${visibleColumns.map(col => {
                const filterValue = filters[col] || '';
                return `<th class="filter-cell"><input type="text" data-filter-column="${col}" placeholder="Filter..." value="${filterValue}"></th>`;
            }).join('')}</tr>
        `;

        // データをフィルタリング
        let filteredNodes = Array.from(nodes);
        for (const [column, filterValue] of Object.entries(filters)) {
            if (filterValue && filterValue.trim() !== '') {
                filteredNodes = filteredNodes.filter(node => {
                    const cellValue = String(node.data()[column] || '').toLowerCase();
                    return cellValue.includes(filterValue.toLowerCase());
                });
            }
        }

        // データをソート
        if (sort.column) {
            filteredNodes.sort((a, b) => {
                const aVal = a.data()[sort.column];
                const bVal = b.data()[sort.column];
                
                // 数値の場合は数値比較
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sort.order === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                // 文字列比較
                const aStr = String(aVal || '').toLowerCase();
                const bStr = String(bVal || '').toLowerCase();
                if (sort.order === 'asc') {
                    return aStr.localeCompare(bStr);
                } else {
                    return bStr.localeCompare(aStr);
                }
            });
        }

        // テーブルボディを作成
        tbody.innerHTML = filteredNodes.map(node => {
            const data = node.data();
            const isSelected = selectedNodeIds && selectedNodeIds.has(node.id());
            return `<tr class="${isSelected ? 'selected' : ''}" data-id="${node.id()}">${visibleColumns.map(col => {
                const value = data[col];
                return `<td>${value !== undefined ? value : ''}</td>`;
            }).join('')}</tr>`;
        }).join('');

        if (filteredNodes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #64748b;">No matching data</td></tr>';
        }

        // イベントリスナーを設定
        this.setupExternalTableEvents(doc, 'node');
    }

    /**
     * 外部ウィンドウのエッジテーブルを描画
     */
    renderExternalEdgeTable(edges, selectedEdgeIds) {
        if (!this.dataTableWindow || this.dataTableWindow.closed) return;

        const doc = this.dataTableWindow.document;
        const thead = doc.getElementById('edge-thead');
        const tbody = doc.getElementById('edge-tbody');

        if (!thead || !tbody) return;

        if (edges.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #64748b;">No data available</td></tr>';
            return;
        }

        const allKeys = new Set();
        edges.forEach(edge => {
            Object.keys(edge.data()).forEach(key => allKeys.add(key));
        });

        const columns = ['id', 'source', 'target'].filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        // 非表示カラムをフィルタ
        const visibleColumns = columns.filter(col => !this.hiddenColumnsExternal.edge.has(col));

        // カラム幅を保持
        const columnWidths = {};
        const existingHeaders = thead.querySelectorAll('th[data-column]');
        existingHeaders.forEach(th => {
            const colName = th.getAttribute('data-column');
            if (colName && th.style.width) {
                columnWidths[colName] = th.style.width;
            }
        });

        // フィルター値を保持
        const filters = this.externalFilters.edge || {};
        
        // ソート状態
        const sort = this.externalSort.edge;

        // ヘッダー行とフィルター行を作成
        thead.innerHTML = `
            <tr class="header-row">${visibleColumns.map(col => {
                const width = columnWidths[col] || '';
                const sortIcon = sort.column === col 
                    ? (sort.order === 'asc' ? '▲' : '▼')
                    : '⇅';
                const isActive = sort.column === col ? 'active' : '';
                return `<th data-column="${col}" style="${width ? 'width:' + width + ';min-width:' + width + ';' : 'min-width:80px;'}">
                    <div class="th-content" data-sort-column="${col}">
                        <span>${col}</span>
                        <span class="sort-icon ${isActive}">${sortIcon}</span>
                    </div>
                    <div class="column-resizer"></div>
                </th>`;
            }).join('')}</tr>
            <tr class="filter-row">${visibleColumns.map(col => {
                const filterValue = filters[col] || '';
                return `<th class="filter-cell"><input type="text" data-filter-column="${col}" placeholder="Filter..." value="${filterValue}"></th>`;
            }).join('')}</tr>
        `;

        // データをフィルタリング
        let filteredEdges = Array.from(edges);
        for (const [column, filterValue] of Object.entries(filters)) {
            if (filterValue && filterValue.trim() !== '') {
                filteredEdges = filteredEdges.filter(edge => {
                    const cellValue = String(edge.data()[column] || '').toLowerCase();
                    return cellValue.includes(filterValue.toLowerCase());
                });
            }
        }

        // データをソート
        if (sort.column) {
            filteredEdges.sort((a, b) => {
                const aVal = a.data()[sort.column];
                const bVal = b.data()[sort.column];
                
                // 数値の場合は数値比較
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sort.order === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                // 文字列比較
                const aStr = String(aVal || '').toLowerCase();
                const bStr = String(bVal || '').toLowerCase();
                if (sort.order === 'asc') {
                    return aStr.localeCompare(bStr);
                } else {
                    return bStr.localeCompare(aStr);
                }
            });
        }

        // テーブルボディを作成
        tbody.innerHTML = filteredEdges.map(edge => {
            const data = edge.data();
            const isSelected = selectedEdgeIds && selectedEdgeIds.has(edge.id());
            return `<tr class="${isSelected ? 'selected' : ''}" data-id="${edge.id()}">${visibleColumns.map(col => {
                const value = data[col];
                return `<td>${value !== undefined ? value : ''}</td>`;
            }).join('')}</tr>`;
        }).join('');

        if (filteredEdges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #64748b;">No matching data</td></tr>';
        }

        // イベントリスナーを設定
        this.setupExternalTableEvents(doc, 'edge');
    }

    /**
     * 外部テーブルのイベントリスナーを設定
     */
    setupExternalTableEvents(doc, tabType) {
        const tableId = tabType === 'node' ? 'node-table' : 'edge-table';
        const table = doc.getElementById(tableId);
        if (!table) return;

        const self = this;

        // ソートイベント
        table.querySelectorAll('.th-content[data-sort-column]').forEach(thContent => {
            thContent.addEventListener('click', (e) => {
                const column = thContent.getAttribute('data-sort-column');
                const sort = self.externalSort[tabType];
                if (sort.column === column) {
                    sort.order = sort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    sort.column = column;
                    sort.order = 'asc';
                }
                self.updateExternalDataTable();
            });
        });

        // フィルターイベント
        table.querySelectorAll('input[data-filter-column]').forEach(input => {
            // 既存のイベントを削除するためにクローン
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            let debounceTimer;
            newInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const column = newInput.getAttribute('data-filter-column');
                    self.externalFilters[tabType][column] = newInput.value;
                    self.updateExternalDataTable();
                }, 300);
            });
        });

        // カラムリサイズ
        this.setupExternalColumnResizers(doc, tableId);

        // 行クリックでネットワーク選択
        table.querySelectorAll('tbody tr[data-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                const id = row.getAttribute('data-id');
                if (!networkManager.cy) return;

                const element = tabType === 'node' 
                    ? networkManager.cy.getElementById(id)
                    : networkManager.cy.edges().filter(edge => edge.id() === id);

                if (element && element.length > 0) {
                    // Ctrl/Cmdキーで複数選択
                    if (!e.ctrlKey && !e.metaKey) {
                        networkManager.cy.elements().unselect();
                    }
                    element.select();
                    
                    // ノードの場合はビューをフィット
                    if (tabType === 'node') {
                        networkManager.cy.animate({
                            center: { eles: element },
                            duration: 300
                        });
                    }
                }
            });
        });
    }

    /**
     * 外部ウィンドウのカラムリサイズ機能を設定
     */
    setupExternalColumnResizers(doc, tableId) {
        const table = doc.getElementById(tableId);
        if (!table) return;

        const resizers = table.querySelectorAll('.column-resizer');
        resizers.forEach(resizer => {
            let isResizing = false;
            let startX;
            let startWidth;
            let th;

            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                th = resizer.parentElement;
                th.classList.add('resizing');
                startX = e.clientX;
                startWidth = th.offsetWidth;
                e.preventDefault();
                e.stopPropagation();
            });

            doc.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const newWidth = Math.max(50, startWidth + deltaX);
                th.style.width = newWidth + 'px';
                th.style.minWidth = newWidth + 'px';
            });

            doc.addEventListener('mouseup', () => {
                if (isResizing) {
                    if (th) th.classList.remove('resizing');
                    isResizing = false;
                }
            });
        });
    }

    /**
     * データテーブルを初期化
     */
    initializeDataTable() {
        // タブ切り替え
        document.getElementById('tab-node').addEventListener('click', () => {
            document.getElementById('tab-node').classList.add('active');
            document.getElementById('tab-edge').classList.remove('active');
            document.getElementById('node-table-content').style.display = 'block';
            document.getElementById('edge-table-content').style.display = 'none';
        });

        document.getElementById('tab-edge').addEventListener('click', () => {
            document.getElementById('tab-edge').classList.add('active');
            document.getElementById('tab-node').classList.remove('active');
            document.getElementById('edge-table-content').style.display = 'block';
            document.getElementById('node-table-content').style.display = 'none';
        });

        // Cytoscapeの選択イベントをリスン
        if (networkManager.cy) {
            this.setupCytoscapeSelectionListeners();
        }

        // network:loadedイベントでテーブルを更新
        document.addEventListener('network:loaded', () => {
            this.setupCytoscapeSelectionListeners();
            this.updateDataTable();
        });
    }

    /**
     * Cytoscapeの選択イベントリスナーを設定
     */
    setupCytoscapeSelectionListeners() {
        if (!networkManager.cy) return;

        // 既存のリスナーをクリア
        networkManager.cy.off('select unselect');

        // 選択/非選択時にテーブルを更新
        networkManager.cy.on('select unselect', () => {
            this.updateDataTable();
        });
    }

    /**
     * データテーブルを更新（選択されたノード/エッジのみ表示）
     */
    updateDataTable() {
        if (!networkManager.cy) return;

        const selectedNodes = networkManager.cy.nodes(':selected');
        const selectedEdges = networkManager.cy.edges(':selected');

        // 選択がなければ全データ表示、選択があれば選択データのみ表示
        const nodesToShow = selectedNodes.length > 0 ? selectedNodes : networkManager.cy.nodes();
        const edgesToShow = selectedEdges.length > 0 ? selectedEdges : networkManager.cy.edges();

        this.renderNodeTable(nodesToShow);
        this.renderEdgeTable(edgesToShow);
    }

    /**
     * ノードテーブルを描画
     */
    renderNodeTable(nodes) {
        const thead = document.getElementById('node-table-head');
        const tbody = document.getElementById('node-table-body');

        if (nodes.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: var(--text-light);">No data available</td></tr>';
            return;
        }

        // 全ノードの属性を収集
        const allKeys = new Set();
        nodes.forEach(node => {
            Object.keys(node.data()).forEach(key => allKeys.add(key));
        });

        // id, label, groupを先頭に、それ以外をアルファベット順に
        const columns = ['id', 'label', 'group'].filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        // ヘッダー作成
        thead.innerHTML = `<tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>`;

        // ボディ作成
        tbody.innerHTML = nodes.map(node => {
            const data = node.data();
            const isSelected = node.selected();
            return `<tr class="${isSelected ? 'selected' : ''}">${columns.map(col => {
                const value = data[col];
                return `<td>${value !== undefined ? value : ''}</td>`;
            }).join('')}</tr>`;
        }).join('');
    }

    /**
     * エッジテーブルを描画
     */
    renderEdgeTable(edges) {
        const thead = document.getElementById('edge-table-head');
        const tbody = document.getElementById('edge-table-body');

        if (edges.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: var(--text-light);">No data available</td></tr>';
            return;
        }

        // 全エッジの属性を収集
        const allKeys = new Set();
        edges.forEach(edge => {
            Object.keys(edge.data()).forEach(key => allKeys.add(key));
        });

        // id, source, targetを先頭に、それ以外をアルファベット順に
        const columns = ['id', 'source', 'target'].filter(k => allKeys.has(k));
        Array.from(allKeys).sort().forEach(key => {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        });

        // ヘッダー作成
        thead.innerHTML = `<tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>`;

        // ボディ作成
        tbody.innerHTML = edges.map(edge => {
            const data = edge.data();
            const isSelected = edge.selected();
            return `<tr class="${isSelected ? 'selected' : ''}">${columns.map(col => {
                const value = data[col];
                return `<td>${value !== undefined ? value : ''}</td>`;
            }).join('')}</tr>`;
        }).join('');
    }

    /**
     * リサイズハンドルを初期化
     */
    initializeResizeHandle() {
        const handle = document.getElementById('resize-handle');
        const cy = document.getElementById('cy');
        const tableSection = document.getElementById('data-table-section');
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = tableSection.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaY = startY - e.clientY;
            const newHeight = Math.max(100, Math.min(window.innerHeight - 100, startHeight + deltaY));

            tableSection.style.height = newHeight + 'px';
            cy.style.bottom = newHeight + 'px';
            handle.style.bottom = newHeight + 'px';

            // Cytoscapeのリサイズを通知
            if (networkManager.cy) {
                networkManager.cy.resize();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});
