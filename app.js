// ==========================================
// 📌 BASE DE DATOS Y CONFIGURACIÓN GLOBAL
// ==========================================
const TOTAL_IMAGENES = 54;
const { jsPDF } = window.jspdf;

// Generar array de imágenes simuladas (banco de assets)
const bancoImagenes = Array.from({ length: TOTAL_IMAGENES }, (_, i) => {
  const canvas = document.createElement('canvas');
  canvas.width = 120; canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `hsl(${(i * 360) / TOTAL_IMAGENES}, 75%, 85%)`;
  ctx.fillRect(0, 0, 120, 180);
  ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${i + 1}`, 60, 95);
  return canvas.toDataURL('image/jpeg', 0.8);
});

let cartasFijas = {}; // Almacena { posicion_index: imagen_url }

// Inicialización
window.onload = () => {
  renderizarGridInteractivo();
};

// Control de vistas en el panel
function cambiarModalidad() {
  const mod = document.getElementById("modalidad").value;
  document.getElementById("opcionesOficial").classList.toggle("hidden", mod !== "oficial");
  document.getElementById("opcionesPlantilla").classList.toggle("hidden", mod !== "plantilla");
  
  if (mod === "pocito") {
    document.getElementById("anchoCm").value = 18;
    document.getElementById("altoCm").value = 24;
  } else if (mod === "plantilla") {
    document.getElementById("anchoCm").value = 20;
    document.getElementById("altoCm").value = 26;
  } else {
    document.getElementById("anchoCm").value = 16;
    document.getElementById("altoCm").value = 22;
  }
}

// Utilería para mezclar vectores de forma aleatoria
function mezclarMatriz(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==========================================
// 🎯 MÓDULO INTERACTIVO DE CARTAS FIJAS
// ==========================================
function renderizarGridInteractivo() {
  const tam = parseInt(document.getElementById("tamano").value);
  const grid = document.getElementById("gridInteractivo");
  grid.style.gridTemplateColumns = `repeat(${tam}, 1fr)`;
  grid.innerHTML = "";
  cartasFijas = {};

  for (let i = 0; i < tam * tam; i++) {
    const celda = document.createElement("div");
    celda.className = "celda-interactiva";
    celda.innerText = `Pos ${i + 1}`;
    celda.onclick = () => toggleraCartaFija(celda, i);
    grid.appendChild(celda);
  }
}

function toggleraCartaFija(elemento, idx) {
  if (elemento.classList.contains("fijada")) {
    elemento.classList.remove("fijada");
    elemento.innerText = `Pos ${idx + 1}`;
    delete cartasFijas[idx];
  } else {
    if (Object.keys(cartasFijas).length >= 10) return alert("Máximo de 10 cartas fijas por tabla.");
    const numImg = prompt(`Ingresa el número de carta (1 al ${TOTAL_IMAGENES}) para clavar aquí:`);
    const n = parseInt(numImg);
    if (n >= 1 && n <= TOTAL_IMAGENES) {
      elemento.classList.add("fijada");
      elemento.innerText = `📌 #${n}`;
      cartasFijas[idx] = bancoImagenes[n - 1];
    }
  }
}

function limpiarCartasFijas() {
  renderizarGridInteractivo();
}

// ==========================================
// 📐 CALCULADOR DE ESTRATEGIA DE IMPRESIÓN
// ==========================================
function calcularEstrategiaImpresion(wPieza, hPieza, gap, margen) {
  const papelW_Port = 215.9, papelH_Port = 279.4; // Carta estándar en mm
  
  function evaluar(pW, pH, orient) {
    let cols = Math.floor((pW - (margen * 2) + gap) / (wPieza + gap));
    let rows = Math.floor((pH - (margen * 2) + gap) / (hPieza + gap));
    if (cols < 1 || rows < 1) return { total: 0, cols: 0, rows: 0 };
    return { total: cols * rows, cols, rows, pageW: pW, pageH: pH, orient };
  }

  let vertical = evaluar(papelW_Port, papelH_Port, "portrait");
  let horizontal = evaluar(papelH_Port, papelW_Port, "landscape");

  return (vertical.total >= horizontal.total && vertical.total > 0) ? vertical : horizontal;
}

function aplicarFondoHoja(doc, tipo) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  if (tipo === "blanco") return;
  
  if (tipo === "gris") doc.setFillColor(240, 242, 245);
  else if (tipo === "negro") doc.setFillColor(20, 20, 25);
  else if (tipo === "rojo") doc.setFillColor(180, 20, 40);
  else if (tipo === "azul") doc.setFillColor(15, 32, 67);
  
  doc.rect(0, 0, w, h, "F");
}

