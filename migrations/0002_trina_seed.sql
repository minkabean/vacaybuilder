INSERT OR IGNORE INTO events(slug,title,subtitle,destination,start_date,end_date,welcome_message,status) VALUES('trina-60-2029','Trina''s 60th Birthday & Retirement Trip','Martha''s Vineyard · Oak Bluffs, Massachusetts','Martha''s Vineyard, Massachusetts','2029-08-05','2029-08-18','Join Trina for a special birthday and retirement trip to Martha''s Vineyard.','published');
INSERT OR IGNORE INTO users(email,display_name) VALUES('minkabean@gmail.com','Angela');
INSERT OR IGNORE INTO users(email,display_name) VALUES('trinajames2011@yahoo.com','Trina James');
INSERT OR REPLACE INTO event_memberships(event_id,user_id,role) SELECT e.id,u.id,'organizer' FROM events e,users u WHERE e.slug='trina-60-2029' AND lower(u.email) IN('minkabean@gmail.com','trinajames2011@yahoo.com');
