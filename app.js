/**
 * SISTEMA PRO DE GENERACIÓN DE LOTERÍA MEXICANA
 * Archivo: app.js
 * Incluye: Motor Tradicional, Motor de Pocitos Estilizado y Motor de Láminas.
 */

// Banco de datos simulado (Reemplazar con tus rutas reales de imágenes si es necesario)
const TOTAL_CARTAS_BARAJA = 54;
const imagenesBaraja = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, i) => `cartas/${i + 1}.jpg`);

// Estado global de cartas fijas (Lotería Tradicional)
let cartasFijas = [];

// Ejecutar al cargar la página para inicializar el grid interactivo
window.onload = function() {
  renderizarGridInteractivo();
};

/**
 * CAPA DE CONTROL PRINCIPAL (Disparador del HTML)
 */
function ejecutarGeneracionDirecta() {
  const mod = document.getElementById("modalidad").value;
  const cant = parseInt(document.getElementById("cantidad").value) || 1;
  
  // Conversión de centímetros a milímetros (jsPDF trabaja mejor en mm)
  const w = Number(document.getElementById("anchoCm").value) * 10 || 140;
  const h = Number(document.getElementById("altoCm").value) * 10 || 200;
  const gap = Number(document.getElementById("espacioCm").value) * 10 || 5;
  const fondo = document.getElementById("fondo").value;

  if (mod === "oficial") {
    generarMotorOficial(cant, w, h, gap, fondo);
  } else if (mod === "pocito") {
    generarMotorPocitos(cant, w, h, gap, fondo);
  } else if (mod === "plantilla") {
    generarMotorLaminas(cant, w, h, fondo);
  }
}

/**
 * INTERRUPTOR DE VISTAS EN EL HTML
 */
function cambiarModalidad() {
  const mod = document.getElementById("modalidad").value;
  const opcOficial = document.getElementById("opcionesOficial");
  const opcPlantilla = document.getElementById("opcionesPlantilla");
  const grupoEspacio = document.getElementById("grupoEspacio");
  const grupoBorde = document.getElementById("grupoBorde");
  const lblCant = document.getElementById("lblCantidad");

  if (mod === "plantilla") {
    opcOficial.classList.add("hidden");
    opcPlantilla.classList.remove("hidden");
    grupoEspacio.classList.add("hidden");
    grupoBorde.classList.add("hidden");
    lblCant.innerText = "Cantidad de láminas a generar:";
  } else {
    opcOficial.classList.remove("hidden");
    opcPlantilla.classList.add("hidden");
    grupoEspacio.classList.remove("hidden");
    grupoBorde.classList.remove("hidden");
    lblCant.innerText = "Cantidad de tablas / bloques:";
  }
}

/**
 * ASISTENTE DE PALETA DE COLORES PARA EL PDF
 */
function obtenerColorInyeccion(nombreColor) {
  const paleta = {
    blanco: [255, 255, 255],
    gris: [240, 240, 240],
    negro: [25, 25, 25],
    rojo: [186, 12, 47],
    azul: [15, 76, 129]
  };
  return paleta[nombreColor] || [255, 255, 255];
}

/**
 * 1. MOTOR OFICIAL TRADICIONAL (Cuadrículas configurables con inserción fija)
 */
