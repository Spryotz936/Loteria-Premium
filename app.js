/**
 * SISTEMA PROFESIONAL DE GENERACIÓN DE LOTERÍA MEXICANA Premium
 * Motores Autónomos e Independientes: 
 * 1. Tradicional (54 cartas)
 * 2. Pocitos Especial (90 imágenes organizadas en 54 tarjetas: 30 individuales, 12 dobles, 12 triples)
 * 3. Láminas de Baraja Tradicional
 */

// --- CONFIGURACIÓN DE BARAJAS ---
const TOTAL_TRADICIONAL = 54;
const imagenesTradicional = Array.from({ length: TOTAL_TRADICIONAL }, (_, i) => `cartas/${i + 1}.jpg`);

// Universo de Pocitos: 90 imágenes totales distribuidas en carpetas o nombres del 1 al 90
const TOTAL_IMAGENES_POCITOS = 90;
const imagenesPocitos = Array.from({ length: TOTAL_IMAGENES_POCITOS }, (_, i) => `pocitos/${i + 1}.jpg`);

// Almacén de cartas fijas (EXCLUSIVO de Lotería Tradicional)
let cartasFijas = [];

window.onload = function() {
  renderizarGridInteractivo();
};

/**
 * CONTROLADOR MAESTRO DE DISPARO (Enruta y aísla los parámetros)
 */
function ejecutarGeneracionDirecta() {
  const mod = document.getElementById("modalidad").value;
  const cant = parseInt(document.getElementById("cantidad").value) || 1;
  
  // Conversión de cm a mm para jsPDF
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
    // LLAMADA LIMPIA: No le envía tamaños ni formas de celda de la tradicional
    generarMotorPocitosEspecial(cant, w, h, gap, fondo);
  } 
  else if (mod === "plantilla") {
    generarMotorLaminas(cant, w, h, fondo);
  }
}

/**
 * INTERRUPTOR DINÁMICO DE INTERFAZ (Oculta y muestra según el producto comercial)
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
    if(grupoEspacio) grupoEspacio.classList.add("hidden");
    if(grupoBorde) grupoBorde.classList.add("hidden");
    
    lblCant.innerText = "Cantidad de láminas a generar:";
  } 
  else if (mod === "pocito") {
    // AISLAMIENTO TOTAL: Oculta la suite de personalización tradicional por completo
    opcOficial.classList.add("hidden"); 
    opcPlantilla.classList.add("hidden");
    
    if(grupoAncho) grupoAncho.classList.remove("hidden");
    if(grupoAlto) grupoAlto.classList.remove("hidden");
    if(grupoEspacio) grupoEspacio.classList.remove("hidden");
    if(grupoFondo) grupoFondo.classList.remove("hidden");
    if(grupoBorde) grupoBorde.classList.remove("hidden");
    
    lblCant.innerText = "Cantidad de tablas de Pocitos:";
  } 
  else {
    opcOficial.classList.remove("hidden"); // Regresa el panel interactivo y los tamaños
    opcPlantilla.classList.add("hidden");
    
    if(grupoAncho) grupoAncho.classList.remove("hidden");
    if(grupoAlto) grupoAlto.classList.remove("hidden");
    if(grupoEspacio) grupoEspacio.classList.remove("hidden");
    if(grupoFondo) grupoFondo.classList.remove("hidden");
    if(grupoBorde) grupoBorde.classList.remove("hidden");
    
    lblCant.innerText = "Cantidad de tablas / bloques:";
  }
}

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
 * 1. MOTOR TRADICIONAL VARIABLES (Usa la baraja de 54)
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

    let pool = Array.from({ length: TOTAL_TRADICIONAL }, (_, idx) => idx);
    let seleccionadas = Array(dimTamano * dimTamano).fill(null);

    cartasFijas.forEach(fija => {
      if (fija.pos < seleccionadas.length) {
        seleccionadas[fija.pos] = fija.id;
        pool = pool.filter(id => id !== fija.id);
      }
    });

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
        const imgPath = imagenesTradicional[seleccionadas[idx]];

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
 * 2. MOTOR DE POCITOS MATEMÁTICO REAL (Aislado, 90 imágenes, 54 tarjetas configuradas estructuralmente)
 */
