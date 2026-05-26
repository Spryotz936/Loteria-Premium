const { jsPDF } = window.jspdf;
const TOTAL_IMAGENES = 54;
let bancoImagenes = [];

// Diccionario para guardar las cartas fijadas por el usuario: {"fila-col": numeroCarta}
let cartasFijas = {}; 

// 🔄 1. Controlador Dinámico de UI
function cambiarModalidad() {
  const mod = document.getElementById("modalidad").value;
  const divOficial = document.getElementById("opcionesOficial");
  const divPlantilla = document.getElementById("opcionesPlantilla");
  const grupoEspacio = document.getElementById("grupoEspacio");
  const grupoBorde = document.getElementById("grupoBorde");

  divOficial.classList.add("hidden");
  divPlantilla.classList.add("hidden");
  grupoEspacio.classList.remove("hidden");
  grupoBorde.classList.remove("hidden");

  if (mod === "oficial") {
    divOficial.classList.remove("hidden");
    document.getElementById("lblCantidad").innerText = "Cantidad de tablas (Máx. 100):";
    document.getElementById("lblAncho").innerText = "Ancho de cada tabla (cm):";
    document.getElementById("lblAlto").innerText = "Alto de cada tabla (cm):";
    document.getElementById("anchoCm").value = "6";
    document.getElementById("altoCm").value = "6";
    renderizarGridInteractivo();
  } else if (mod === "pocito") {
    document.getElementById("lblCantidad").innerText = "Cantidad de Pocitos (Máx. 100):";
    document.getElementById("lblAncho").innerText = "Ancho total del bloque Pocito (cm):";
    document.getElementById("lblAlto").innerText = "Alto total del bloque Pocito (cm):";
    document.getElementById("anchoCm").value = "18";
    document.getElementById("altoCm").value = "24";
  } else if (mod === "plantilla") {
    divPlantilla.classList.remove("hidden");
    grupoEspacio.classList.add("hidden");
    grupoBorde.classList.add("hidden");
    document.getElementById("lblCantidad").innerText = "Número de láminas de baraja (Máx. 100):";
    document.getElementById("lblAncho").innerText = "Ancho total de la lámina (cm):";
    document.getElementById("lblAlto").innerText = "Alto total de la lámina (cm):";
    document.getElementById("anchoCm").value = "30";
    document.getElementById("altoCm").value = "20";
  }
}

// 🗺️ 2. CEREBRO INTERACTIVO: Dibuja la cuadrícula adaptada al tamaño seleccionado (3x3, 4x4, etc.)
function renderizarGridInteractivo() {
  const tamano = parseInt(document.getElementById("tamano").value);
  const contenedor = document.getElementById("gridInteractivo");
  contenedor.innerHTML = "";
  contenedor.style.gridTemplateColumns = `repeat(${tamano}, 60px)`;

  limpiarCartasFijas(); // Resetear selecciones al cambiar tamaño

  for (let f = 0; f < tamano; f++) {
    for (let c = 0; c < tamano; c++) {
      let celda = document.createElement("div");
      celda.className = "celda-interactiva";
      celda.id = `cell-${f}-${c}`;
      celda.innerText = `Fila ${f+1}\nCol ${c+1}`;
      celda.onclick = () => configurarCeldaFija(f, c);
      contenedor.appendChild(celda);
    }
  }
}

function configurarCeldaFija(f, c) {
  const clave = `${f}-${c}`;
  
  if (cartasFijas[clave]) {
    delete cartasFijas[clave];
    let celda = document.getElementById(`cell-${f}-${c}`);
    celda.className = "celda-interactiva";
    celda.innerText = `Fila ${f+1}\nCol ${c+1}`;
    return;
  }

  if (Object.keys(cartasFijas).length >= 10) {
    alert("Por seguridad del algoritmo, solo puedes fijar un máximo de 10 figuras por tabla.");
    return;
  }

  let seleccion = prompt("Introduce el número de la carta que quieres fijar en esta celda (Del 1 al 54):");
  let num = parseInt(seleccion);

  if (isNaN(num) || num < 1 || num > 54) {
    alert("Número de carta inválido. Debe ser entre 1 y 54.");
    return;
  }

  // Verificar si la carta ya fue fijada en otra celda de la misma tabla
  if (Object.values(cartasFijas).includes(num)) {
    alert("Esa carta ya está asignada a otra celda. No puedes repetir cartas dentro de la misma tabla.");
    return;
  }

  cartasFijas[clave] = num;
  let celda = document.getElementById(`cell-${f}-${c}`);
  celda.className = "celda-interactiva fijada";
  celda.innerText = `Carta #${num}`;
}

