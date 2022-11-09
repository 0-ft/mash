import randomWords from "random-words"
import assert from "assert";
import {
    decodePublicKey,
    generateActionChallenge,
    makeOperationHash,
    verifyCalendarActionSignature,
    verifyOperationSignature
} from "./mash-crypto";
import {CreateCalendarRequest, DeleteCalendarRequest, GetCalendarRequest, UpdateCalendarRequest} from "./request-types";
import {DatabaseCalendar, DatabaseOperation, getCalendarActionChallenge, MashDatabase} from "./db";
import {logger} from "./logger";

export class MashServer {

    database: MashDatabase

    constructor(database: MashDatabase) {
        this.database = database
        logger.info("constructed mash server")
    }

    log(message: string): void {
        logger.info(`MashServer: ${message}`);
    }

    /**
     * Generate a new calendar name that is not taken
     * @returns The generated name
     */
    private async newCalendarName(): Promise<string> {
        const name = randomWords({exactly: 3}).join("-")
        return this.database.findCalendar(name)
            .then(() => this.newCalendarName())
            .catch(() => name)
    }

    /**
     * Create a new calendar
     * @param request
     * @returns The created calendar (including generated name)
     * @throws If the operation failed
     */
    async createCalendar(request: CreateCalendarRequest): Promise<DatabaseCalendar> {
        this.log(`entering createCalendar`)
        const newName = await this.newCalendarName()
        const calendar: DatabaseCalendar = {
            name: newName,
            readKey: request.readKey,
            writeKey: request.writeKey,
            operations: [],
            initialChallenge: generateActionChallenge()
        }
        await this.database.addCalendar(calendar)
        this.log(`finished createCalendar ${newName}`)
        return calendar;
    }

    /**
     * Get a calendar by name
     * @param request
     * @returns The matching calendar
     * @throws If no matching calendar was found
     */
    async getCalendar(request: GetCalendarRequest): Promise<DatabaseCalendar> {
        this.log(`entering getCalendar ${request.name}`);
        const calendar = await this.database.findCalendar(request.name)
        if (request.lastOperationHash !== undefined) {
            return {
                initialChallenge: calendar.initialChallenge,
                name: calendar.name,
                operations: calendar.operations.slice(calendar.operations.findIndex((op => op.hash == request.lastOperationHash)) + 1),
                readKey: calendar.readKey,
                writeKey: calendar.writeKey
            }
        }
        this.log(`finished getCalendar ${request.name}`);
        return calendar;
    }

    /**
     * Add an (encrypted) operation to a calendar's operation list
     * - Find the calendar by name
     * - Verify that the operation signature is correct
     * - Push the operation
     * - Update the action challenge
     * @throws If the operation failed
     * @param request
     */
    async updateCalendar(request: UpdateCalendarRequest) {
        this.log(`entering updateCalendar ${request.name}`);
        const calendar = await this.database.findCalendar(request.name)

        const operationChallenge = getCalendarActionChallenge(calendar)

        const encryptedOperation = Buffer.from(request.encryptedOperation, "base64");
        const signature = Buffer.from(request.signature, "base64");
        const writePublicKey = decodePublicKey(calendar.writeKey);
        if (!verifyOperationSignature(encryptedOperation, operationChallenge, writePublicKey, signature))
            throw new Error("signature incorrect")

        const databaseOperation: DatabaseOperation = {
            timestamp: new Date(),
            encryptedOperation: request.encryptedOperation,
            signature: request.signature,
            hash: makeOperationHash(encryptedOperation)
        }
        await this.database.updateCalendar(request.name, databaseOperation)
        this.log(`finished updateCalendar ${request.name}`);
    }

    /**
     * Add an (encrypted) operation to a calendar's operation list
     * @throws If the operation failed
     * @param request
     */
    async deleteCalendar(request: DeleteCalendarRequest) {
        this.log(`entering deleteCalendar ${request.name}`);
        const calendar = await this.database.findCalendar(request.name)

        const writePublicKey = decodePublicKey(calendar.writeKey);
        const signature = Buffer.from(request.signature, "base64");
        const actionChallenge = getCalendarActionChallenge(calendar);
        assert(verifyCalendarActionSignature(actionChallenge, writePublicKey, signature), "signature incorrect")

        await this.database.deleteCalendar(request.name)
        this.log(`finished deleteCalendar ${request.name}`);
    }

}