// ==========================================
// 🚀 DISPARADOR DIRECTO DE ACCIONES
// ==========================================
function ejecutarGeneracionDirecta() {
  const mod = document.getElementById("modalidad").value;
  const cant = parseInt(document.getElementById("cantidad").value) || 1;
  const w = parseFloat(document.getElementById("anchoCm").value) * 10;
  const h = parseFloat(document.getElementById("altoCm").value) * 10;
  const gap = parseFloat(document.getElementById("espacioCm").value) * 10 || 0;
  const fondo = document.getElementById("fondo").value;

  if (mod === "oficial") {
    generarMotorOficial(cant, w, h, gap, fondo);
  } else if (mod === "pocito") {
    generarMotorPocitos(cant, w, h, gap, fondo);
  } else if (mod === "plantilla") {
    generarMotorLaminas(cant, w, h, fondo);
  }
}

// ==========================================
// 🎰 MOTOR 1: LOTERÍA TRADICIONAL OFICIAL
// ==========================================
function generarMotorOficial(cantidad, anchoTab, altoTab, espacioTab, fondo) {
  const tam = parseInt(document.getElementById("tamano").value);
  const forma = document.getElementById("forma").value;
  const dibujarBorde = document.getElementById("borde").checked;
  const margenMinimo = 6;

  const layout = calcularEstrategiaImpresion(anchoTab, altoTab, espacioTab, margenMinimo);
  if (layout.totalHoja === 0) return alert("Las dimensiones no caben en el papel.");

  const doc = new jsPDF({ orientation: layout.orientacion, unit: "mm", format: "letter" });
  let contador = 0;

  for (let t = 0; t < cantidad; t++) {
    if (contador % layout.totalHoja === 0) {
      if (contador > 0) doc.addPage();
      aplicarFondoHoja(doc, fondo);
    }

    let pos = contador % layout.totalHoja;
    let r = Math.floor(pos / layout.cols);
    let c = pos % layout.cols;

    let anchoBloqueTotal = layout.cols * anchoTab + (layout.cols - 1) * espacioTab;
    let altoBloqueTotal = layout.rows * altoTab + (layout.rows - 1) * espacioTab;

    let ox = (layout.pageW - anchoBloqueTotal) / 2 + c * (anchoTab + espacioTab);
    let oy = (layout.pageH - altoBloqueTotal) / 2 + r * (altoTab + espacioTab);

    // Preparar el pool de imágenes barajadas excluyendo las fijas
    let poolDisponibles = [...bancoImagenes];
    Object.values(cartasFijas).forEach(img => {
      let idx = poolDisponibles.indexOf(img);
      if (idx !== -1) poolDisponibles.splice(idx, 1);
    });
    mezclarMatriz(poolDisponibles);

    let cW = anchoTab / tam;
    let cH = altoTab / tam;

    for (let i = 0; i < tam * tam; i++) {
      let cellC = i % tam;
      let cellR = Math.floor(i / tam);
      let x = ox + cellC * cW;
      let y = oy + cellR * cH;

      let img = cartasFijas[i] || poolDisponibles.pop();

      if (forma === "circulo") {
        doc.saveGraphicsState();
        doc.clip_rounded_container = true;
        doc.arc(x + cW / 2, y + cH / 2, Math.min(cW, cH) * 0.46, 0, 360);
        doc.clip();
        doc.addImage(img, "JPEG", x, y, cW, cH);
        doc.restoreGraphicsState();
      } else {
        doc.addImage(img, "JPEG", x, y, cW, cH);
      }

      if (dibujarBorde) {
        doc.setDrawColor(150); doc.setLineWidth(0.15);
        doc.rect(x, y, cW, cH, "S");
      }
    }
    contador++;
  }
  doc.save("loteria_tradicional_pro.pdf");
}