function limpiarCartasFijas() {
  cartasFijas = {};
  const celdas = document.querySelectorAll(".celda-interactiva");
  celdas.forEach(celda => {
    celda.className = "celda-interactiva";
    let coordenadas = celda.id.split("-");
    celda.innerText = `Fila ${parseInt(coordenadas[1])+1}\nCol ${parseInt(coordenadas[2])+1}`;
  });
}

// 📥 3. Inicializar Imágenes
function inicializarBancoImagenes() {
  if (bancoImagenes.length === TOTAL_IMAGENES) return Promise.resolve();
  let promesas = [];
  for (let i = 1; i <= TOTAL_IMAGENES; i++) {
    promesas.push(
      new Promise((resolve) => {
        let img = new Image();
        img.src = `imagenes/${i}.jpg`;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      })
    );
  }
  return Promise.all(promesas).then((imgs) => {
    bancoImagenes = imgs.filter(img => img !== null);
  });
}

// 🔀 4. Algoritmos de Mezcla y Fondos
function mezclarMatriz(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generarCirculoBase64(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = Math.min(img.width, img.height);
  canvas.width = size; canvas.height = size;
  ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip();
  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

function aplicarFondoHoja(doc, estilo) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const paleta = {
    blanco: [255, 255, 255], gris: [225, 228, 230], negro: [25, 27, 31],
    rojo: [195, 35, 35], azul: [35, 85, 185]
  };
  if (paleta[estilo]) {
    doc.setFillColor(...paleta[estilo]);
    doc.rect(0, 0, w, h, "F");
    return;
  }
  if (estilo === "neon") {
    doc.setFillColor(15, 12, 28); doc.rect(0, 0, w, h, "F");
    for (let i = 0; i < 15; i++) {
      doc.setDrawColor(Math.random()*255, Math.random()*255, 255);
      doc.line(Math.random()*w, 0, Math.random()*w, h);
    }
  }
  if (estilo === "textura") {
    doc.setFillColor(243, 238, 221); doc.rect(0, 0, w, h, "F");
    doc.setFillColor(210, 202, 180);
    for (let i = 0; i < 200; i++) doc.circle(Math.random()*w, Math.random()*h, 0.4, "F");
  }
}

function calcularEstrategiaImpresion(anchoItem, altoItem, espacioItem, margenMin) {
  const CARTA_W = 215.9, CARTA_H = 279.4;
  let areaWP = CARTA_W - margenMin * 2, areaHP = CARTA_H - margenMin * 2;
  let colsP = Math.floor((areaWP + espacioItem) / (anchoItem + espacioItem));
  let rowsP = Math.floor((areaHP + espacioItem) / (altoItem + espacioItem));
  let totalP = Math.max(0, colsP) * Math.max(0, rowsP);

  let areaWL = CARTA_H - margenMin * 2, areaHL = CARTA_W - margenMin * 2;
  let colsL = Math.floor((areaWL + espacioItem) / (anchoItem + espacioItem));
  let rowsL = Math.floor((areaHL + espacioItem) / (altoItem + espacioItem));
  let totalL = Math.max(0, colsL) * Math.max(0, rowsL);

  if (totalL > totalP) {
    return { orientacion: "landscape", cols: colsL, rows: rowsL, totalHoja: totalL, pageW: CARTA_H, pageH: CARTA_W };
  } else {
    return { orientacion: "portrait", cols: colsP, rows: rowsP, totalHoja: totalP, pageW: CARTA_W, pageH: CARTA_H };
  }
}

// 🔒 5. Procesamiento Centralizado Comercial
async function procesarSistemaComercial() {
  const cantidad = parseInt(document.getElementById("cantidad").value);
  if (isNaN(cantidad) || cantidad <= 0) return alert("Cantidad inválida.");
  if (cantidad > 100) return alert("Máximo 100 piezas por ejecución.");

  alert("Optimizando espacio e inyectando lógica de cartas fijas...");
  await inicializarBancoImagenes();

  if (bancoImagenes.length !== TOTAL_IMAGENES) return alert("Error: Faltan imágenes.");

  const anchoMm = parseFloat(document.getElementById("anchoCm").value) * 10;
  const altoMm = parseFloat(document.getElementById("altoCm").value) * 10;
  const espacioMm = document.getElementById("modalidad").value !== "plantilla" ? parseFloat(document.getElementById("espacioCm").value) * 10 : 0;
  
  const modalidad = document.getElementById("modalidad").value;
  const fondo = document.getElementById("fondo").value;

  if (modalidad === "oficial") generarMotorOficial(cantidad, anchoMm, altoMm, espacioMm, fondo);
  if (modalidad === "pocito") generarMotorPocitos(cantidad, anchoMm, altoMm, espacioMm, fondo);
  if (modalidad === "plantilla") generarMotorLaminas(cantidad, anchoMm, altoMm, fondo);
}

// ==========================================
// 🚀 MOTOR 1: OFICIAL CON MATRIZ INTELIGENTE Y FIJAS
// ==========================================
function generarMotorOficial(cantidad, anchoTab, altoTab, espacioTab, fondo) {
  const tamano = parseInt(document.getElementById("tamano").value);
  const forma = document.getElementById("forma").value;
  const dibujaBorde = document.getElementById("borde").checked;
  const margenMinimo = 6; 

  const layout = calcularEstrategiaImpresion(anchoTab, altoTab, espacioTab, margenMinimo);
  if (layout.totalHoja === 0) return alert("Las dimensiones superan el tamaño del papel.");

  const doc = new jsPDF({ orientation: layout.orientacion, unit: "mm", format: "letter" });
  let contador = 0;

  for (let i = 0; i < cantidad; i++) {
    if (contador % layout.totalHoja === 0) {
      if (contador > 0) doc.addPage();
      aplicarFondoHoja(doc, fondo);
    }

    let pos = contador % layout.totalHoja;
    let r = Math.floor(pos / layout.cols);
    let c = pos % layout.cols;

    let anchoBloqueTotal = layout.cols * anchoTab + (layout.cols - 1) * espacioTab;
    let altoBloqueTotal = layout.rows * altoTab + (layout.rows - 1) * espacioTab;
    let mx = (layout.pageW - anchoBloqueTotal) / 2;
    let my = (layout.pageH - altoBloqueTotal) / 2;

    let xTabla = mx + c * (anchoTab + espacioTab);
    let yTabla = my + r * (altoTab + espacioTab);

    if (dibujaBorde) {
      doc.setDrawColor(170); doc.setLineWidth(0.2);
      doc.rect(xTabla, yTabla, anchoTab, altoTab, "S");
    }

    // 🧠 ALGORITMO DE RELLENO INTELIGENTE CON CARTAS FIJAS
    let matrizTabla = Array.from({ length: tamano }, () => Array(tamano).fill(null));
    let cartasUsadas = new Set();

    // Paso 1: Insertar las cartas fijas obligatorias
    for (let clave in cartasFijas) {
      let [fFija, cFija] = clave.split("-").map(Number);
      if (fFija < tamano && cFija < tamano) { // Evitar desbordamiento si cambiaron el grid
        let numCarta = cartasFijas[clave];
        matrizTabla[fFija][cFija] = numCarta;
        cartasUsadas.add(numCarta);
      }
    }

    // Paso 2: Crear baraja de relleno sin las cartas ya fijadas
    let poolDisponibles = [];
    for (let id = 1; id <= TOTAL_IMAGENES; id++) {
      if (!cartasUsadas.has(id)) poolDisponibles.push(id);
    }
    mezclarMatriz(poolDisponibles);

    // Paso 3: Rellenar huecos vacíos
    let poolIndex = 0;
    for (let f = 0; f < tamano; f++) {
      for (let cc = 0; cc < tamano; cc++) {
        if (matrizTabla[f][cc] === null) {
          matrizTabla[f][cc] = poolDisponibles[poolIndex];
          poolIndex++;
        }
      }
    }

    // Dibujado exacto en el PDF sin espacios intermedios
    let celdaW = anchoTab / tamano;
    let celdaH = altoTab / tamano;
    if (forma === "rectangulo") celdaH = celdaW * 1.35;

    for (let f = 0; f < tamano; f++) {
      for (let cc = 0; cc < tamano; cc++) {
        let num = matrizTabla[f][cc];
        let imgObj = bancoImagenes[num - 1];
        let xImg = xTabla + cc * celdaW;
        let yImg = yTabla + f * celdaH;

        let finalRender = (forma === "circulo") ? generarCirculoBase64(imgObj) : imgObj;
        doc.addImage(finalRender, forma === "circulo" ? "PNG" : "JPEG", xImg, yImg, celdaW, celdaH);
      }
    }
    contador++;
  }
  doc.save("loteria_personalizada_pro.pdf");
}

// ==========================================
// 🚀 MOTORES 2 Y 3 (PERMANECEN IGUALES PARA VELOCIDAD DE PROCESAMIENTO)
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
    
    // 1. Separación matemática estricta de la baraja para este pocito
    let baraja = mezclarMatriz([...bancoImagenes]); 
    let grandes = baraja.slice(0, 30);      // 30 cartas que irán en formato grande
    let dobles = baraja.slice(30, 42);     // 12 cartas que se repetirán 2 veces
    let triples = baraja.slice(42, 54);    // 12 cartas que se repetirán 3 veces
    
    // 2. Construcción del pool de cartas pequeñas (Total: 60 cartas)
    let pequenias = []; 
    dobles.forEach(img => pequenias.push(img, img)); 
    triples.forEach(img => pequenias.push(img, img, img)); 
    
    // 3. Algoritmo de distribución balanceada sin bloqueos (Garantiza desorden único)
    let bloques = Array.from({ length: 30 }, () => []);
    let intentosDistribucion = 0;
    let exito = false;

    while (!exito && intentosDistribucion < 10) {
      // Reiniciamos los bloques para un nuevo intento limpio si se llega a trabar
      for (let b = 0; b < 30; b++) bloques[b] = [];
      let poolCopia = mezclarMatriz([...pequenias]);
      exito = true;

      for (let img of poolCopia) {
        let acomodado = false;
        // Buscamos un bloque que tenga espacio y cumpla las reglas de los Pocitos
        for (let b = 0; b < 30; b++) {
          if (bloques[b].length < 2 && grandes[b] !== img && !bloques[b].includes(img)) {
            bloques[b].push(img);
            acomodado = true;
            break;
          }
        }
        // Si una carta no cupo en ningún lado por colisión de reglas, repetimos la mezcla completa
        if (!acomodado) {
          exito = false;
          break;
        }
      }
      intentosDistribucion++;
    }

    // 4. Renderizado e impresión en el lienzo del PDF
    let cPocito = 5, rPocito = 6; 
    let bW = anchoPocito / cPocito; 
    let bH = altoPocito / rPocito;
    
    for (let i = 0; i < 30; i++) {
      let colCell = i % cPocito; 
      let rowCell = Math.floor(i / cPocito); 
      let x = ox + colCell * bW; 
      let y = oy + rowCell * bH;
      
      let gImg = grandes[i]; 
      // Si por una extrema casualidad matemática fallara la distribución, usamos cartas de respaldo seguras
      let pImg1 = bloques[i][0] || baraja[(i + 1) % 54]; 
      let pImg2 = bloques[i][1] || baraja[(i + 2) % 54];
      
      let wG = bW * 0.72; 
      let wP = bW * 0.28; 
      let hP = bH / 2; 
      
      // Dibujar la carta grande del bloque
      doc.addImage(gImg, "JPEG", x, y, wG, bH); 
      // Dibujar las dos cartas pequeñas de la esquina (Pocitos)
      doc.addImage(pImg1, "JPEG", x + wG, y, wP, hP); 
      doc.addImage(pImg2, "JPEG", x + wG, y + hP, wP, hP);
      
      // Marco de corte/separación técnica
      doc.setDrawColor(140); 
      doc.setLineWidth(0.15); 
      doc.rect(x, y, bW, bH, "S");
    }
    contador++;
  }
  doc.save("loteria_pocitos_pro.pdf");
}

