-- Pitchdeck seed data — real venue data for demo
-- Run AFTER schema.sql in your Supabase SQL editor

insert into venues (name, city, country, venue_type, capacity, genres, website, booking_email, contact_name, recent_lineups, notes)
values

-- Amsterdam
('Shelter', 'Amsterdam', 'Netherlands', 'club', 500,
 array['house', 'disco', 'soul', 'balearic'],
 'shelteramsterdam.nl', 'booking@shelteramsterdam.nl', 'Petra',
 array['San Proper', 'Antal', 'Red D', 'Young Marco'],
 'Under the A''dam tower. Known for quality house and disco.'),

('Garage Noord', 'Amsterdam', 'Netherlands', 'club', 350,
 array['minimal', 'house', 'techno', 'leftfield'],
 'garagenoord.nl', 'info@garagenoord.nl', 'Lisa',
 array['Young Marco', 'San Proper', 'Orpheu The Wizard', 'Call Super'],
 'Intimate industrial space. Very selective booking.'),

('Dekmantel', 'Amsterdam', 'Netherlands', 'collective', null,
 array['techno', 'house', 'experimental', 'ambient', 'leftfield'],
 'dekmantelfestival.com', 'booking@dekmantel.com', 'Martijn',
 array['Skee Mask', 'Objekt', 'Avalon Emerson', 'Floating Points'],
 'Festival + label + event series. Strong experimental/underground focus.'),

('Trouw Amsterdam', 'Amsterdam', 'Netherlands', 'club', 900,
 array['techno', 'house', 'experimental'],
 null, null, null,
 array['Actress', 'Pantha du Prince', 'Objekt'],
 'Historic venue — now closed, but bookers still active with new projects.'),

('AIR Amsterdam', 'Amsterdam', 'Netherlands', 'club', 1200,
 array['techno', 'house', 'commercial techno'],
 'air.nl', 'booking@air.nl', null,
 array['Amelie Lens', 'Charlotte de Witte', 'ARTBAT'],
 'Large club. Main floor runs harder techno.'),

-- Berlin
('Berghain', 'Berlin', 'Germany', 'club', 1500,
 array['techno', 'industrial', 'minimal', 'dark techno'],
 'berghain.de', null, null,
 array['Marcel Dettmann', 'DVS1', 'Blawan', 'Surgeon'],
 'No unsolicited bookings. Agency representation required.'),

('Panorama Bar', 'Berlin', 'Germany', 'club', 400,
 array['house', 'techno', 'minimal', 'disco', 'balearic'],
 'berghain.de', null, null,
 array['Prosumer', 'Hunee', 'Fiedel', 'Job Jobse'],
 'Upstairs at Berghain. More eclectic than the main floor.'),

('Tresor', 'Berlin', 'Germany', 'club', 600,
 array['techno', 'industrial', 'dark techno'],
 'tresorberlin.com', 'booking@tresorberlin.de', 'Klaus',
 array['Surgeon', 'Paula Temple', 'Blawan', 'Regis'],
 'Historic techno institution. Vault for harder sounds.'),

('://about blank', 'Berlin', 'Germany', 'club', 1000,
 array['techno', 'experimental', 'queer', 'ambient', 'noise'],
 'aboutparty.net', null, null,
 array['Aphex Twin', 'Autechre', 'Actress', 'Special Request'],
 'Deliberately eclectic. Known for long-form experimental bookings.'),

('OHM', 'Berlin', 'Germany', 'club', 200,
 array['experimental', 'industrial', 'noise', 'ambient', 'electro'],
 'ohm-berlin.com', 'booking@ohm-berlin.com', null,
 array['Karen Gwyer', 'Mark Fell', 'Rashad Becker'],
 'Tiny, intense. Strong experimental-electronic focus.'),

('Salon zur wilden Renate', 'Berlin', 'Germany', 'club', 600,
 array['house', 'disco', 'afro', 'balearic'],
 'renate.cc', 'booking@renate.cc', null,
 array['Roman Flügel', 'Gerd Janson', 'Chloé'],
 'Multi-room venue. Eclectic and friendly atmosphere.'),

-- London
('Fabric', 'London', 'United Kingdom', 'club', 1500,
 array['techno', 'drum & bass', 'house', 'minimal'],
 'fabriclondon.com', 'bookings@fabriclondon.com', 'Maria',
 array['DJ Stingray', 'Clouds', 'Pangaea', 'Blawan'],
 'One of the world''s leading clubs. Rooms 1, 2 and 3.'),

