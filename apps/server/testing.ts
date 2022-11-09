import { sign, verify, generateKeyPairSync, createPrivateKey, createPublicKey, pbkdf2Sync } from "crypto"

function keyPairFromPassword(password: string): { publicKey: string, encryptedPrivateKey: string } {
    // let derivedKey = pbkdf2Sync(password, "", 10000, 128, "SHA256")
    let keyPair = generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: password
        }
    })
    return {
        publicKey: keyPair.publicKey,
        encryptedPrivateKey: keyPair.privateKey
    }
}

let kp = keyPairFromPassword("my password")
console.log(kp.publicKey)
console.log(kp.encryptedPrivateKey)
console.log(JSON.stringify(kp))

// function test() {
//     let server = new Server(new Database())
//     let password = "my freaky password"
//     let keyPair = keyPairFromPassword(password)
//     console.log(keyPair)

//     let calendarName = server.calendar_POST(keyPair.publicKey, keyPair.encryptedPrivateKey)

//     console.log(`created calendar with name ${calendarName}`)
//     let operation = Buffer.from("encrypted op")

//     console.log(`trying to push with wrong sig`)
//     console.log(server.calendar_id_PUT(calendarName, operation, Buffer.from("wrong sig")))

//     let signature = sign("rsa-sha256", operation, { key: keyPair.encryptedPrivateKey, passphrase: password })
//     console.log(`created signature ${signature}`)

//     console.log(`trying to push with right sig`)
//     console.log(server.calendar_id_PUT(calendarName, operation, signature))

//     console.log(`accessing calendar: `, server.calendar_id_GET(calendarName))
//     console.log(`finished:`)
//     console.log(server.db.calendars)
// }

// test()