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
 * INTERRUPTOR DE VISTAS EN EL HTML (Control Total de Interfaces por Modalidad)
 */
function cambiarModalidad() {
  const mod = document.getElementById("modalidad").value;
  
  // 1. CAPTURA DE PANELES DE CONFIGURACIÓN
  const opcOficial = document.getElementById("opcionesOficial");     // Configuración Tradicional (Tamaño 3x3/4x4/5x5, forma de celda y Grid interactivo)
  const opcPlantilla = document.getElementById("opcionesPlantilla"); // Configuración de Láminas (Selector 6x9 o 9x6)

  // 2. CAPTURA DE PARAMETROS FÍSICOS DEL PDF (Medidas y Estructura)
  const grupoAncho = document.getElementById("anchoCm")?.closest('.grupo-control') || document.getElementById("anchoCm");
  const grupoAlto = document.getElementById("altoCm")?.closest('.grupo-control') || document.getElementById("altoCm");
  const grupoEspacio = document.getElementById("grupoEspacio") || document.getElementById("espacioCm");
  const grupoBorde = document.getElementById("grupoBorde");
  const grupoFondo = document.getElementById("fondo")?.closest('.grupo-control') || document.getElementById("fondo");
  const lblCant = document.getElementById("lblCantidad");

  // ==========================================
  // CASO A: MODALIDAD LÁMINAS / PLANTILLAS
  // ==========================================
  if (mod === "plantilla") {
    // Visibilidad de Paneles Principales
    opcOficial.classList.add("hidden");
    opcPlantilla.classList.remove("hidden"); // Muestra selector de distribución 6x9 o 9x6
    
    // Control de Medidas y Estructura Técnica
    if(grupoAncho) grupoAncho.classList.remove("hidden");   // Mantiene Medida Ancho
    if(grupoAlto) grupoAlto.classList.remove("hidden");     // Mantiene Medida Alto
    if(grupoFondo) grupoFondo.classList.remove("hidden");   // Mantiene Color de Fondo de la hoja
    if(grupoEspacio) grupoEspacio.classList.add("hidden");   // OCULTA espacio entre tablas (es una sola lámina grande)
    if(grupoBorde) grupoBorde.classList.add("hidden");       // OCULTA checkbox de borde grueso tradicional
    
    lblCant.innerText = "Cantidad de láminas a generar:";
  } 
  
  // ==========================================
  // CASO B: MODALIDAD POCITOS (Fijo 4x4, sin personalización manual)
  // ==========================================
  else if (mod === "pocito") {
    // Visibilidad de Paneles Principales
    opcOficial.classList.add("hidden");   // OCULTA Grid interactivo, Tamaño de matriz (fuerza 4x4) y formas circulares
    opcPlantilla.classList.add("hidden"); // OCULTA selector de distribución de láminas
    
    // Control de Medidas y Estructura Técnica (Aquí se queda TODO lo de impresión)
    if(grupoAncho) grupoAncho.classList.remove("hidden");     // MANTIENE visible cambiar Ancho
    if(grupoAlto) grupoAlto.classList.remove("hidden");       // MANTIENE visible cambiar Alto
    if(grupoEspacio) grupoEspacio.classList.remove("hidden"); // MANTIENE separación entre tablas (gap)
    if(grupoFondo) grupoFondo.classList.remove("hidden");     // MANTIENE selector de color de fondo
    if(grupoBorde) grupoBorde.classList.remove("hidden");     // MANTIENE checkbox de contorno negro exterior
    
    lblCant.innerText = "Cantidad de tablas de Pocitos:";
  } 
  
  // ==========================================
  // CASO C: MODALIDAD LOTERÍA OFICIAL TRADICIONAL
  // ==========================================
  else {
    // Visibilidad de Paneles Principales
    opcOficial.classList.remove("hidden"); // MUESTRA personalización total (Tamaños, Formas y Grid interactivo)
    opcPlantilla.classList.add("hidden");
    
    // Control de Medidas y Estructura Técnica (Habilitado Completo)
    if(grupoAncho) grupoAncho.classList.remove("hidden");
    if(grupoAlto) groupAlto.classList.remove("hidden");
    if(grupoEspacio) grupoEspacio.classList.remove("hidden");
    if(grupoFondo) grupoFondo.classList.remove("hidden");
    if(grupoBorde) grupoBorde.classList.remove("hidden");
    
    lblCant.innerText = "Cantidad de tablas / bloques:";
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