('Corsica Studios', 'London', 'United Kingdom', 'club', 300,
 array['techno', 'experimental', 'ambient', 'industrial'],
 'corsica-studios.com', 'info@corsica-studios.com', 'Kev',
 array['Forest Drive West', 'Locklead', 'Ø [Phase]', 'Regis'],
 'DIY ethos. Prides itself on non-mainstream programming.'),

('FOLD', 'London', 'United Kingdom', 'club', 450,
 array['techno', 'industrial', 'experimental', 'dark techno'],
 'foldlondon.com', 'booking@foldlondon.com', 'Oliver',
 array['Ancient Methods', 'Blawan', 'Paula Temple', 'Surgeon'],
 'East London. Strong industrial and dark techno focus.'),

('NTS Radio', 'London', 'United Kingdom', 'radio', null,
 array['all genres', 'experimental', 'ambient', 'jazz', 'roots'],
 'nts.live', 'shows@nts.live', 'Tom',
 array['Floating Points', 'Actress', 'Loraine James', 'Skee Mask'],
 'Community radio. Accepts show proposals. Strong reach.'),

('EartH', 'London', 'United Kingdom', 'club', 900,
 array['leftfield', 'experimental', 'ambient', 'jazz', 'bass music'],
 'earthackney.co.uk', 'bookings@earthackney.co.uk', null,
 array['Four Tet', 'Caribou', 'Floating Points'],
 'Hackney. Cross-genre programming. Strong production values.'),

-- Paris
('Concrete', 'Paris', 'France', 'club', 700,
 array['techno', 'house', 'minimal', 'electro'],
 'concrete-paris.fr', 'booking@concrete-paris.fr', 'Antoine',
 array['Cabaret Nocturne', 'Jordan', 'Antigone', 'Or:la'],
 'Daytime and overnight parties on the Seine. French techno institution.'),

('Rex Club', 'Paris', 'France', 'club', 650,
 array['techno', 'house', 'electro', 'minimal'],
 'rexclub.com', 'booking@rexclub.com', 'Laurent',
 array['Laurent Garnier', 'Dj Deep', 'Jennifer Cardini'],
 'Legendary Paris club. Laurent Garnier residency for many years.'),

-- Glasgow
('Sub Club', 'Glasgow', 'United Kingdom', 'club', 410,
 array['house', 'techno', 'minimal', 'disco'],
 'subclub.co.uk', 'bookings@subclub.co.uk', 'Stuart',
 array['Optimo', 'Jackmaster', 'Dixon', 'Theo Parrish'],
 'Underground institution. Optimo residency. Intimate basement.'),

-- Rotterdam
('Perron', 'Rotterdam', 'Netherlands', 'club', 600,
 array['techno', 'house', 'experimental'],
 'perronrotterdam.nl', 'info@perronrotterdam.nl', 'Frank',
 array['Marcel Fengler', 'Phase Fatale', 'Setaoc Mass'],
 'Industrial space. Strong European techno bookings.'),

-- Brussels
('Fuse', 'Brussels', 'Belgium', 'club', 700,
 array['techno', 'house', 'minimal'],
 'fuse.be', 'booking@fuse.be', null,
 array['Charlotte de Witte', 'Cinthie', 'Âme'],
 'Long-running Belgian club. Techno and house focus.'),

-- Barcelona
('Nitsa Club', 'Barcelona', 'Spain', 'club', 1000,
 array['techno', 'house', 'minimal', 'electro'],
 'nitsa.com', 'booking@nitsa.com', null,
 array['Blawan', 'Shackleton', 'Actress'],
 'Within Sala Apolo. Strong underground programming.'),

-- Online / Radio
('Boiler Room', 'London', 'United Kingdom', 'collective', null,
 array['all genres', 'techno', 'house', 'experimental'],
 'boilerroom.tv', 'info@boilerroom.tv', null,
 array['Ben UFO', 'Special Request', 'Objekt'],
 'Streaming platform and event series. High visibility worldwide.'),

('Rinse FM', 'London', 'United Kingdom', 'radio', null,
 array['UK bass', 'garage', 'drum & bass', 'house', 'grime'],
 'rinse.fm', 'shows@rinse.fm', null,
 array['Dusk + Blackdown', 'Beneath', 'Plastician'],
 'Pirate-turned-licensed station. UK bass music focus.'),

('Resident Advisor', 'London', 'United Kingdom', 'collective', null,
 array['all genres', 'techno', 'house'],
 'ra.co', 'editorial@ra.co', null,
 array['Various'],
 'Mix series and editorial platform. Significant industry reach.');
