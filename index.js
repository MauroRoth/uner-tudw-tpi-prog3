import express from "express";
import handlebars from "handlebars";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import path from "path";
import { conexion } from "./db/conexion.js";


const app = express();
//reservas, reservas2025
//Midleware para parchear json en las peticiones
app.use(express.json());

app.get('/estado', (req, res) => {
    //res.json({'ok': true});
    res.status(201).send({ 'estado': true, 'Mensaje': 'Reserva creada!' });
})

app.post('/notificacion', async (req, res) => {
    console.log(req.body);
    const { fecha, salon, turno, correoDestino } = req.body;

    if (!req.body.fecha || !req.body.salon || !req.body.turno || !req.body.correoDestino) {
        res.status(400).send({ 'estado': false, 'Mensaje': 'Faltan datos requeridos' });
    }

    try {
        //me da url del archivo actual, con fileURLToPath convierto en una ruta absoluta 
        // del sistema, la ruta del archivo actual
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const plantilla = path.join(__dirname, 'utils', 'handlebars', 'plantilla.hbs');
        //dirección absoluta plantilla
        //console.log(plantilla);
        //leo plantilla
        const datos = await readFile(plantilla, 'utf-8');
        //compilo plantilla
        const template = handlebars.compile(datos);
        //paso los datos a mi plantilla
        var html = template(
            {
                fecha: fecha,
                salon: salon,
                turno: turno,
                correoDestino: correoDestino
            });

        //console.log(html)


        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

        const opciones = {
            to: correoDestino,
            subject: 'Notificación',
            html: html
        };

        transporter.sendMail(opciones, (error, info) => {
            if (error) {
                console.log(error);
                res.json({ 'ok': false, 'mensaje': 'Error al enviar!' });
            }
            console.log(info);
            res.json({ 'ok': true, 'mensaje': 'Correo enviado!' });
        });

    } catch (error) {
        console.log(error);
    }

    //res.json({'oki': true});
})

//ruta para obtener un salón
app.get('/salones/:salon_id', async (req, res) => {
    try {
        const salon_id = req.params.salon_id;
        const sql = `SELECT * FROM salones WHERE salon_id = ? and activo = ?`;
        //usando sentencias preparadas evitamos la injección sql,
        //los datos del array se vinculan de forma segura a la consulta
        const [results, fields] = await conexion.query(sql, [salon_id, 1]);

        //console.log(results); // results contains rows returned by server
        //console.log(fields); // fields contains extra meta data about results, if available
        res.json({ 'ok': true, 'salon': results });

    } catch (err) {
        console.log(err);
    }

})

//cargamos las variables de entorno que estan definidas en el archivo .env (en el objeto process.env)
process.loadEnvFile();
//Inicio servidor en puerto especificado
app.listen(process.env.PUERTO, () => {
    console.log(`Servidor arriba en Puerto:  ${process.env.PUERTO}`)
})
