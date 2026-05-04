const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function seed() {
  let connection;
  try {
    // Connect without database first to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'jp_multiservices';
    console.log(`📦 Creating database "${dbName}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    // Create tables
    console.log('📋 Creating tables...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS visited_sites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        client_name VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        image_url VARCHAR(255),
        completion_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id INT PRIMARY KEY AUTO_INCREMENT,
        service_name VARCHAR(100) NOT NULL,
        cost_estimate VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS work_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        mobile_no VARCHAR(15) NOT NULL,
        address VARCHAR(500) NOT NULL,
        map_link VARCHAR(500),
        the_work TEXT NOT NULL,
        status ENUM('Pending', 'Contacted', 'Completed') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created successfully');

    // Seed admin user
    console.log('👤 Seeding admin user...');
    const hashedPassword = await bcrypt.hash('JPMulty@2026', 12);
    await connection.query(`
      INSERT IGNORE INTO admins (username, password_hash) VALUES (?, ?)
    `, ['admin', hashedPassword]);

    // Seed services
    console.log('🔧 Seeding services...');
    const services = [
      { title: 'Aluminum Windows', description: 'Premium quality aluminum windows with sleek modern designs. Custom-fit solutions for residential and commercial spaces with excellent thermal insulation and weather resistance.', image_url: '/uploads/services/aluminum-windows.jpg' },
      { title: 'Aluminum Partition', description: 'Elegant aluminum partition systems for offices and homes. Create flexible spaces with modern glass and aluminum combinations that maximize light and style.', image_url: '/uploads/services/aluminum-partition.jpg' },
      { title: 'Curtain Wall', description: 'Professional curtain wall installation for commercial buildings. Non-structural facade systems that provide stunning exterior aesthetics with superior performance.', image_url: '/uploads/services/curtain-wall.jpg' },
      { title: 'Urocon Partition', description: 'Durable Urocon partition panels for interior space division. Lightweight, fire-resistant, and sound-insulating solutions perfect for modern office environments.', image_url: '/uploads/services/urocon-partition.jpg' },
      { title: 'Fall Ceiling', description: 'Beautiful false ceiling designs using the latest materials and techniques. Transform any room with artistic ceiling patterns that enhance ambiance and hide utilities.', image_url: '/uploads/services/fall-ceiling.jpg' },
      { title: 'PVC Ceiling', description: 'Waterproof and low-maintenance PVC ceiling panels. Ideal for kitchens, bathrooms, and commercial spaces where durability meets aesthetic excellence.', image_url: '/uploads/services/pvc-ceiling.jpg' },
      { title: 'POP Ceiling', description: 'Custom Plaster of Paris ceiling designs with intricate molding and artistic patterns. From simple elegance to elaborate designs for luxurious interiors.', image_url: '/uploads/services/pop-ceiling.jpg' },
      { title: 'PVC Mat', description: 'High-quality PVC mat flooring solutions for residential and commercial spaces. Anti-slip, waterproof, and available in a wide range of designs and textures.', image_url: '/uploads/services/pvc-mat.jpg' },
      { title: 'PVC Curtains', description: 'Versatile PVC strip curtains for industrial, commercial, and residential use. Effective temperature control, dust prevention, and noise reduction solutions.', image_url: '/uploads/services/pvc-curtains.jpg' },
      { title: 'Rolling Curtain', description: 'Motorized and manual rolling curtain systems for windows and shop fronts. Space-saving, secure, and available in various materials and finishes.', image_url: '/uploads/services/rolling-curtain.jpg' },
      { title: '12mm Glass Work', description: 'Premium 12mm toughened glass installations for partitions, doors, railings, and shower enclosures. Crystal-clear views with maximum strength and safety.', image_url: '/uploads/services/glass-work.jpg' }
    ];

    for (const service of services) {
      await connection.query(`
        INSERT INTO services (title, description, image_url, is_active) 
        VALUES (?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE title = title
      `, [service.title, service.description, service.image_url]);
    }

    // Seed pricing
    console.log('💰 Seeding pricing...');
    const pricing = [
      { service_name: 'Aluminum Windows', cost_estimate: '₹250 - ₹600/sq ft', details: 'Price varies based on glass type (single/double), frame thickness, and design complexity. Includes installation and hardware.' },
      { service_name: 'Aluminum Partition', cost_estimate: '₹300 - ₹800/sq ft', details: 'Includes aluminum frame and glass panels. Price depends on glass thickness, partition height, and design. Custom designs available.' },
      { service_name: 'Curtain Wall', cost_estimate: '₹800 - ₹2000/sq ft', details: 'Professional grade curtain wall systems for commercial buildings. Price includes structural analysis, materials, and installation.' },
      { service_name: 'Urocon Partition', cost_estimate: '₹150 - ₹350/sq ft', details: 'Lightweight and durable partition solution. Pricing includes panels, framework, and finishing. Bulk discounts available.' },
      { service_name: 'Fall Ceiling', cost_estimate: '₹60 - ₹200/sq ft', details: 'Includes material, design, and installation. Premium designs with lighting integration available at higher tiers.' },
      { service_name: 'PVC Ceiling', cost_estimate: '₹40 - ₹120/sq ft', details: 'Waterproof and maintenance-free. Includes panels, frame, and installation. Wide range of colors and patterns.' },
      { service_name: 'POP Ceiling', cost_estimate: '₹70 - ₹250/sq ft', details: 'Custom POP designs with cornices and molding. Simple to intricate designs. Includes material and labor.' },
      { service_name: 'PVC Mat', cost_estimate: '₹30 - ₹150/sq ft', details: 'Wide range of designs from basic to premium wood-look finishes. Includes subfloor preparation and installation.' },
      { service_name: 'PVC Curtains', cost_estimate: '₹200 - ₹500/running ft', details: 'Strip and solid curtain options. Price depends on thickness, transparency, and installation height.' },
      { service_name: 'Rolling Curtain', cost_estimate: '₹400 - ₹1200/sq ft', details: 'Manual and motorized options available. Price includes track, curtain fabric, and installation.' },
      { service_name: '12mm Glass Work', cost_estimate: '₹500 - ₹1500/sq ft', details: 'Toughened safety glass for partitions, doors, and enclosures. Price includes glass, fittings, and professional installation.' }
    ];

    for (const item of pricing) {
      await connection.query(`
        INSERT INTO pricing (service_name, cost_estimate, details) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE service_name = service_name
      `, [item.service_name, item.cost_estimate, item.details]);
    }

    // Seed visited sites
    console.log('🏗️ Seeding portfolio sites...');
    const sites = [
      { client_name: 'Rajesh Kumar Residence', location: 'Aurangabad, Maharashtra', description: 'Complete interior renovation including aluminum windows, PVC ceiling, and glass partition work for a 3BHK luxury apartment.', image_url: '/uploads/sites/site1.jpg', completion_date: '2025-11-15' },
      { client_name: 'Sunrise Corporate Office', location: 'Gangapur, Maharashtra', description: 'Full office interior setup with aluminum partitions, curtain walls, and POP false ceiling with integrated lighting.', image_url: '/uploads/sites/site2.jpg', completion_date: '2025-09-20' },
      { client_name: 'Hotel Grand Palace', location: 'Nashik, Maharashtra', description: 'Luxury hotel lobby renovation featuring 12mm glass work, designer fall ceilings, and rolling curtain installations across 50+ rooms.', image_url: '/uploads/sites/site3.jpg', completion_date: '2026-01-10' },
      { client_name: 'Patel Family Home', location: 'Shendurwada, Maharashtra', description: 'Residential project with PVC ceilings in bathrooms and kitchen, aluminum windows throughout, and PVC mat flooring in all bedrooms.', image_url: '/uploads/sites/site4.jpg', completion_date: '2025-12-05' },
      { client_name: 'TechVista IT Park', location: 'Pune, Maharashtra', description: 'Modern IT workspace with Urocon partitions, glass cabin enclosures, PVC curtains for server rooms, and designer POP ceilings.', image_url: '/uploads/sites/site5.jpg', completion_date: '2026-02-28' },
      { client_name: 'Shree Ganesh Showroom', location: 'Aurangabad, Maharashtra', description: 'Retail showroom interior with curtain wall facade, aluminum partition display sections, and premium fall ceiling design.', image_url: '/uploads/sites/site6.jpg', completion_date: '2026-03-15' }
    ];

    for (const site of sites) {
      await connection.query(`
        INSERT INTO visited_sites (client_name, location, description, image_url, completion_date) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE client_name = client_name
      `, [site.client_name, site.location, site.description, site.image_url, site.completion_date]);
    }

    // Seed sample work requests
    console.log('📝 Seeding sample work requests...');
    const requests = [
      { name: 'Amit Sharma', email: 'amit.sharma@gmail.com', mobile_no: '9876543210', address: '45, MG Road, Aurangabad, Maharashtra', map_link: 'https://maps.google.com/?q=19.8762,75.3433', the_work: 'Need aluminum windows for my new 2BHK flat. Total 8 windows of standard size. Also interested in PVC ceiling for 2 bathrooms.', status: 'Pending' },
      { name: 'Priya Deshmukh', email: 'priya.d@yahoo.com', mobile_no: '8765432109', address: '12, Cidco Colony, Gangapur, Maharashtra', map_link: '', the_work: 'Looking for complete false ceiling work for my living room and dining area. Approximately 500 sq ft total area. Prefer POP with modern design.', status: 'Contacted' },
      { name: 'Vikram Industries', email: 'info@vikramindustries.com', mobile_no: '7654321098', address: 'Plot 78, Industrial Area, Waluj, Aurangabad', map_link: 'https://maps.google.com/?q=19.8354,75.2803', the_work: 'Require PVC strip curtains for warehouse cold storage section. Approx 6 openings, each 8ft wide and 10ft high. Also need Urocon partitions for new office section.', status: 'Completed' }
    ];

    for (const req of requests) {
      await connection.query(`
        INSERT INTO work_requests (name, email, mobile_no, address, map_link, the_work, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [req.name, req.email, req.mobile_no, req.address, req.map_link, req.the_work, req.status]);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log('   • 1 Admin user (username: admin, password: JPMulty@2026)');
    console.log('   • 11 Services');
    console.log('   • 11 Pricing entries');
    console.log('   • 6 Portfolio sites');
    console.log('   • 3 Sample work requests');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seed();
