document.getElementById('btn-gerar').addEventListener('click', gerarTabela);
document.getElementById('btn-calcular').addEventListener('click', calcular);

let historicoCalculos = [];
let animacaoId = null; // Guarda a ID do loop da animação gráfica do Canvas

function gerarTabela() {
    const numPos = parseInt(document.getElementById('campos-pos').value);
    const numTemp = parseInt(document.getElementById('campos-temp').value);
    const header = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    
    header.innerHTML = '';
    tbody.innerHTML = '';

    if (numPos < 5 || numPos > 10 || numTemp < 5 || numTemp > 10) {
        alert("Por favor, escolha valores entre 5 e 10.");
        return;
    }

    const totalPesos = (3 + numTemp) * 1.0 + (3 * 1.4); 
    const baseWidth = (96 / totalPesos); 

    const larguraDado = (baseWidth * 1.0).toFixed(4) + 'vw';
    const larguraCalculado = (baseWidth * 1.4).toFixed(4) + 'vw';

    let colsHtml = `
        <th style="width: ${larguraDado}">x<br>(m)</th>
        <th style="width: ${larguraDado}">y<br>(m)</th>
        <th style="width: ${larguraDado}">z<br>(m)</th>
    `;
    
    for (let i = 1; i <= numTemp; i++) {
        colsHtml += `<th style="width: ${larguraDado}">t${i}<br>(s)</th>`;
    }

    colsHtml += `
        <th style="width: ${larguraCalculado}">t<sub>m</sub><br>(s)</th>
        <th style="width: ${larguraCalculado}">v<sub>m</sub><br>(m/s)</th>
        <th style="width: ${larguraCalculado}">a<sub>m</sub><br>(m/s²|N/kg)</th>
    `;
    header.innerHTML = colsHtml;

    for (let p = 0; p < numPos; p++) {
        let row = document.createElement('tr');
        let xInicial = (p + 1) * 2;
        
        let rowHtml = `
            <td><input type="number" value="${xInicial}" class="pos-x" name="pos_x_${p}" step="any"></td>
            <td><input type="number" value="0" class="pos-y" name="pos_y_${p}" step="any"></td>
            <td><input type="number" value="0" class="pos-z" name="pos_z_${p}" step="any"></td>
        `;

        for (let t = 0; t < numTemp; t++) {
            let tempoInjetado = ((p + 1) * 1.5 + (t * 0.1)).toFixed(2);
            rowHtml += `<td><input type="number" value="${tempoInjetado}" class="tempo" name="tempo_${p}_${t}" step="any"></td>`;
        }

        rowHtml += `
            <td class="tempo-medio">—</td>
            <td class="vel-media">—</td>
            <td class="acel-media">—</td>
        `;
        row.innerHTML = rowHtml;
        tbody.appendChild(row);
    }

    // Gerenciamento de fluxo: exibe a tabela e esconde relatórios anteriores
    document.getElementById('section-tabela').style.display = 'block';
    document.getElementById('container-calcular').style.display = 'block';
    document.getElementById('painel-resultados').style.display = 'none';
    if(animacaoId) cancelAnimationFrame(animacaoId);

    document.querySelectorAll('#table-body input').forEach(element => {
        element.addEventListener('input', calcular);
    });
    
    document.querySelectorAll('.controls input, .controls select').forEach(element => {
        element.addEventListener('input', calcular);
    });
}

