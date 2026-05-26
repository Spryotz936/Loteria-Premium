/**
 * SISTEMA PROFESIONAL DE GENERACIÓN DE LOTERÍA MEXICANA
 * Archivo: app.js
 * Motores Autónomos: Tradicional Variable, Pocitos 4x4 Estilizado, y Láminas de Baraja.
 */

const TOTAL_CARTAS_BARAJA = 54;
// Genera las rutas relativas: cartas/1.jpg hasta cartas/54.jpg
const imagenesBaraja = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, i) => `cartas/${i + 1}.jpg`);

// Almacén de cartas fijas (Solo aplica en Lotería Tradicional)
let cartasFijas = [];

// Inicialización del Grid Interactivo al cargar el DOM
window.onload = function() {
  renderizarGridInteractivo();
};

/**
 * CONTROLADOR MAESTRO DE DISPARO
 */
function ejecutarGeneracionDirecta() {
  const mod = document.getElementById("modalidad").value;
  const cant = parseInt(document.getElementById("cantidad").value) || 1;
  
  // Conversiones directas de centímetros a milímetros para el motor jsPDF
  const w = Number(document.getElementById("anchoCm").value) * 10 || 140;
  const h = Number(document.getElementById("altoCm").value) * 10 || 200;
  const gap = Number(document.getElementById("espacioCm").value) * 10 || 5;
  const fondo = document.getElementById("fondo").value;

  if (mod === "oficial") {
    const dimTamano = parseInt(document.getElementById("tamano").value) || 4;
    const formaCelda = document.getElementById("forma").value;
    generarMotorOficial(cant, w, h, gap, fondo, dimTamano, formaCelda);
  } 
  else if (mod === "pocito") {
    // Aislado al 100%: Autocontrola su propia estructura interna sin heredar inputs extras
    generarMotorPocitos(cant, w, h, gap, fondo);
  } 
  else if (mod === "plantilla") {
    generarMotorLaminas(cant, w, h, fondo);
  }
}

/**
 * INTERRUPTOR DINÁMICO DE VISUALIZACIÓN
 */
function cambiarModalidad() {
  const mod = document.getElementById("modalidad").value;
  
  const opcOficial = document.getElementById("opcionesOficial");
  const opcPlantilla = document.getElementById("opcionesPlantilla");
  
  const grupoAncho = document.getElementById("grupoAncho");
  const grupoAlto = document.getElementById("grupoAlto");
  const grupoEspacio = document.getElementById("grupoEspacio");
  const grupoBorde = document.getElementById("grupoBorde");
  const grupoFondo = document.getElementById("grupoFondo");
  const lblCant = document.getElementById("lblCantidad");

  if (mod === "plantilla") {
    opcOficial.classList.add("hidden");
    opcPlantilla.classList.remove("hidden");
    
    if(grupoAncho) grupoAncho.classList.remove("hidden");
    if(grupoAlto) grupoAlto.classList.remove("hidden");
    if(grupoFondo) grupoFondo.classList.remove("hidden");
    if(grupoEspacio) grupoEspacio.classList.add("hidden"); // Oculto en láminas
    if(grupoBorde) grupoBorde.classList.add("hidden");     // Oculto en láminas
    
    lblCant.innerText = "Cantidad de láminas a generar:";
  } 
  else if (mod === "pocito") {
    opcOficial.classList.add("hidden"); // Desaparece la personalización e interactivo tradicional
    opcPlantilla.classList.add("hidden");
    
    if(grupoAncho) grupoAncho.classList.remove("hidden");
    if(grupoAlto) grupoAlto.classList.remove("hidden");
    if(grupoEspacio) grupoEspacio.classList.remove("hidden");
    if(grupoFondo) grupoFondo.classList.remove("hidden");
    if(grupoBorde) grupoBorde.classList.remove("hidden");
    
    lblCant.innerText = "Cantidad de tablas de Pocitos:";
  } 
  else {
    opcOficial.classList.remove("hidden"); // Habilita la suite de maquetación tradicional
    opcPlantilla.classList.add("hidden");
    
    if(grupoAncho) grupoAncho.classList.remove("hidden");
    if(grupoAlto) grupoAlto.classList.remove("hidden");
    if(grupoEspacio) grupoEspacio.classList.remove("hidden");
    if(grupoFondo) grupoFondo.classList.remove("hidden");
    if(grupoBorde) grupoBorde.classList.remove("hidden");
    
    lblCant.innerText = "Cantidad de tablas / bloques:";
  }
}

