/**
 * singleton to hold state for a given "logged in" mash session. e.g. in-browser, in-app state.
 * this includes the API client, and sets of calendars (and stashes) accessible, with the relevant MashCalendarAccesses
 */
import {MashApiClient} from "./mash-client";
import {MashCalendarAccess} from "./mash-calendar";

export class MashSession {
    private calendars: Array<MashCalendarAccess>

    constructor(private client: MashApiClient) {

    }

    async addCalendar(name: string, readPassword: string, writePassword?: string): Promise<void> {
        const newCalendar = new MashCalendarAccess(this.client, name);
        await newCalendar.setup(readPassword, writePassword);
        this.calendars.push(newCalendar);
    }

    getCalendar(name: string) {
        return this.calendars.find(calendar => calendar.calendarName == name)
    }

    getCalendars() {
        return this.calendars;
    }
}