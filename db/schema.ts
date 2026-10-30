import {pgSchema,text,bigint,real,primaryKey} from 'drizzle-orm/pg-core';
const garden=pgSchema('garden');
export const memorials=garden.table('memorials',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),kind:text('kind').notNull(),message:text('message').notNull(),createdAt:bigint('created_at',{mode:'number'}).notNull(),photo:text('photo')
});
export const gestures=garden.table('gestures',{
 memorialId:text('memorial_id').notNull().references(()=>memorials.id,{onDelete:'cascade'}),userId:text('user_id').notNull(),kind:text('kind').notNull()
},t=>[primaryKey({columns:[t.memorialId,t.userId,t.kind]})]);
export const pets=garden.table('pets',{userId:text('user_id').primaryKey(),name:text('name').notNull(),kind:text('kind').notNull(),coat:text('coat').notNull(),breed:text('breed').notNull()});
export const messages=garden.table('messages',{id:text('id').primaryKey(),userId:text('user_id').notNull(),nickname:text('nickname').notNull(),message:text('message').notNull(),createdAt:bigint('created_at',{mode:'number'}).notNull()});
export const presence=garden.table('presence',{userId:text('user_id').primaryKey(),x:real('x').notNull(),z:real('z').notNull(),pet:text('pet').notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()});
export const comments=garden.table('comments',{id:text('id').primaryKey(),memorialId:text('memorial_id').notNull().references(()=>memorials.id,{onDelete:'cascade'}),userId:text('user_id').notNull(),nickname:text('nickname').notNull(),message:text('message').notNull(),createdAt:bigint('created_at',{mode:'number'}).notNull()});