/**
 * TRADUCTOR DE PALETAS DE COLOR RGB
 */
function obtenerColorInyeccion(nombreColor) {
  const mapa = {
    blanco: [255, 255, 255],
    gris: [240, 240, 240],
    negro: [25, 25, 25],
    rojo: [186, 12, 47],
    azul: [15, 76, 129]
  };
  return mapa[nombreColor] || [255, 255, 255];
}

/**
 * 1. MOTOR TRADICIONAL VARIABLES
 */
function generarMotorOficial(cantidad, tW, tH, gap, colorFondo, dimTamano, formaCelda) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  const dibujaBorde = document.getElementById("borde").checked;
  const rgb = obtenerColorInyeccion(colorFondo);

  const pW = 215.9; const pH = 279.4;
  let xCursor = gap; let yCursor = gap;

  for (let i = 0; i < cantidad; i++) {
    if (i > 0) {
      if (!(xCursor + tW + gap <= pW && yCursor + tH + gap <= pH)) {
        if (xCursor === gap && yCursor + (tH * 2) + (gap * 2) <= pH) {
          xCursor = gap; yCursor += tH + gap;
        } else {
          doc.addPage(); xCursor = gap; yCursor = gap;
        }
      }
    }

    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(xCursor, yCursor, tW, tH, "F");

    let pool = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, idx) => idx);
    let seleccionadas = Array(dimTamano * dimTamano).fill(null);

    // Inyección obligatoria de cartas fijas
    cartasFijas.forEach(fija => {
      if (fija.pos < seleccionadas.length) {
        seleccionadas[fija.pos] = fija.id;
        pool = pool.filter(id => id !== fija.id);
      }
    });

    // Relleno aleatorio sin colisiones
    for (let pos = 0; pos < seleccionadas.length; pos++) {
      if (seleccionadas[pos] === null) {
        const rndIdx = Math.floor(Math.random() * pool.length);
        seleccionadas[pos] = pool[rndIdx];
        pool.splice(rndIdx, 1);
      }
    }

    const cW = tW / dimTamano; const cH = tH / dimTamano;

    for (let r = 0; r < dimTamano; r++) {
      for (let c = 0; c < dimTamano; c++) {
        const idx = r * dimTamano + c;
        const cX = xCursor + c * cW; const cY = yCursor + r * cH;
        const imgPath = imagenesBaraja[seleccionadas[idx]];

        if (formaCelda === "circulo") {
          doc.saveGraphicsState();
          doc.clipRoundRectangle(cX + 0.5, cY + 0.5, cW - 1, cH - 1, (cW - 1) / 2, (cH - 1) / 2);
          doc.addImage(imgPath, "JPEG", cX + 0.5, cY + 0.5, cW - 1, cH - 1);
          doc.restoreGraphicsState();
        } else if (formaCelda === "rectangulo") {
          doc.addImage(imgPath, "JPEG", cX + cW * 0.1, cY + 0.5, cW * 0.8, cH - 1);
        } else {
          doc.addImage(imgPath, "JPEG", cX + 0.5, cY + 0.5, cW - 1, cH - 1);
        }

        if (dibujaBorde) {
          doc.setDrawColor(180); doc.setLineWidth(0.1);
          doc.rect(cX, cY, cW, cH, "S");
        }
      }
    }

    if (dibujaBorde) {
      doc.setDrawColor(0); doc.setLineWidth(0.3);
      doc.rect(xCursor, yCursor, tW, tH, "S");
    }

    xCursor += tW + gap;
    if (xCursor + tW > pW) { xCursor = gap; yCursor += tH + gap; }
  }
  doc.save(`Loteria_Tradicional_${Date.now()}.pdf`);
}

