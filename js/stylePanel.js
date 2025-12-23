/**
 * StylePanel - ノード/エッジスタイル設定パネル
 */
class StylePanel {
    constructor(type) {
        this.type = type; // 'node' or 'edge'
        this.panel = null;
    }

    /**
     * パネルを初期化
     */
    initialize() {
        this.createPanel();
        this.setupEventListeners();
    }

    /**
     * パネルを作成
     */
    createPanel() {
        // 既存パネルがあれば削除
        const old = document.getElementById(`style-panel-${this.type}`);
        if (old) old.remove();

        // パネル本体
        const panel = document.createElement('div');
        panel.className = 'tools-panel style-panel';
        panel.id = `style-panel-${this.type}`;
        panel.innerHTML = `
            <div class="tools-panel-header">
                <h3>Style: ${this.type === 'node' ? 'Node' : 'Edge'}</h3>
                <span class="tools-panel-close" id="style-panel-close-${this.type}">&times;</span>
            </div>
            <div class="tools-panel-body">
                <div class="tool-section">
                    <div class="tool-section-header">
                        <span class="tool-section-title">設定項目</span>
                    </div>
                    <div class="tool-section-body">
                        ${this.type === 'node' ? this.createNodeSettings() : this.createEdgeSettings()}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        panel.classList.add('active');
        
        // 位置を既定位置にセット
        panel.style.top = '50px';
        panel.style.right = '10px';
        
        this.panel = panel;
    }

    /**
     * ノード設定UIを作成
     */
    createNodeSettings() {
        return `
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Label Font Size:</label>
                <input type="number" id="node-label-font-size" value="12" min="8" max="32" style="width: 100%;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Label Color:</label>
                <input type="color" id="node-label-color" value="#1e293b" style="width: 100%;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Fill Color:</label>
                <input type="color" id="node-fill-color" value="#2563eb" style="width: 100%;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Shape:</label>
                <select id="node-shape" style="width: 100%;">
                    <option value="ellipse">○ (Ellipse)</option>
                    <option value="rectangle">□ (Rectangle)</option>
                    <option value="diamond">◇ (Diamond)</option>
                    <option value="triangle">△ (Triangle)</option>
                </select>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Size:</label>
                <input type="number" id="node-size" value="40" min="10" max="200" style="width: 100%;">
            </div>
        `;
    }

    /**
     * エッジ設定UIを作成
     */
    createEdgeSettings() {
        return `
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Line Type:</label>
                <select id="edge-line-type" style="width: 100%;">
                    <option value="solid">ノーマル</option>
                    <option value="dashed">点線</option>
                </select>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Arrow Shape:</label>
                <select id="edge-arrow-shape" style="width: 100%;">
                    <option value="triangle">矢印</option>
                    <option value="none">ノーマル</option>
                </select>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">Width:</label>
                <input type="number" id="edge-width" value="2" min="1" max="20" style="width: 100%;">
            </div>
        `;
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // パネルを閉じる
        this.panel.querySelector('.tools-panel-close').addEventListener('click', () => {
            this.panel.remove();
        });

        // 各設定項目の変更時にリアルタイムで適用
        if (this.type === 'node') {
            const inputs = [
                'node-label-font-size',
                'node-label-color',
                'node-fill-color',
                'node-shape',
                'node-size'
            ];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => this.applyNodeStyle());
                    element.addEventListener('change', () => this.applyNodeStyle());
                }
            });
        } else {
            const inputs = [
                'edge-line-type',
                'edge-arrow-shape',
                'edge-width'
            ];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => this.applyEdgeStyle());
                    element.addEventListener('change', () => this.applyEdgeStyle());
                }
            });
        }
    }

    /**
     * スタイルを適用
     */
    applyStyle() {
        if (!window.networkManager || !networkManager.cy) {
            alert('ネットワークが読み込まれていません。');
            return;
        }

        if (this.type === 'node') {
            this.applyNodeStyle();
        } else {
            this.applyEdgeStyle();
        }
    }

    /**
     * ノードスタイルを適用
     */
    applyNodeStyle() {
        if (!window.networkManager || !networkManager.cy) {
            console.log('networkManager or cy not available');
            return;
        }

        const fontSize = document.getElementById('node-label-font-size').value;
        const labelColor = document.getElementById('node-label-color').value;
        const fillColor = document.getElementById('node-fill-color').value;
        const shape = document.getElementById('node-shape').value;
        const size = document.getElementById('node-size').value;

        console.log('Applying node style:', { fontSize, labelColor, fillColor, shape, size });

        // 全ノードに直接スタイルを適用
        networkManager.cy.nodes().style({
            'font-size': fontSize + 'px',
            'color': labelColor,
            'background-color': fillColor,
            'shape': shape,
            'width': size + 'px',
            'height': size + 'px'
        });

        console.log('Node style applied to', networkManager.cy.nodes().length, 'nodes');
    }

    /**
     * エッジスタイルを適用
     */
    applyEdgeStyle() {
        if (!window.networkManager || !networkManager.cy) {
            console.log('networkManager or cy not available');
            return;
        }

        const lineType = document.getElementById('edge-line-type').value;
        const arrowShape = document.getElementById('edge-arrow-shape').value;
        const width = document.getElementById('edge-width').value;

        console.log('Applying edge style:', { lineType, arrowShape, width });

        // 全エッジに直接スタイルを適用
        networkManager.cy.edges().style({
            'width': width + 'px',
            'target-arrow-shape': arrowShape,
            'line-style': lineType === 'dashed' ? 'dashed' : 'solid'
        });

        console.log('Edge style applied to', networkManager.cy.edges().length, 'edges');
    }
}

// グローバル参照用
window.StylePanel = StylePanel;
