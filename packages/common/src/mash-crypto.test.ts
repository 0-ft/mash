import {ModifyEventOperation} from "./operations";
import {
    createCalendarActionSignature,
    decryptKeyPair,
    decryptOperation,
    encryptAndSignOperation,
    generateDatabaseZKKeyPair,
    verifyCalendarActionSignature,
    verifyOperationSignature
} from "./mash-crypto";

test("generate keypair, decrypt keypair", () => {
    const encryptedKeyPair = generateDatabaseZKKeyPair("my secret key");
    expect(() => decryptKeyPair(encryptedKeyPair, "my secret key")).not.toThrow();
    expect(() => decryptKeyPair(encryptedKeyPair, "wrong key")).toThrow();
})

test("encrypt, sign, verify, decrypt operation", () => {
    const op: ModifyEventOperation = {
        kind: "modifyEvent",
        eventId: "some-event-id",
        title: "My Event Title",
        description: "A very cool event",
        startDate: new Date(),
        endDate: new Date(new Date().getDate() + 1000),
    }
    const readPassphrase = "i can read";
    const encryptedReadKeys = generateDatabaseZKKeyPair(readPassphrase);
    const readKeys = decryptKeyPair(encryptedReadKeys, readPassphrase);

    const writePassphrase = "i can write";
    const encryptedWriteKeys = generateDatabaseZKKeyPair(writePassphrase);
    const writeKeys = decryptKeyPair(encryptedWriteKeys, writePassphrase);

    const operationChallenge = "last-op-hash";
    const encryptedAndSigned = encryptAndSignOperation(op, operationChallenge, readKeys, writeKeys);

    expect(verifyOperationSignature(encryptedAndSigned.encryptedOperation, operationChallenge, writeKeys.publicKey, encryptedAndSigned.signature));
    expect(verifyOperationSignature(Buffer.from("wrong operation"), operationChallenge, writeKeys.publicKey, encryptedAndSigned.signature)).toBeFalsy();
    expect(verifyOperationSignature(encryptedAndSigned.encryptedOperation, "wrong last op hash", writeKeys.publicKey, encryptedAndSigned.signature)).toBeFalsy();
    expect(verifyOperationSignature(encryptedAndSigned.encryptedOperation, operationChallenge, writeKeys.publicKey, Buffer.from("wrong signature"))).toBeFalsy();

    const decryptedOperation = decryptOperation(encryptedAndSigned.encryptedOperation, readKeys);
    expect(decryptedOperation).toEqual(op);
})

test("create and verify calendar action signature", () => {
    const readPassphrase = "i can read";
    const encryptedReadKeys = generateDatabaseZKKeyPair(readPassphrase);
    const readKeys = decryptKeyPair(encryptedReadKeys, readPassphrase);

    const writePassphrase = "i can write";
    const encryptedWriteKeys = generateDatabaseZKKeyPair(writePassphrase);
    const writeKeys = decryptKeyPair(encryptedWriteKeys, writePassphrase);

    const actionChallenge = "action-challenge";
    const signature = createCalendarActionSignature(actionChallenge, writeKeys);

    expect(verifyCalendarActionSignature(actionChallenge, writeKeys.publicKey, signature));
    expect(verifyCalendarActionSignature("wrong action challenge", writeKeys.publicKey, signature));
    expect(verifyCalendarActionSignature(actionChallenge, writeKeys.publicKey, Buffer.from("wrong signature")));
})