/**
 * 2. MOTOR DE POCITOS (Formato Autónomo Estricto 4x4 Estilizado)
 */
function generarMotorPocitos(cantidad, tW, tH, gap, colorFondo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  const dibujaBorde = document.getElementById("borde").checked;
  const rgb = obtenerColorInyeccion(colorFondo);

  const pW = 215.9; const pH = 279.4;
  let xCursor = gap; let yCursor = gap;

  for (let i = 0; i < cantidad; i++) {
    if (i > 0) {
      if (!(xCursor + tW + gap <= pW && yCursor + tH + gap <= pH)) {
        if (xCursor === gap && yCursor + (tH * 2) + (gap * 2) <= pH) {
          xCursor = gap; yCursor += tH + gap;
        } else {
          doc.addPage(); xCursor = gap; yCursor = gap;
        }
      }
    }

    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(xCursor, yCursor, tW, tH, "F");

    // Pocitos es invariablemente sub-matrices de 4x4 casillas
    const bW = tW / 4; const bH = tH / 4;

    let poolG = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, idx) => idx);
    let poolP = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, idx) => idx);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = xCursor + c * bW; const y = yCursor + r * bH;

        // Selección Carta Principal (Grande)
        const idxG = Math.floor(Math.random() * poolG.length);
        const idGrande = poolG[idxG];
        poolG.splice(idxG, 1);

        // Bloqueo inmediato en celda para evitar duplicados idénticos en el sub-bloque
        let poolP_Filtrado = poolP.filter(id => id !== idGrande);

        const idxP1 = Math.floor(Math.random() * poolP_Filtrado.length);
        const idP1 = poolP_Filtrado[idxP1];
        poolP_Filtrado.splice(idxP1, 1);
        poolP = poolP.filter(id => id !== idP1);

        const idxP2 = Math.floor(Math.random() * poolP_Filtrado.length);
        const idP2 = poolP_Filtrado[idxP2];
        poolP = poolP.filter(id => id !== idP2);

        const gImg = imagenesBaraja[idGrande];
        const pImg1 = imagenesBaraja[idP1];
        const pImg2 = imagenesBaraja[idP2];

        // PROPORCIÓN ESTILIZADA DE COMPACTACIÓN (Cartas esbeltas)
        let margenInterno = 0.6;
        let wG = (bW * 0.64) - (margenInterno * 2); 
        let hG = bH - (margenInterno * 2);
        let wP = (bW * 0.36) - (margenInterno * 2); 
        let hP = (bH / 2) - (margenInterno * 1.5); 

        // Inyección de componentes gráficos
        doc.addImage(gImg, "JPEG", x + margenInterno, y + margenInterno, wG, hG); 
        let xPequenas = x + (bW * 0.64) + margenInterno;
        doc.addImage(pImg1, "JPEG", xPequenas, y + margenInterno, wP, hP); 
        doc.addImage(pImg2, "JPEG", xPequenas, y + (bH / 2) + (margenInterno / 2), wP, hP);

        // Delimitador técnico de celda
        doc.setDrawColor(140); doc.setLineWidth(0.15);
        doc.rect(x, y, bW, bH, "S");
      }
    }

    if (dibujaBorde) {
      doc.setDrawColor(0); doc.setLineWidth(0.4);
      doc.rect(xCursor, yCursor, tW, tH, "S");
    }

    xCursor += tW + gap;
    if (xCursor + tW > pW) { xCursor = gap; yCursor += tH + gap; }
  }
  doc.save(`Loteria_Pocitos_${Date.now()}.pdf`);
}

/**
 * 3. MOTOR DE LÁMINAS DE BARAJA COMPLETA
 */
