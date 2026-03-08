window.TestCircuitGenerator = {
    generate: function (subTopic) {
        if (!subTopic) {
            const allTopics = [
                'kirchhoff', 'dc_eq_res', 'dc_circuits', 'dc_thevenin', 'dc_mna', 'dc_two_port',
                'ac_imp', 'ac_circuits', 'ac_thevenin', 'ac_power', 'ac_multi', 'first_order',
                'transfer_func', 'impulse', 'natural_freq', 'bode', 'state_eq', 'trans_no_ic',
                'trans_ic_dc', 'gen_trans', 'mna_lti', 'lti_two_port', 'op_amp'
            ];
            subTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
        }
        console.log("Generating circuit for subtopic:", subTopic);

        switch (subTopic) {
            case 'kirchhoff':
                return this.generateKirchhoff();
            case 'dc_eq_res':
                return this.generateDCEquivalent();
            case 'dc_circuits':
                return this.generateDCCircuits();
            case 'dc_thevenin':
                return this.generateDCThevenin();
            case 'dc_mna':
                return this.generateDCMNA();
            case 'dc_two_port':
                return this.generateDCTwoPort();
            case 'ac_imp':
                return this.generateACImpedance();
            case 'ac_circuits':
                return this.generateACCircuits();
            case 'ac_thevenin':
                return this.generateACThevenin();
            case 'ac_power':
                return this.generateACPower();
            case 'ac_multi':
                return this.generateACMultiFreq();
            case 'first_order':
                return this.generateFirstOrder();
            case 'transfer_func':
                return this.generateTransferFunc();
            case 'impulse':
                return this.generateImpulseResponse();
            case 'natural_freq':
                return this.generateNaturalFreq();
            case 'bode':
                return this.generateBode();
            case 'state_eq':
                return this.generateStateEq();
            case 'trans_no_ic':
                return this.generateTransientNoIC();
            case 'trans_ic_dc':
                return this.generateTransientICDC();
            case 'gen_trans':
                return this.generateGeneralTransients();
            case 'mna_lti':
                return this.generateMNALTI();
            case 'lti_two_port':
                return this.generateLTITwoPort();
            // Add other cases here...
            case 'op_amp':
            default:
                return this.generateOpAmp(subTopic); // Pass subTopic for prefix if needed
        }
    },

    // ==========================================
    // COMPLEX MATH HELPER
    // ==========================================
    Complex: {
        add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
        sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
        mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
        div: (a, b) => {
            const denom = b.re * b.re + b.im * b.im;
            return {
                re: (a.re * b.re + a.im * b.im) / denom,
                im: (a.im * b.re - a.re * b.im) / denom
            };
        },
        mag: (a) => Math.sqrt(a.re * a.re + a.im * a.im),
        angle: (a) => Math.atan2(a.im, a.re) * (180 / Math.PI), // Degrees
        toString: (a) => {
            const re = a.re.toFixed(2);
            const im = Math.abs(a.im).toFixed(2);
            const sign = a.im >= 0 ? '+' : '-';
            return `${re} ${sign} j${im}`;
        },
        fromPolar: (mag, angleDeg) => {
            const rad = angleDeg * (Math.PI / 180);
            return { re: mag * Math.cos(rad), im: mag * Math.sin(rad) };
        }
    },

    // ==========================================
    // 7. AC IMPEDANCE
    // ==========================================
    generateACImpedance: function () {
        // Series R-L-C
        const R = 10 * (Math.floor(Math.random() * 5) + 1);
        const XL = 10 * (Math.floor(Math.random() * 5) + 1);
        const XC = 10 * (Math.floor(Math.random() * 5) + 1);

        // Z = R + j(XL - XC)
        const Z_re = R;
        const Z_im = XL - XC;

        const answerVal = `${Z_re}${Z_im >= 0 ? '+' : '-'}j${Math.abs(Z_im)}`;
        const prompt = `[AC IMPEDANCE] Calculate the equivalent impedance <b>Z<sub>eq</sub></b> in rectangular form (R + jX).`;
        const explanation = `Components are in series.<br>Z = R + j(X<sub>L</sub> - X<sub>C</sub>) = ${R} + j(${XL} - ${XC}) = ${answerVal} Ω.`;

        const svg = this.generateACImpSVG(R, XL, XC);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateACImpSVG: function (R, XL, XC) {
        const w = 600, h = 300;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5"; // Resistor
        const lPathH = "l 5 -5 q 5 -5 10 0 q 5 -5 10 0 q 5 -5 10 0 l 5 5"; // Inductor coils (approx)
        const cPathH = "m 15 0 l 0 -10 m 10 0 l 0 20 m -10 0 l 0 -10 m 10 -10 l 0 20"; // Capacitor (custom simple)
        const cPathSimple = "m 0 -10 l 0 20 m 10 -20 l 0 20"; // Parallel plates

        const lPath = "m 0 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0"; // Better coils

        let els = `
            <g transform="scale(1.5)">
            <text x="10" y="80" class="comp-text">Zeq?</text>
            <circle cx="50" cy="100" r="4" fill="white" stroke="black" />
            <circle cx="50" cy="200" r="4" fill="white" stroke="black" />
            
            <line x1="54" y1="100" x2="100" y2="100" class="wire" />
            
            <!-- R -->
            <g transform="translate(100, 100)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="110" y="80" class="comp-text">R=${R}</text>
            <line x1="132.5" y1="100" x2="180" y2="100" class="wire" />
            
            <!-- L -->
            <g transform="translate(180, 100)"><path d="${lPath}" class="wire" fill="none"/></g>
            <text x="190" y="80" class="comp-text">j${XL}</text>
            <line x1="220" y1="100" x2="260" y2="100" class="wire" />
            
            <!-- C -->
            <line x1="260" y1="100" x2="270" y2="100" class="wire" />
            <line x1="270" y1="90" x2="270" y2="110" class="wire" />
            <line x1="280" y1="90" x2="280" y2="110" class="wire" />
            <line x1="280" y1="100" x2="290" y2="100" class="wire" />
            <text x="265" y="80" class="comp-text">-j${XC}</text>
            
            <line x1="290" y1="100" x2="320" y2="100" class="wire" />
            <line x1="320" y1="100" x2="320" y2="200" class="wire" />
            <line x1="320" y1="200" x2="54" y2="200" class="wire" />
            </g>
         `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },


    // ==========================================
    // 8. AC CIRCUITS (Ohm's Law)
    // ==========================================
    generateACCircuits: function () {
        // V source (Polar) -> Impedance Z (Rect) -> Calculate I (Polar)
        const Vmag = 100 + Math.floor(Math.random() * 10) * 10;
        const Vang = 0; // Reference

        const R = 20 + Math.floor(Math.random() * 20);
        const X = 20 + Math.floor(Math.random() * 20); // Inductive

        // Z = R + jX
        const Z = { re: R, im: X };
        const V = { re: Vmag, im: 0 };

        // I = V / Z
        const I = this.Complex.div(V, Z);
        const Imag = this.Complex.mag(I).toFixed(2);
        const Tang = this.Complex.angle(I).toFixed(1);

        const answerVal = `${Imag}∠${Tang}°`;
        const prompt = `[AC CIRCUITS] A voltage source V = ${Vmag}∠0° V is connected to an impedance Z = ${R} + j${X} Ω. Calculate the current <b>I</b> in polar form.`;
        const explanation = `
            <strong>Step 1:</strong> Convert Z to polar (optional) or use complex division.<br>
            Z = ${R} + j${X} Ω.<br>
            I = V / Z = (${Vmag} + j0) / (${R} + j${X}).<br>
            Magnitude |I| = |V|/|Z| = ${Vmag} / √(${R}² + ${X}²) = ${Imag} A.<br>
            Angle ∠I = ∠V - ∠Z = 0 - atan(${X}/${R}) = ${Tang}°.
        `;

        const svg = this.generateACSourceSVG(Vmag, R, X);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateACSourceSVG: function (V, R, X) {
        const w = 600, h = 400;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const lPath = "m 0 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0";

        let els = `
           <g transform="scale(1.5)">
           <!-- AC Source -->
           <circle cx="50" cy="150" r="15" fill="white" stroke="black" stroke-width="2" />
           <path d="M 40 150 q 5 -10 10 0 q 5 10 10 0" fill="none" stroke="black" />
           <text x="10" y="185" class="comp-text">V=${V}∠0°</text>
           
           <line x1="50" y1="135" x2="50" y2="100" class="wire" />
           <line x1="50" y1="165" x2="50" y2="200" class="wire" />
           
           <!-- Top -->
           <line x1="50" y1="100" x2="100" y2="100" class="wire" />
           
           <!-- Z (Box) -->
           <rect x="100" y="85" width="80" height="30" fill="white" stroke="black" stroke-width="2" />
           <text x="110" y="105" class="comp-text">Z=${R}+j${X}</text>
           
           <line x1="180" y1="100" x2="230" y2="100" class="wire" />
           <line x1="230" y1="100" x2="230" y2="200" class="wire" />
           <line x1="230" y1="200" x2="50" y2="200" class="wire" />
           </g>
        `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 9. AC THEVENIN
    // ==========================================
    generateACThevenin: function () {
        // V source (100<0) -> Z1 -> Node A -> Z2 -> Gnd.
        // Find Vth at Node A (Open circuit across Z2)
        // Vth = V * Z2 / (Z1 + Z2)

        const Vmag = 100;
        const Z1 = { re: 10, im: 10 }; // 10+j10
        const Z2 = { re: 10, im: -10 }; // 10-j10 (Series resonance? Denom becomes real 20)

        // Z1+Z2 = 20 + j0 = 20.
        // Vth = 100 * (10-j10) / 20 = 5 * (10-j10) = 50 - j50.

        const answerVal = "50-j50";
        const prompt = `[AC THEVENIN] Calculate <b>V<sub>th</sub></b> (Thevenin Voltage) across the load terminals A-B (parallel to Z2).<br>V = 100∠0° V, Z1 = 10+j10 Ω, Z2 = 10-j10 Ω.`;
        const explanation = `
            V<sub>th</sub> is the voltage across Z2 (Voltage Divider).<br>
            V<sub>th</sub> = V × Z2 / (Z1 + Z2).<br>
            Z1 + Z2 = (10+j10) + (10-j10) = 20 Ω (Real).<br>
            V<sub>th</sub> = 100 × (10-j10) / 20 = 5 × (10-j10) = ${answerVal} V.
        `;

        const svg = this.generateACTheveninSVG();
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateACTheveninSVG: function () {
        const w = 600, h = 400;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        let els = `
           <g transform="scale(1.5)">
           <circle cx="50" cy="150" r="15" fill="white" stroke="black" stroke-width="2" />
           <path d="M 40 150 q 5 -10 10 0 q 5 10 10 0" fill="none" stroke="black" />
           <text x="10" y="185" class="comp-text">V=100∠0°</text>
           
           <line x1="50" y1="135" x2="50" y2="100" class="wire" />
           <line x1="50" y1="165" x2="50" y2="200" class="wire" />
           
           <!-- Z1 -->
           <rect x="70" y="90" width="60" height="20" fill="white" stroke="black" />
           <text x="75" y="85" class="comp-text">Z1</text>
           <line x1="50" y1="100" x2="70" y2="100" class="wire" />
           <line x1="130" y1="100" x2="180" y2="100" class="wire" />
           
           <!-- Z2 (Shunt) -->
           <rect x="170" y="125" width="20" height="50" fill="white" stroke="black" />
           <text x="195" y="150" class="comp-text">Z2</text>
           <line x1="180" y1="100" x2="180" y2="125" class="wire" />
           <line x1="180" y1="175" x2="180" y2="200" class="wire" />
           
           <line x1="180" y1="200" x2="50" y2="200" class="wire" />
           
           <!-- Terminals -->
           <line x1="180" y1="100" x2="250" y2="100" class="wire" />
           <circle cx="250" cy="100" r="3" fill="white" stroke="black" />
           <text x="260" y="105" class="comp-text">A</text>
           
           <line x1="180" y1="200" x2="250" y2="200" class="wire" />
           <circle cx="250" cy="200" r="3" fill="white" stroke="black" />
           <text x="260" y="205" class="comp-text">B</text>
           </g>
        `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 10. AC POWER
    // ==========================================
    generateACPower: function () {
        // V (RMS) -> Z -> S = V*conj(I) = |V|^2 / conj(Z)
        // Let's keep it simple.
        // Z = 3 + j4. Vrms = 100.
        // |Z| = 5. I = 20.
        // S = V * I = 100 * 20 = 2000 VA.
        // P = I^2 R = 400 * 3 = 1200 W.
        // Q = I^2 X = 400 * 4 = 1600 VAR.

        const R = 3, X = 4;
        const Vrms = 100;

        const type = Math.random() < 0.5 ? 'P' : 'Q';
        let answerVal, prompt, explanation;

        if (type === 'P') {
            answerVal = "1200";
            prompt = `[AC POWER] A load Z = 3 + j4 Ω is connected to V<sub>rms</sub> = 100V. Calculate the <b>Real Power (P)</b> delivered to the load.`;
            explanation = `
                |Z| = √(3² + 4²) = 5 Ω.<br>
                I<sub>rms</sub> = V / |Z| = 100 / 5 = 20 A.<br>
                P = I² × R = 20² × 3 = 400 × 3 = 1200 W.
            `;
        } else {
            answerVal = "1600";
            prompt = `[AC POWER] A load Z = 3 + j4 Ω is connected to V<sub>rms</sub> = 100V. Calculate the <b>Reactive Power (Q)</b>.`;
            explanation = `
                |Z| = 5 Ω, I = 20 A.<br>
                Q = I² × X = 20² × 4 = 400 × 4 = 1600 VAR.
            `;
        }

        const svg = this.generateACSourceSVG(100, 3, 4);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    // ==========================================
    // 11. AC MULTI-FREQ
    // ==========================================
    generateACMultiFreq: function () {
        // Source v(t) = 10 + 10cos(10t)
        // Inductor L=1H. Find impedance at w=10.
        // Or find Inductor voltage at DC.

        const w = 10;
        const L = 2; // H

        const answerVal = (w * L).toString();
        const prompt = `[AC MULTI-FREQ] A source v(t) = 10 + 5cos(${w}t) is connected to an inductor L=${L}H. What is the magnitude of the inductor's impedance at the fundamental frequency ω=${w} rad/s?`;
        const explanation = `
            At ω = ${w} rad/s, the impedance of an inductor is Z = jωL.<br>
            Magnitude |Z| = ωL = ${w} × ${L} = ${answerVal} Ω.<br>
            (Note: At DC component, ω=0, so Z=0).
        `;

        const svg = this.generateACSourceSVG("v(t)", 0, `(L=${L}H)`); // Reuse SVG
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    // ==========================================
    // 3. DC CIRCUITS (Ladder Network)
    // ==========================================
    generateDCCircuits: function () {
        // Simple resistive ladder R1-R2-R3
        // Vsource -> R1 -> Node A -> R2 (down to gnd) -> R3 -> Node B -> R4 (down to gnd)

        const V = (Math.floor(Math.random() * 5) + 1) * 10;
        const R1 = 10, R2 = 20, R3 = 10, R4 = 20; // Keep simple for mental math

        // Solve right to left? No, let's solve node voltages.
        // Node B is just voltage divider from Node A if we replace left part?
        // Actually, let's do a simpler "Bridge" or just "Mesh"
        // Let's do a Bridge Balanced/Unbalanced check?
        // Let's do a "Voltage Divider Loaded"
        // V -> R1 -> Node A -> (R2 || R3) -> Gnd

        const Ra = 10 * (Math.floor(Math.random() * 9) + 1);
        const Rb = 10 * (Math.floor(Math.random() * 9) + 1);
        const Rc = Rb; // R2=R3 for simplicity

        // Rp = Rb || Rc = Rb/2
        const Rp = Rb / 2;
        const Rtotal = Ra + Rp;
        const I = V / Rtotal;
        const Va = I * Rp;

        const answerVal = Va.toFixed(2);

        const prompt = `[DC CIRCUITS] In the circuit shown, calculate the node voltage <b>V<sub>A</sub></b> (voltage across R2).`;
        const explanation = `
            <strong>Step 1:</strong> Identify parallel resistors R2 and R3.<br>
            R<sub>p</sub> = R2 || R3 = ${Rb} || ${Rc} = ${Rp} Ω.<br>
            <strong>Step 2:</strong> Use Voltage Divider Rule.<br>
            V<sub>A</sub> = V × (R<sub>p</sub> / (R1 + R<sub>p</sub>)) = ${V} × (${Rp} / (${Ra} + ${Rp})) = ${answerVal} V.
        `;

        const svg = this.generateDCCircuitsSVG(V, Ra, Rb, Rc);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateDCCircuitsSVG: function (V, R1, R2, R3) {
        const w = 600, h = 400;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const rPathV = "l -5 5 l 10 5 l -10 5 l 10 5 l -10 5 l 10 5 l -5 2.5";

        let els = `
            <g transform="scale(1.5)">
            <!-- Source -->
            <rect x="40" y="135" width="20" height="30" fill="white" />
            <circle cx="50" cy="140" r="3" fill="none" stroke="black" />
            <line x1="50" y1="145" x2="50" y2="155" stroke="black" stroke-width="2" />
            <text x="10" y="155" class="comp-text">V=${V}</text>
            <line x1="50" y1="120" x2="50" y2="80" class="wire" />
            <line x1="50" y1="170" x2="50" y2="220" class="wire" />
            
            <!-- Top Wire R1 -->
            <line x1="50" y1="80" x2="100" y2="80" class="wire" />
            <g transform="translate(100, 80)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="115" y="65" class="comp-text">R1=${R1}</text>
            <line x1="132.5" y1="80" x2="200" y2="80" class="wire" />
            
            <!-- Node A -->
            <circle cx="200" cy="80" r="4" fill="black" />
            <text x="195" y="60" class="comp-text" fill="blue">A</text>
            
            <!-- R2 Down -->
            <line x1="200" y1="80" x2="200" y2="120" class="wire" />
            <g transform="translate(200, 120)"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="215" y="140" class="comp-text">R2=${R2}</text>
            <line x1="200" y1="152.5" x2="200" y2="220" class="wire" />
            
            <!-- R3 Parallel (Far Right) -->
            <line x1="200" y1="80" x2="300" y2="80" class="wire" />
            <line x1="300" y1="80" x2="300" y2="120" class="wire" />
            <g transform="translate(300, 120)"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="315" y="140" class="comp-text">R3=${R3}</text>
            <line x1="300" y1="152.5" x2="300" y2="220" class="wire" />
            <line x1="300" y1="220" x2="50" y2="220" class="wire" />
            </g>
         `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },


    // ==========================================
    // 4. DC THEVENIN (Source Transformation)
    // ==========================================
    generateDCThevenin: function () {
        // Vsource, R1 series, R2 parallel.
        // Terminals across R2.
        const V = (Math.floor(Math.random() * 4) + 2) * 10;
        const R1 = 10 * (Math.floor(Math.random() * 5) + 1);
        const R2 = 10 * (Math.floor(Math.random() * 5) + 1);

        // Vth = V * R2/(R1+R2)
        // Rth = R1 || R2

        // Let's ask for Vth OR Rth randomly
        const askVth = Math.random() < 0.5;

        let answerVal, prompt, explanation;

        if (askVth) {
            const Vth = V * (R2 / (R1 + R2));
            answerVal = Vth.toFixed(2);
            prompt = `[DC THEVENIN] Calculate the Thevenin Voltage <b>V<sub>th</sub></b> seen from terminals A-B.`;
            explanation = `V<sub>th</sub> is the open-circuit voltage at A-B.<br>This is a voltage divider: V<sub>th</sub> = V × R2/(R1+R2) = ${V}×${R2}/(${R1}+${R2}) = ${answerVal}V.`;
        } else {
            const Rth = (R1 * R2) / (R1 + R2);
            answerVal = Rth.toFixed(1);
            prompt = `[DC THEVENIN] Calculate the Thevenin Resistance <b>R<sub>th</sub></b> seen from terminals A-B.`;
            explanation = `R<sub>th</sub> is found by turning off the voltage source (short circuit).<br>Then R1 is in parallel with R2.<br>R<sub>th</sub> = R1 || R2 = (${R1}×${R2})/(${R1}+${R2}) = ${answerVal}Ω.`;
        }

        const svg = this.generateDCTheveninSVG(V, R1, R2);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateDCTheveninSVG: function (V, R1, R2) {
        const w = 600, h = 400;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; } .term { font-size:16px; fill:red; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const rPathV = "l -5 5 l 10 5 l -10 5 l 10 5 l -10 5 l 10 5 l -5 2.5";

        let els = `
            <g transform="scale(1.5)">
            <!-- Source -->
            <rect x="40" y="135" width="20" height="30" fill="white" />
            <circle cx="50" cy="140" r="3" fill="none" stroke="black" />
            <line x1="50" y1="145" x2="50" y2="155" stroke="black" stroke-width="2" />
            <text x="10" y="155" class="comp-text">V=${V}</text>
            <line x1="50" y1="120" x2="50" y2="80" class="wire" />
            <line x1="50" y1="170" x2="50" y2="220" class="wire" />
            
            <!-- R1 Series -->
            <line x1="50" y1="80" x2="100" y2="80" class="wire" />
            <g transform="translate(100, 80)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="115" y="65" class="comp-text">R1=${R1}</text>
            <line x1="132.5" y1="80" x2="200" y2="80" class="wire" />
            
            <!-- R2 Parallel -->
            <line x1="200" y1="80" x2="200" y2="120" class="wire" />
            <g transform="translate(200, 120)"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="215" y="140" class="comp-text">R2=${R2}</text>
            <line x1="200" y1="152.5" x2="200" y2="220" class="wire" />
            <line x1="200" y1="220" x2="50" y2="220" class="wire" />
            
            <!-- Terminals A-B -->
            <line x1="200" y1="80" x2="280" y2="80" class="wire" />
            <circle cx="280" cy="80" r="4" fill="white" stroke="black" stroke-width="2" />
            <text x="290" y="85" class="term">A</text>
            
            <line x1="200" y1="220" x2="280" y2="220" class="wire" />
            <circle cx="280" cy="220" r="4" fill="white" stroke="black" stroke-width="2" />
            <text x="290" y="225" class="term">B</text>
            </g>
         `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 5. MNA (Matrix)
    // ==========================================
    generateDCMNA: function () {
        // Two nodes 1 and 2. R1 to gnd, R2 between 1-2, R3 to gnd at 2.
        // G11 = 1/R1 + 1/R2
        // G12 = -1/R2
        // G22 = 1/R2 + 1/R3

        const R1 = 10, R2 = 20, R3 = 40;

        // Ask for G11, G12, or G22
        const type = Math.floor(Math.random() * 3);
        let answerVal, prompt, explanation;

        if (type === 0) {
            answerVal = (1 / R1 + 1 / R2).toFixed(3);
            prompt = `[DC MNA] For the circuit shown, conduct modified nodal analysis. Calculate the value of the conductance matrix element <b>G<sub>11</sub></b> (sum of conductances at Node 1).`;
            explanation = `G<sub>11</sub> is the sum of all conductances connected to Node 1.<br>G<sub>11</sub> = 1/R1 + 1/R2 = 1/${R1} + 1/${R2} = ${answerVal} S.`;
        } else if (type === 1) {
            answerVal = (-1 / R2).toFixed(3);
            prompt = `[DC MNA] Calculate the conductance matrix element <b>G<sub>12</sub></b> (coupling between Node 1 and 2).`;
            explanation = `G<sub>12</sub> is the negative sum of conductances connecting Node 1 and Node 2.<br>G<sub>12</sub> = -1/R2 = -1/${R2} = ${answerVal} S.`;
        } else {
            answerVal = (1 / R2 + 1 / R3).toFixed(3);
            prompt = `[DC MNA] Calculate the conductance matrix element <b>G<sub>22</sub></b> (sum of conductances at Node 2).`;
            explanation = `G<sub>22</sub> is the sum of all conductances connected to Node 2.<br>G<sub>22</sub> = 1/R2 + 1/R3 = 1/${R2} + 1/${R3} = ${answerVal} S.`;
        }

        const svg = this.generateDCMNASVG(R1, R2, R3);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateDCMNASVG: function (R1, R2, R3) {
        const w = 600, h = 400;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; } .node-lbl { fill:blue; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const rPathV = "l -5 5 l 10 5 l -10 5 l 10 5 l -10 5 l 10 5 l -5 2.5";

        let els = `
            <g transform="scale(1.5)">
            <!-- Node 1 -->
            <line x1="50" y1="100" x2="150" y2="100" class="wire" />
            <circle cx="100" cy="100" r="4" fill="black" />
            <text x="95" y="80" class="node-lbl">1</text>
            
            <!-- R1 (Node 1 to Gnd) -->
            <line x1="100" y1="100" x2="100" y2="140" class="wire" />
            <g transform="translate(100, 140)"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="115" y="160" class="comp-text">R1=${R1}</text>
            <line x1="100" y1="172.5" x2="100" y2="220" class="wire" />

            <!-- R2 (Node 1 to Node 2) -->
            <g transform="translate(150, 100)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="165" y="85" class="comp-text">R2=${R2}</text>
            <line x1="182.5" y1="100" x2="250" y2="100" class="wire" />

            <!-- Node 2 -->
            <circle cx="250" cy="100" r="4" fill="black" />
            <text x="245" y="80" class="node-lbl">2</text>
            
            <!-- R3 (Node 2 to Gnd) -->
            <line x1="250" y1="100" x2="250" y2="140" class="wire" />
            <g transform="translate(250, 140)"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="265" y="160" class="comp-text">R3=${R3}</text>
            <line x1="250" y1="172.5" x2="250" y2="220" class="wire" />

            <!-- Ground Line -->
            <line x1="50" y1="220" x2="300" y2="220" class="wire" />
            <line x1="175" y1="220" x2="175" y2="230" class="wire" />
            <line x1="165" y1="230" x2="185" y2="230" class="wire" /> <!-- Gnd symbol -->
            <line x1="170" y1="235" x2="180" y2="235" class="wire" />
            </g>
         `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 6. DC TWO-PORT (Z-Parameters)
    // ==========================================
    generateDCTwoPort: function () {
        // T-Network: R1(series), R2(shunt), R3(series).
        // Z11 = R1 + R2
        // Z12 = R2
        // Z21 = R2
        // Z22 = R2 + R3

        const R1 = 10, R2 = 20, R3 = 30;

        // Randomly ask for Z-param
        const params = ['Z11', 'Z12', 'Z22'];
        const p = params[Math.floor(Math.random() * 3)];

        let val, explanation;
        if (p === 'Z11') {
            val = R1 + R2;
            explanation = `Z<sub>11</sub> = V1/I1 with I2=0 (Output Open).<br>Input Impedance = R1 + R2 (series) = ${R1}+${R2} = ${val}Ω.`;
        } else if (p === 'Z12') {
            val = R2;
            explanation = `Z<sub>12</sub> = V1/I2 with I1=0 (Input Open).<br>Voltage at port 1 is voltage across R2.<br>Z<sub>12</sub> = R2 = ${val}Ω.`;
        } else {
            val = R2 + R3;
            explanation = `Z<sub>22</sub> = V2/I2 with I1=0 (Input Open).<br>Output Impedance = R3 + R2 (series) = ${R3}+${R2} = ${val}Ω.`;
        }

        const answerVal = val.toString();
        const prompt = `[DC TWO-PORT] For the T-network shown, calculate the Z-parameter <b>${p}</b>.`;

        const svg = this.generateDCTwoPortSVG(R1, R2, R3);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateDCTwoPortSVG: function (R1, R2, R3) {
        const w = 600, h = 400;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; } .port { fill:blue; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const rPathV = "l -5 5 l 10 5 l -10 5 l 10 5 l -10 5 l 10 5 l -5 2.5";

        let els = `
            <g transform="scale(1.5)">
            <!-- Port 1 -->
            <circle cx="30" cy="100" r="4" stroke="black" fill="white" />
            <circle cx="30" cy="200" r="4" stroke="black" fill="white" />
            <text x="10" y="150" class="port">Port 1</text>
            
            <!-- R1 Series -->
            <line x1="34" y1="100" x2="80" y2="100" class="wire" />
            <g transform="translate(80, 100)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="95" y="85" class="comp-text">R1=${R1}</text>
            <line x1="112.5" y1="100" x2="180" y2="100" class="wire" />
            
            <!-- R2 Shunt -->
            <line x1="180" y1="100" x2="180" y2="130" class="wire" />
            <g transform="translate(180, 130)"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="195" y="150" class="comp-text">R2=${R2}</text>
            <line x1="180" y1="162.5" x2="180" y2="200" class="wire" />
            
            <!-- R3 Series -->
            <line x1="180" y1="100" x2="230" y2="100" class="wire" />
            <g transform="translate(230, 100)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="245" y="85" class="comp-text">R3=${R3}</text>
            <line x1="262.5" y1="100" x2="320" y2="100" class="wire" />
            
            <!-- Port 2 -->
            <circle cx="320" cy="100" r="4" stroke="black" fill="white" />
            <circle cx="320" cy="200" r="4" stroke="black" fill="white" />
            <text x="330" y="150" class="port">Port 2</text>
            
            <!-- Bottom Wire -->
            <line x1="34" y1="200" x2="320" y2="200" class="wire" />
            </g>
         `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 1. KIRCHHOFF LAWS (Single Loop)
    // ==========================================
    generateKirchhoff: function () {
        // Simple Series Circuit: Vsource + R1 + R2 + R3
        // Task: Find Current I or Voltage across Rx
        const V = (Math.floor(Math.random() * 5) + 1) * 10; // 10V - 50V
        const R1 = (Math.floor(Math.random() * 9) + 1) * 10; // 10 - 90 Ohm
        const R2 = (Math.floor(Math.random() * 9) + 1) * 10;
        const R3 = (Math.floor(Math.random() * 9) + 1) * 10;

        const Rtotal = R1 + R2 + R3;
        const I = V / Rtotal;

        // Let's ask for Voltage across R2 (VR2) to make it slightly interesting (Voltage Divider)
        // VR2 = I * R2
        const VR2 = I * R2;
        const answerVal = VR2.toFixed(2);

        const prompt = `[KIRCHHOFF] In the single-loop circuit shown, calculate the voltage drop <b>V<sub>R2</sub></b> across resistor R2.`;

        const explanation = `
            <strong>Step 1:</strong> Calculate total resistance in series.<br>
            R<sub>eq</sub> = R1 + R2 + R3 = ${R1} + ${R2} + ${R3} = ${Rtotal} Ω.<br>
            <strong>Step 2:</strong> Calculate Loop Current I (Ohm's Law).<br>
            I = V / R<sub>eq</sub> = ${I.toFixed(3)} / ${Rtotal} = ${I.toFixed(3)} A.<br>
            <strong>Step 3:</strong> Calculate Voltage across R2.<br>
            V<sub>R2</sub> = I × R2 = ${I.toFixed(3)} × ${R2} = ${answerVal} V.
        `;

        // Generate SVG
        const svg = this.generateKirchhoffSVG(V, R1, R2, R3);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateKirchhoffSVG: function (V, R1, R2, R3) {
        const w = 600, h = 450; // Scaled 1.5x (400->600, 300->450)

        // Internal logic uses original coordinates (cx based on 400/300)
        // We wrap everything in scale(1.5)

        const originalW = 400;
        const originalH = 300;

        const cx = originalW / 2, cy = originalH / 2;

        // Rectangular Loop
        // Top: R1, Right: R2, Bottom: R3, Left: V
        const left = 80, right = 320, top = 50, bottom = 250;

        let path = `M ${left} ${bottom} L ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`;

        const style = `
            <style>
                .wire { fill:none; stroke:black; stroke-width:2; }
                .comp-text { font-family:sans-serif; font-size:14px; fill:#333; font-weight:bold; }
                .label { font-family:sans-serif; font-size:16px; fill:#d32f2f; font-weight:bold; }
            </style>
        `;

        // Resistor Path (Horiz)
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5"; // 32.5 width
        // Resistor Path (Vert)
        const rPathV = "l -5 5 l 10 5 l -10 5 l 10 5 l -10 5 l 10 5 l -5 2.5"; // 32.5 height

        let elements = `
            <g transform="scale(1.5)">
            <path d="${path}" class="wire" />

            <!-- Source V (Left) -->
            <rect x="${left - 10}" y="${(top + bottom) / 2 - 15}" width="20" height="30" fill="white" />
            <circle cx="${left}" cy="${(top + bottom) / 2 - 10}" r="3" fill="none" stroke="black" />
            <line x1="${left}" y1="${(top + bottom) / 2 - 5}" x2="${left}" y2="${(top + bottom) / 2 + 5}" stroke="black" stroke-width="2" />
            <text x="${left - 40}" y="${(top + bottom) / 2 + 5}" class="comp-text">V=${V}V</text>
            <text x="${left - 20}" y="${(top + bottom) / 2 - 15}" class="comp-text">+</text>
            <text x="${left - 20}" y="${(top + bottom) / 2 + 25}" class="comp-text">-</text>

            <!-- R1 (Top) -->
            <rect x="${(left + right) / 2 - 20}" y="${top - 10}" width="40" height="20" fill="white" />
            <g transform="translate(${(left + right) / 2 - 16}, ${top})"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="${(left + right) / 2}" y="${top - 15}" class="comp-text" text-anchor="middle">R1=${R1}Ω</text>

            <!-- R2 (Right, Target) -->
            <rect x="${right - 10}" y="${(top + bottom) / 2 - 20}" width="20" height="40" fill="white" />
            <g transform="translate(${right}, ${(top + bottom) / 2 - 16})"><path d="M 0 0 ${rPathV}" class="wire" /></g>
            <text x="${right + 15}" y="${(top + bottom) / 2}" class="comp-text">R2=${R2}Ω</text>
            <text x="${right + 15}" y="${(top + bottom) / 2 + 20}" class="label">(Target)</text>

            <!-- R3 (Bottom) -->
            <rect x="${(left + right) / 2 - 20}" y="${bottom - 10}" width="40" height="20" fill="white" />
            <g transform="translate(${(left + right) / 2 - 16}, ${bottom})"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="${(left + right) / 2}" y="${bottom + 20}" class="comp-text" text-anchor="middle">R3=${R3}Ω</text>
            </g>
        `;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${elements}</svg>`;
    },


    // ==========================================
    // 2. DC EQ RESISTANCE (Series-Parallel)
    // ==========================================
    generateDCEquivalent: function () {
        // Structure: R1 in Series with (R2 || R3)
        const R1 = (Math.floor(Math.random() * 9) + 1) * 10;
        const R2 = (Math.floor(Math.random() * 9) + 1) * 10;
        const R3 = R2; // Make them equal often for easier mental math, or simple ratio

        // Req = R1 + (R2*R3)/(R2+R3)
        const Rp = (R2 * R3) / (R2 + R3);
        const Req = R1 + Rp;

        const answerVal = Req.toFixed(1);

        const prompt = `[DC EQ] Calculate the equivalent resistance <b>R<sub>eq</sub></b> seen from the terminals for this circuit.`;

        const explanation = `
            <strong>Step 1:</strong> Identify Parallel combination (R2 || R3).<br>
            R<sub>p</sub> = (R2 × R3) / (R2 + R3) = (${R2} × ${R3}) / (${R2} + ${R3}) = ${Rp.toFixed(1)} Ω.<br>
            <strong>Step 2:</strong> Identify Series combination (R1 + R<sub>p</sub>).<br>
            R<sub>eq</sub> = R1 + R<sub>p</sub> = ${R1} + ${Rp.toFixed(1)} = ${Req.toFixed(1)} Ω.
        `;

        // Generate SVG
        const svg = this.generateDCEqSVG(R1, R2, R3);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateDCEqSVG: function (R1, R2, R3) {
        const w = 675, h = 375; // Scaled 1.5x (450->675, 250->375)
        const originalH = 250;
        const cy = originalH / 2; // Use original cy relative to unscaled content

        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const rPathV = "l -5 5 l 10 5 l -10 5 l 10 5 l -10 5 l 10 5 l -5 2.5";

        let els = `
            <g transform="scale(1.5)">
            <!-- Terminals -->
            <circle cx="30" cy="${cy - 40}" r="4" stroke="black" fill="white" stroke-width="2" />
            <circle cx="30" cy="${cy + 40}" r="4" stroke="black" fill="white" stroke-width="2" />
            <text x="10" y="${cy + 5}" class="comp-text">Req ?</text>

            <!-- Main Lines -->
            <line x1="34" y1="${cy - 40}" x2="100" y2="${cy - 40}" class="wire" />
            <line x1="34" y1="${cy + 40}" x2="100" y2="${cy + 40}" class="wire" />

            <!-- R1 (Series) -->
            <g transform="translate(100, ${cy - 40})"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="115" y="${cy - 55}" class="comp-text">R1=${R1}</text>
            <line x1="132.5" y1="${cy - 40}" x2="200" y2="${cy - 40}" class="wire" />

            <!-- Parallel Branch Split -->
            <!-- Redraw: 200 is node. R2 goes UP then across. R3 goes DOWN then across. -->
            <line x1="200" y1="${cy - 40}" x2="200" y2="${cy - 90}" class="wire" />
            <line x1="200" y1="${cy - 90}" x2="250" y2="${cy - 90}" class="wire" />
            <g transform="translate(250, ${cy - 90})"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="265" y="${cy - 105}" class="comp-text">R2=${R2}</text>
            <line x1="282.5" y1="${cy - 90}" x2="350" y2="${cy - 90}" class="wire" />
            <line x1="350" y1="${cy - 90}" x2="350" y2="${cy - 40}" class="wire" />

            <!-- R3 Parallel -->
            <line x1="200" y1="${cy - 40}" x2="200" y2="${cy + 10}" class="wire" />
            <line x1="200" y1="${cy + 10}" x2="250" y2="${cy + 10}" class="wire" />
            <g transform="translate(250, ${cy + 10})"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="265" y="${cy - 5}" class="comp-text">R3=${R3}</text>
            <line x1="282.5" y1="${cy + 10}" x2="350" y2="${cy + 10}" class="wire" />
            <line x1="350" y1="${cy + 10}" x2="350" y2="${cy - 40}" class="wire" />

            <!-- Return path to terminal -->
            <!-- Combine at 350, cy-40 -->
            <line x1="350" y1="${cy - 40}" x2="350" y2="${cy + 40}" class="wire" />
            <line x1="100" y1="${cy + 40}" x2="350" y2="${cy + 40}" class="wire" />
            </g>
        `;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 3. OP-AMP (Default)
    // ==========================================
    generateOpAmp: function (subTopic) {
        // Randomly choose between Inverting and Non-Inverting Op-Amp
        const type = Math.random() < 0.5 ? 'INVERTING' : 'NON_INVERTING';

        // Randomize Values
        const Vin = Math.floor(Math.random() * 5) + 1; // 1V to 5V
        const Rf = (Math.floor(Math.random() * 9) + 2) * 10; // 20k to 100k
        const Rin = 10; // 10k fixed for simplicity or random

        let Vout = 0;
        let explanation = "";
        let prompt = "";

        const prefix = subTopic ? `[${subTopic.toUpperCase()}] ` : "";

        if (type === 'INVERTING') {
            // Vout = - (Rf / Rin) * Vin
            const gain = -(Rf / Rin);
            Vout = gain * Vin;
            prompt = `${prefix}Calculate the output voltage (Vout) for this Inverting Op-Amp circuit.`;
            explanation = `<strong>Step 1:</strong> Identify the circuit as an Inverting Amplifier.<br>` +
                `<strong>Step 2:</strong> Formula: V<sub>out</sub> = -(R<sub>f</sub> / R<sub>in</sub>) × V<sub>in</sub>.<br>` +
                `<strong>Step 3:</strong> Values: R<sub>f</sub>=${Rf}kΩ, R<sub>in</sub>=${Rin}kΩ, V<sub>in</sub>=${Vin}V.<br>` +
                `<strong>Step 4:</strong> Calculation: -(${Rf}/${Rin}) × ${Vin} = ${gain} × ${Vin} = ${Vout.toFixed(1)}V.`;
        } else {
            // Non-Inverting
            // Vout = (1 + Rf / Rin) * Vin
            const gain = (1 + Rf / Rin);
            Vout = gain * Vin;
            prompt = `${prefix}Calculate the output voltage (Vout) for this Non-Inverting Op-Amp circuit.`;
            explanation = `<strong>Step 1:</strong> Identify the circuit as a Non-Inverting Amplifier.<br>` +
                `<strong>Step 2:</strong> Formula: V<sub>out</sub> = (1 + R<sub>f</sub> / R<sub>in</sub>) × V<sub>in</sub>.<br>` +
                `<strong>Step 3:</strong> Values: R<sub>f</sub>=${Rf}kΩ, R<sub>in</sub>=${Rin}kΩ, V<sub>in</sub>=${Vin}V.<br>` +
                `<strong>Step 4:</strong> Calculation: (1 + ${Rf}/${Rin}) × ${Vin} = ${gain} × ${Vin} = ${Vout.toFixed(1)}V.`;
        }

        const answerVal = Vout.toFixed(1);
        const svg = this.generateOpAmpSVG(type, Vin, Rin, Rf);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateOpAmpSVG: function (type, Vin, Rin, Rf) {
        const w = 675, h = 450; // Scaled 1.5x (450->675, 300->450)
        const originalW = 450;
        const originalH = 300;
        const cx = originalW / 2;
        const cy = originalH / 2;

        const style = `
            <style>
                .wire { fill:none; stroke:black; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
                .component { fill:none; stroke:black; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
                .label { font-family:'Nunito', sans-serif; font-size:14px; fill:#374151; font-weight:600; }
                .title { font-family:'Nunito', sans-serif; font-size:16px; fill:#111827; font-weight:700; }
                .node { fill:black; }
                .opamp { fill:white; stroke:black; stroke-width:2; }
            </style>
        `;

        const triPath = `M ${cx - 30} ${cy - 30} L ${cx - 30} ${cy + 30} L ${cx + 30} ${cy} Z`;

        let elements = `
            <g transform="scale(1.5)">
            <path d="${triPath}" class="opamp" />
            <text x="${cx - 25}" y="${cy - 8}" class="label" font-size="16">-</text>
            <text x="${cx - 25}" y="${cy + 15}" class="label" font-size="16">+</text>
        `;

        const pathR = "M -20 0 l 2.5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";

        if (type === 'INVERTING') {
            // Inverting Configuration
            // Non-inverting (+) grounded
            elements += `<line x1="${cx - 30}" y1="${cy + 10}" x2="${cx - 50}" y2="${cy + 10}" class="wire" />`;
            elements += `<line x1="${cx - 50}" y1="${cy + 10}" x2="${cx - 50}" y2="${cy + 30}" class="wire" />`;
            // Ground symbol at cx-50, cy+30
            elements += `<line x1="${cx - 60}" y1="${cy + 30}" x2="${cx - 40}" y2="${cy + 30}" class="wire" />`;
            elements += `<line x1="${cx - 55}" y1="${cy + 35}" x2="${cx - 45}" y2="${cy + 35}" class="wire" />`;

            // Inverting (-) Input
            // Rin connected to Vin
            elements += `<line x1="${cx - 30}" y1="${cy - 10}" x2="${cx - 60}" y2="${cy - 10}" class="wire" />`;

            // Draw Rin
            elements += `<g transform="translate(${cx - 80}, ${cy - 10})"><path d="${pathR}" class="component" /></g>`;
            elements += `<text x="${cx - 80}" y="${cy - 25}" class="label" text-anchor="middle">R<sub>in</sub>=${Rin}k</text>`;

            // Vin connection
            elements += `<line x1="${cx - 100}" y1="${cy - 10}" x2="${cx - 130}" y2="${cy - 10}" class="wire" />`;
            elements += `<circle cx="${cx - 130}" cy="${cy - 10}" r="3" class="wire" fill="white" />`;
            elements += `<text x="${cx - 140}" y="${cy - 5}" class="label" text-anchor="end">V<sub>in</sub>=${Vin}V</text>`;

            // Feedback Rf (from - input to output)
            // Node at - input
            elements += `<circle cx="${cx - 60}" cy="${cy - 10}" r="3" class="node" />`;
            // Up wire
            elements += `<line x1="${cx - 60}" y1="${cy - 10}" x2="${cx - 60}" y2="${cy - 60}" class="wire" />`;
            // Across
            elements += `<line x1="${cx - 60}" y1="${cy - 60}" x2="${cx + 60}" y2="${cy - 60}" class="wire" />`;
            // Rf in middle
            elements += `<g transform="translate(${cx}, ${cy - 60})"><path d="${pathR}" class="component" /></g>`;
            elements += `<text x="${cx}" y="${cy - 70}" class="label" text-anchor="middle">R<sub>f</sub>=${Rf}k</text>`;
            // Down to output
            elements += `<line x1="${cx + 60}" y1="${cy - 60}" x2="${cx + 60}" y2="${cy}" class="wire" />`;

        } else {
            // Non-Inverting Configuration
            // Inverting (-) connected to Ground via Rin
            elements += `<line x1="${cx - 30}" y1="${cy - 10}" x2="${cx - 60}" y2="${cy - 10}" class="wire" />`;
            elements += `<line x1="${cx - 60}" y1="${cy - 10}" x2="${cx - 60}" y2="${cy + 30}" class="wire" />`;
            // Rin vertical
            elements += `<g transform="translate(${cx - 60}, ${cy + 50}) rotate(90)"><path d="${pathR}" class="component" /></g>`;
            elements += `<text x="${cx - 80}" y="${cy + 55}" class="label" text-anchor="end">R<sub>in</sub>=${Rin}k</text>`;
            // To Ground
            elements += `<line x1="${cx - 60}" y1="${cy + 70}" x2="${cx - 60}" y2="${cy + 80}" class="wire" />`;
            // Ground
            elements += `<line x1="${cx - 70}" y1="${cy + 80}" x2="${cx - 50}" y2="${cy + 80}" class="wire" />`;
            elements += `<line x1="${cx - 55}" y1="${cy + 85}" x2="${cx - 45}" y2="${cy + 85}" class="wire" />`;

            // Feedback Rf (from - input measure point to Output)
            // Node at cx-60, cy-10 (wait, - input is at cy-10)
            // Up wire from - input line
            elements += `<circle cx="${cx - 60}" cy="${cy - 10}" r="3" class="node" />`;
            elements += `<line x1="${cx - 60}" y1="${cy - 10}" x2="${cx - 60}" y2="${cy - 60}" class="wire" />`;
            elements += `<line x1="${cx - 60}" y1="${cy - 60}" x2="${cx + 60}" y2="${cy - 60}" class="wire" />`;
            elements += `<g transform="translate(${cx}, ${cy - 60})"><path d="${pathR}" class="component" /></g>`;
            elements += `<text x="${cx}" y="${cy - 70}" class="label" text-anchor="middle">R<sub>f</sub>=${Rf}k</text>`;
            elements += `<line x1="${cx + 60}" y1="${cy - 60}" x2="${cx + 60}" y2="${cy}" class="wire" />`;

            // Non-Inverting (+) Input has Vin
            elements += `<line x1="${cx - 30}" y1="${cy + 10}" x2="${cx - 100}" y2="${cy + 10}" class="wire" />`;
            elements += `<circle cx="${cx - 100}" cy="${cy + 10}" r="3" class="wire" fill="white" />`;
            elements += `<text x="${cx - 110}" y="${cy + 15}" class="label" text-anchor="end">V<sub>in</sub>=${Vin}V</text>`;
        }

        // Output Terminal
        elements += `<line x1="${cx + 30}" y1="${cy}" x2="${cx + 80}" y2="${cy}" class="wire" />`;
        elements += `<circle cx="${cx + 60}" cy="${cy}" r="3" class="node" />`; // Feedback tap
        elements += `<circle cx="${cx + 80}" cy="${cy}" r="3" class="wire" fill="white" />`;
        elements += `<text x="${cx + 90}" y="${cy + 5}" class="label">V<sub>out</sub></text>`;
        elements += `</g>`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${elements}</svg>`;
    },

    // Helper: Format Question Object
    formatQuestion: function (topicId, prompt, answerVal, svgDataUri, explanation) {
        const options = new Set();
        options.add(answerVal);
        while (options.size < 4) {
            let numAnswer = parseFloat(answerVal);
            // Ensure reasonable distractors
            let offset = (Math.random() - 0.5) * (Math.abs(numAnswer) * 0.5 + 2);
            if (numAnswer === 0) offset = (Math.random() - 0.5) * 5;

            let val = (numAnswer + offset).toFixed(answerVal.includes('.') ? answerVal.split('.')[1].length : 1);
            if (val !== answerVal) options.add(val);
        }

        return {
            id: 'test_' + Date.now() + Math.random(),
            topicId: topicId,
            prompt: prompt,
            options: Array.from(options),
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: explanation
        };
    },

    // ==========================================
    // 12. FIRST-ORDER CIRCUITS (Time Constant)
    // ==========================================
    generateFirstOrder: function () {
        // RC or RL circuit. Calculate Time Constant.
        const type = Math.random() < 0.5 ? 'RC' : 'RL';
        const R = 10 * (Math.floor(Math.random() * 9) + 1); // 10-90 Ohm

        let val, unit, prompt, explanation;
        let C, L;

        if (type === 'RC') {
            C = Math.floor(Math.random() * 9) + 1; // 1-9 mF
            // tau = R * C (in seconds if Ohms * Farads)
            const C_val = C * 1e-3;
            val = (R * C_val);
            unit = 's';
            prompt = `[FIRST-ORDER] Calculate the time constant <b>τ</b> for this series RC circuit.<br>R = ${R} Ω, C = ${C} mF.`;
            explanation = `For an RC circuit, τ = R × C.<br>τ = ${R} × ${C}×10<sup>-3</sup> = ${val.toFixed(3)} s.`;
        } else {
            L = Math.floor(Math.random() * 9) + 1; // 1-9 H
            // tau = L / R
            val = L / R;
            unit = 's';
            prompt = `[FIRST-ORDER] Calculate the time constant <b>τ</b> for this series RL circuit.<br>R = ${R} Ω, L = ${L} H.`;
            explanation = `For an RL circuit, τ = L / R.<br>τ = ${L} / ${R} = ${val.toFixed(3)} s.`;
        }

        const answerVal = val.toFixed(3);
        const svg = this.generateFirstOrderSVG(type, R, type === 'RC' ? C : L);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateFirstOrderSVG: function (type, R, CL) {
        const w = 600, h = 300;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .comp-text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const lPath = "m 0 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0"; // Inductor

        let compSVG = "";
        let compLabel = "";
        if (type === 'RC') {
            // Capacitor
            compSVG = `
                <line x1="260" y1="90" x2="260" y2="110" class="wire" />
                <line x1="270" y1="90" x2="270" y2="110" class="wire" />
                <line x1="270" y1="100" x2="280" y2="100" class="wire" />
            `;
            compLabel = `C=${CL}F`;
        } else {
            // Inductor
            compSVG = `<g transform="translate(260, 100)"><path d="${lPath}" class="wire" fill="none"/></g>`;
            compLabel = `L=${CL}H`;
        }

        let els = `
            <g transform="translate(60, 20) scale(1.3)">
            <!-- Source (V0) -->
            <circle cx="50" cy="150" r="15" fill="white" stroke="black" stroke-width="2" />
            <text x="35" y="155" class="comp-text">V0</text>
            <line x1="50" y1="135" x2="50" y2="100" class="wire" />
            <line x1="50" y1="165" x2="50" y2="200" class="wire" />

            <!-- Switch -->
            <circle cx="50" cy="100" r="3" fill="black" />
            <circle cx="90" cy="100" r="3" fill="black" />
            <line x1="50" y1="100" x2="85" y2="80" class="wire" /> <!-- Switch blade (opening) -->
            <path d="M 60 90 A 20 20 0 0 1 75 95" fill="none" stroke="black" stroke-dasharray="2,2" />
            <text x="60" y="70" class="comp-text">t=0</text>
            
            <line x1="90" y1="100" x2="130" y2="100" class="wire" />

            <!-- Resistor -->
            <g transform="translate(130, 100)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="145" y="80" class="comp-text">R=${R}Ω</text>
            <line x1="162.5" y1="100" x2="260" y2="100" class="wire" />

            <!-- Comp (C or L) -->
            ${compSVG}
            <text x="265" y="80" class="comp-text">${compLabel}</text>
            
            <!-- Return path -->
            <line x1="${type === 'RC' ? 280 : 300}" y1="100" x2="320" y2="100" class="wire" />
            <line x1="320" y1="100" x2="320" y2="200" class="wire" />
            <line x1="320" y1="200" x2="50" y2="200" class="wire" />
            </g>
         `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 13. TRANSFER FUNCTIONS (Poles/Zeros)
    // ==========================================
    generateTransferFunc: function () {
        // H(s) = K / (s + p)
        // Questions: What is the Pole? What is the DC Gain?
        const p = Math.floor(Math.random() * 9) + 1; // Pole at -p
        const K = Math.floor(Math.random() * 9) + 1;

        const type = Math.random() < 0.5 ? 'POLE' : 'DC_GAIN';
        let answerVal, prompt, explanation;

        if (type === 'POLE') {
            answerVal = (-p).toString();
            prompt = `[TRANSFER FUNC] Given the transfer function H(s) = ${K} / (s + ${p}), what is the value of the pole?`;
            explanation = `The pole is the value of s that makes the denominator zero.<br>s + ${p} = 0  =>  s = -${p}.`;
        } else {
            answerVal = (K / p).toFixed(2);
            prompt = `[TRANSFER FUNC] Given the transfer function H(s) = ${K} / (s + ${p}), calculate the DC gain (H(0)).`;
            explanation = `DC Gain is found by evaluating H(s) at s = 0.<br>H(0) = ${K} / (0 + ${p}) = ${K}/${p} = ${answerVal}.`;
        }

        // Just text based, no circuit needed really, but let's show block diagram
        const svg = this.generateBlockDiagramSVG(`H(s) = ${K} / (s + ${p})`);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateBlockDiagramSVG: function (text) {
        const w = 600, h = 200;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .text { font-family:sans-serif; font-size:16px; font-weight:bold; }</style>`;

        let els = `
            <g transform="scale(1.5) translate(0, -50)">
            <line x1="50" y1="100" x2="100" y2="100" class="wire" />
            <polygon points="90,95 100,100 90,105" fill="black" />
            <text x="20" y="105" class="text">X(s)</text>
            
            <rect x="100" y="70" width="180" height="60" fill="white" stroke="black" stroke-width="2" />
            <text x="190" y="105" class="text" text-anchor="middle">${text}</text>
            
            <line x1="280" y1="100" x2="330" y2="100" class="wire" />
            <polygon points="320,95 330,100 320,105" fill="black" />
            <text x="340" y="105" class="text">Y(s)</text>
            </g>
        `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 14. IMPULSE RESPONSE (Inverse Laplace)
    // ==========================================
    generateImpulseResponse: function () {
        // H(s) = 1 / (s + a) -> h(t) = e^(-at) u(t)
        const a = Math.floor(Math.random() * 5) + 1;

        // We can't type functions easily as answers, so let's ask for value at t=1 or time constant
        // Let's ask: What is h(1) ?

        const t = 1;
        const val = Math.exp(-a * t);
        const answerVal = val.toFixed(3);

        const prompt = `[IMPULSE] Given H(s) = 1 / (s + ${a}), calculate the value of the impulse response h(t) at t = ${t} second.`;
        const explanation = `
            Inverse Laplace of 1/(s+a) is h(t) = e<sup>-${a}t</sup> u(t).<br>
            At t = ${t}, h(${t}) = e<sup>-${a}(${t})</sup> = e<sup>-${a}</sup> = ${answerVal}.
        `;

        const svg = this.generateBlockDiagramSVG(`H(s) = 1 / (s + ${a})`);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    // ==========================================
    // 15. NATURAL FREQUENCIES (RLC)
    // ==========================================
    generateNaturalFreq: function () {
        // Series RLC. w0 = 1/sqrt(LC).
        // To get nice integer w0, let's pick w0 and L, then find C.

        const w0 = Math.floor(Math.random() * 9) + 2; // 2 to 10 rad/s
        const L = Math.floor(Math.random() * 5) + 1;  // 1 to 5 H

        // w0^2 = 1/(LC) => C = 1 / (L * w0^2)
        const C_val = 1 / (L * w0 * w0);

        // Format C nicely. If it's 0.025, show 25mF? 
        // Let's just show decimal F for simplicity or use exponential if too small.
        let C_display = C_val.toFixed(4);
        if (C_val < 0.01) C_display = C_val.toExponential(2);

        const answerVal = w0.toFixed(1);
        const prompt = `[NATURAL FREQ] A series RLC circuit has L=${L}H and C=${C_display}F. Calculate the undamped natural frequency <b>ω<sub>0</sub></b> (rad/s).`;
        const explanation = `
            For Series RLC, ω<sub>0</sub> = 1 / √(LC).<br>
            C = ${C_display} F.<br>
            LC = ${L} × ${C_display} = ${(L * C_val).toFixed(4)}.<br>
            ω<sub>0</sub> = 1 / √(${(L * C_val).toFixed(4)}) = ${answerVal} rad/s.
        `;

        const svg = this.generateRLCSVG(10, L, C_display); // Dummy R
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateRLCSVG: function (R, L, C_disp) {
        // Updated to accept values for labels if passed, else generic
        const R_lbl = R ? `R=${R}Ω` : "R";
        const L_lbl = L ? `L=${L}H` : "L";
        const C_lbl = C_disp ? `C=${C_disp}F` : "C";

        const w = 600, h = 300;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;
        const rPathH = "l 5 -5 l 5 10 l 5 -10 l 5 10 l 5 -10 l 5 10 l 2.5 -5";
        const lPath = "m 0 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0 q 5 -10 10 0";

        let els = `
            <g transform="translate(60, 20) scale(1.3)">
            <text x="160" y="50" class="text" text-anchor="middle">Series RLC Circuit</text>
            
            <!-- Voltage Source -->
            <circle cx="50" cy="150" r="15" fill="white" stroke="black" stroke-width="2" />
            <text x="35" y="155" class="text">Vs</text>
            <line x1="50" y1="135" x2="50" y2="100" class="wire" />
            <line x1="50" y1="165" x2="50" y2="200" class="wire" />
            
            <!-- Top Wire to R -->
            <line x1="50" y1="100" x2="80" y2="100" class="wire" />
            
            <!-- Resistor -->
            <g transform="translate(80, 100)"><path d="M 0 0 ${rPathH}" class="wire" /></g>
            <text x="95" y="80" class="text">${R_lbl}</text>
            
            <line x1="112.5" y1="100" x2="150" y2="100" class="wire" />
            
            <!-- Inductor -->
            <g transform="translate(150, 100)"><path d="${lPath}" class="wire" /></g>
            <text x="165" y="80" class="text">${L_lbl}</text>
            
            <line x1="190" y1="100" x2="230" y2="100" class="wire" />
            
            <!-- Capacitor (Vertical Plates) -->
            <line x1="230" y1="90" x2="230" y2="110" class="wire" />
            <line x1="240" y1="90" x2="240" y2="110" class="wire" />
            <text x="235" y="80" class="text" text-anchor="middle">${C_lbl}</text>
            
            <!-- Loop back -->
            <line x1="240" y1="100" x2="280" y2="100" class="wire" />
            <line x1="280" y1="100" x2="280" y2="200" class="wire" />
            <line x1="280" y1="200" x2="50" y2="200" class="wire" />
            </g>
        `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 16. BODE DIAGRAMS
    // ==========================================
    generateBode: function () {
        const type = Math.random() < 0.5 ? 'LP' : 'HP';
        // Add random cutoff frequency for variety in display
        const wc = Math.pow(10, Math.floor(Math.random() * 4) + 1); // 10, 100, 1000...

        let answerVal, prompt, explanation;

        if (type === 'LP') {
            answerVal = "-20";
            prompt = `[BODE] For a single-pole low-pass filter H(s) = 1 / (s/${wc} + 1), what is the asymptotic slope of the magnitude plot for ω >> ${wc} rad/s (in dB/decade)?`;
            explanation = `For a single pole, the magnitude roll-off is -20 dB/decade after the cutoff frequency ω<sub>c</sub> = ${wc}.`;
        } else {
            answerVal = "20";
            prompt = `[BODE] For a single-zero (at origin) high-pass filter H(s) = s / (s/${wc} + 1), what is the asymptotic slope of the magnitude plot for ω << ${wc} rad/s (in dB/decade)?`;
            explanation = `At low frequencies (ω < ${wc}), the zero at the origin dominates, giving a slope of +20 dB/decade.`;
        }

        const svg = this.generateBlockDiagramSVG(type === 'LP' ? `LPF (ωc=${wc})` : `HPF (ωc=${wc})`);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    // ==========================================
    // 17. STATE EQUATIONS
    // ==========================================
    generateStateEq: function () {
        // Series RL
        const R = Math.floor(Math.random() * 10) + 2; // 2-12
        const L = Math.floor(Math.random() * 4) + 1; // 1-5 H

        // A = -R/L
        const answerVal = (-1 * R / L).toFixed(2);

        const prompt = `[STATE EQ] For a series RL circuit with state variable x = i(t), voltage source u = v(t), derive the state equation <br>$\\dot{x} = Ax + Bu$. <br>Calculate the scalar value <b>A</b>.<br>R=${R}Ω, L=${L}H.`;
        const explanation = `
            KVL: L(di/dt) + iR = v(t).<br>
            di/dt = -(R/L)i + (1/L)v.<br>
            Comparing to x_dot = Ax + Bu: A = -R/L = -${R}/${L} = ${answerVal}.
        `;

        const svg = this.generateFirstOrderSVG('RL', R, L); // Reuse RL SVG
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    // ==========================================
    // 18. TRANSIENTS NO IC (Damping)
    // ==========================================
    generateTransientNoIC: function () {
        // alpha = R/2L, w0 = 1/sqrt(LC).
        // Pick L, C first
        const L = Math.floor(Math.random() * 3) + 1; // 1-3 H
        const C_inv = Math.pow(Math.floor(Math.random() * 4) + 1, 2); // 1, 4, 9, 16
        const C = 1 / C_inv; // e.g. 1/4 = 0.25 F

        const w0 = Math.sqrt(C_inv); // 1, 2, 3, 4

        // Decide type
        const type = Math.floor(Math.random() * 3); // 0: Over, 1: Under, 2: Critical
        let R;
        let answerVal, explanation;

        if (type === 0) {
            // Overdamped: alpha > w0 => R/2L > w0 => R > 2L*w0
            // Let's set R = 2L*w0 + (some random amount)
            const minR = 2 * L * w0;
            R = minR + Math.floor(Math.random() * 5) + 2; // Ensure definitely larger
            answerVal = "Overdamped";
            explanation = `α = R/2L = ${R}/${2 * L} = ${(R / (2 * L)).toFixed(2)}. ω<sub>0</sub> = ${w0}.<br>Since α > ω<sub>0</sub>, the response is <b>Overdamped</b>.`;
        } else if (type === 1) {
            // Underdamped: alpha < w0 => R < 2L*w0
            // Make R small, e.g. 1 or 2
            const maxR = 2 * L * w0;
            R = Math.max(1, Math.floor(maxR / 2));
            answerVal = "Underdamped";
            explanation = `α = R/2L = ${R}/${2 * L} = ${(R / (2 * L)).toFixed(2)}. ω<sub>0</sub> = ${w0}.<br>Since α < ω<sub>0</sub>, the response is <b>Underdamped</b>.`;
        } else {
            // Critical: R = 2L*w0
            R = 2 * L * w0;
            answerVal = "Critically Damped";
            explanation = `α = R/2L = ${R}/${2 * L} = ${(R / (2 * L)).toFixed(2)}. ω<sub>0</sub> = ${w0}.<br>Since α = ω<sub>0</sub>, the response is <b>Critically Damped</b>.`;
        }

        const C_disp = C.toFixed(3);
        const prompt = `[TRANSIENTS] Determine the type of damping for this series RLC circuit.<br>R=${R}Ω, L=${L}H, C=${C_disp}F.`;

        const options = ["Overdamped", "Underdamped", "Critically Damped", "Undamped"];

        const svg = this.generateRLCSVG(R, L, C_disp);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return {
            id: 'test_' + Date.now() + Math.random(),
            topicId: 9,
            prompt: prompt,
            options: options,
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: explanation
        };
    },

    // ==========================================
    // 19. TRANSIENTS IC FROM DC
    // ==========================================
    generateTransientICDC: function () {
        // Randomize V, R1, R2, R3
        const V = (Math.floor(Math.random() * 5) + 1) * 12; // 12, 24, 36... to divide nicely
        const R1 = Math.floor(Math.random() * 5) + 2; // 2-6
        const R2 = Math.floor(Math.random() * 5) + 2; // 2-6
        const R3 = R2; // Keep R2=R3 for simple parallel = R/2

        // R_parallel = R2/2
        const Rp = R2 / 2;
        const R_total = R1 + Rp;

        // We want good numbers, so maybe adjust V to be multiple of R_total
        // Re-calculate V to be clean
        const I_source = Math.floor(Math.random() * 3) + 1; // 1, 2, 3 A
        const V_clean = I_source * R_total;

        const type = Math.random() < 0.5 ? 'IL' : 'VC';
        let answerVal, prompt, explanation;

        const Va = I_source * Rp; // Voltage at node A
        const IL = Va / R3; // Current through L branch (series with R3)
        // Note: L branch has R3. R2 branch is just R2.
        // Parallel V is Va.

        if (type === 'IL') {
            answerVal = IL.toFixed(2);
            prompt = `[TRANSIENTS IC] The circuit has been in steady state for t < 0. Calculate the initial inductor current <b>i<sub>L</sub>(0<sup>+</sup>)</b>.<br>V=${V_clean}V, R1=${R1}Ω, R2=${R2}Ω, R3=${R3}Ω (in series with L).`;
            explanation = `At DC Steady State (t < 0): Inductor is short, Capacitor is open.<br>
            R2 || (R3) = ${R2} || ${R3} = ${Rp}Ω.<br>
            Total R = R1 + ${Rp} = ${R_total}Ω.<br>
            Source Current I = V/R = ${V_clean}/${R_total} = ${I_source}A.<br>
            Current splits between R2 and R3. Rule: i<sub>L</sub> = I * (R2 / (R2+R3)) = ${I_source} * 0.5 = ${IL.toFixed(2)}A.`;
        } else {
            answerVal = Va.toFixed(2);
            prompt = `[TRANSIENTS IC] The circuit has been in steady state for t < 0. Calculate the initial capacitor voltage <b>v<sub>C</sub>(0<sup>+</sup>)</b>.<br>V=${V_clean}V, R1=${R1}Ω, R2=${R2}Ω (parallel to C), C is parallel to R2.`;
            explanation = `At DC Steady State (t < 0): Capacitor is open.<br>
            v<sub>C</sub> is the voltage across the parallel branch (Node voltage).<br>
            Total Current I = ${I_source}A.<br>
            v<sub>C</sub> = I * R<sub>parallel</sub> = ${I_source} * ${Rp} = ${Va.toFixed(2)}V.`;
        }

        const svg = this.generateICDCSVG(V_clean, R1, R2, R3);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return this.formatQuestion(9, prompt, answerVal, svgDataUri, explanation);
    },

    generateICDCSVG: function (V, R1, R2, R3) {
        const w = 600, h = 300;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;

        let els = `
            <g transform="scale(1.5)">
            <!-- Source V -->
            <circle cx="50" cy="150" r="15" stroke="black" fill="white" />
            <text x="45" y="155" class="text">${V}V</text>
            <line x1="50" y1="135" x2="50" y2="100" class="wire" />
            <line x1="50" y1="165" x2="50" y2="200" class="wire" />
            
            <!-- R1 -->
            <line x1="50" y1="100" x2="80" y2="100" class="wire" />
            <rect x="80" y="90" width="30" height="20" fill="white" stroke="black" />
            <text x="85" y="85" class="text">R1=${R1}</text>
            <line x1="110" y1="100" x2="150" y2="100" class="wire" />
            
            <!-- Parallel Branches at x=150 -->
            <!-- Branch 1: R2 -->
            <line x1="150" y1="100" x2="150" y2="130" class="wire" />
            <rect x="140" y="130" width="20" height="30" fill="white" stroke="black" />
            <text x="165" y="150" class="text">R2=${R2}</text>
            <line x1="150" y1="160" x2="150" y2="200" class="wire" />
            
            <!-- Branch 2: L + R3 -->
            <line x1="150" y1="100" x2="220" y2="100" class="wire" />
            <line x1="220" y1="100" x2="220" y2="120" class="wire" />
            <path d="M 220 120 q -5 5 0 10 q 5 5 0 10 q -5 5 0 10" fill="none" stroke="black" />
            <text x="230" y="135" class="text">L</text>
            <rect x="210" y="160" width="20" height="30" fill="white" stroke="black" />
            <text x="235" y="180" class="text">R3=${R3}</text>
            <line x1="220" y1="150" x2="220" y2="160" class="wire" />
            <line x1="220" y1="190" x2="220" y2="200" class="wire" />
            
            <!-- Branch 3: C -->
            <line x1="220" y1="100" x2="290" y2="100" class="wire" />
            <line x1="290" y1="100" x2="290" y2="140" class="wire" />
            <line x1="280" y1="140" x2="300" y2="140" class="wire" />
            <line x1="280" y1="150" x2="300" y2="150" class="wire" />
            <text x="305" y="150" class="text">C</text>
            <line x1="290" y1="150" x2="290" y2="200" class="wire" />
            
            <!-- Ground Return -->
            <line x1="50" y1="200" x2="290" y2="200" class="wire" />
            </g>
        `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    },

    // ==========================================
    // 20. GENERAL TRANSIENTS (Roots) - Already random, mostly.
    // ==========================================
    generateGeneralTransients: function () {
        // Reuse existing logic, it generates random r1, r2.
        // Just verify variable usage.
        const r1 = Math.floor(Math.random() * 4) + 1; // 1-4
        const r2 = Math.floor(Math.random() * 4) + 5; // 5-8

        const b = r1 + r2;
        const c = r1 * r2;
        const R = b;
        const L = 1;
        const C_display = (1 / c).toFixed(3);

        const answerVal = `-${r1}, -${r2}`;
        const prompt = `[GEN TRANSIENT] Find the roots of the characteristic equation (s<sub>1</sub>, s<sub>2</sub>) for a series RLC circuit with R=${R}Ω, L=${L}H, C=${C_display}F.`;
        const explanation = `
            Characteristic Eq: s<sup>2</sup> + (R/L)s + 1/(LC) = 0.<br>
            s<sup>2</sup> + ${R}s + ${c} = 0.<br>
            Factors: (s + ${r1})(s + ${r2}) = 0.<br>
            Roots: s = -${r1}, -${r2}.
        `;

        const svg = this.generateRLCSVG(R, L, C_display);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return {
            id: 'test_' + Date.now() + Math.random(),
            topicId: 9,
            prompt: prompt,
            options: [
                `-${r1}, -${r2}`,
                `${r1}, ${r2}`,
                `-${r1}, ${r2}`,
                `-${r1 + 1}, -${r2 - 1}`
            ],
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: explanation
        };
    },

    // ==========================================
    // 21. MNA OF LTI (S-Domain)
    // ==========================================
    generateMNALTI: function () {
        const R = Math.floor(Math.random() * 9) + 2; // 2-10
        const L = Math.floor(Math.random() * 4) + 1; // 1-4
        const C = Math.floor(Math.random() * 5) + 1; // 1-5
        const G = (1 / R).toFixed(2);

        // Y(s) = G + sC + 1/sL
        const answerVal = `${G} + ${C}s + ${(1 / L).toFixed(1)}/s`;
        const prompt = `[MNA LTI] Determine the total admittance Y(s) of a parallel RLC circuit with R=${R}Ω, L=${L}H, C=${C}F. (G = 1/R).`;
        const explanation = `
            Y(s) = G + sC + 1/(sL).<br>
            G = 1/${R} ≈ ${G} S.<br>
            sC = s(${C}) = ${C}s.<br>
            1/(sL) = 1/(s*${L}) = ${(1 / L).toFixed(1)}/s.<br>
            Total: ${G} + ${C}s + ${(1 / L).toFixed(1)}/s.
        `;

        const svg = this.generateRLCSVG(R, L, C); // Using RLC svg for simpler visual even if parallel text
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        // Options
        const options = [
            `${G} + ${C}s + ${(1 / L).toFixed(1)}/s`,
            `${R} + ${L}s + ${C}/s`,
            `${G} + ${C * 2}s + ${(1 / (L * 2)).toFixed(1)}/s`,
            `${G} + ${(C / 2).toFixed(1)}s + ${(1 / L).toFixed(1)}/s`
        ];

        return {
            id: 'test_' + Date.now() + Math.random(),
            topicId: 9,
            prompt: prompt,
            options: options,
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: explanation
        };
    },

    // ==========================================
    // 22. LTI TWO-PORTS (s-Domain)
    // ==========================================
    generateLTITwoPort: function () {
        const R = Math.floor(Math.random() * 8) + 2; // 2-9
        const L = Math.floor(Math.random() * 5) + 2; // 2-6

        const answerVal = `${R} + ${L}s`;
        const prompt = `[LTI 2-PORT] For a T-Network where series arm Z1 is an Inductor L=${L}H and shunt arm Z2 is a Resistor R=${R}Ω, calculate the Z-parameter <b>Z<sub>11</sub>(s)</b>.`;
        const explanation = `
            Z<sub>11</sub>(s) = Z1 + Z2 (Input impedance with output open).<br>
            Z1 = sL = ${L}s.<br>
            Z2 = R = ${R}.<br>
            Z<sub>11</sub> = ${L}s + ${R}.
        `;

        const svg = this.generateSimpleTSVG(R, L);
        const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

        return {
            id: 'test_' + Date.now() + Math.random(),
            topicId: 9,
            prompt: prompt,
            options: [
                `${R} + ${L}s`,
                `${R} - ${L}s`,
                `${L} + ${R}s`,
                `${R * L}s`
            ],
            correctAnswer: answerVal,
            image: svgDataUri,
            explanation: explanation
        };
    },

    generateSimpleTSVG: function (R, L) {
        const w = 400, h = 300;
        const style = `<style>.wire { fill:none; stroke:black; stroke-width:2; } .text { font-family:sans-serif; font-size:14px; font-weight:bold; }</style>`;

        const R_lbl = R ? `R=${R}` : "R";
        const L_lbl = L ? `L=${L}H` : "L";

        let els = `
            <g transform="scale(1.5)">
            <text x="130" y="50" class="text" text-anchor="middle">T-Network</text>
            
            <!-- Z1 (Series) - L -->
            <rect x="50" y="100" width="40" height="20" fill="white" stroke="black" />
            <text x="70" y="95" class="text" text-anchor="middle">Z1(${L_lbl})</text>
            <line x1="20" y1="110" x2="50" y2="110" class="wire" />
            <line x1="90" y1="110" x2="130" y2="110" class="wire" />
            
            <!-- Z2 (Shunt) - R -->
            <rect x="120" y="110" width="20" height="40" fill="white" stroke="black" />
            <text x="145" y="130" class="text">Z2(${R_lbl})</text>
            <line x1="130" y1="150" x2="130" y2="180" class="wire" />
            
            <!-- Turn off Z3 wire for now to look like L-Section or simple T -->
            <line x1="130" y1="110" x2="200" y2="110" class="wire" />
            
            <line x1="20" y1="180" x2="200" y2="180" class="wire" />
            </g>
        `;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" />${style}${els}</svg>`;
    }
};