function generarMotorLaminas(cantidad, anchoLam, altoLam, fondo) {
  const gridType = document.getElementById("grid").value; let colsGrid = (gridType === "9x6") ? 9 : 6; let rowsGrid = (gridType === "9x6") ? 6 : 9;
  const margen = 4, sep = 6; const layout = calcularEstrategiaImpresion(anchoLam, altoLam, sep, margen); if (layout.totalHoja === 0) return alert("Medidas muy grandes.");
  const doc = new jsPDF({ orientation: layout.orientacion, unit: "mm", format: "letter" }); let actual = 0;
  while (actual < cantidad) {
    if (actual > 0) doc.addPage(); aplicarFondoHoja(doc, fondo);
    let enHoja = Math.min(layout.totalHoja, cantidad - actual); let areaW = layout.cols * anchoLam + (layout.cols - 1) * sep; let areaH = layout.rows * altoLam + (layout.rows - 1) * sep;
    let kx = (layout.pageW - areaW) / 2; let ky = (layout.pageH - areaH) / 2;
    for (let i = 0; i < enHoja; i++) {
      let cH = i % layout.cols; let rH = Math.floor(i / layout.cols); let bx = kx + cH * (anchoLam + sep); let by = ky + rH * (layout.rows + sep);
      let cW = anchoLam / colsGrid; let hC = altoLam / rowsGrid; let index = 0;
      for (let f = 0; f < rowsGrid; f++) {
        for (let c = 0; c < colsGrid; c++) { if (index < TOTAL_IMAGENES) { let x = bx + c * cW; let y = by + f * hC; doc.addImage(bancoImagenes[index], "JPEG", x, y, cW, hC); doc.setDrawColor(180); doc.setLineWidth(0.15); doc.rect(x, y, cW, hC, "S"); } index++; } }
    }
    actual += enHoja;
  }
  doc.save("laminas_baraja_pro.pdf");
}

// Inicializar por primera vez al cargar
document.addEventListener("DOMContentLoaded", () => { renderizarGridInteractivo(); });