function generarMotorPocitosEspecial(cantidad, tW, tH, gap, colorFondo) {
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

    // Dibujar fondo de la tabla de Pocitos
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(xCursor, yCursor, tW, tH, "F");

    // CONSTRUCCIÓN DE LA BARAJA MATEMÁTICA DE POCITOS (90 imágenes ordenadas en 54 objetos estructurales)
    // Se crean dinámicamente para garantizar que cada tabla reciba una mezcla fresca sin repetir tarjetas físicas
    let poolImagenes = Array.from({ length: TOTAL_IMAGENES_POCITOS }, (_, idx) => idx);
    let cartasPocitosMazo = [];

    // A. Crear las 30 Cartas Individuales (1 sola imagen grande)
    for (let k = 0; k < 30; k++) {
      const idxImg = Math.floor(Math.random() * poolImagenes.length);
      cartasPocitosMazo.push({ tipo: 'individual', ids: [poolImagenes[idxImg]] });
      poolImagenes.splice(idxImg, 1);
    }

    // B. Crear las 12 Cartas Dobles (2 imágenes acopladas)
    for (let k = 0; k < 12; k++) {
      const idx1 = Math.floor(Math.random() * poolImagenes.length);
      const id1 = poolImagenes[idx1]; poolImagenes.splice(idx1, 1);
      
      const idx2 = Math.floor(Math.random() * poolImagenes.length);
      const id2 = poolImagenes[idx2]; poolImagenes.splice(idx2, 1);

      cartasPocitosMazo.push({ tipo: 'doble', ids: [id1, id2] });
    }

    // C. Crear las 12 Cartas Triples (3 imágenes acopladas)
    for (let k = 0; k < 12; k++) {
      const idx1 = Math.floor(Math.random() * poolImagenes.length);
      const id1 = poolImagenes[idx1]; poolImagenes.splice(idx1, 1);
      
      const idx2 = Math.floor(Math.random() * poolImagenes.length);
      const id2 = poolImagenes[idx2]; poolImagenes.splice(idx2, 1);

      const idx3 = Math.floor(Math.random() * poolImagenes.length);
      const id3 = poolImagenes[idx3]; poolImagenes.splice(idx3, 1);

      cartasPocitosMazo.push({ tipo: 'triple', ids: [id1, id2, id3] });
    }

    // Mezclamos el mazo de Pocitos de 54 tarjetas armado
    cartasPocitosMazo.sort(() => Math.random() - 0.5);

    // Como son 54 cartas en el mazo mezclado, tomamos las primeras 16 para rellenar la cuadrícula obligatoria de 4x4
    let seleccionadasTablero = cartasPocitosMazo.slice(0, 16);

    const bW = tW / 4; const bH = tH / 4; // Sub-divisiones exactas de la tabla

    let cuentaCasilla = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = xCursor + c * bW; const y = yCursor + r * bH;
        const tarjeta = seleccionadasTablero[cuentaCasilla];
        const margenInterno = 0.6;

        if (tarjeta.tipo === 'individual') {
          // 1 Imagen completa ocupando la celda rectangular
          const imgPath = imagenesPocitos[tarjeta.ids[0]];
          doc.addImage(imgPath, "JPEG", x + margenInterno, y + margenInterno, bW - (margenInterno * 2), bH - (margenInterno * 2));
        } 
        else if (tarjeta.tipo === 'doble') {
          // 2 Imágenes divididas vertical u horizontalmente (diseño limpio a mitades de sub-celda)
          const imgPath1 = imagenesPocitos[tarjeta.ids[0]];
          const imgPath2 = imagenesPocitos[tarjeta.ids[1]];
          const medioAncho = (bW / 2) - margenInterno;

          doc.addImage(imgPath1, "JPEG", x + margenInterno, y + margenInterno, medioAncho, bH - (margenInterno * 2));
          doc.addImage(imgPath2, "JPEG", x + (bW / 2) + (margenInterno / 2), y + margenInterno, medioAncho, bH - (margenInterno * 2));
        } 
        else if (tarjeta.tipo === 'triple') {
          // 3 Imágenes estilizadas (1 Grande a la izquierda ocupando el 64%, y 2 pequeñas apiladas a la derecha)
          const imgPathG = imagenesPocitos[tarjeta.ids[0]];
          const imgPathP1 = imagenesPocitos[tarjeta.ids[1]];
          const imgPathP2 = imagenesPocitos[tarjeta.ids[2]];

          let wG = (bW * 0.64) - (margenInterno * 2); 
          let hG = bH - (margenInterno * 2);
          let wP = (bW * 0.36) - (margenInterno * 2); 
          let hP = (bH / 2) - (margenInterno * 1.5); 

          doc.addImage(imgPathG, "JPEG", x + margenInterno, y + margenInterno, wG, hG); 
          let xPequenas = x + (bW * 0.64) + margenInterno;
          doc.addImage(imgPathP1, "JPEG", xPequenas, y + margenInterno, wP, hP); 
          doc.addImage(imgPathP2, "JPEG", xPequenas, y + (bH / 2) + (margenInterno / 2), wP, hP);
        }

        // Rejilla de división interna
        doc.setDrawColor(140); doc.setLineWidth(0.15);
        doc.rect(x, y, bW, bH, "S");

        cuentaCasilla++;
      }
    }

    if (dibujaBorde) {
      doc.setDrawColor(0); doc.setLineWidth(0.4);
      doc.rect(xCursor, yCursor, tW, tH, "S");
    }

    xCursor += tW + gap;
    if (xCursor + tW > pW) { xCursor = gap; yCursor += tH + gap; }
  }
  doc.save(`Loteria_Pocitos_Especial_${Date.now()}.pdf`);
}

/**
 * 3. MOTOR DE LÁMINAS DE BARAJA COMPLETA (Tradicional)
 */
function generarMotorLaminas(cantidad, lW, lH, colorFondo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  
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

    let barajaMezclada = Array.from({ length: TOTAL_TRADICIONAL }, (_, idx) => idx);
    barajaMezclada.sort(() => Math.random() - 0.5);

    let cuenta = 0;
    for (let r = 0; r < filas; r++) {
      for (let c = 0; c < columnas; c++) {
        if (cuenta >= TOTAL_TRADICIONAL) break;

        const cX = margenX + c * cW; const cY = margenY + r * cH;
        const imgPath = imagenesTradicional[barajaMezclada[cuenta]];

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