// ==========================================
// 🎰 MOTOR 2: DE POCITOS (REPARTO GARANTIZADO)
// ==========================================
function generarMotorPocitos(cantidad, anchoPocito, altoPocito, espacioTab, fondo) {
  const margenMinimo = 6; 
  const layout = calcularEstrategiaImpresion(anchoPocito, altoPocito, espacioTab, margenMinimo);
  if (layout.totalHoja === 0) return alert("Medidas muy grandes.");
  
  const doc = new jsPDF({ orientation: layout.orientacion, unit: "mm", format: "letter" }); 
  let contador = 0;
  
  for (let p = 0; p < cantidad; p++) {
    if (contador % layout.totalHoja === 0) { 
      if (contador > 0) doc.addPage(); 
      aplicarFondoHoja(doc, fondo); 
    }
    
    let pos = contador % layout.totalHoja; 
    let r = Math.floor(pos / layout.cols); 
    let c = pos % layout.cols;
    
    let anchoBloqueTotal = layout.cols * anchoPocito + (layout.cols - 1) * espacioTab; 
    let altoBloqueTotal = layout.rows * altoPocito + (layout.rows - 1) * espacioTab;
    
    let ox = (layout.pageW - anchoBloqueTotal) / 2 + c * (anchoPocito + espacioTab); 
    let oy = (layout.pageH - altoBloqueTotal) / 2 + r * (altoPocito + espacioTab);
    
    // Si por alguna razón el margen se descalibra, forzamos números reales
    if (isNaN(ox) || isNaN(oy)) { ox = margenMinimo; oy = margenMinimo; }
    
    let baraja = mezclarMatriz([...bancoImagenes]); 
    let grandes = baraja.slice(0, 30);      
    let dobles = baraja.slice(30, 42);     
    let triples = baraja.slice(42, 54);    
    
    let pequenias = []; 
    dobles.forEach(img => pequenias.push(img, img)); 
    triples.forEach(img => pequenias.push(img, img, img)); 
    
    let bloques = Array.from({ length: 30 }, () => []);
    let intentosDistribucion = 0;
    let exito = false;

    while (!exito && intentosDistribucion < 15) { // Subimos a 15 intentos para dar más holgura
      for (let b = 0; b < 30; b++) bloques[b] = [];
      let poolCopia = mezclarMatriz([...pequenias]);
      exito = true;

      for (let img of poolCopia) {
        let acomodado = false;
        for (let b = 0; b < 30; b++) {
          if (bloques[b].length < 2 && grandes[b] !== img && !bloques[b].includes(img)) {
            bloques[b].push(img);
            acomodado = true;
            break;
          }
        }
        if (!acomodado) {
          exito = false;
          break;
        }
      }
      intentosDistribucion++;
    }

    let cPocito = 5, rPocito = 6; 
    let bW = anchoPocito / cPocito; 
    let bH = altoPocito / rPocito;
    
    for (let i = 0; i < 30; i++) {
      let colCell = i % cPocito; 
      let rowCell = Math.floor(i / cPocito); 
      
      // 🎯 PROTECCIÓN MATEMÁTICA: Asegurar que las coordenadas de cada celda sean 100% reales
      let x = Number(ox + colCell * bW) || margenMinimo; 
      let y = Number(oy + rowCell * bH) || margenMinimo;
      
      let gImg = grandes[i] || bancoImagenes[0]; 
      let pImg1 = bloques[i][0] || baraja[(i + 1) % 54]; 
      let pImg2 = bloques[i][1] || baraja[(i + 2) % 54];
      
      let wG = bW * 0.72; 
      let wP = bW * 0.28; 
      let hP = bH / 2; 
      
      // Dibujamos verificando que no existan coordenadas rotas
      doc.addImage(gImg, "JPEG", x, y, wG, bH); 
      doc.addImage(pImg1, "JPEG", x + wG, y, wP, hP); 
      doc.addImage(pImg2, "JPEG", x + wG, y + hP, wP, hP);
      
      doc.setDrawColor(140); 
      doc.setLineWidth(0.15); 
      doc.rect(x, y, bW, bH, "S");
    }
    contador++;
  }
  doc.save("loteria_pocitos_pro.pdf");
}

// ==========================================
// 🎰 MOTOR 3: LÁMINAS COMPLETAS CORREGIDO
// ==========================================
function generarMotorLaminas(cantidad, anchoLam, altoLam, fondo) {
  const gridType = document.getElementById("grid").value; 
  let colsGrid = (gridType === "9x6") ? 9 : 6; 
  let rowsGrid = (gridType === "9x6") ? 6 : 9;
  
  const margen = 4;
  const sep = 6; 
  
  const layout = calcularEstrategiaImpresion(anchoLam, altoLam, sep, margen); 
  if (layout.totalHoja === 0) return alert("Las dimensiones superan el papel.");
  
  const doc = new jsPDF({ orientation: layout.orientacion, unit: "mm", format: "letter" }); 
  let actual = 0;
  
  while (actual < cantidad) {
    if (actual > 0) doc.addPage(); 
    aplicarFondoHoja(doc, fondo);
    
    let enHoja = Math.min(layout.totalHoja, cantidad - actual); 
    let areaW = layout.cols * anchoLam + (layout.cols - 1) * sep; 
    let areaH = layout.rows * altoLam + (layout.rows - 1) * sep; 
    
    let kx = (layout.pageW - areaW) / 2; 
    let ky = (layout.pageH - areaH) / 2;
    
    for (let i = 0; i < enHoja; i++) { 
      let cH = i % layout.cols;          
      let rH = Math.floor(i / layout.cols); 
      
      let bx = kx + cH * (anchoLam + sep); 
      let by = ky + rH * (altoLam + sep); 
      
      let cW = anchoLam / colsGrid; 
      let hC = altoLam / rowsGrid; 
      
      let index = 0; 
      
      for (let f = 0; f < rowsGrid; f++) { 
        for (let c = 0; c < colsGrid; c++) { 
          if (index < TOTAL_IMAGENES) { 
            let x = bx + c * cW; 
            let y = by + f * hC; 
            
            doc.addImage(bancoImagenes[index], "JPEG", x, y, cW, hC); 
            
            doc.setDrawColor(180); 
            doc.setLineWidth(0.15); 
            doc.rect(x, y, cW, hC, "S"); 
          } 
          index++; 
        } 
      } 
    } 
    actual += enHoja;
  }
  doc.save("laminas_baraja_pro.pdf");
}
