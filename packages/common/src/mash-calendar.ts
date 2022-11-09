import {decodePublicKey, decryptKeyPair, MashReaderKeys, MashWriterKeys} from "./mash-crypto";
import {DeleteEventOperation, MashOperation, MashOperationSequence, ModifyEventOperation} from "./operations";
import {logger} from "./logger";
import {MashApiClient, MashEvent} from "./mash-client";
import {DeleteCalendarRequest, UpdateCalendarRequest} from "./request-types";
import {DatabaseOperation} from "./db";

/**
 * Stateful accessor for calendar over API
 */
export class MashCalendarAccess {
    calendarState: MashCalendarState = new MashCalendarState();

    private opSequence: MashOperationSequence;

    constructor(private api: MashApiClient, public calendarName: string) {
    }

    log(message: string): void {
        logger.info(`MashCalendarAccess: ${message}`);
    }


    async setup(readPassword: string, writePassword?: string) {
        const dbCalendar = await this.api.getCalendar({name: this.calendarName});

        let keys: (MashReaderKeys & { canWrite: false }) | (MashWriterKeys & { canWrite: true });

        //TODO: rethrow errors for readkeys and writekeys to indicate which failed
        if (writePassword) {
            keys = {
                readKeys: decryptKeyPair(dbCalendar.readKey, readPassword),
                writeKeys: decryptKeyPair(dbCalendar.writeKey, writePassword),
                canWrite: true
            }
        } else {
            keys = {
                readKeys: decryptKeyPair(dbCalendar.readKey, readPassword),
                writeKeys: {
                    publicKey: decodePublicKey(dbCalendar.writeKey)
                },
                canWrite: false
            }
        }
        this.opSequence = new MashOperationSequence(keys, dbCalendar.initialChallenge);
    }

    /**
     * update local calendar state with a set of operations received from server
     * @returns number of operations applied
     */
    private sync(receivedOperations: Array<DatabaseOperation>): number {
        const currentOpIndex = receivedOperations.findIndex(op => op.hash == this.opSequence.lastOpHash);
        const newOperations = receivedOperations
            .slice(currentOpIndex + 1);
        const operationsToApply = newOperations
            .map(op => this.opSequence.receiveOperation(op));
        logger.debug(`applying ${operationsToApply.length} operations of ${receivedOperations.length} received, ${newOperations.length} new`);
        operationsToApply.forEach(op => this.calendarState.applyOperation(op));
        return operationsToApply.length;
    }

    /**
     * fetch the calendar from server and update local calendar state
     * @returns number of operations applied
     */
    async pull(forceReset = false): Promise<number> {
        //TODO: implement forceReset
        let lastOpHash = this.opSequence.lastOpHash;
        if (forceReset) {
            this.opSequence.clear()
            lastOpHash = undefined;
        }

        const dbCalendar = await this.api.getCalendar({
            name: this.calendarName,
            lastOperationHash: lastOpHash
        });
        return this.sync(dbCalendar.operations);
    }

    async putOperation(op: MashOperation): Promise<void> {
        const encryptedSignedOperation = this.opSequence.signOperation(op);
        const req: UpdateCalendarRequest = {
            name: this.calendarName,
            encryptedOperation: encryptedSignedOperation.encryptedOperation.toString("base64"),
            signature: encryptedSignedOperation.signature.toString("base64"),
        }
        return this.api.updateCalendar(req);
    }

    async deleteCalendar(): Promise<void> {
        const signature = this.opSequence.makeActionSignature().toString("base64");
        const req: DeleteCalendarRequest = {
            name: this.calendarName,
            signature
        }
        return this.api.deleteCalendar(req);
    }

}

export class MashCalendarState {
    title = "untitled";
    description = "";
    events: Array<MashEvent> = [];

    findEvent(id: string): MashEvent | undefined {
        return this.events.find(event => event.id == id);
    }

    applyOperation(op: MashOperation): void {
        switch (op.kind) {
            case "createEvent":
                this.events.push(op.event);
                break;
            case "deleteEvent":
                this.events = this.events.filter(event => event.id != (op as DeleteEventOperation).eventId);
                break;
            case "modifyEvent":
                const target = this.findEvent((op as ModifyEventOperation).eventId);
                if (target) {
                    target.title = (op as ModifyEventOperation).title || target.title;
                    target.description = (op as ModifyEventOperation).description || target.description;
                    target.startDate = (op as ModifyEventOperation).startDate || target.startDate;
                    target.endDate = (op as ModifyEventOperation).endDate || target.endDate;
                }
                break;
            case "modifyCalendar":
                this.title = op.title || this.title;
                this.description = op.description || this.description;
                break;
        }
    }

    // static fromOperationSequence(operations: Array<MashOperation>): MashCalendarState {
    //     const result = new MashCalendarState();
    //     for (const op of operations) {
    //         result.applyOperation(op);
    //     }
    //     return result;
    // }

}
