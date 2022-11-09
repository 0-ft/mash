import {
    createHash,
    createPrivateKey,
    createPublicKey,
    generateKeyPairSync,
    KeyObject, privateDecrypt,
    publicEncrypt,
    sign,
    verify
} from "crypto";
import {v4 as uuidv4} from 'uuid';
import {DatabaseKeyPair} from "./db";
import {deserializeOperation, MashOperation, serializeOperation} from "./operations";

export interface MashKeyPair {
    publicKey: KeyObject,
    privateKey: KeyObject
}

/**
 * Keys that read-only clients have
 */
export interface MashReaderKeys {
    readKeys: MashKeyPair,
    writeKeys: {
        publicKey: KeyObject
    }
}

/**
 * Keys that read-write clients have
 */
export interface MashWriterKeys {
    readKeys: MashKeyPair,
    writeKeys: MashKeyPair
}

//TODO: do we need to salt/use a KDF? or does generateKeyPair handle that?
export function generateDatabaseZKKeyPair(passphrase: string): DatabaseKeyPair {
    // let derivedKey = pbkdf2Sync(password, "", 10000, 128, "SHA256")
    const keyPair = generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: passphrase
        }
    })
    return {
        publicKey: keyPair.publicKey,
        encryptedPrivateKey: keyPair.privateKey
    }
}

export function decryptKeyPair(encryptedKeyPair: DatabaseKeyPair, passphrase: string): MashKeyPair {
    const privateKey = createPrivateKey({
        key: encryptedKeyPair.encryptedPrivateKey,
        type: 'pkcs8',
        format: 'pem',
        passphrase: passphrase
    });
    return {
        publicKey: createPublicKey(privateKey),
        privateKey: privateKey
    }
}

export function decodePublicKey(encryptedKeyPair: DatabaseKeyPair): KeyObject {
    return createPublicKey(encryptedKeyPair.publicKey);
}

// export function decryptPrivateKey(encryptedKey: string, passphrase: string) {
//     return createPrivateKey({
//         key: encryptedKey,
//         type: 'pkcs8',
//         format: 'pem',
//         passphrase: passphrase
//     });
// }

/*
Functions only by privileged client
 */

export function encryptAndSignOperation(op: MashOperation, operationChallenge: string, readKeys: MashKeyPair, writeKeys: MashKeyPair): { encryptedOperation: Buffer, signature: Buffer } {
    const buffer = Buffer.from(serializeOperation(op), "utf-8");

    const encryptedOperation = publicEncrypt(readKeys.publicKey, buffer);
    const signature = sign(null, Buffer.concat([encryptedOperation, Buffer.from(operationChallenge, 'utf-8')]), writeKeys.privateKey);
    return {
        encryptedOperation, signature
    }
}


export function decryptOperation(encryptedOp: Buffer, readKeys: MashKeyPair): MashOperation {
    const decryptedBuffer = privateDecrypt(readKeys.privateKey, encryptedOp);
    return deserializeOperation(decryptedBuffer);
}

/*
Functions also used by unprivileged server
 */

export function makeOperationHash(encryptedOperation: Buffer): string {
    return createHash("sha256").update(encryptedOperation).digest("base64")
}

export function createCalendarActionSignature(actionChallenge: string, writeKeys: MashKeyPair) {
    return sign(null, Buffer.from(actionChallenge, "utf-8"), writeKeys.privateKey);
}

export function verifyCalendarActionSignature(actionChallenge: string, writePublicKey: KeyObject, signature: Buffer) {
    return verify("SHA256", Buffer.from(actionChallenge, "utf-8"), writePublicKey, signature);
}

export function verifyOperationSignature(encryptedOperation: Buffer, actionChallenge: string, writePublicKey: KeyObject, signature: Buffer): boolean {
    return verify("SHA256", Buffer.concat([encryptedOperation, Buffer.from(actionChallenge, 'utf-8')]), writePublicKey, signature);
}

export function generateActionChallenge(): string {
    return uuidv4();
}