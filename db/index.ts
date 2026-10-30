import 'server-only';
import postgres from 'postgres';
import {drizzle} from 'drizzle-orm/postgres-js';
import * as schema from './schema';
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() {
 if(database) return database;
 const url=process.env.DATABASE_URL;
 if(!url) throw new Error('DATABASE_URL is not configured');
 const client=postgres(url,{prepare:false,max:1,idle_timeout:20,connect_timeout:10,ssl:'require'});
 database=drizzle(client,{schema});
 return database;
}
