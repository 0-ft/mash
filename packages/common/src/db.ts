import {makeOperationHash} from "./mash-crypto";
import {logger} from "./logger";

export interface DatabaseOperation {
    timestamp: Date
    encryptedOperation: string
    signature: string
    hash: string
}

/**
 * A public-private key pair as stored by the server -
 * the public key is plaintext but the private key is encrypted with a passphrase unknown to the server
 */
export interface DatabaseKeyPair {
    publicKey: string
    encryptedPrivateKey: string
}

/**
 * Type definition for a calendar stored in the database
 */
export interface DatabaseCalendar {
    name: string

    readKey: DatabaseKeyPair,
    writeKey: DatabaseKeyPair,

    operations: Array<DatabaseOperation>,

    initialChallenge: string
}

// export function serializeDatabaseOperation(dbOperation: DatabaseOperation): { timestamp: Date, encryptedOperation: string, signature: string, hash: string } {
//     return {
//         timestamp: JSON.stringify(dbOperation.timestamp),
//         encryptedOperation: Base
//     }
// }
//
// export function serializeDatabaseCalendar(dbCalendar: DatabaseCalendar) {
//
// }

/**
 * Get the current calendar action challenge. If there are any operations, this is the most recent operation hash.
 * Otherwise, it is the calendar's initialChallenge
 * @param calendar
 * @private
 */
export function getCalendarActionChallenge(calendar: DatabaseCalendar) {
    return calendar.operations.length > 0
        ? makeOperationHash(Buffer.from(calendar.operations[calendar.operations.length - 1].encryptedOperation, "base64"))
        : calendar.initialChallenge;
}

export interface MashDatabase {
    connect(): Promise<void>

    addCalendar(calendar: DatabaseCalendar): Promise<void>

    findCalendar(name: string, publicKey?: string): Promise<DatabaseCalendar>

    updateCalendar(name: string, operation: DatabaseOperation): Promise<void>

    deleteCalendar(name: string): Promise<void>
}

export class MashLocalDatabase implements MashDatabase {
    private calendars: Array<DatabaseCalendar> = [];

    connect() {
        return Promise.resolve();
    }

    async addCalendar(calendar: DatabaseCalendar): Promise<void> {
        if (this.calendars.find(cal => cal.name == calendar.name)) {
            throw new Error("name already taken");
        }
        this.calendars.push(calendar);
    }

    async findCalendar(name: string, readPublicKey?: string): Promise<DatabaseCalendar> {
        const calendar = (readPublicKey === undefined)
            ? this.calendars.find(cal => cal.name == name)
            : this.calendars.find(cal => cal.name == name && cal.readKey.publicKey)
        if (!calendar) {
            throw new Error("calendar not found");
        }
        return calendar;
    }

    async updateCalendar(name: string, operation: DatabaseOperation): Promise<void> {
        const calendar = this.calendars.find(cal => cal.name == name);
        if (!calendar) {
            throw new Error("calendar not found");
        }
        calendar.operations.push(operation);
        return Promise.resolve();
    }

    async deleteCalendar(name: string): Promise<void> {
        const index = this.calendars.findIndex(cal => cal.name == name);
        if (index == -1) {
            throw new Error("calendar not found");
        }
        logger.info(`db deleting ${name}`)
        this.calendars.splice(index, 1);
        return Promise.resolve();
    }

}
