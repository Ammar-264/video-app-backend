import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

app.use(cors(
    {
        // which origin can access our server
        // origin:process.env.CORS_ORIGIN 
    }
))

app.use(express.urlencoded({
    extended:true
}))
app.use(express.json())

app.use(express.static('../public'))
app.use(cookieParser())

export {app}