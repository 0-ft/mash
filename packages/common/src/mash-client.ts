import fetch from 'cross-fetch';
import {
    CreateCalendarRequest,
    DeleteCalendarRequest,
    GetCalendarRequest,
    MashRequest,
    UpdateCalendarRequest
} from "./request-types";
import {MashServer} from "./mash-server";
import {logger} from "./logger";
import {DatabaseCalendar} from "./db";
import qs from 'qs';

export type MashEvent = {
    id: string,
    title: string,
    description: string | undefined,
    startDate: Date,
    endDate: Date,
}

function serializeMashRequest(req: MashRequest): string {
    return JSON.stringify(req);
}

function deserializeMashRequest(req: string): any {
    return JSON.parse(req);
}

function serializeMashResponse(res: any): string {
    return JSON.stringify(res);
}

function deserializeMashResponse(res: string): any {
    const result = JSON.parse(res);
    if (result.errors !== undefined) {
        throw new Error(result.errors);
    }
    return result;
}


/**
 * MashApiClients are responsible for fetching data, and nothing else.
 */
export interface MashApiClient {
    getCalendar(req: GetCalendarRequest): Promise<DatabaseCalendar>,

    createCalendar(req: CreateCalendarRequest): Promise<DatabaseCalendar>,

    updateCalendar(req: UpdateCalendarRequest): Promise<void>,

    deleteCalendar(req: DeleteCalendarRequest): Promise<void>
}

export class MashLocalClient implements MashApiClient {
    constructor(private server: MashServer) {
    }

    createCalendar(req: CreateCalendarRequest): Promise<DatabaseCalendar> {
        const serDeser = deserializeMashRequest(serializeMashRequest(req));
        return this.server.createCalendar(serDeser);
    }

    getCalendar(req: GetCalendarRequest): Promise<DatabaseCalendar> {
        const serDeser = deserializeMashRequest(serializeMashRequest(req));
        return this.server.getCalendar(req);
    }

    updateCalendar(req: UpdateCalendarRequest): Promise<void> {
        const serDeser = deserializeMashRequest(serializeMashRequest(req));
        return this.server.updateCalendar(req);
    }

    deleteCalendar(req: DeleteCalendarRequest): Promise<void> {
        const serDeser = deserializeMashRequest(serializeMashRequest(req));
        return this.server.deleteCalendar(req);
    }
}

/**
 * The REST client is responsible for fetching data, and nothing else.
 */
export class MashRestClient implements MashApiClient {
    constructor(private basePath: string) {
    }

    log(message: string): void {
        logger.info(`MashRestClient: ${message}`);
    }

    async request(path: string, method: "POST" | "GET" | "PUT" | "DELETE", body: MashRequest) {
        let result: Response;
        if (method == "GET") {
            const searchParams = qs.stringify(body);
            result = await fetch(`${this.basePath}/${path}?${searchParams}`, {
                method,
                headers: {'content-type': 'application/json;charset=UTF-8'}
            });
        } else {
            result = await fetch(`${this.basePath}/${path}`, {
                method,
                headers: {'content-type': 'application/json;charset=UTF-8'},
                body: serializeMashRequest(body)
            });
        }
        if(result.status != 200) {
            throw new Error(await result.text())
        }
        const done = await result.text();
        // logger.info(done);
        return deserializeMashResponse(done);
    }

    async createCalendar(req: CreateCalendarRequest): Promise<DatabaseCalendar> {
        this.log(`createCalendar`)
        return await this.request("calendar", "POST", req);
    }

    async getCalendar(req: GetCalendarRequest): Promise<DatabaseCalendar> {
        this.log(`getCalendar`)
        return await this.request("calendar", "GET", req);
    }

    async updateCalendar(req: UpdateCalendarRequest) {
        this.log(`updateCalendar`)
        return await this.request("calendar", "PUT", req);
    }

    async deleteCalendar(req: UpdateCalendarRequest) {
        this.log(`deleteCalendar`)
        return await this.request("calendar", "DELETE", req);
    }
}
