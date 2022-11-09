import {CreateEventOperation, DeleteEventOperation, ModifyCalendarOperation, ModifyEventOperation} from "./operations";
import {randomEvent} from "./test-utils";
import {MashCalendarState} from "./mash-calendar";

const testCalendar = new MashCalendarState();

const newEvent = randomEvent();

test("create event", () => {
    const op: CreateEventOperation = {
        kind: "createEvent",
        event: {...newEvent},
    };
    testCalendar.applyOperation(op);
    expect(testCalendar.events.length).toBe(1);
    expect(testCalendar.findEvent(newEvent.id)).toEqual(newEvent);
});

test("change event title", () => {
   const op: ModifyEventOperation = {
       kind: "modifyEvent",
       eventId: newEvent.id,
       title: "changed event title",
       description: undefined,
       endDate: undefined,
       startDate: undefined
   }
   testCalendar.applyOperation(op);
   expect(testCalendar.findEvent(newEvent.id).title).toEqual(op.title);
});

test("change event properties", () => {
    const op: ModifyEventOperation = {
        kind: "modifyEvent",
        eventId: newEvent.id,
        title: "changed event title 2",
        description: "changed description 2",
        startDate: new Date(1000),
        endDate: new Date(2000),
    }
    testCalendar.applyOperation(op);
    expect(testCalendar.findEvent(newEvent.id).title).toEqual(op.title);
    expect(testCalendar.findEvent(newEvent.id).description).toEqual(op.description);
    expect(testCalendar.findEvent(newEvent.id).startDate).toEqual(op.startDate);
    expect(testCalendar.findEvent(newEvent.id).endDate).toEqual(op.endDate);
});

test("delete event", () => {
    const op: DeleteEventOperation = {
        kind: "deleteEvent",
        eventId: newEvent.id,
    };
    testCalendar.applyOperation(op);
    expect(testCalendar.findEvent(newEvent.id)).toBeUndefined();
});

test("change calendar title", () => {
    const op: ModifyCalendarOperation = {
        kind: "modifyCalendar",
        title: "changed calendar title",
    }
    testCalendar.applyOperation(op);
    expect(testCalendar.title).toEqual(op.title);
});

test("change calendar properties", () => {
    const op: ModifyCalendarOperation = {
        kind: "modifyCalendar",
        title: "changed calendar title 2",
        description: "changed calendar description",
    }
    testCalendar.applyOperation(op);
    expect(testCalendar.title).toEqual(op.title);
    expect(testCalendar.description).toEqual(op.description);
});

// test("operation serialization", () => {
//     for(const op of testCalendar.operations) {
//         let serialized = serializeOperation(op);
//         let deserialized = deserializeOperation(Buffer.from(serialized, 'utf-8'));
//         expect(deserialized).toEqual(op);
//     }
// });
//