function generarMotorOficial(cantidad, tW, tH, gap, colorFondo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  
  const dimTamano = parseInt(document.getElementById("tamano").value) || 4;
  const formaCelda = document.getElementById("forma").value;
  const dibujaBorde = document.getElementById("borde").checked;
  const rgb = obtenerColorInyeccion(colorFondo);

  // Dimensiones de la hoja Carta en mm
  const pW = 215.9;
  const pH = 279.4;

  let xCursor = gap;
  let yCursor = gap;

  for (let i = 0; i < cantidad; i++) {
    if (i > 0) {
      if (xCursor + tW + gap <= pW && yCursor + tH + gap <= pH) {
        // Cabe en la misma página
      } else if (xCursor === gap && yCursor + (tH * 2) + (gap * 2) <= pH) {
        xCursor = gap;
        yCursor += tH + gap;
      } else {
        doc.addPage();
        xCursor = gap;
        yCursor = gap;
      }
    }

    // Fondo del tablero
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(xCursor, yCursor, tW, tH, "F");

    // Construcción de matriz sin colisiones respetando las fijas
    let pool = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, index) => index);
    let seleccionadas = Array(dimTamano * dimTamano).fill(null);

    // Colocar las fijas en sus respectivas posiciones asignadas
    cartasFijas.forEach(fija => {
      if (fija.pos < seleccionadas.length) {
        seleccionadas[fija.pos] = fija.id;
        pool = pool.filter(id => id !== fija.id);
      }
    });

    // Llenar los huecos vacíos de forma aleatoria
    for (let pos = 0; pos < seleccionadas.length; pos++) {
      if (seleccionadas[pos] === null) {
        const indexAleatorio = Math.floor(Math.random() * pool.length);
        seleccionadas[pos] = pool[indexAleatorio];
        pool.splice(indexAleatorio, 1);
      }
    }

    // Dibujo de las celdas en el PDF
    const cW = tW / dimTamano;
    const cH = tH / dimTamano;

    for (let r = 0; r < dimTamano; r++) {
      for (let c = 0; c < dimTamano; c++) {
        const idx = r * dimTamano + c;
        const cX = xCursor + c * cW;
        const cY = yCursor + r * cH;
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
          doc.setDrawColor(180);
          doc.setLineWidth(0.1);
          doc.rect(cX, cY, cW, cH, "S");
        }
      }
    }

    if (dibujaBorde) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(xCursor, yCursor, tW, tH, "S");
    }

    xCursor += tW + gap;
    if (xCursor + tW > pW) {
      xCursor = gap;
      yCursor += tH + gap;
    }
  }

  doc.save(`Loteria_Tradicional_${Date.now()}.pdf`);
}

/**
 * 2. MOTOR DE POCITOS (Formato 4x4 Especial con Proporción Estilizada Comprensible)
 */
function generarMotorPocitos(cantidad, tW, tH, gap, colorFondo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  
  const dibujaBorde = document.getElementById("borde").checked;
  const rgb = obtenerColorInyeccion(colorFondo);

  const pW = 215.9;
  const pH = 279.4;

  let xCursor = gap;
  let yCursor = gap;

  for (let i = 0; i < cantidad; i++) {
    if (i > 0) {
      if (xCursor + tW + gap <= pW && yCursor + tH + gap <= pH) {
        // Espacio disponible continuo lateral
      } else if (xCursor === gap && yCursor + (tH * 2) + (gap * 2) <= pH) {
        xCursor = gap;
        yCursor += tH + gap;
      } else {
        doc.addPage();
        xCursor = gap;
        yCursor = gap;
      }
    }

    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(xCursor, yCursor, tW, tH, "F");

    // Lógica Matemática anti-repeticiones en pocito completo
    let poolG = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, index) => index);
    let poolP = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, index) => index);
    
    const bW = tW / 4;
    const bH = tH / 4;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = xCursor + c * bW;
        const y = yCursor + r * bH;

        // Selección de la carta Grande
        const idxG = Math.floor(Math.random() * poolG.length);
        const idGrande = poolG[idxG];
        poolG.splice(idxG, 1);

        // Remover de las pequeñas para evitar duplicados idénticos en el mismo bloque
        let poolP_Filtrado = poolP.filter(id => id !== idGrande);

        // Selección Pequeña 1
        const idxP1 = Math.floor(Math.random() * poolP_Filtrado.length);
        const idP1 = poolP_Filtrado[idxP1];
        poolP_Filtrado.splice(idxP1, 1);
        poolP = poolP.filter(id => id !== idP1);

        // Selección Pequeña 2
        const idxP2 = Math.floor(Math.random() * poolP_Filtrado.length);
        const idP2 = poolP_Filtrado[idxP2];
        poolP = poolP.filter(id => id !== idP2);

        const gImg = imagenesBaraja[idGrande];
        const pImg1 = imagenesBaraja[idP1];
        const pImg2 = imagenesBaraja[idP2];

        // =========================================================
        // NUEVA PROPORCIÓN ESTILIZADA (Evita elementos gigantes/toscos)
        // =========================================================
        let margenInterno = 0.6; // Espaciado de cortesía estética
        
        // Reducción del ancho de la grande al 64% para estilizarla verticalmente
        let wG = (bW * 0.64) - (margenInterno * 2); 
        let hG = bH - (margenInterno * 2);
        
        // Las gemelas pequeñas ocupan el 36% restante de forma clara
        let wP = (bW * 0.36) - (margenInterno * 2); 
        let hP = (bH / 2) - (margenInterno * 1.5); 
        
        // Inyección de imágenes
        doc.addImage(gImg, "JPEG", x + margenInterno, y + margenInterno, wG, hG); 
        
        let xPequenas = x + (bW * 0.64) + margenInterno;
        doc.addImage(pImg1, "JPEG", xPequenas, y + margenInterno, wP, hP); 
        doc.addImage(pImg2, "JPEG", xPequenas, y + (bH / 2) + (margenInterno / 2), wP, hP);

        // Rejilla interna por pocito
        doc.setDrawColor(140);
        doc.setLineWidth(0.15);
        doc.rect(x, y, bW, bH, "S");
      }
    }

    if (dibujaBorde) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.rect(xCursor, yCursor, tW, tH, "S");
    }

    xCursor += tW + gap;
    if (xCursor + tW > pW) {
      xCursor = gap;
      yCursor += tH + gap;
    }
  }

  doc.save(`Loteria_Pocitos_${Date.now()}.pdf`);
}

