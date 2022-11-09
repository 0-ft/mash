import {MashEvent} from "./mash-client";
import assert from "assert";
import {
    createCalendarActionSignature,
    decryptOperation,
    encryptAndSignOperation,
    makeOperationHash,
    MashReaderKeys,
    MashWriterKeys,
    verifyOperationSignature
} from "./mash-crypto";
import {logger} from "./logger";
import {DatabaseOperation} from "./db";

export type CreateEventOperation = {
    kind: "createEvent",
    event: MashEvent
}

export type DeleteEventOperation = {
    kind: "deleteEvent",
    eventId: string
}

export type ModifyEventOperation = {
    //     [Property in keyof MashEvent]?: MashEvent[Property];
    // } & {
    kind: "modifyEvent",
    eventId: string,
    title?: string | undefined,
    description?: string | undefined,
    startDate?: Date | undefined,
    endDate?: Date | undefined,
};

export type ModifyCalendarOperation = {
    kind: "modifyCalendar",
    title?: string | undefined,
    description?: string | undefined
}

export type MashOperation = (CreateEventOperation | DeleteEventOperation | ModifyEventOperation | ModifyCalendarOperation)

export function serializeOperation(op: MashOperation) {
    return JSON.stringify(op);
}

export function deserializeOperation(data: Buffer): MashOperation {
    const json = JSON.parse(data.toString());
    switch (json.kind) {
        case "createEvent":
            return {
                kind: "createEvent",
                event: {
                    id: json.event.id,
                    title: json.event.title,
                    description: json.event.description,
                    startDate: new Date(json.event.startDate),
                    endDate: new Date(json.event.endDate),
                },
                // lastOperationHash: json.lastOperationHash
            }
        case "deleteEvent":
            return {
                kind: "deleteEvent",
                eventId: json.eventId,
                // lastOperationHash: json.lastOperationHash
            }
        case "modifyEvent":
            return {
                kind: "modifyEvent",
                eventId: json.eventId,
                title: json.title,
                description: json.description,
                startDate: json.startDate ? new Date(json.startDate) : undefined,
                endDate: json.endDate ? new Date(json.endDate) : undefined,
                // lastOperationHash: json.lastOperationHash
            }
        case "modifyCalendar":
            return {
                kind: "modifyCalendar",
                title: json.title,
                description: json.description,
                // lastOperationHash: json.lastOperationHash
            }
    }
    throw new Error("couldn't parse operation");
}

/**
 * Stateful. Receives encrypted, signed, hash-chained operations and decrypts. Does not store contents.
 */
export class MashOperationSequence {
    // private databaseOperations: Array<DatabaseOperation>;
    // private operations: Array<MashOperation>;

    lastOpHash: string | undefined = undefined;

    constructor(private keys: (MashReaderKeys & { canWrite: false }) | (MashWriterKeys & { canWrite: true }), private initialChallenge: string) {
    }

    log(message: string): void {
        logger.info(`MashOperationSequence: ${message}`);
    }

    private getActionChallenge(): string {
        return this.lastOpHash === undefined ? this.initialChallenge : this.lastOpHash;
    }

    /**
     * - verify op signature with write private key
     * - decrypt op with read private key
     * throw if either bad
     * @param dbOp
     */
    receiveOperation(dbOp: DatabaseOperation): MashOperation {
        const op = Buffer.from(dbOp.encryptedOperation, "base64");
        const sig = Buffer.from(dbOp.signature, "base64");
        this.log(`receiving op, actionChallenge ${this.getActionChallenge()}`);
        const signatureCorrect = verifyOperationSignature(op, this.getActionChallenge(), this.keys.writeKeys.publicKey, sig);
        assert(signatureCorrect, "operation signature incorrect");
        const decrypted = decryptOperation(op, this.keys.readKeys);
        this.lastOpHash = makeOperationHash(op);
        return decrypted;
    }

    /**
     * encrypt and sign an operation, including the current action challenge
     * @param op
     */
    signOperation(op: MashOperation): { encryptedOperation: Buffer, signature: Buffer } {
        this.log(`signing ${op.kind}, actionChallenge ${this.getActionChallenge()}`)
        assert(this.keys.canWrite, "cannot write");
        return encryptAndSignOperation(op, this.getActionChallenge(), this.keys.readKeys, this.keys.writeKeys);
    }

    /**
     * generate an action signature (for e.g. deleteCalendar) with current action challenge
     */
    makeActionSignature(): Buffer {
        this.log(`making action sig`)
        assert(this.keys.canWrite, "cannot write");
        return createCalendarActionSignature(this.getActionChallenge(), this.keys.writeKeys);
    }

    /**
     * Reset to initial state (e.g. when cache is cleared)
     */
    clear(): void {
        this.lastOpHash = undefined;
    }

}
