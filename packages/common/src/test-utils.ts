import {MashApiClient, MashEvent, MashLocalClient, MashRestClient} from "./mash-client";
import randomWords from "random-words";
import {
    CreateCalendarRequest,
    decryptKeyPair,
    generateDatabaseZKKeyPair,
    GetCalendarRequest, logger,
    MashLocalDatabase,
    MashServer
} from "@mash/common";

export const randomEvent: () => MashEvent = () => {
    const words = randomWords({exactly: 3});
    const start = Math.random() * 100000000;
    return {
        id: words.join("-"),
        title: `my '${randomWords({exactly: 3}).join(" ")}' event`,
        description: `i would describe my event as '${words.join(", ")}'!`,
        startDate: new Date(start),
        endDate: new Date(start + Math.random() * 1000000),
    }
}

export function makeTestingKeys() {
    const readPassphrase = "i can read";
    const encryptedReadKeys = generateDatabaseZKKeyPair(readPassphrase);
    const readKeys = decryptKeyPair(encryptedReadKeys, readPassphrase);

    const writePassphrase = "i can write";
    const encryptedWriteKeys = generateDatabaseZKKeyPair(writePassphrase);
    const writeKeys = decryptKeyPair(encryptedWriteKeys, writePassphrase);
    return {
        readPassphrase,
        encryptedReadKeys,
        readKeys,

        writePassphrase,
        encryptedWriteKeys,
        writeKeys
    }
}

export function makeTestingClient(): MashApiClient {
    // const db = new MashLocalDatabase();
    // const server = new MashServer(db);
    // const client = new MashLocalClient(server);
    // return {
    //     db,
    //     server,
    //     client
    // }
    return new MashRestClient("http://localhost:8080/api")

}

export async function makeTestingCalendar() {
    const keys = makeTestingKeys();
    const client = makeTestingClient();
    const createCalendarRequest: CreateCalendarRequest = {
        readKey: keys.encryptedReadKeys,
        writeKey: keys.encryptedWriteKeys,
    }
    const createdCalendar = await client.createCalendar(createCalendarRequest);

    logger.info(`created test calendar ${createdCalendar.name}`);

    // // fetch the same calendar and verify exists
    // const getCalendarRequest: GetCalendarRequest = {
    //     name: createdCalendar.name
    // }

    return {
        keys,
        client,
        calendar: createdCalendar
    };
}