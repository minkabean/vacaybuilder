-- Completes data that was intentionally absent from the first two migrations.
-- Every insert is idempotent so existing organizer edits are preserved.
INSERT INTO hotels(event_id,name,room_type,area,nightly_rate,sort_order)
SELECT id,'Narragansett House','1-bedroom','Oak Bluffs',575,1 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM hotels WHERE event_id=events.id);
INSERT INTO hotels(event_id,name,room_type,area,nightly_rate,sort_order)
SELECT id,'Pequot Hotel','3-bedroom','Oak Bluffs',1300,2 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM hotels WHERE event_id=events.id AND name='Pequot Hotel');
INSERT INTO hotels(event_id,name,room_type,area,nightly_rate,sort_order)
SELECT id,'The Oak Bluffs Inn','2-bedroom','Oak Bluffs',1250,3 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM hotels WHERE event_id=events.id AND name='The Oak Bluffs Inn');
INSERT INTO hotels(event_id,name,room_type,area,nightly_rate,sort_order)
SELECT id,'Island Inn','2-bedroom','Oak Bluffs',1000,4 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM hotels WHERE event_id=events.id AND name='Island Inn');
INSERT INTO hotels(event_id,name,room_type,area,nightly_rate,sort_order)
SELECT id,'Dockside Inn','Deluxe Suite','Oak Bluffs',NULL,5 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM hotels WHERE event_id=events.id AND name='Dockside Inn');

INSERT INTO budget_items(event_id,label,detail,amount_text,sort_order)
SELECT id,'Flights','round trip','$900',1 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM budget_items WHERE event_id=events.id);
INSERT INTO budget_items(event_id,label,detail,amount_text,sort_order)
SELECT id,'Ubers','airport to ferry','$460',2 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM budget_items WHERE event_id=events.id AND label='Ubers');
INSERT INTO budget_items(event_id,label,detail,amount_text,sort_order)
SELECT id,'Ferry','both ways','$144',3 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM budget_items WHERE event_id=events.id AND label='Ferry');
INSERT INTO budget_items(event_id,label,detail,amount_text,sort_order)
SELECT id,'African American Film Festival','9-day passes','$2,000',4 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM budget_items WHERE event_id=events.id AND label='African American Film Festival');
INSERT INTO budget_items(event_id,label,detail,amount_text,sort_order)
SELECT id,'Food','per day','$250 per day',5 FROM events WHERE slug='trina-60-2029' AND NOT EXISTS(SELECT 1 FROM budget_items WHERE event_id=events.id AND label='Food');

INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'home_intro','Home introduction','A beautiful island getaway to celebrate Trina''s 60th birthday and retirement—together.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'travel_intro','Travel introduction','Martha''s Vineyard is an island off the coast of Massachusetts. Plan your airport-to-ferry connection before you travel.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'stay_intro','Stay introduction','Everyone will book their own lodging. Staying in or near Oak Bluffs keeps you close to the ferry, shops, restaurants, beaches, and the center of the trip.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'budget_intro','Costs introduction','Use these planning estimates to build your own trip budget. Food is priced per day and hotels are priced per night.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'plans_intro','Plans introduction','Confirmed trip plans appear first. Guest ideas can become shared meetups as plans take shape.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'explore_intro','Explore introduction','Use Trina''s notes as inspiration for food, culture, shopping, beaches, wellness, and island adventures.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'before_intro','Before You Go introduction','A little preparation will make the island experience easier and more comfortable.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'community_intro','Community introduction','Sign in only when you want to add an idea, coordinate an activity, leave a message, or share a photo.' FROM events WHERE slug='trina-60-2029';
INSERT OR IGNORE INTO content_sections(event_id,key,label,value)
SELECT id,'about_intro','About Martha''s Vineyard introduction','Get to know Martha''s Vineyard, Oak Bluffs, and the history and culture that make this destination special.' FROM events WHERE slug='trina-60-2029';

CREATE INDEX IF NOT EXISTS idx_memberships_user_event ON event_memberships(user_id,event_id);
CREATE INDEX IF NOT EXISTS idx_responses_user ON activity_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_event_status ON guest_book_entries(event_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_photos_event_status ON photos(event_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_content_event_key ON content_sections(event_id,key);
PRAGMA optimize;