function generarMotorLaminas(cantidad, lW, lH, colorFondo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  
  // Apunta directamente a la ID correcta corregida del select
  const tipoGrid = document.getElementById("grid").value; 
  const rgb = obtenerColorInyeccion(colorFondo);

  let columnas = 9; let filas = 6;
  if (tipoGrid === "6x9") { columnas = 6; filas = 9; }

  const pW = 215.9; const pH = 279.4;
  const margenX = (pW - lW) / 2; const margenY = (pH - lH) / 2;
  const cW = lW / columnas; const cH = lH / filas;

  for (let m = 0; m < cantidad; m++) {
    if (m > 0) doc.addPage();

    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(margenX, margenY, lW, lH, "F");

    let barajaMezclada = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, idx) => idx);
    barajaMezclada.sort(() => Math.random() - 0.5);

    let cuenta = 0;
    for (let r = 0; r < filas; r++) {
      for (let c = 0; c < columnas; c++) {
        if (cuenta >= TOTAL_CARTAS_BARAJA) break;

        const cX = margenX + c * cW; const cY = margenY + r * cH;
        const imgPath = imagenesBaraja[barajaMezclada[cuenta]];

        doc.addImage(imgPath, "JPEG", cX + 0.2, cY + 0.2, cW - 0.4, cH - 0.4);

        doc.setDrawColor(120); doc.setLineWidth(0.1);
        doc.rect(cX, cY, cW, cH, "S");

        cuenta++;
      }
    }

    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.rect(margenX, margenY, lW, lH, "S");
  }
  doc.save(`Laminas_Baraja_${tipoGrid}_${Date.now()}.pdf`);
}

/**
 * INTERFAZ: LOGICA DEL GRID INTERACTIVO TRADICIONAL
 */
function renderizarGridInteractivo() {
  const gridContainer = document.getElementById("gridInteractivo");
  if (!gridContainer) return;
  
  gridContainer.innerHTML = "";
  const dim = parseInt(document.getElementById("tamano").value) || 4;
  gridContainer.style.gridTemplateColumns = `repeat(${dim}, 62px)`;

  for (let i = 0; i < dim * dim; i++) {
    const celda = document.createElement("div");
    celda.className = "celda-interactiva";
    celda.dataset.pos = i;

    const fijaActual = cartasFijas.find(f => f.pos === i);
    if (fijaActual) {
      celda.classList.add("fijada");
      celda.innerHTML = `<div>#${fijaActual.id + 1}</div><div style="font-size:8px;color:#15803d;">Pos ${i+1}</div>`;
    } else {
      celda.innerHTML = `<div>${i + 1}</div><div style="font-size:7px;opacity:0.5;">Libre</div>`;
    }

    celda.onclick = function() { gestionarClickCelda(i); };
    gridContainer.appendChild(celda);
  }
}

function gestionarClickCelda(posicion) {
  const indexFijo = cartasFijas.findIndex(f => f.pos === posicion);

  if (indexFijo > -1) {
    cartasFijas.splice(indexFijo, 1);
    renderizarGridInteractivo();
  } else {
    if (cartasFijas.length >= 10) {
      alert("Por diseño técnico, el límite máximo es de 10 cartas fijas por tabla.");
      return;
    }

    const entrada = prompt("Ingresa el número de carta que deseas fijar aquí (Del 1 al 54):");
    if (!entrada) return;

    const numCarta = parseInt(entrada);
    if (isNaN(numCarta) || numCarta < 1 || numCarta > 54) {
      alert("Número inválido. Debe estar entre 1 y 54.");
      return;
    }

    const idCarta = numCarta - 1;
    if (cartasFijas.some(f => f.id === idCarta)) {
      alert(`La carta #${numCarta} ya fue fijada en otra casilla de este tablero.`);
      return;
    }

    cartasFijas.push({ pos: posicion, id: idCarta });
    renderizarGridInteractivo();
  }
}

function limpiarCartasFijas() {
  cartasFijas = [];
  renderizarGridInteractivo();
}
