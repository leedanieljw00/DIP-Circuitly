window.ThreePhaseCircuitGenerator = {
    generate: function () {
        // 1. Randomize System Configuration
        // Requested Distribution:
        // 35% Filter Circuits
        // 25% Delta Questions (Delta-Delta)
        // 25% Star Questions (Wye-Wye)
        // 15% Star-Delta (Mixed)

        const rand = Math.random();
        let scenario = "";

        if (rand < 0.35) scenario = 'FILTER';
        else if (rand < 0.60) scenario = 'DELTA_DELTA'; // 0.35 + 0.25
        else if (rand < 0.85) scenario = 'WYE_WYE';     // 0.60 + 0.25
        else scenario = 'MIXED';                        // Remainder 0.15

        if (scenario === 'FILTER') {
            return this.generateFilterCLR();
        }

        let sourceConfig = 'Wye';
        let loadConfig = 'Wye';

        if (scenario === 'DELTA_DELTA') {
            sourceConfig = 'Delta';
            loadConfig = 'Delta';
        } else if (scenario === 'WYE_WYE') {
            sourceConfig = 'Wye';
            loadConfig = 'Wye';
        } else {
            // Mixed: Wye-Delta or Delta-Wye
            if (Math.random() < 0.5) {
                sourceConfig = 'Wye'; loadConfig = 'Delta';
            } else {
                sourceConfig = 'Delta'; loadConfig = 'Wye';
            }
        }

        // 2. Randomize Voltage Input Type
        // "Line": Provide V_line directly.
        // "Phase": Provide Source Phase Voltage.
        const inputTypes = ['Line', 'Phase'];
        const inputType = inputTypes[Math.floor(Math.random() * inputTypes.length)];

        // Base Voltage
        const baseVolts = 100 + Math.floor(Math.random() * 41) * 10; // 100-500

        let V_source_phase = 0;
        let V_line = 0;
        let voltagePrompText = "";

        if (inputType === 'Line') {
            V_line = baseVolts;
            voltagePrompText = `V<sub>line</sub> = ${V_line}V`;
        } else {
            V_source_phase = baseVolts;
            voltagePrompText = `Source V<sub>phase</sub> = ${V_source_phase}V`;
            // Calculate Line Voltage based on Source Config
            if (sourceConfig === 'Wye') {
                V_line = V_source_phase * Math.sqrt(3);
            } else {
                V_line = V_source_phase;
            }
        }

        // 3. Randomize Load Type
        const loadTypes = [
            { type: 'R', label: 'R' },
            { type: 'L', label: 'XL' },
            { type: 'C', label: 'XC' },
            { type: 'RL_Series', label: 'R+L Series' },
            { type: 'RC_Series', label: 'R+C Series' },
            { type: 'RL_Parallel', label: 'R||L Parallel' },
            { type: 'RC_Parallel', label: 'R||C Parallel' },
            { type: 'RLC_Series', label: 'R+L+C Series' },
            { type: 'RLC_Parallel', label: 'R||L||C Parallel' }
        ];

        const loadChoice = loadTypes[Math.floor(Math.random() * loadTypes.length)];
        const loadType = loadChoice.type;

        let Z_mag = 0;
        let R = 0, XL = 0, XC = 0;
        let componentValueStr = "";

        // Component Values
        const val1 = 10 + Math.floor(Math.random() * 20); // 10-29
        const val2 = 10 + Math.floor(Math.random() * 20);
        const val3 = 10 + Math.floor(Math.random() * 20);

        if (loadType === 'R') {
            R = val1; Z_mag = R; componentValueStr = `R=${R}Ω`;
        } else if (loadType === 'L') {
            XL = val1; Z_mag = XL; componentValueStr = `X<sub>L</sub>=${XL}Ω`;
        } else if (loadType === 'C') {
            XC = val1; Z_mag = XC; componentValueStr = `X<sub>C</sub>=${XC}Ω`;
        } else if (loadType === 'RL_Series') {
            R = val1; XL = val2;
            Z_mag = Math.sqrt(R * R + XL * XL);
            componentValueStr = `R=${R}Ω, X<sub>L</sub>=${XL}Ω`;
        } else if (loadType === 'RC_Series') {
            R = val1; XC = val2;
            Z_mag = Math.sqrt(R * R + XC * XC);
            componentValueStr = `R=${R}Ω, X<sub>C</sub>=${XC}Ω`;
        } else if (loadType === 'RL_Parallel') {
            R = val1; XL = val2;
            const Y = Math.sqrt(Math.pow(1 / R, 2) + Math.pow(1 / XL, 2));
            Z_mag = 1 / Y;
            componentValueStr = `R=${R}Ω, X<sub>L</sub>=${XL}Ω`;
        } else if (loadType === 'RC_Parallel') {
            R = val1; XC = val2;
            const Y = Math.sqrt(Math.pow(1 / R, 2) + Math.pow(1 / XC, 2));
            Z_mag = 1 / Y;
            componentValueStr = `R=${R}Ω, X<sub>C</sub>=${XC}Ω`;
        } else if (loadType === 'RLC_Series') {
            R = val1; XL = val2; XC = val3;
            // Z = sqrt(R^2 + (XL - XC)^2)
            Z_mag = Math.sqrt(R * R + Math.pow(XL - XC, 2));
            componentValueStr = `R=${R}Ω, X<sub>L</sub>=${XL}Ω, X<sub>C</sub>=${XC}Ω`;
        } else if (loadType === 'RLC_Parallel') {
            R = val1; XL = val2; XC = val3;
            // Y = sqrt( (1/R)^2 + (1/XC - 1/XL)^2 )   (Susceptance B = BC - BL)
            const G = 1 / R;
            const B = (1 / XC) - (1 / XL);
            const Y = Math.sqrt(G * G + B * B);
            Z_mag = 1 / Y;
            componentValueStr = `R=${R}Ω, X<sub>L</sub>=${XL}Ω, X<sub>C</sub>=${XC}Ω`;
        }

        // 4. Calculate Answer
        let I_line = 0;
        let V_load_phase = 0;
        let explanation = "";

        // Source Calculation Explanation
        let sourceExp = "";
        if (inputType === 'Phase') {
            if (sourceConfig === 'Wye') {
                sourceExp = `Source is Wye: V<sub>line</sub> = √3 × V<sub>source,phase</sub> = √3 × ${V_source_phase} ≈ ${V_line.toFixed(1)}V. `;
            } else {
                sourceExp = `Source is Delta: V<sub>line</sub> = V<sub>source,phase</sub> = ${V_line.toFixed(1)}V. `;
            }
        } else {
            sourceExp = `Given V<sub>line</sub> = ${V_line}V. `;
        }

        // Load Calculation Explanation
        if (loadConfig === 'Wye') {
            V_load_phase = V_line / Math.sqrt(3);
            I_line = V_load_phase / Z_mag;
            explanation = `${sourceExp}Load is Wye: V<sub>load,phase</sub> = V<sub>line</sub> / √3 ≈ ${V_load_phase.toFixed(1)}V. |Z| = ${Z_mag.toFixed(1)}Ω. I<sub>line</sub> = I<sub>phase</sub> = V<sub>load,phase</sub> / |Z|.`;
        } else {
            V_load_phase = V_line;
            const I_phase = V_load_phase / Z_mag;
            I_line = I_phase * Math.sqrt(3);
            explanation = `${sourceExp}Load is Delta: V<sub>load,phase</sub> = V<sub>line</sub> ≈ ${V_load_phase.toFixed(1)}V. |Z| = ${Z_mag.toFixed(1)}Ω. I<sub>phase</sub> = V<sub>load,phase</sub> / |Z|. I<sub>line</sub> = I<sub>phase</sub> × √3.`;
        }

        const answerVal = I_line.toFixed(1);

        // Generate options
        const options = new Set();
        options.add(answerVal);
        while (options.size < 3) {
            let offset = (Math.random() - 0.5) * (I_line * 0.4);
            let val = (I_line + offset).toFixed(1);
            if (val > 0 && val !== answerVal) options.add(val);
        }

        // 5. Generate SVG
        const svg = this.generateSVG(sourceConfig, loadConfig, loadType, componentValueStr, voltagePrompText);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return {
            id: 'gen_' + Date.now() + Math.random(),
            topicId: 8,
            prompt: `System: ${sourceConfig}-Source feeding ${loadConfig}-Load. Calculate Line Current.`,
            options: Array.from(options),
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: `${explanation} I<sub>line</sub> = ${answerVal}A.`
        };
    },

    generateFilterCLR: function () {
        // Specific Single Phase "Filter" layout: Series C, Shunt L, Load R
        const V_in = 100 + Math.floor(Math.random() * 20) * 10; // 100-300V
        const R = 10 + Math.floor(Math.random() * 20);
        const XL = 10 + Math.floor(Math.random() * 20);
        const XC = 10 + Math.floor(Math.random() * 20);

        // Z_parallel (L || R)
        // Y_p = 1/R - j(1/XL)
        // G = 1/R, B_L = 1/XL
        const G = 1 / R;
        const B_L = 1 / XL;
        const Y_p_mag = Math.sqrt(G * G + B_L * B_L);
        const Z_p_mag = 1 / Y_p_mag;

        // We need complex addition for Z_total = Z_C + Z_p
        // Z_C = 0 - jXC
        // Z_p needs to be decomposed to R_eq + jX_eq to add to Z_C
        // Z_p = (jXL * R) / (R + jXL) = (jXL*R)(R - jXL) / (R^2 + XL^2)
        //     = (jR^2*XL + R*XL^2) / (R^2 + XL^2)
        // R_p_equiv = (R * XL^2) / (R^2 + XL^2)
        // X_p_equiv = (R^2 * XL) / (R^2 + XL^2)

        const denom = R * R + XL * XL;
        const R_p = (R * XL * XL) / denom;
        const X_p = (R * R * XL) / denom;

        // Total Z = (R_p) + j(X_p - XC)
        const R_tot = R_p;
        const X_tot = X_p - XC;
        const Z_tot_mag = Math.sqrt(R_tot * R_tot + X_tot * X_tot);

        const I_in = V_in / Z_tot_mag;
        const answerVal = I_in.toFixed(1);

        // Generate options
        const options = new Set();
        options.add(answerVal);
        while (options.size < 3) {
            let offset = (Math.random() - 0.5) * (I_in * 0.4);
            let val = (I_in + offset).toFixed(1);
            if (val > 0 && val !== answerVal) options.add(val);
        }

        const explanation = `1. Load Parallel Impedance (L||R): Z<sub>p</sub> = (jX<sub>L</sub> × R) / (R + jX<sub>L</sub>). 
        <br>2. Convert to Series Equiv: R<sub>p</sub> = ${(R_p).toFixed(1)}Ω, X<sub>p</sub> = ${(X_p).toFixed(1)}Ω.
        <br>3. Total Impedance: Z<sub>tot</sub> = R<sub>p</sub> + j(X<sub>p</sub> - X<sub>C</sub>) → |Z| = ${Z_tot_mag.toFixed(1)}Ω.
        <br>4. Current: I = V / |Z| = ${answerVal}A.`;

        // SVG Drawing
        const width = 450;
        const height = 300;
        const style = `
            <style>
                .wire { fill:none; stroke:black; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
                .component { fill:none; stroke:black; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
                .label { font-family:'Nunito', sans-serif; font-size:14px; fill:#374151; font-weight:600; }
                .title { font-family:'Nunito', sans-serif; font-size:16px; fill:#111827; font-weight:700; }
                .node { fill:black; }
            </style>
        `;

        // Layout: In Left, C top Series, L middle shunt, R right shunt (or parallel layout)
        // Image shows: C series, Node, L down, then wire to R down.

        let elements = "";

        // Terminals
        elements += `<circle cx="50" cy="100" r="3" class="wire" stroke="black" fill="white" /> <text x="30" y="105" class="label">in</text>`;
        elements += `<circle cx="50" cy="200" r="3" class="wire" stroke="black" fill="white" />`;

        // Top Wire with C
        // 50->150 (C) -> 250 (Node)
        elements += `<line x1="53" y1="100" x2="105" y2="100" class="wire" />`;
        // Draw C at 125. Path width 40 (-20 to 20). Occupies 105 to 145.
        const pathC_template = "M -20 0 L -5 0 M -5 -10 L -5 10 M 5 -10 L 5 10 M 5 0 L 20 0";
        elements += `<g transform="translate(125,100)"> <path d="${pathC_template}" class="component" /> </g> <text x="125" y="80" class="label" text-anchor="middle">X<sub>C</sub>=${XC}Ω</text>`;
        elements += `<line x1="145" y1="100" x2="250" y2="100" class="wire" />`;

        // Node above L
        elements += `<circle cx="250" cy="100" r="3" fill="black" />`;

        // L Shunt (Vertical down at 250)
        // 100 -> 200
        const pathL_vert = "M 0 -20 q -12 5 0 10 q -12 5 0 10 q -12 5 0 10 q -12 5 0 10"; // Rotated L
        // Or just rotate standard
        const pathL = "M -20 0 q 5 -12 10 0 q 5 -12 10 0 q 5 -12 10 0 q 5 -12 10 0";
        elements += `<line x1="250" y1="100" x2="250" y2="130" class="wire" />`;
        elements += `<g transform="translate(250,150) rotate(90)"> <path d="${pathL}" class="component" /> </g> <text x="230" y="155" class="label" text-anchor="end">X<sub>L</sub>=${XL}Ω</text>`;
        elements += `<line x1="250" y1="170" x2="250" y2="200" class="wire" />`;
        elements += `<circle cx="250" cy="200" r="3" fill="black" />`;

        // R Load (Right at 350)
        elements += `<line x1="250" y1="100" x2="350" y2="100" class="wire" /> <circle cx="350" cy="100" r="3" stroke="black" fill="white" />`;
        elements += `<line x1="350" y1="100" x2="350" y2="130" class="wire" />`;
        const pathR = "M -20 0 l 2.5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        elements += `<g transform="translate(350,150) rotate(90)"> <path d="${pathR}" class="component" /> </g> <text x="370" y="155" class="label">R=${R}Ω</text>`;
        elements += `<line x1="350" y1="170" x2="350" y2="200" class="wire" /> <circle cx="350" cy="200" r="3" stroke="black" fill="white" />`;

        // Bottom Return
        elements += `<line x1="53" y1="200" x2="350" y2="200" class="wire" />`;

        // Labels
        elements += `<text x="300" y="155" class="label" fill="#666" font-size="12">out</text>`;

        // Info
        elements += `
            <rect x="10" y="10" width="150" height="40" rx="5" fill="none" stroke="#ddd" />
            <text x="20" y="35" class="title">V<sub>in</sub> = ${V_in}V</text>
        `;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white" />${style}${elements}</svg>`;
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return {
            id: 'gen_' + Date.now() + Math.random(),
            topicId: 8,
            prompt: `Calculate the Input Current magnitude |I_in| for this single-phase filter circuit.`,
            options: Array.from(options),
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: explanation
        };
    },

    generateSVG: function (sourceConfig, loadConfig, loadType, compValStr, voltText) {
        const width = 500;
        const height = 450;
        const cx = width / 2;
        const cy = height / 2 + 20;

        // Paths (Horizontal, centered at 0,0, width ~40)
        const pathR = "M -20 0 l 2.5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const pathL = "M -20 0 q 5 -12 10 0 q 5 -12 10 0 q 5 -12 10 0 q 5 -12 10 0";
        const pathC = "M -20 0 L -5 0 M -5 -10 L -5 10 M 5 -10 L 5 10 M 5 0 L 20 0";

        function getComponentGroup(type) {
            if (type === 'R') return `<path d="${pathR}" class="component" />`;
            if (type === 'L') return `<path d="${pathL}" class="component" />`;
            if (type === 'C') return `<path d="${pathC}" class="component" />`;

            // Series Combinations
            // Stack horizontally: -40 to 0 to 40
            if (type.includes('Series')) {
                let p1 = pathR, p2 = pathL, p3 = null;
                if (type === 'RC_Series') { p2 = pathC; }
                if (type === 'RLC_Series') { p3 = pathC; }

                let g = ``;
                if (!p3) {
                    // 2 Comp
                    g += `<g transform="translate(-20,0) scale(0.8)"><path d="${p1}" class="component"/></g>`;
                    g += `<g transform="translate(20,0) scale(0.8)"><path d="${p2}" class="component"/></g>`;
                    g += `<line x1="-4" y1="0" x2="4" y2="0" class="wire" />`;
                } else {
                    // 3 Comp (R, L, C)
                    // R at -30 (ends at -18). L at 0 (starts -12). Gap -18 to -12.
                    // L ends at 12. C at 30 (starts 18). Gap 12 to 18.
                    g += `<g transform="translate(-30,0) scale(0.6)"><path d="${pathR}" class="component"/></g>`;
                    g += `<g transform="translate(0,0) scale(0.6)"><path d="${pathL}" class="component"/></g>`;
                    g += `<g transform="translate(30,0) scale(0.6)"><path d="${pathC}" class="component"/></g>`;
                    g += `<line x1="-18" y1="0" x2="-12" y2="0" class="wire" />`;
                    g += `<line x1="12" y1="0" x2="18" y2="0" class="wire" />`;
                }
                return g;
            }

            // Parallel Combinations
            if (type.includes('Parallel')) {
                // 2 or 3 parallel
                let p1 = pathR, p2 = pathL, p3 = null;
                if (type === 'RC_Parallel') { p2 = pathC; }
                if (type === 'RLC_Parallel') { p3 = pathC; }

                let g = ``;
                if (!p3) {
                    // 2 Branches
                    g += `<g transform="translate(0,-15) scale(0.8)"><path d="${p1}" class="component"/></g>`;
                    g += `<g transform="translate(0,15) scale(0.8)"><path d="${p2}" class="component"/></g>`;
                    // Wires
                    g += `<path d="M -25 0 L -25 -15 L -16 -15 M -25 0 L -25 15 L -16 15" class="wire"/>`;
                    g += `<path d="M 25 0 L 25 -15 L 16 -15 M 25 0 L 25 15 L 16 15" class="wire"/>`;
                    g += `<line x1="-35" y1="0" x2="-25" y2="0" class="wire"/> <line x1="25" y1="0" x2="35" y2="0" class="wire"/>`;
                } else {
                    // 3 Branches
                    g += `<g transform="translate(0,-20) scale(0.7)"><path d="${pathR}" class="component"/></g>`;
                    g += `<g transform="translate(0,0) scale(0.7)"><path d="${pathL}" class="component"/></g>`;
                    g += `<g transform="translate(0,20) scale(0.7)"><path d="${pathC}" class="component"/></g>`;

                    // Connections
                    g += `<path d="M -25 0 L -25 -20 L -14 -20 M -25 0 L -14 0 M -25 0 L -25 20 L -14 20" class="wire"/>`;
                    g += `<path d="M 25 0 L 25 -20 L 14 -20 M 25 0 L 14 0 M 25 0 L 25 20 L 14 20" class="wire"/>`;
                    g += `<line x1="-35" y1="0" x2="-25" y2="0" class="wire"/> <line x1="25" y1="0" x2="35" y2="0" class="wire"/>`;
                }
                return g;
            }
            return "";
        }

        function drawComponent(x, y, angle) {
            return `<g transform="translate(${x},${y}) rotate(${angle})">${getComponentGroup(loadType)}</g>`;
        }

        const style = `
            <style>
                .wire { fill:none; stroke:black; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
                .component { fill:none; stroke:black; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
                .label { font-family:'Nunito', sans-serif; font-size:14px; fill:#374151; font-weight:600; }
                .title { font-family:'Nunito', sans-serif; font-size:16px; fill:#111827; font-weight:700; }
                .node { fill:black; }
            </style>
        `;

        let elements = "";

        // --- DRAW LOAD CONFIGURATION ---
        if (loadConfig === 'Wye') {
            const radius = 100;
            // Center Node
            elements += `<circle cx="${cx}" cy="${cy}" r="3" class="node" />`;
            elements += `<text x="${cx + 10}" y="${cy - 5}" class="label">N</text>`;

            // Phase A
            elements += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 40}" class="wire" />`;
            elements += drawComponent(cx, cy - 70, -90);
            elements += `<line x1="${cx}" y1="${cy - 100}" x2="${cx}" y2="${cy - 120}" class="wire" />`;
            elements += `<text x="${cx}" y="${cy - 135}" class="label" text-anchor="middle">A</text>`;

            // Phase B (150)
            const bx = cx + Math.cos(150 * Math.PI / 180) * radius;
            const by = cy + Math.sin(150 * Math.PI / 180) * radius;
            const bx_comp = cx + Math.cos(150 * Math.PI / 180) * 70;
            const by_comp = cy + Math.sin(150 * Math.PI / 180) * 70;
            elements += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(150 * Math.PI / 180) * 40}" y2="${cy + Math.sin(150 * Math.PI / 180) * 40}" class="wire" />`;
            elements += drawComponent(bx_comp, by_comp, 150);
            elements += `<line x1="${cx + Math.cos(150 * Math.PI / 180) * 100}" y1="${cy + Math.sin(150 * Math.PI / 180) * 100}" x2="${bx}" y2="${by}" class="wire" />`;
            elements += `<text x="${bx - 15}" y="${by + 10}" class="label" text-anchor="middle">B</text>`;

            // Phase C (30)
            const cx_pos = cx + Math.cos(30 * Math.PI / 180) * radius;
            const cy_pos = cy + Math.sin(30 * Math.PI / 180) * radius;
            const cx_comp = cx + Math.cos(30 * Math.PI / 180) * 70;
            const cy_comp = cy + Math.sin(30 * Math.PI / 180) * 70;
            elements += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(30 * Math.PI / 180) * 40}" y2="${cy + Math.sin(30 * Math.PI / 180) * 40}" class="wire" />`;
            elements += drawComponent(cx_comp, cy_comp, 30);
            elements += `<line x1="${cx + Math.cos(30 * Math.PI / 180) * 100}" y1="${cy + Math.sin(30 * Math.PI / 180) * 100}" x2="${cx_pos}" y2="${cy_pos}" class="wire" />`;
            elements += `<text x="${cx_pos + 15}" y="${cy_pos + 10}" class="label" text-anchor="middle">C</text>`;

        } else {
            // Delta
            const side = 180;
            const h = side * Math.sqrt(3) / 2;
            const ax = cx; const ay = cy - h / 2 - 20;
            const bx = cx - side / 2; const by = cy + h / 2 - 20;
            const cx_node = cx + side / 2; const cy_node = cy + h / 2 - 20;

            // Nodes
            elements += `<circle cx="${ax}" cy="${ay}" r="3" class="node" /> <text x="${ax}" y="${ay - 15}" class="label" text-anchor="middle">A</text>`;
            elements += `<circle cx="${bx}" cy="${by}" r="3" class="node" /> <text x="${bx - 15}" y="${by + 5}" class="label" text-anchor="middle">B</text>`;
            elements += `<circle cx="${cx_node}" cy="${cy_node}" r="3" class="node" /> <text x="${cx_node + 15}" y="${cy_node + 5}" class="label" text-anchor="middle">C</text>`;

            const ab_mid_x = (ax + bx) / 2; const ab_mid_y = (ay + by) / 2;
            elements += drawComponent(ab_mid_x, ab_mid_y, -60);
            // Connect
            const ab_p = ab_mid_x + 15, ab_q = ab_mid_y - 25.98;
            const ab_r = ab_mid_x - 15, ab_s = ab_mid_y + 25.98;
            elements += `<line x1="${ax}" y1="${ay}" x2="${ab_p}" y2="${ab_q}" class="wire" /> <line x1="${bx}" y1="${by}" x2="${ab_r}" y2="${ab_s}" class="wire" />`;

            const ac_mid_x = (ax + cx_node) / 2; const ac_mid_y = (ay + cy_node) / 2;
            elements += drawComponent(ac_mid_x, ac_mid_y, 60);
            const ac_p = ac_mid_x + 15, ac_q = ac_mid_y + 25.98;
            const ac_r = ac_mid_x - 15, ac_s = ac_mid_y - 25.98;
            elements += `<line x1="${ax}" y1="${ay}" x2="${ac_r}" y2="${ac_s}" class="wire" /> <line x1="${cx_node}" y1="${cy_node}" x2="${ac_p}" y2="${ac_q}" class="wire" />`;

            const bc_mid_x = cx; const bc_mid_y = by;
            elements += drawComponent(bc_mid_x, bc_mid_y, 0);
            elements += `<line x1="${bx}" y1="${by}" x2="${bc_mid_x - 30}" y2="${by}" class="wire" /> <line x1="${cx_node}" y1="${cy_node}" x2="${bc_mid_x + 30}" y2="${by}" class="wire" />`;
        }

        // Info Box with parsed HTML for subscripts
        // Can't use HTML in SVG text easily without foreignObject or tspans.
        // We will use tspan for key elements

        let titleLine = "";
        // Convert "Source V<sub>phase</sub>" to SVG safe text
        // Plain text: "Source V_phase"
        // Or tspans.

        // Regex to parse the prompt text `voltText` which has <sub> tags
        // Simplify for SVG visual:
        const cleanVoltText = voltText.replace("<sub>", "_").replace("</sub>", "");
        // Or manually reconstruct

        elements += `
            <rect x="10" y="10" width="220" height="90" rx="5" fill="none" stroke="#ddd" />
            <text x="20" y="30" class="title">Source: ${sourceConfig}</text>
            <text x="20" y="50" class="title">${cleanVoltText}</text>
            <text x="20" y="70" class="label" font-size="12">Load: ${loadConfig}</text>
            <text x="20" y="90" class="label" font-size="11" fill="#666">${compValStr.replace(/<sub>/g, '').replace(/<\/sub>/g, '')}</text>
        `;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white" />${style}${elements}</svg>`;
    }
};
