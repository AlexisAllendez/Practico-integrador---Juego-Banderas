const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/guardar-ranking', (req, res) => {
  const nuevoResultado = req.body;
  const rutaRanking = path.join(__dirname, 'data', 'ranking.json');

  fs.readFile(rutaRanking, 'utf8', (err, data) => {
    let ranking = [];

    if (!err && data) {
      ranking = JSON.parse(data);
    }

    ranking.push(nuevoResultado);

    fs.writeFile(rutaRanking, JSON.stringify(ranking, null, 2), err => {
      if (err) {
        console.error('Error al guardar ranking:', err);
        return res.status(500).json({ ok: false, error: 'Error al guardar' });
      }

      res.json({ ok: true });
    });
  });
});


app.get('/ranking', (req, res) => {
  const rutaRanking = path.join(__dirname, 'data', 'ranking.json');

  fs.readFile(rutaRanking, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer ranking:', err);
      return res.status(500).json({ ok: false, error: 'No se pudo leer el ranking' });
    }

    let ranking = JSON.parse(data || '[]');

    
    ranking.sort((a, b) => {
      if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
      return a.tiempo - b.tiempo;
    });

    res.json(ranking);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

