import {
    CreateCalendarRequest,
    DeleteCalendarRequest,
    GetCalendarRequest,
    UpdateCalendarRequest
} from "common/src/request-types";
import {logger, MashServer} from "common";

/**
 * Express handler that processes requests from express and triggers actions in a MashServer.
 */
export class MashRouteHandler {

    server: MashServer

    constructor(server: MashServer) {
        this.server = server
    }

    log(message: string): void {
        logger.info(`MashRouteHandler: ${message}`);
    }

    /**
     * Handle POST request to /calendar
     * @param req Express request
     * @param res Express response
     */
    async calendar_POST(req: { body: CreateCalendarRequest }, res: any) {
        this.log("calendar_POST")
        let calendar = await this.server.createCalendar(req.body)
        // let response: CreateCalendarResponse = {
        //     // data: calendar
        // }
        res.json(calendar)
    }

    /**
     * Handle GET request to /calendar
     * @param req Express request
     * @param res Express response
     */
    async calendar_GET(req: { query: GetCalendarRequest }, res: any) {
        this.log("calendar_GET")
        return this.server.getCalendar(req.query).then(cal => res.json(cal))
                    // res.json(calendar)
    }

    /**
     * Handle PUT request to /calendar
     * @param req Express request
     * @param res Express response
     */
    async calendar_PUT(req: { body: UpdateCalendarRequest }, res: any) {
        this.log("calendar_PUT")
        //TODO: sort out error responses
        this.server.updateCalendar(req.body).then(res.json({success: true})).catch(err => {console.log(err); res.json({success: false})});
    }

    /**
     * Handle DELETE request to /calendar
     * @param req Express request
     * @param res Express response
     */
    async calendar_DELETE(req: { body: DeleteCalendarRequest }, res: any) {
        this.log("calendar_DELETE")
        this.server.deleteCalendar(req.body).then(res.json({success: true})).catch(err => res.json({success: false}));

        // res.json(result)
    }
}
