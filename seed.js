const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'oxygen_sports.db');

const db = new sqlite3.Database(dbPath);

console.log('Seeding SQLite database with 15 realistic records...');

const categories = ['School', 'Tournament', 'Academy', 'Club'];
const statuses = ['Draft', 'Approved', 'Disbursed', 'Completed', 'Archived'];

const mockRecords = [
  {
    event_name: "Secunderabad Club Junior Badminton Tournament",
    event_date: "2026-06-25 to 2026-06-27",
    category: "Tournament",
    budget_limit: 25000,
    items_donated: [
      { name: "YONEX Badminton Rackets", qty: 10, unitCost: 1500 },
      { name: "Nylon Shuttlecocks Box", qty: 15, unitCost: 400 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: true, prizeSpeech: false },
    status: "Approved",
    notes: "Approved for young player tournament."
  },
  {
    event_name: "Begumpet Govt Girls School Sports Meet",
    event_date: "2026-06-28",
    category: "School",
    budget_limit: 12000,
    items_donated: [
      { name: "KIPSTA Footballs Size 5", qty: 5, unitCost: 800 },
      { name: "Agility Training Cones", qty: 20, unitCost: 100 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: false, prizeSpeech: true },
    status: "Completed",
    notes: "Successfully completed with physical director speech."
  },
  {
    event_name: "Hyderabad Cricket Academy Under-15 League",
    event_date: "2026-07-01 to 2026-07-10",
    category: "Academy",
    budget_limit: 50000,
    items_donated: [
      { name: "English Willow Cricket Bats", qty: 5, unitCost: 6000 },
      { name: "Leather Cricket Balls Box", qty: 6, unitCost: 1500 },
      { name: "Batting Pads Pairs", qty: 4, unitCost: 2000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: true, socialMedia: true, prizeSpeech: true },
    status: "Disbursed",
    notes: "Disbursed all premium willow bats."
  },
  {
    event_name: "Kukatpally Football Club Summer League",
    event_date: "2026-07-05 to 2026-07-08",
    category: "Club",
    budget_limit: 30000,
    items_donated: [
      { name: "Training Vests (Bibs)", qty: 40, unitCost: 150 },
      { name: "Match Footballs Size 5", qty: 10, unitCost: 1200 },
      { name: "Metal Goal Nets Pair", qty: 1, unitCost: 5000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: true, prizeSpeech: false },
    status: "Approved",
    notes: "Training nets and balls set."
  },
  {
    event_name: "Malkajgiri High School Volleyball Championship",
    event_date: "2026-06-24",
    category: "School",
    budget_limit: 15000,
    items_donated: [
      { name: "COSCO Volleyballs", qty: 8, unitCost: 1200 },
      { name: "Volleyball Net Heavy", qty: 2, unitCost: 2000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: false, prizeSpeech: false },
    status: "Draft",
    notes: "Initial draft proposal."
  },
  {
    event_name: "Dilsukhnagar Boxing Academy Cup",
    event_date: "2026-07-15",
    category: "Academy",
    budget_limit: 20000,
    items_donated: [
      { name: "Boxing Gloves Pairs", qty: 10, unitCost: 1200 },
      { name: "Leather Punching Bags", qty: 2, unitCost: 3000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: true, prizeSpeech: true },
    status: "Approved",
    notes: "Sponsorship for combat sports tournament."
  },
  {
    event_name: "Gachibowli Stadium Athletics Meet",
    event_date: "2026-06-20",
    category: "Tournament",
    budget_limit: 80000,
    items_donated: [
      { name: "Rubber Running Relays Set", qty: 4, unitCost: 2000 },
      { name: "Aluminium Javelins 800g", qty: 5, unitCost: 6000 },
      { name: "Metal Discus Discs", qty: 6, unitCost: 4000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: true, socialMedia: true, prizeSpeech: true },
    status: "Completed",
    notes: "Major athletics meet. High exposure achieved."
  },
  {
    event_name: "Peerzadiguda Basketball Club League",
    event_date: "2026-07-20 to 2026-07-22",
    category: "Club",
    budget_limit: 25000,
    items_donated: [
      { name: "Basketballs Size 7 Leather", qty: 10, unitCost: 1800 },
      { name: "Heavy Duty Net Chains", qty: 4, unitCost: 500 }
    ],
    brand_visibility_received: { banner: false, jerseyLogo: false, socialMedia: true, prizeSpeech: false },
    status: "Archived",
    notes: "Archived due to tournament scheduling delays."
  },
  {
    event_name: "Jubilee Hills School Chess Championship",
    event_date: "2026-06-18",
    category: "School",
    budget_limit: 5000,
    items_donated: [
      { name: "Tournament Chess Boards", qty: 20, unitCost: 200 }
    ],
    brand_visibility_received: { banner: false, jerseyLogo: false, socialMedia: false, prizeSpeech: true },
    status: "Completed",
    notes: "Mini sponsorship for brain sports."
  },
  {
    event_name: "Kondapur Sports Academy Table Tennis Cup",
    event_date: "2026-07-12",
    category: "Academy",
    budget_limit: 15000,
    items_donated: [
      { name: "STIGA Ping Pong Paddles", qty: 12, unitCost: 800 },
      { name: "3-Star Table Tennis Balls Pack", qty: 5, unitCost: 500 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: true, prizeSpeech: false },
    status: "Approved",
    notes: "For indoor tournament games."
  },
  {
    event_name: "Charminar Cricket Tournament",
    event_date: "2026-07-02 to 2026-07-04",
    category: "Tournament",
    budget_limit: 30000,
    items_donated: [
      { name: "Leather Cricket Balls Box", qty: 10, unitCost: 1500 },
      { name: "Wicket Keeping Gloves Set", qty: 2, unitCost: 2500 },
      { name: "Wooden Wickets Stumps Sets", qty: 4, unitCost: 1500 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: false, prizeSpeech: false },
    status: "Approved",
    notes: "Local city league tournament."
  },
  {
    event_name: "Yousufguda Govt School Kabaddi Pitch",
    event_date: "2026-06-29",
    category: "School",
    budget_limit: 8000,
    items_donated: [
      { name: "Kabaddi Team Jerseys Set", qty: 14, unitCost: 400 },
      { name: "First Aid Medical Box", qty: 2, unitCost: 1000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: true, socialMedia: false, prizeSpeech: true },
    status: "Approved",
    notes: "Jerseys carry the brand logo."
  },
  {
    event_name: "Hyderabad Football Club Junior Camp",
    event_date: "2026-07-09",
    category: "Club",
    budget_limit: 45000,
    items_donated: [
      { name: "Nike Training Footballs", qty: 15, unitCost: 2000 },
      { name: "Agility Ladder Hurdles", qty: 5, unitCost: 2000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: true, prizeSpeech: false },
    status: "Disbursed",
    notes: "Kits sent for summer camp."
  },
  {
    event_name: "Banjara Hills Tennis Academy Tournament",
    event_date: "2026-07-16 to 2026-07-19",
    category: "Academy",
    budget_limit: 60000,
    items_donated: [
      { name: "Wilson Tennis Rackets", qty: 6, unitCost: 6000 },
      { name: "Tennis Balls Boxes Pack", qty: 20, unitCost: 600 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: true, socialMedia: true, prizeSpeech: true },
    status: "Approved",
    notes: "High profile tournament."
  },
  {
    event_name: "Secunderabad High School Hockey League",
    event_date: "2026-07-11 to 2026-07-14",
    category: "School",
    budget_limit: 25000,
    items_donated: [
      { name: "Composite Hockey Sticks", qty: 15, unitCost: 1200 },
      { name: "Hockey Practice Balls Pack", qty: 4, unitCost: 1000 }
    ],
    brand_visibility_received: { banner: true, jerseyLogo: false, socialMedia: false, prizeSpeech: false },
    status: "Approved",
    notes: "Approved sports equipment."
  }
];

db.serialize(() => {
  // Clear tables
  db.run(`DELETE FROM audit_logs`);
  db.run(`DELETE FROM sports_event_sponsorship_kit_donation`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='sports_event_sponsorship_kit_donation'`);

  const stmt = db.prepare(`
    INSERT INTO sports_event_sponsorship_kit_donation 
    (event_name, event_date, category, budget_limit, items_donated, brand_visibility_received, status, notes, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  mockRecords.forEach((record, index) => {
    const itemsSerialized = JSON.stringify(record.items_donated);
    const visibilitySerialized = JSON.stringify(record.brand_visibility_received);
    const totalCost = record.items_donated.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

    stmt.run(
      record.event_name,
      record.event_date,
      record.category,
      record.budget_limit,
      itemsSerialized,
      visibilitySerialized,
      record.status,
      record.notes,
      totalCost,
      function(err) {
        if (err) {
          console.error(`Failed to insert record ${index + 1}:`, err.message);
        } else {
          const sponsorshipId = this.lastID;
          console.log(`Saved Record ${sponsorshipId}: ${record.event_name}`);
          
          // Insert initial audit trail
          db.run(`
            INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by)
            VALUES (?, ?, ?, ?, ?)
          `, [sponsorshipId, itemsSerialized, visibilitySerialized, record.status, 'System (Seeder)']);
        }
      }
    );
  });

  stmt.finalize(() => {
    console.log('Database seeding successfully concluded.');
    db.close();
  });
});
