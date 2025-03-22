const firebaseAdmin = require('../src/config/firebase');
const { pool } = require('../src/config/database');

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create user in Firebase using the helper function
    const userRecord = await firebaseAdmin.createUser('admin@revoai.com', '552004');

    console.log('Firebase user created successfully');

    // Insert user into our database with admin privileges
    const { rows } = await pool.query(
      'INSERT INTO users (firebase_uid, full_name, email, is_verified, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [userRecord.uid, 'System Admin', 'admin@revoai.com', true, true]
    );

    console.log('✅ Admin user created successfully:', {
      firebase_uid: userRecord.uid,
      database_id: rows[0].id,
      email: rows[0].email
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();