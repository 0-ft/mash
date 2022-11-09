import {Collection, MongoClient} from "mongodb"
import {DatabaseCalendar, DatabaseOperation, logger, MashDatabase} from "common";

export class MashMongoDatabase implements MashDatabase {

    mongo: MongoClient
    calendars: Collection<DatabaseCalendar>

    /**
     * @param mongoAddress The URL of the mongodb instance
     */
    constructor(mongoAddress: string) {
        this.mongo = new MongoClient(mongoAddress)
        this.calendars = this.mongo.db("mash").collection<DatabaseCalendar>("calendars")
    }

    log(message: string): void {
        logger.info(`MashMongoDatabase: ${message}`);
    }

    /**
     * Connect to the mongo instance
     * @throws If connection failed
     */
    async connect(): Promise<void> {
        await this.mongo.connect()
        this.log("mash database connected")
    }

    /**
     * Insert a calendar into the database
     * @param calendar The calendar instance to add to the database
     * @throws If the operation failed
     */
    async addCalendar(calendar: DatabaseCalendar): Promise<void> {
        await this.calendars.insertOne(calendar)
        this.log(`added calendar ${calendar.name}`);
    }

    // async addCalendar(publicKey: string, encryptedPrivateKey: string) {

    // }

    /**
     * Find a calendar by name or name and public key
     * @param name The name of the calendar to find
     * @param publicKey The public key of the calendar to find - if unspecified, only name will be matched
     * @returns The matching calendar
     * @throws If no matching calendar was found
     */
    async findCalendar(name: string, readPublicKey?: string): Promise<DatabaseCalendar> {
        let calendar = (readPublicKey === undefined)
            ? await this.calendars.findOne({name: name})
            : await this.calendars.findOne({name: name, "_readKey.publicKey": readPublicKey})
        return calendar || Promise.reject("calendar not found")
    }

    /**
     * Add an (encrypted) operation to a calendar's operation list
     * @param name The name of the calendar to add an operation to
     * @param operation The encrypted operation to add to the calendar
     * @throws If the operation failed
     */
    async updateCalendar(name: string, operation: DatabaseOperation): Promise<void> {
        let result = await this.calendars.updateOne(
            {name: name},
            {
                $push: {
                    operations: operation
                }
            },
            {upsert: false}
        )
        if(result.modifiedCount < 1) {
            throw new Error("not updated");
        }
        this.log(`pushed operation to ${name}`);
    }

    /**
     * Delete the calendar with the given name
     * @param name The name of the calendar to delete
     * @throws If the operation failed
     */
    async deleteCalendar(name: string): Promise<void> {
        await this.calendars.deleteOne({name: name})
        this.log(`deleted calendar ${name}`);
    }
}

// export { MashDatabase, MashMongoDatabase, DatabaseCalendar, DatabaseOperation }
