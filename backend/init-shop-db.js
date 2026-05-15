require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const packages = [
  { 
    name: "Standard Package", 
    price: 10000, 
    duration: "1 hr 30 min", 
    color: "#6EC1E4", 
    images: "6 edited soft copy images",
    outfits: "2 gowns & styling",
    features: ["Professional makeup", "Full gown access", "Studio session"],
    description: "Ideal for a quick, elegant session focused on capturing the essence of your journey."
  },
  { 
    name: "Economy Package", 
    price: 15000, 
    duration: "2 hrs", 
    color: "#B84FA0", 
    images: "12 edited soft copy images",
    outfits: "3 gowns & styling",
    features: ["Professional makeup", "Full gown access", "Studio session"],
    description: "Our most balanced package, offering more time and a wider variety of looks."
  },
  { 
    name: "Executive Package", 
    price: 20000, 
    duration: "2 hrs 30 min", 
    color: "#6EC1E4", 
    images: "15 edited soft copy images",
    outfits: "4 gowns & styling",
    features: ["Professional makeup", "Full gown access", "1 A3 Mount included", "Studio session"],
    description: "Level up with more outfits and a stunning A3 mount for your wall."
  },
  { 
    name: "Gold Package", 
    price: 30000, 
    duration: "2 hrs 30 min", 
    color: "#B84FA0", 
    images: "20 edited soft copy images",
    outfits: "4 gowns & styling",
    popular: true,
    features: ["Professional makeup", "8×8\" hardpage photobook", "Full gown access", "Studio session"],
    description: "Capture your story in a high-quality photobook that will last generations."
  },
  { 
    name: "Platinum Package", 
    price: 35000, 
    duration: "2 hrs 30 min", 
    color: "#6EC1E4", 
    images: "25 edited soft copy images",
    outfits: "4 gowns & styling",
    popular: true,
    features: ["Professional makeup", "Customized Balloon Backdrop", "1 A3 mount included", "Full gown access"],
    description: "Luxury meets artistry with a customized backdrop tailored to your style."
  },
  { 
    name: "VIP Package", 
    price: 45000, 
    duration: "3 hrs 30 min", 
    color: "#B84FA0", 
    images: "25 edited soft copy images",
    outfits: "4 gowns & styling",
    features: ["Professional makeup", "Customized Balloon Backdrop", "8×8\" hardpage photobook", "Extended session"],
    description: "The ultimate luxury experience with every detail curated for perfection."
  },
  { 
    name: "VVIP Package", 
    price: 50000, 
    duration: "3 hrs 30 min", 
    color: "#6EC1E4", 
    images: "30 edited soft copy images",
    outfits: "5 gowns & styling",
    features: ["Professional makeup", "Styled Wig included", "Customized Balloon Backdrop", "8×8\" photobook + A3 mount"],
    description: "Our most exclusive offering. Absolute luxury, more outfits, and premium styling."
  },
];

const initShopDb = async () => {
  try {
    console.log("Connecting to database for shop initialization...");
    
    // Create Shop Packages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_packages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        duration TEXT,
        images_count TEXT,
        outfits_count TEXT,
        color TEXT,
        popular BOOLEAN DEFAULT false,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Shop Packages table created");

    // Create Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
        payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Shop Orders table created");

    // Create Order Items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_order_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
        package_id UUID REFERENCES shop_packages(id) ON DELETE SET NULL,
        package_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Shop Order Items table created");

    // Seed Packages if empty
    const checkPackages = await pool.query('SELECT COUNT(*) FROM shop_packages');
    if (parseInt(checkPackages.rows[0].count) === 0) {
      console.log("Seeding packages...");
      for (const pkg of packages) {
        await pool.query(
          `INSERT INTO shop_packages (name, price, description, duration, images_count, outfits_count, color, popular, features) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [pkg.name, pkg.price, pkg.description, pkg.duration, pkg.images, pkg.outfits, pkg.color, pkg.popular || false, JSON.stringify(pkg.features)]
        );
      }
      console.log("✓ Packages seeded");
    }

    console.log("Shop database initialization complete!");
    process.exit(0);
  } catch (err) {
    console.error("Shop initialization failed:", err);
    process.exit(1);
  }
};

initShopDb();
