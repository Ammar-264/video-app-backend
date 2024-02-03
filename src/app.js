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


// import routes
import userRoutes from './routes/user.routes.js'
import videoRoutes from './routes/video.routes.js'
import subscriptionRoutes from './routes/subscription.routes.js'


// routes declaration

app.use('/api/v1/users' , userRoutes)
app.use('/api/v1/videos' ,  videoRoutes)
app.use('/api/v1/subscription' ,  subscriptionRoutes)

export {app}