const pantallaInicio = document.querySelector('.pantalla-inicio');
const pantallaPregunta = document.querySelector('.pantalla-pregunta');
const inputNombre = document.getElementById('nombre-usuario');
const btnComenzar = document.getElementById('btn-comenzar');
const textoPregunta = document.getElementById('texto-pregunta');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const contadorPregunta = document.getElementById('contador-pregunta');
const btnSiguiente = document.getElementById('btn-siguiente');
const btnMostrarRanking = document.getElementById('btn-mostrar-ranking');
const contenedorRanking = document.getElementById('ranking-contenedor');

let datosPaises = [];
let preguntas = [];
let indicePregunta = 0;
let respuestasCorrectas = 0;
let respuestasIncorrectas = 0;
let tiempos = [];
let tiempoInicioPregunta;
let nombreUsuario = '';
let puntajeTotal = 0;

async function cargarPaises() {
    const res = await fetch('https://restcountries.com/v3.1/all');
    const data = await res.json();
    datosPaises = data.filter(p => p.capital && p.borders && p.flags);
  }

  function generarPreguntas() {
    const tipos = ['capital', 'bandera', 'fronteras'];
    for (let i = 0; i < 10; i++) {
      const tipo = tipos[i % 3]; 
      const pais = datosPaises[Math.floor(Math.random() * datosPaises.length)];
      const pregunta = crearPregunta(tipo, pais);
      preguntas.push(pregunta);
    }
  }
  
  function crearPregunta(tipo, pais) {
    let enunciado = '', correcta = '', opciones = [];
  
    switch (tipo) {
      case 'capital':
        enunciado = `¿Cuál es el país de la ciudad capital ${pais.capital[0]}?`;
        correcta = pais.name.common;
        opciones = generarOpciones(correcta, p => p.name.common);
        break;
  
      case 'bandera':
        enunciado = `¿A qué país pertenece esta bandera?`;
        correcta = pais.name.common;
        opciones = generarOpciones(correcta, p => p.name.common);
        pais.imgBandera = pais.flags.png;
        break;
  
      case 'fronteras':
        enunciado = `¿Cuántas fronteras tiene ${pais.name.common}?`;
        correcta = pais.borders.length.toString();
        opciones = generarOpciones(correcta, () => Math.floor(Math.random() * 10).toString(), true);
        break;
    }
  
    return { tipo, enunciado, correcta, opciones, pais };
  }
  
  function generarOpciones(correcta, getOpcion, soloNumeros = false) {
    const opciones = new Set([correcta]);
    while (opciones.size < 4) {
      const paisRandom = datosPaises[Math.floor(Math.random() * datosPaises.length)];
      const opcion = getOpcion(paisRandom);
      if (!soloNumeros || !isNaN(opcion)) {
        opciones.add(opcion);
      }
    }
    return Array.from(opciones).sort(() => Math.random() - 0.5);
  }

  function mostrarPregunta() {
    const preguntaActual = preguntas[indicePregunta];
    textoPregunta.innerText = preguntaActual.enunciado;
    contadorPregunta.innerText = `Pregunta ${indicePregunta + 1} de 10`;
  
    contenedorOpciones.innerHTML = '';
  
    if (preguntaActual.tipo === 'bandera') {
      const img = document.createElement('img');
      img.src = preguntaActual.pais.imgBandera;
      img.style.width = '200px';
      img.style.marginBottom = '20px';
      img.style.display = 'block';
      img.style.margin = '0 auto 20px auto';
      contenedorOpciones.appendChild(img);
    }

    preguntaActual.opciones.forEach(op => {
      const btn = document.createElement('div');
      btn.classList.add('opcion');
      btn.innerText = op;
      btn.addEventListener('click', () => seleccionarOpcion(btn, op));
      contenedorOpciones.appendChild(btn);
    });
  
    tiempoInicioPregunta = Date.now();
    btnSiguiente.style.display = 'none';
  }


  function seleccionarOpcion(boton, opcion) {
    const preguntaActual = preguntas[indicePregunta];
    const correcta = preguntaActual.correcta;
    const tiempo = (Date.now() - tiempoInicioPregunta) / 1000;
    tiempos.push(tiempo);
  
    const opcionesDOM = document.querySelectorAll('.opcion');
    opcionesDOM.forEach(op => op.style.pointerEvents = 'none');
  
    if (opcion === correcta) {
      boton.classList.add('correcta');
      respuestasCorrectas++;
    
  
      switch (preguntaActual.tipo) {
        case "capital":
        case "fronteras":
          puntajeTotal += 3;
          break;
        case "bandera":
          puntajeTotal += 5;
          break;
        default:
          puntajeTotal += 1;
      }
  
    } else {
      boton.classList.add('incorrecta');
      respuestasIncorrectas++;
  
      opcionesDOM.forEach(op => {
        if (op.innerText === correcta) {
          op.classList.add('correcta');
        }
      });
    }
  
    btnSiguiente.style.display = 'block';
  }

  btnSiguiente.addEventListener('click', () => {
    indicePregunta++;
    if (indicePregunta < preguntas.length) {
      mostrarPregunta();
    } else {
      finalizarJuego();
    }
  });


  btnComenzar.addEventListener('click', async () => {
    if (inputNombre.value.trim() === '') {
      alert('Por favor, ingresa tu nombre');
      return;
    }
  
    nombreUsuario = inputNombre.value.trim();
    await cargarPaises();
    generarPreguntas();
  
    pantallaInicio.classList.remove('activa');
    pantallaPregunta.classList.add('activa');
  
    mostrarPregunta();
  });


  async function finalizarJuego() {
    const totalTiempo = tiempos.reduce((a, b) => a + b, 0);
   
    const promedio = totalTiempo / tiempos.length;
  
    
    await fetch('/guardar-ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombreUsuario,
        correctas: respuestasCorrectas,
        incorrectas: respuestasIncorrectas,
        puntaje: puntajeTotal,
        tiempo: totalTiempo.toFixed(2),
        promedio: promedio.toFixed(2),
        fecha: new Date().toISOString().split('T')[0]
      })
    });
  
    
    document.querySelector('.pantalla-pregunta').classList.remove('activa');
    document.querySelector('.pantalla-final').style.display = 'block';
  
    

    const resultado = `
    <strong>${nombreUsuario}</strong><br>
    Correctas: ${respuestasCorrectas}/10<br>
    Incorrectas: ${respuestasIncorrectas}<br>
    Puntaje total: ${puntajeTotal}<br>
    Tiempo total: ${totalTiempo.toFixed(2)}s<br>
    Promedio por pregunta: ${promedio.toFixed(2)}s
  `;
  document.getElementById('resultado-usuario').innerHTML = resultado;
  
  
    cargarRanking();
  }

 async function cargarRanking() {
  const respuesta = await fetch('/ranking');
  const data = await respuesta.json();


  const tablaRanking = document.querySelector('#tabla-ranking tbody');
  tablaRanking.innerHTML = '';

  data.forEach((item, index) => {
    const fila = document.createElement('tr');
  
    if (index === 0) fila.classList.add('oro');
    else if (index === 1) fila.classList.add('plata');
    else if (index === 2) fila.classList.add('bronce');
  
    fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.nombre}</td>
      <td>${item.correctas}</td>
      <td>${item.incorrectas}</td>
      <td>${item.puntaje}</td>
      <td>${item.tiempo}s</td>
      <td>${item.promedio}s</td>
      <td>${item.fecha}</td>
    `;
    tablaRanking.appendChild(fila);
  });
}

  document.getElementById('btn-reiniciar').addEventListener('click', () => {
    location.reload();
  });

  


btnMostrarRanking.addEventListener('click', () => {
  if (contenedorRanking.classList.contains('mostrar')) {
    contenedorRanking.classList.remove('mostrar');
    btnMostrarRanking.textContent = 'Mostrar Ranking';
  } else {
    contenedorRanking.classList.add('mostrar');
    btnMostrarRanking.textContent = 'Ocultar Ranking';
  }
});
