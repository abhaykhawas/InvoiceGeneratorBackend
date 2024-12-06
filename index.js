const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors")
const cookieParser = require("cookie-parser");
require('dotenv').config()
const app = express()
const authRoute = require('./Routes/AuthRoute')
const mainRoute = require('./Routes/mainRoute')
const { PORT, MONGO_URI } = process.env

mongoose.connect(MONGO_URI).then(() => console.log("MONGODB is Connected successfully")).catch((err) => console.error(err))

app.use(
    cors({
        credentials: true,
        origin: ['*'],
        methods: ['GET','POST','PUT', 'DELETE']
    })
)
app.use(cookieParser());

app.use(express.json())

app.get('/', (req, res) => {
    res.send("Hello")
})

app.use('/api/v1/', authRoute)

app.use('/api/v1/', mainRoute)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})