/**
 * 3. MOTOR DE LÁMINAS DE BARAJA (Cálculo exacto basado en la ID "grid")
 */
function generarMotorLaminas(cantidad, lW, lH, colorFondo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");
  
  const tipoGrid = document.getElementById("grid").value; // Enlaza directo al select del HTML
  const rgb = obtenerColorInyeccion(colorFondo);

  let columnas = 9;
  let filas = 6;

  if (tipoGrid === "6x9") {
    columnas = 6;
    filas = 9;
  }

  const pW = 215.9;
  const pH = 279.4;

  // Centrado absoluto automático de la lámina en la hoja carta
  const margenX = (pW - lW) / 2;
  const margenY = (pH - lH) / 2;

  const cW = lW / columnas;
  const cH = lH / filas;

  for (let m = 0; m < cantidad; m++) {
    if (m > 0) doc.addPage();

    // Fondo protector de la lámina
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(margenX, margenY, lW, lH, "F");

    // Barajado e impresión secuencial de las 54 cartas sin repetir por lámina
    let barajaMezclada = Array.from({ length: TOTAL_CARTAS_BARAJA }, (_, index) => index);
    barajaMezclada.sort(() => Math.random() - 0.5);

    let cuenta = 0;
    for (let r = 0; r < filas; r++) {
      for (let c = 0; c < columnas; c++) {
        if (cuenta >= TOTAL_CARTAS_BARAJA) break;

        const cX = margenX + c * cW;
        const cY = margenY + r * cH;
        const imgPath = imagenesBaraja[barajaMezclada[cuenta]];

        // Inyección sin encimarse (reducción controlada milimétrica)
        doc.addImage(imgPath, "JPEG", cX + 0.2, cY + 0.2, cW - 0.4, cH - 0.4);

        // Línea técnica de corte perimetral
        doc.setDrawColor(120);
        doc.setLineWidth(0.1);
        doc.rect(cX, cY, cW, cH, "S");

        cuenta++;
      }
    }

    // Marco exterior reforzado de la planilla
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.rect(margenX, margenY, lW, lH, "S");
  }

  doc.save(`Laminas_Baraja_${tipoGrid}_${Date.now()}.pdf`);
}

/**
 * COMPONENTES DE INTERFAZ DEL GRID INTERACTIVO (Fijación de posiciones)
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
      celda.innerHTML = `<div>#${fijaActual.id + 1}</div><div style="font-size:8px;color:#1e5631;">Pos ${i+1}</div>`;
    } else {
      celda.innerHTML = `<div>${i + 1}</div><div style="font-size:7px;opacity:0.5;">Libre</div>`;
    }

    celda.onclick = function() {
      gestionarClickCelda(i);
    };
    gridContainer.appendChild(celda);
  }
}

function gestionarClickCelda(posicion) {
  const indexFijo = cartasFijas.findIndex(f => f.pos === posicion);

  if (indexFijo > -1) {
    // Si ya estaba asignada, la liberamos
    cartasFijas.splice(indexFijo, 1);
    renderizarGridInteractivo();
  } else {
    // Validar tope de diseño estipulado
    if (cartasFijas.length >= 10) {
      alert("Por diseño técnico, el límite máximo es de 10 cartas fijas por tabla.");
      return;
    }

    const entrada = prompt("Ingresa el número de carta que deseas fijar aquí (Del 1 al 54):");
    if (!entrada) return;

    const numCarta = parseInt(entrada);
    if (isNaN(numCarta) || numCarta < 1 || numCarta > 54) {
      alert("Número inválido. Debe ser un número entero entre 1 y 54.");
      return;
    }

    const idCarta = numCarta - 1;

    // Control preventivo: Evitar duplicar la misma carta en la misma tabla
    if (cartasFijas.some(f => f.id === idCarta)) {
      alert(`La carta #${numCarta} ya está asignada en otra casilla de este tablero.`);
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
