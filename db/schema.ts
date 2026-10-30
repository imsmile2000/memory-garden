import {sqliteTable,text,integer,real,primaryKey} from 'drizzle-orm/sqlite-core';
export const memorials=sqliteTable('memorials',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),kind:text('kind').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull(),photo:text('photo')
});
export const gestures=sqliteTable('gestures',{
 memorialId:text('memorial_id').notNull().references(()=>memorials.id,{onDelete:'cascade'}),userId:text('user_id').notNull(),kind:text('kind').notNull()
},t=>[primaryKey({columns:[t.memorialId,t.userId,t.kind]})]);
export const pets=sqliteTable('pets',{userId:text('user_id').primaryKey(),name:text('name').notNull(),kind:text('kind').notNull(),coat:text('coat').notNull(),breed:text('breed').notNull()});
export const messages=sqliteTable('messages',{id:text('id').primaryKey(),userId:text('user_id').notNull(),nickname:text('nickname').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull()});
export const presence=sqliteTable('presence',{userId:text('user_id').primaryKey(),x:real('x').notNull(),z:real('z').notNull(),pet:text('pet').notNull(),updatedAt:integer('updated_at').notNull()});
export const comments=sqliteTable('comments',{id:text('id').primaryKey(),memorialId:text('memorial_id').notNull().references(()=>memorials.id,{onDelete:'cascade'}),userId:text('user_id').notNull(),nickname:text('nickname').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull()});