function calcular() {
    const rows = document.querySelectorAll('#table-body tr');
    if(rows.length === 0) return;

    const massa = parseFloat(document.getElementById('massa').value) || 1;
    const anguloGraus = parseFloat(document.getElementById('angulo').value) || 0;
    const angulo = anguloGraus * Math.PI / 180;
    const traj = document.getElementById('trajetoria').value;

    let resultadosVetorHTML = '';
    let resultadosModuloHTML = '';

    let dadosFinais = { t: 7.70, x: 10, y: 0, z: 0, v: 1.50, a: 3.00, vx: 1.30, vy: 0.75, ax: 2.60, ay: 1.50 };

    rows.forEach((row, index) => {
        let xInput = row.querySelector('.pos-x');
        let yInput = row.querySelector('.pos-y');
        let zInput = row.querySelector('.pos-z');

        let x = parseFloat(xInput.value) || 0;
        
        if (traj === 'inclinada') {
            if(document.activeElement !== yInput) yInput.value = (x * Math.tan(angulo)).toFixed(2);
            if(document.activeElement !== zInput) zInput.value = "0.00";
        } else if (traj === 'vertical') {
            if(document.activeElement !== yInput) yInput.value = x.toFixed(2);
            if(document.activeElement !== xInput) xInput.value = "0.00";
            x = 0;
            if(document.activeElement !== zInput) zInput.value = "0.00";
        } else if (traj === 'parabolica') {
            if(document.activeElement !== yInput) yInput.value = (x * Math.tan(angulo) - (9.81 * Math.pow(x, 2)) / (2 * Math.pow(10 * Math.cos(angulo), 2))).toFixed(2);
            if(document.activeElement !== zInput) zInput.value = "0.00";
        } else { 
            if(document.activeElement !== yInput) yInput.value = "0.00";
            if(document.activeElement !== zInput) zInput.value = "0.00";
        }












        let y = parseFloat(yInput.value) || 0;
        let z = parseFloat(zInput.value) || 0;

        const temposInput = row.querySelectorAll('.tempo');
        let tempos = [];
        temposInput.forEach(t => tempos.push(parseFloat(t.value) || 0));

        if (tempos.length < 3) return;

        let temposOrdenados = [...tempos].sort((a, b) => a - b);
        let temposValidos = temposOrdenados.slice(1, -1);
        let soma = temposValidos.reduce((acc, curr) => acc + curr, 0);
        let tempoMedio = soma / temposValidos.length;
        row.querySelector('.tempo-medio').textContent = tempoMedio.toFixed(2);

        let d = Math.sqrt(x*x + y*y + z*z);
        let velMedia = tempoMedio > 0 ? (d / tempoMedio) : 0;
        row.querySelector('.vel-media').textContent = velMedia.toFixed(2);

        let acelMedia = 2 * velMedia;
        row.querySelector('.acel-media').textContent = acelMedia.toFixed(2);

        let vx = velMedia * Math.cos(angulo);
        let vy = velMedia * Math.sin(angulo);
        if(traj === 'vertical') { vx = 0; vy = velMedia; }

        let ax = acelMedia * Math.cos(angulo);
        let ay = acelMedia * Math.sin(angulo);
        if(traj === 'vertical') { ax = 0; ay = acelMedia; }

        if(index === rows.length - 1) {
            dadosFinais = { t: tempoMedio, x: x, y: y, z: z, v: velMedia, a: acelMedia, vx: vx, vy: vy, ax: ax, ay: ay };
        }

        let px = massa * vx; let py = massa * vy;
        let fx = massa * ax; let fy = massa * ay;
        let impX = fx * tempoMedio; let impY = fy * tempoMedio;
        
        let ec = 0.5 * massa * Math.pow(velMedia, 2);
        let ep = massa * 9.81 * y; 
        let potencia = (ec + ep) / tempoMedio;

        historicoCalculos.push({
            ponto: index + 1, x, y, z, tempoMedio, velMedia, acelMedia,
            vx, vy, ax, ay, fx, fy, px, py, impX, impY, ec, ep, potencia
        });

        resultadosVetorHTML += `
            <div class="vector-block">
                <h3>Linha de Dados #${index + 1}</h3>
                <div class="item-grandeza"><span class="label-grandeza">Deslocamento Vetorial:</span><math><mrow><mover accent="true"><mi>d</mi><mo>→</mo></mover><mo>=</mo><mn>${x.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${y.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> m</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Velocidade Média Vetorial:</span><math><mrow><msub><mover accent="true"><mi>v</mi><mo>→</mo></mover><mi>m</mi></msub><mo>=</mo><mn>${vx.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${vy.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Velocidade Instantânea Vetorial:</span><math><mrow><msub><mover accent="true"><mi>v</mi><mo>→</mo></mover><mtext>inst</mtext></msub><mo>≈</mo><mn>${(vx * 1.05).toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${(vy * 1.05).toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Aceleração Vetorial:</span><math><mrow><mover accent="true"><mi>a</mi><mo>→</mo></mover><mo>=</mo><mn>${ax.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${ay.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> m/s²</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Quantidade de Movimento:</span><math><mrow><mover accent="true"><mi>Q</mi><mo>→</mo></mover><mo>=</mo><mn>${px.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${py.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> kg·m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Momento Linear:</span><math><mrow><mover accent="true"><mi>p</mi><mo>→</mo></mover><mo>=</mo><mn>${px.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${py.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> kg·m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Impulso Vetorial:</span><math><mrow><mover accent="true"><mi>I</mi><mo>→</mo></mover><mo>=</mo><mn>${impX.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${impY.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> N·s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Força Resultante Vetorial:</span><math><mrow><msub><mover accent="true"><mi>F</mi><mo>→</mo></mover><mtext>res</mtext></msub><mo>=</mo><mn>${fx.toFixed(2)}</mn><mover accent="true"><mi>i</mi><mo>^</mo></mover><mo>+</mo><mn>${fy.toFixed(2)}</mn><mover accent="true"><mi>j</mi><mo>^</mo></mover><mtext> N</mtext></mrow></math></div>
            </div>
        `;

        resultadosModuloHTML += `
            <div class="vector-block">
                <h3>Linha de Dados #${index + 1}</h3>
                <div class="item-grandeza"><span class="label-grandeza">Módulo do Deslocamento:</span><math><mrow><mo>|</mo><mover accent="true"><mi>d</mi><mo>→</mo></mover><mo>|</mo><mo>=</mo><mn>${d.toFixed(2)}</mn><mtext> m</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo da Velocidade Média:</span><math><mrow><mo>|</mo><msub><mover accent="true"><mi>v</mi><mo>→</mo></mover><mi>m</mi></msub><mo>|</mo><mo>=</mo><mn>${velMedia.toFixed(2)}</mn><mtext> m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo da Velocidade Instantânea:</span><math><mrow><mo>|</mo><msub><mover accent="true"><mi>v</mi><mo>→</mo></mover><mtext>inst</mtext></|><mo>≈</mo><mn>${(velMedia * 1.05).toFixed(2)}</mn><mtext> m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo da Aceleração:</span><math><mrow><mo>|</mo><mover accent="true"><mi>a</mi><mo>→</mo></mover><mo>|</mo><mo>=</mo><mn>${acelMedia.toFixed(2)}</mn><mtext> m/s²</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo da Qtd. Movimento:</span><math><mrow><mo>|</mo><mover accent="true"><mi>Q</mi><mo>→</mo></mover><mo>|</mo><mo>=</mo><mn>${(massa * velMedia).toFixed(2)}</mn><mtext> kg·m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo do Momento Linear:</span><math><mrow><mo>|</mo><mover accent="true"><mi>p</mi><mo>→</mo></mover><mo>|</mo><mo>=</mo><mn>${(massa * velMedia).toFixed(2)}</mn><mtext> kg·m/s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo do Impulso:</span><math><mrow><mo>|</"><mover accent="true"><mi>I</mi><mo>→</mo></mover><mo>|</mo><mo>=</mo><mn>${(Math.sqrt(impX*impX + impY*impY)).toFixed(2)}</mn><mtext> N·s</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Módulo da Força Resultante:</span><math><mrow><mo>|</mo><msub><mover accent="true"><mi>F</mi><mo>→</mo></mover><mtext>res</mtext></|><mo>=</mo><mn>${(Math.sqrt(fx*fx + fy*fy)).toFixed(2)}</mn><mtext> N</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Energia Cinética:</span><math><mrow><msub><mi>E</mi><mi>c</mi></msub><mo>=</mo><mn>${ec.toFixed(2)}</mn><mtext> J</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Energia Potencial Gravitacional:</span><math><mrow><msub><mi>E</mi><mi>p</mi></msub><mo>=</mo><mn>${ep.toFixed(2)}</mn><mtext> J</mtext></mrow></math></div>
                <div class="item-grandeza"><span class="label-grandeza">Potência Mecânica Desenvolvida:</span><math><mrow><mi>P</mi><mo>=</mo><mn>${potencia.toFixed(2)}</mn><mtext> W</mtext></mrow></math></div>
            </div>
        `;
    });


        document.getElementById('output-vetor').innerHTML = resultadosVetorHTML;
    document.getElementById('output-modulo').innerHTML = resultadosModuloHTML;

    let tReal = dadosFinais.t;
    let aReal = dadosFinais.a;
    let vReal = dadosFinais.v;
    let sFinal = Math.sqrt(dadosFinais.x * dadosFinais.x + dadosFinais.y * dadosFinais.y + dadosFinais.z * dadosFinais.z);
    
    let fResTotal = massa * aReal;
    let ecFinal = 0.5 * massa * Math.pow(vReal, 2);
    let epFinal = massa * 9.81 * dadosFinais.y;
    let potFinal = (ecFinal + epFinal) / tReal;

    let equacoesHTML = `
        <div class="vector-block" style="width: 100%;">
            <h3>Equações Gerais e Empíricas Combinadas (t = ${tReal.toFixed(2)} s)</h3>
            <div class="item-grandeza"><span class="label-grandeza">Equação Horária do Espaço:</span> <math><mrow><mi>s</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><msub><mi>s</mi><mn>0</mn></msub><mo>+</mo><msub><mi>v</mi><mn>0</mn></v><mi>t</mi><mo>+</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>a</mi><msup><mi>t</mi><mn>2</mn></msup><mo>⇒</mo><mi>s</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mn>${(0.5 * aReal).toFixed(2)}</mn><msup><mi>t</mi><mn>2</mn></msup></mrow></math></div>
            <div class="item-grandeza"><span class="label-grandeza">Equação Horária da Velocidade:</span> <math><mrow><mi>v</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><msub><mi>v</mi><mn>0</mn></mrow><mo>+</mo><mi>a</mi><mi>t</mi><mo>⇒</mo><mi>v</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mn>${aReal.toFixed(2)}</mn><mi>t</mi></mrow></math></div>
            <div class="item-grandeza"><span class="label-grandeza">Segunda Lei de Newton Dinâmica (F):</span> <math><mrow><mi>F</mi><mo>=</mo><mi>m</mi><mo>·</mo><mi>a</mi><mo>⇒</mo><mi>F</mi><mo>=</mo><mn>${massa.toFixed(1)}</mn><mo>·</mo><mn>${aReal.toFixed(2)}</mn><mo>=</mo><mn>${fResTotal.toFixed(2)}</mn><mtext> N</mtext></mrow></math></div>
            <div class="item-grandeza"><span class="label-grandeza">Energia Cinética Experimental (K):</span> <math><mrow><mi>K</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>m</mi><msup><mi>v</mi><mn>2</msup><mo>⇒</mo><mi>K</mi><mo>=</mo><mn>${ecFinal.toFixed(2)}</mn><mtext> J</mtext></mrow></math></div>
            <div class="item-grandeza"><span class="label-grandeza">Energia Potencial Gravitacional (U):</span> <math><mrow><mi>U</mi><mo>=</mo><mi>m</mi><mo>·</mo><mi>g</mi><mo>·</mo><mi>h</mi><mo>⇒</mo><mi>U</mi><mo>=</mo><mn>${epFinal.toFixed(2)}</mn><mtext> J</mtext></mrow></math></div>
            <div class="item-grandeza"><span class="label-grandeza">Potência Média Desenvolvida (P):</span> <math><mrow><mi>P</mi><mo>=</mo><mfrac><mi>W</mi><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac><mo>⇒</mo><mi>P</mi><mo>=</mo><mn>${potFinal.toFixed(2)}</mn><mtext> W</mtext></mrow></math></div>
        </div>
    `;
    document.getElementById('output-equacoes').innerHTML = equacoesHTML;

    document.getElementById('painel-resultados').style.display = 'block';

    const canvasS = document.createElement('canvas');
    const canvasV = document.createElement('canvas');
    const containerS = document.getElementById('svg-posicao-container');
    const containerV = document.getElementById('svg-velocidade-container');
    
    containerS.innerHTML = ''; containerV.innerHTML = '';
    containerS.appendChild(canvasS); containerV.appendChild(canvasV);

    const w = containerS.clientWidth || 400; const h = 180;
    canvasS.width = w; canvasS.height = h; canvasV.width = w; canvasV.height = h;

    const ctxS = canvasS.getContext('2d'); const ctxV = canvasV.getContext('2d');
    const padding = 35;
    
    let sMax = sFinal > 0 ? sFinal * 1.1 : 10;
    let vMax = vReal > 0 ? vReal * 1.2 : 5;

    function desenharEixos(ctx, labelY, valMaxY) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "black"; ctx.lineWidth = 2;
        ctx.font = "12px sans-serif"; ctx.fillStyle = "black";
        ctx.beginPath(); ctx.moveTo(padding, padding - 15); ctx.lineTo(padding, h - padding); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padding, h - padding); ctx.lineTo(w - padding + 15, h - padding); ctx.stroke();
        ctx.fillText("t", w - padding + 20, h - padding + 4);
        ctx.fillText(labelY, padding - 5, padding - 20);
        ctx.fillText("0", padding - 12, h - padding + 12);
        ctx.fillText(tReal.toFixed(2) + "s", w - padding - 10, h - padding + 15);
        ctx.fillText(valMaxY.toFixed(1), padding - 30, padding + 5);
    }
    
    desenharEixos(ctxS, "S(m)", sMax);
    ctxS.strokeStyle = "blue"; ctxS.lineWidth = 3; ctxS.beginPath();
    for (let i = 0; i <= 30; i++) {
        let t = (tReal / 30) * i;
        let s = 0.5 * aReal * Math.pow(t, 2);
        let cx = padding + (t / tReal) * (w - 2 * padding);
        let cy = (h - padding) - (s / sMax) * (h - 2 * padding);
        if (i === 0) ctxS.moveTo(cx, cy); else ctxS.lineTo(cx, cy);
    }
    ctxS.stroke();
    
    desenharEixos(ctxV, "v(m/s)", vMax);
    ctxV.strokeStyle = "green"; ctxV.lineWidth = 3; ctxV.beginPath();
    for (let i = 0; i <= 30; i++) {
        let t = (tReal / 30) * i;
        let v = aReal * t;
        let cx = padding + (t / tReal) * (w - 2 * padding);
        let cy = (h - padding) - (v / vMax) * (h - 2 * padding);
        if (i === 0) ctxV.moveTo(cx, cy); else ctxV.lineTo(cx, cy);
    }
    ctxV.stroke();

        // ENGINE DE ANIMAÇÃO GRÁFICA VETORIAL EM TEMPO REAL (CANVAS INTERNO)
    const containerAnim = document.getElementById('canvas-animacao-container');
    let canvasAnim = containerAnim.querySelector('canvas');
    if(!canvasAnim) {
        canvasAnim = document.createElement('canvas');
        containerAnim.appendChild(canvasAnim);
    }
    const wA = containerAnim.clientWidth || 800; const hA = 250;
    canvasAnim.width = wA; canvasAnim.height = hA;
    const ctxA = canvasAnim.getContext('2d');

    if(animacaoId) cancelAnimationFrame(animacaoId);

    function redesenharCenarioEstatico() {
        ctxA.clearRect(0, 0, wA, hA);
        ctxA.strokeStyle = "#444"; ctxA.lineWidth = 1; ctxA.setLineDash([5, 5]);
        ctxA.beginPath(); ctxA.moveTo(50, hA - 40); ctxA.lineTo(wA - 50, hA - 40); ctxA.stroke();
        ctxA.setLineDash([]);
        ctxA.fillStyle = "#888"; ctxA.font = "11px sans-serif";
        ctxA.fillText("Referencial Inicial (0,0)", 35, hA - 20);
        ctxA.fillStyle = "#ff4d4d"; ctxA.beginPath(); ctxA.arc(50, hA - 40, 10, 0, 2 * Math.PI); ctxA.fill();
    }
    redesenharCenarioEstatico();

    document.getElementById('btn-play').onclick = function() {
        if(animacaoId) cancelAnimationFrame(animacaoId);
        let tempoInicio = performance.now();
        const tTotalSimulado = tReal * 1000; 

        function loop(agora) {
            let tempoDecorrido = agora - tempoInicio;
            if (tempoDecorrido > tTotalSimulado) tempoDecorrido = tTotalSimulado;
            
            let tCurrent = tempoDecorrido / 1000;
            let sCurrent = 0.5 * aReal * Math.pow(tCurrent, 2);
            let escalaPX = (wA - 150) / (sFinal > 0 ? sFinal : 1);

            let posX_PX = 50; let posY_PX = hA - 40;

            if (traj === 'horizontal') {
                posX_PX += sCurrent * escalaPX;
            } else if (traj === 'vertical') {
                posY_PX -= sCurrent * (hA - 80) / (sFinal > 0 ? sFinal : 1);
            } else if (traj === 'inclinada') {
                posX_PX += (sCurrent * Math.cos(angulo)) * escalaPX;
                posY_PX -= (sCurrent * Math.sin(angulo)) * (hA - 80) / (sFinal > 0 ? sFinal : 1);
            } else if (traj === 'parabolica') {
                let xSim = (dadosFinais.x / tReal) * tCurrent;
                let ySim = xSim * Math.tan(angulo) - (9.81 * Math.pow(xSim, 2)) / (2 * Math.pow(10 * Math.cos(angulo), 2));
                posX_PX += xSim * escalaPX;
                posY_PX -= ySim * (hA - 80) / (sFinal > 0 ? sFinal : 1);
            }

            ctxA.clearRect(0, 0, wA, hA);
            ctxA.strokeStyle = "#333"; ctxA.lineWidth = 1; ctxA.setLineDash([5, 5]);
            ctxA.beginPath(); ctxA.moveTo(50, hA - 40); ctxA.lineTo(wA - 50, hA - 40); ctxA.stroke();
            ctxA.setLineDash([]);

            // Desenha vetores de velocidade tangenciais à partícula
            ctxA.strokeStyle = "#e74c3c"; ctxA.lineWidth = 2; ctxA.beginPath();
            ctxA.moveTo(posX_PX, posY_PX); 
            ctxA.lineTo(posX_PX + (dadosFinais.vx * 15), posY_PX - (dadosFinais.vy * 15)); ctxA.stroke();

            // Renderiza a amostra física em movimento acelerado
            ctxA.fillStyle = "#00b4d8"; ctxA.beginPath();
            ctxA.arc(posX_PX, posY_PX, 10 + (massa * 0.5), 0, 2 * Math.PI); ctxA.fill();

            ctxA.fillStyle = "#fff"; ctxA.font = "12px monospace";
            ctxA.fillText(`t: ${tCurrent.toFixed(2)}s | S: ${sCurrent.toFixed(2)}m`, 20, 25);

            if (tempoDecorrido < tTotalSimulado) {
                animacaoId = requestAnimationFrame(loop);
            }
        }
        animacaoId = requestAnimationFrame(loop);
    };
}

