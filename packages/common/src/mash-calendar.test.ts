import {MashCalendarAccess} from "./mash-calendar";
import {ModifyCalendarOperation} from "./operations";
import {makeTestingCalendar} from "./test-utils";
import {GetCalendarRequest} from "./request-types";
import {logger} from "./logger";

test("calendar access integration test", async () => {
    const {
        keys,
        client,
        calendar
    } = await makeTestingCalendar();

    logger.info("created calendar, beginning access integration test");
    const access = new MashCalendarAccess(client, calendar.name);
    await access.setup(keys.readPassphrase, keys.writePassphrase);
    logger.info(`setup access successfully`);

    // check no operations initially
    expect(await access.pull()).toBe(0);

    const changeTitleOperation: ModifyCalendarOperation = {
        kind: "modifyCalendar",
        title: "special calendar title",
        description: undefined
    };

    // change title
    await access.putOperation(changeTitleOperation);

    expect(await access.pull()).toBe(1);
    expect(access.calendarState.title).toEqual("special calendar title");

    const changeDescriptionOperation: ModifyCalendarOperation = {
        kind: "modifyCalendar",
        title: undefined,
        description: "new calendar description"
    };

    // change description
    await access.putOperation(changeDescriptionOperation);

    expect(await access.pull()).toBe(1);
    expect(access.calendarState.title).toEqual("special calendar title");
    expect(access.calendarState.description).toEqual("new calendar description");

    // delete calendar
    await expect(access.deleteCalendar()).resolves.not.toThrow();

    const getCalendarRequest: GetCalendarRequest = {name: calendar.name}

    // verify calendar is deleted
    await expect(client.getCalendar(getCalendarRequest)).rejects.toThrow();
});