const express = require('express');
const app = express(),
      port = 3080;

app.get('/', (req,res) => {
    res.send(`
        <h1>Bienvenido a mi Aplicación</h1>
        <p>Estás experimentando una increíble aplicación.</p>
        <table border="1">
            <tr>
                <th>Nombre</th>
                <th>Edad</th>
            </tr>
            <tr>
                <td>John Doe</td>
                <td>30</td>
            </tr>
            <tr>
                <td>Jane Smith</td>
                <td>28</td>
            </tr>
        </table>
    `);
});

app.get('/time', (req,res) => {
    const now = new Date();
    res.send(`
        <h1>La Hora Actual</h1>
        <p>La hora actual es: ${now.toLocaleString()}</p>
        <table border="1">
            <tr>
                <th>Día</th>
                <th>Mes</th>
                <th>Año</th>
            </tr>
            <tr>
                <td>${now.getDate()}</td>
                <td>${now.getMonth() + 1}</td>
                <td>${now.getFullYear()}</td>
            </tr>
        </table>
    `);
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ::${port}`);
});
