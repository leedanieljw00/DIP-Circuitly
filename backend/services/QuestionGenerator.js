/**
 * Dynamic Question Generator for Topic 8: Three-Phase Circuits
 * Adapted from frontend ThreePhaseCircuitGenerator.js
 */

const QuestionGenerator = {
    generateBatch: function (count = 15) {
        const questions = [];
        for (let i = 0; i < count; i++) {
            questions.push(this.generateOne());
        }
        return questions;
    },

    generateOne: function () {
        const rand = Math.random();
        let scenario = "";

        if (rand < 0.35) scenario = 'FILTER';
        else if (rand < 0.60) scenario = 'DELTA_DELTA';
        else if (rand < 0.85) scenario = 'WYE_WYE';
        else scenario = 'MIXED';

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
            if (Math.random() < 0.5) {
                sourceConfig = 'Wye'; loadConfig = 'Delta';
            } else {
                sourceConfig = 'Delta'; loadConfig = 'Wye';
            }
        }

        const inputTypes = ['Line', 'Phase'];
        const inputType = inputTypes[Math.floor(Math.random() * inputTypes.length)];
        const baseVolts = 100 + Math.floor(Math.random() * 41) * 10;

        let V_source_phase = 0;
        let V_line = 0;
        let voltagePrompText = "";

        if (inputType === 'Line') {
            V_line = baseVolts;
            voltagePrompText = `V_line = ${V_line}V`;
        } else {
            V_source_phase = baseVolts;
            voltagePrompText = `Source V_phase = ${V_source_phase}V`;
            if (sourceConfig === 'Wye') {
                V_line = V_source_phase * Math.sqrt(3);
            } else {
                V_line = V_source_phase;
            }
        }

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

        const val1 = 10 + Math.floor(Math.random() * 20);
        const val2 = 10 + Math.floor(Math.random() * 20);
        const val3 = 10 + Math.floor(Math.random() * 20);

        if (loadType === 'R') {
            R = val1; Z_mag = R; componentValueStr = `R=${R}Ω`;
        } else if (loadType === 'L') {
            XL = val1; Z_mag = XL; componentValueStr = `XL=${XL}Ω`;
        } else if (loadType === 'C') {
            XC = val1; Z_mag = XC; componentValueStr = `XC=${XC}Ω`;
        } else if (loadType === 'RL_Series') {
            R = val1; XL = val2; Z_mag = Math.sqrt(R * R + XL * XL);
            componentValueStr = `R=${R}Ω, XL=${XL}Ω`;
        } else if (loadType === 'RC_Series') {
            R = val1; XC = val2; Z_mag = Math.sqrt(R * R + XC * XC);
            componentValueStr = `R=${R}Ω, XC=${XC}Ω`;
        } else if (loadType === 'RL_Parallel') {
            R = val1; XL = val2;
            const Y = Math.sqrt(Math.pow(1 / R, 2) + Math.pow(1 / XL, 2));
            Z_mag = 1 / Y;
            componentValueStr = `R=${R}Ω, XL=${XL}Ω`;
        } else if (loadType === 'RC_Parallel') {
            R = val1; XC = val2;
            const Y = Math.sqrt(Math.pow(1 / R, 2) + Math.pow(1 / XC, 2));
            Z_mag = 1 / Y;
            componentValueStr = `R=${R}Ω, XC=${XC}Ω`;
        } else if (loadType === 'RLC_Series') {
            R = val1; XL = val2; XC = val3;
            Z_mag = Math.sqrt(R * R + Math.pow(XL - XC, 2));
            componentValueStr = `R=${R}Ω, XL=${XL}Ω, XC=${XC}Ω`;
        } else if (loadType === 'RLC_Parallel') {
            R = val1; XL = val2; XC = val3;
            const G = 1 / R;
            const B = (1 / XC) - (1 / XL);
            const Y = Math.sqrt(G * G + B * B);
            Z_mag = 1 / Y;
            componentValueStr = `R=${R}Ω, XL=${XL}Ω, XC=${XC}Ω`;
        }

        let I_line = 0;
        let V_load_phase = 0;
        let explanation = "";
        let sourceExp = "";

        if (inputType === 'Phase') {
            if (sourceConfig === 'Wye') {
                sourceExp = `Source is Wye: V_line = √3 × V_source,phase = √3 × ${V_source_phase} ≈ ${V_line.toFixed(1)}V. `;
            } else {
                sourceExp = `Source is Delta: V_line = V_source,phase = ${V_line.toFixed(1)}V. `;
            }
        } else {
            sourceExp = `Given V_line = ${V_line}V. `;
        }

        if (loadConfig === 'Wye') {
            V_load_phase = V_line / Math.sqrt(3);
            I_line = V_load_phase / Z_mag;
            explanation = `${sourceExp}\nStep 1: Load is Wye connected.\nStep 2: V_load,phase = V_line / √3 = ${V_line.toFixed(1)} / √3 ≈ ${V_load_phase.toFixed(1)}V.\nStep 3: |Z| = ${Z_mag.toFixed(1)}Ω.\nStep 4: I_line = I_phase = V_load,phase / |Z| ≈ ${I_line.toFixed(1)}A.`;
        } else {
            V_load_phase = V_line;
            const I_phase = V_load_phase / Z_mag;
            I_line = I_phase * Math.sqrt(3);
            explanation = `${sourceExp}\nStep 1: Load is Delta connected.\nStep 2: V_load,phase = V_line = ${V_load_phase.toFixed(1)}V.\nStep 3: |Z| = ${Z_mag.toFixed(1)}Ω, I_phase = V_load,phase / |Z| ≈ ${I_phase.toFixed(1)}A.\nStep 4: I_line = I_phase × √3 ≈ ${I_line.toFixed(1)}A.`;
        }

        const answerVal = I_line.toFixed(1);
        const options = this.generateOptions(I_line, answerVal);
        const svg = this.generateSVG(sourceConfig, loadConfig, loadType, componentValueStr, voltagePrompText);

        return {
            topic_id: 8,
            prompt: `System: ${sourceConfig}-Source feeding ${loadConfig}-Load. Calculate Line Current.`,
            option_a: options[0],
            option_b: options[1],
            option_c: options[2],
            answer: answerVal,
            explanation: `${explanation} I_line = ${answerVal}A.`,
            image_url: svg
        };
    },

    generateFilterCLR: function () {
        const V_in = 100 + Math.floor(Math.random() * 20) * 10;
        const R = 10 + Math.floor(Math.random() * 20);
        const XL = 10 + Math.floor(Math.random() * 20);
        const XC = 10 + Math.floor(Math.random() * 20);

        const denom = R * R + XL * XL;
        const R_p = (R * XL * XL) / denom;
        const X_p = (R * R * XL) / denom;

        const R_tot = R_p;
        const X_tot = X_p - XC;
        const Z_tot_mag = Math.sqrt(R_tot * R_tot + X_tot * X_tot);

        const I_in = V_in / Z_tot_mag;
        const answerVal = I_in.toFixed(1);
        const options = this.generateOptions(I_in, answerVal);

        const explanation = `1. Load Parallel Impedance (L||R): Zp = (jXL × R) / (R + jXL).\n2. Series Equiv: Rp = ${R_p.toFixed(1)}Ω, Xp = ${X_p.toFixed(1)}Ω.\n3. Total Z = Rp + j(Xp - XC) → |Z| = ${Z_tot_mag.toFixed(1)}Ω.\n4. Current: I = V / |Z| = ${answerVal}A.`;

        // Filter SVG simplified logic (returning a base64 placeholder for now or minimal SVG)
        const svg = "IMAGE_FILTER_PLACEHOLDER";

        return {
            topic_id: 8,
            prompt: `Calculate the Input Current magnitude |I_in| for this single-phase filter circuit. (Vin=${V_in}V, R=${R}Ω, XL=${XL}Ω, XC=${XC}Ω)`,
            option_a: options[0],
            option_b: options[1],
            option_c: options[2],
            answer: answerVal,
            explanation: explanation,
            image: null
        };
    },

    generateOptions: function (correctVal, answerStr) {
        const options = new Set();
        options.add(answerStr);
        while (options.size < 3) {
            let offset = (Math.random() - 0.5) * (correctVal * 0.4);
            let val = (correctVal + offset).toFixed(1);
            if (val > 0 && val !== answerStr) options.add(val);
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    },

    generateSVG: function (sourceConfig, loadConfig, loadType, compValStr, voltText) {
        // Return null or a simple description for now, as full SVG generation in Node is tedious
        // Better: Return the parameters so the frontend can render it, OR return the raw SVG string.
        return null;
    }
};

module.exports = QuestionGenerator;
