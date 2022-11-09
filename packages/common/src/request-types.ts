import {DatabaseKeyPair} from "./db";

export interface CreateCalendarRequest {
    readKey: DatabaseKeyPair
    writeKey: DatabaseKeyPair
}

export interface GetCalendarRequest {
    name: string
    lastOperationHash?: string | undefined
}

export interface UpdateCalendarRequest {
    name: string
    encryptedOperation: string
    signature: string
}

export interface DeleteCalendarRequest {
    name: string
    signature: string
}

export type MashRequest = CreateCalendarRequest | GetCalendarRequest | UpdateCalendarRequest | DeleteCalendarRequest;