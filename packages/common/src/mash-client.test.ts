import {MashLocalClient} from "./mash-client";
import {MashLocalDatabase} from "./db";
import {decryptKeyPair, encryptAndSignOperation, generateDatabaseZKKeyPair} from "./mash-crypto";
import {MashServer} from "./mash-server";
import {CreateCalendarRequest, GetCalendarRequest, UpdateCalendarRequest} from "./request-types";
import {ModifyCalendarOperation} from "./operations";

test("client integration test - raw requests", async () => {
    const readPassphrase = "i can read";
    const encryptedReadKeys = generateDatabaseZKKeyPair(readPassphrase);
    const readKeys = decryptKeyPair(encryptedReadKeys, readPassphrase);

    const writePassphrase = "i can write";
    const encryptedWriteKeys = generateDatabaseZKKeyPair(writePassphrase);
    const writeKeys = decryptKeyPair(encryptedWriteKeys, writePassphrase);

    const db = new MashLocalDatabase();
    const server = new MashServer(db);
    const client = new MashLocalClient(server);

    const createCalendarRequest: CreateCalendarRequest = {
        readKey: encryptedReadKeys,
        writeKey: encryptedWriteKeys,
    }
    const createdCalendar = await client.createCalendar(createCalendarRequest);
    const getCalendarRequest: GetCalendarRequest = {
        name: createdCalendar.name
    }
    const fetchedCalendar = await client.getCalendar(getCalendarRequest);
    expect(fetchedCalendar).toEqual(createdCalendar);

    const changeTitleOperation: ModifyCalendarOperation = {
        kind: "modifyCalendar",
        title: "special calendar title",
        description: undefined
    };

    const encryptedOperation = encryptAndSignOperation(changeTitleOperation, fetchedCalendar.initialChallenge, readKeys, writeKeys)
    const updateCalendarRequest: UpdateCalendarRequest = {
        name: createdCalendar.name,
        encryptedOperation: encryptedOperation.encryptedOperation.toString("base64"),
        signature: encryptedOperation.signature.toString("base64"),
    }

    await client.updateCalendar(updateCalendarRequest);

    const fetchedCalendar2 = await client.getCalendar(getCalendarRequest);
    expect(fetchedCalendar2.operations.length).toBe(1);

    // const deleteCalendarSignature = createCalendarActionSignature(fetchedCalendar2.initialChallenge, writeKeys)
    // const deleteCalendarRequest: DeleteCalendarRequest = {
    //     lastOperationHash: "", name: "", signature: ""
    // }
});
