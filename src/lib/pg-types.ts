import { types, defaults } from 'pg';

// W31: columns of type TIMESTAMP (without time zone) hold UTC wall time. node-postgres
// would otherwise read them in the server process's local zone, shifting every
// scheduled time on any machine not running in UTC. (Production runs in UTC, where
// this changes nothing.) OID 1114 = timestamp without time zone.
types.setTypeParser(1114, (value: string) => new Date(value.replace(' ', 'T') + 'Z'));
// ...and write JS Date parameters as UTC too, so reads and writes agree.
defaults.parseInputDatesAsUTC = true;

/** Import for its side effect from every module that creates a pg Pool. */
export const PG_TYPES_CONFIGURED = true;