function exportarPDF() {
    const elemento = document.getElementById('painel-resultados');
    const botoesExport = document.querySelector('.export-buttons');
    if (botoesExport) botoesExport.style.display = 'none';

    html2pdf().from(elemento).save('Relatorio_Laboratorio_Fisica.pdf').then(() => {
        if (botoesExport) botoesExport.style.display = 'flex';
    });
}

function exportarTexto() {
    if (historicoCalculos.length === 0) return;

    let conteudoTxt = `==================================================\n`;
    conteudoTxt += `  RELATÓRIO DE MOVIMENTO E DINÂMICA VETORIAL\n`;
    conteudoTxt += `==================================================\n\n`;
    
    historicoCalculos.forEach(d => {
        conteudoTxt += `PONTO ${d.ponto} (Tempo Médio: ${d.tempoMedio.toFixed(2)}s)\n`;
        conteudoTxt += `--------------------------------------------------\n`;
        conteudoTxt += `- Deslocamento Vetorial: d = (${d.x.toFixed(2)}i + ${d.y.toFixed(2)}j) m\n`;
        conteudoTxt += `- Velocidade Média Vetorial: Vm = (${d.vx.toFixed(2)}i + ${d.vy.toFixed(2)}j) m/s\n`;
        conteudoTxt += `- Aceleração Vetorial: a = (${d.ax.toFixed(2)}i + ${d.ay.toFixed(2)}j) m/s²\n`;
        conteudoTxt += `- Quantidade de Movimento: Q = (${d.px.toFixed(2)}i + ${d.py.toFixed(2)}j) kg·m/s\n`;
        conteudoTxt += `- Impulso Vetorial: I = (${d.impX.toFixed(2)}i + ${d.impY.toFixed(2)}j) N·s\n`;
        conteudoTxt += `- Força Resultante: F = (${d.fx.toFixed(2)}i + ${d.fy.toFixed(2)}j) N\n`;
        conteudoTxt += `- Energia Cinética: Ec = ${d.ec.toFixed(2)} J\n`;
        conteudoTxt += `- Energia Potencial: Ep = ${d.ep.toFixed(2)} J\n`;
        conteudoTxt += `- Potência Mecânica: P = ${d.potencia.toFixed(2)} W\n\n`;
    });

    const blob = new Blob([conteudoTxt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Relatorio_Experimento_Fisica.txt';
    link.click();
    URL.revokeObjectURL(link.href);
}

document.getElementById('btnPdf').addEventListener('click', exportarPDF);
document.getElementById('btnTexto').addEventListener('click', exportarTexto);






