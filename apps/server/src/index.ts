import express, {Router} from "express"
import {AllowedSchema, Validator} from "express-json-validator-middleware"
import {MashMongoDatabase} from "./db"
import bodyParser from "body-parser"
import {MashRouteHandler} from "./route-handler";
import {GetCalendarRequest, MashServer, requestSchemas} from "common";

const {
    MASH_MONGODB_USER,
    MASH_MONGODB_PASSWORD,
    MASH_MONGODB_HOST,
    MASH_MONGODB_PORT,
    MASH_MONGODB_NAME,
    MASH_PORT,
    MASH_API_BASE_PATH,
    MASH_FRONTEND_BASE_PATH
} = process.env

function mashApiExpressRouter(routeHandler: MashRouteHandler): Router {
    let router = express.Router()
    const { validate } = new Validator({})

    router.use(bodyParser.json())

    router.post(
        "/calendar",
        validate({ body: requestSchemas.definitions.CreateCalendarRequest as AllowedSchema }),
        async (req, res) => routeHandler.calendar_POST(req, res)
    )

    router.get(
        "/calendar",
        validate({ query: requestSchemas.definitions.GetCalendarRequest as AllowedSchema }),
        async (req, res) => routeHandler.calendar_GET(req as unknown as {query: GetCalendarRequest}, res)
    )

    router.put(
        "/calendar",
        validate({ body: requestSchemas.definitions.UpdateCalendarRequest as AllowedSchema }),
        async (req, res) => routeHandler.calendar_PUT(req, res)
    )

    router.delete(
        "/calendar",
        validate({ body: requestSchemas.definitions.DeleteCalendarRequest as AllowedSchema }),
        async (req, res) => routeHandler.calendar_DELETE(req, res)
    )

    router.use((err, req, res, next) => {
        console.log("Error Handling Middleware called")
        if (res.headersSent) {
            return next(err)
        }
        res.status(500)
        res.json({ error: err })
    })

    return router
}
async function serve() {
    if (!MASH_API_BASE_PATH)
        throw new Error("API base path not set")

    if (!MASH_PORT)
        throw new Error("Port not set")

    const database = new MashMongoDatabase(`mongodb://${MASH_MONGODB_USER}:${MASH_MONGODB_PASSWORD}@${MASH_MONGODB_HOST}:${MASH_MONGODB_PORT}/${MASH_MONGODB_NAME}?authSource=admin`)
    await database.connect()
    const server = new MashServer(database)
    const routeHandler = new MashRouteHandler(server)

    const app = express()

    const apiRouter = mashApiExpressRouter(routeHandler)
    app.use(MASH_API_BASE_PATH, apiRouter)

    app.listen(MASH_PORT, function () {
        console.log('Mash express server now listening on port', MASH_PORT)
    })
}

serve()
