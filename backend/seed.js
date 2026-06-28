require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

// 1x1 transparent PNG as placeholder image (base64)
const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusfind';

const samplePosts = [
  {
    itemName: 'Blue Slim Wallet',
    type: 'lost',
    category: 'Wallet',
    description: 'A blue slim leather wallet. Contains Aadhar card, college ID, and some cash. Has a small tear on the corner.',
    location: 'Main Library, 2nd Floor',
    date: new Date(Date.now() - 2 * 86400000),
    images: [PLACEHOLDER_IMG],
    imageTypes: ['actual'],
    coverImageIndex: 0,
    status: 'approved',
    questions: {
      question1: 'I left it on the study table near the window on the 2nd floor of the main library.',
      question2: 'I noticed it missing on the evening of June 25th, around 6 PM.',
      question3: 'It has my college ID card inside with my photo, and there is a small Batman sticker inside.'
    }
  },
  {
    itemName: 'Casio FX-991EX Calculator',
    type: 'found',
    category: 'Calculator',
    description: 'Found a Casio scientific calculator. Black colored, slightly worn on the edges. Name written in marker on the back (partially rubbed off).',
    location: 'Lecture Hall LT-4',
    date: new Date(Date.now() - 1 * 86400000),
    images: [PLACEHOLDER_IMG],
    imageTypes: ['actual'],
    coverImageIndex: 0,
    status: 'approved',
    questions: {
      question1: 'Found it under a bench in LT-4 after the afternoon lecture session.',
      question2: 'Found on June 26th at approximately 4:30 PM.',
      question3: 'I deposited it with the department office (ECE Department, Room 101).'
    }
  },
  {
    itemName: 'Dell Laptop Charger (65W)',
    type: 'lost',
    category: 'Laptop Charger',
    description: 'Dell 65W laptop charger with a round barrel connector. Has a yellow tape near the plug end for identification.',
    location: 'Computer Lab, Block C',
    date: new Date(Date.now() - 3 * 86400000),
    images: [PLACEHOLDER_IMG],
    imageTypes: ['actual'],
    coverImageIndex: 0,
    status: 'approved',
    questions: {
      question1: 'Left it plugged in at workstation #14 in the Computer Lab in Block C.',
      question2: 'June 24th, after evening practical session at around 8 PM.',
      question3: 'It has a yellow electrical tape wrapped near the plug end and a small scratch on the adapter box.'
    }
  },
  {
    itemName: 'NIT Kurukshetra ID Card',
    type: 'found',
    category: 'ID Card',
    description: 'Found an NIT Kurukshetra student ID card. Card is in good condition.',
    location: 'Hostel-4 Cafeteria',
    date: new Date(Date.now() - 4 * 86400000),
    images: [PLACEHOLDER_IMG],
    imageTypes: ['actual'],
    coverImageIndex: 0,
    status: 'approved',
    questions: {
      question1: 'Found it on the floor near the cash counter at Hostel-4 cafeteria.',
      question2: 'Found on June 23rd during dinner time at around 7:30 PM.',
      question3: 'The card is with me. Contact me to verify your details and collect it.'
    }
  },
  {
    itemName: 'Black JBL Earbuds (TWS)',
    type: 'lost',
    category: 'Earbuds',
    description: 'JBL Free X true wireless earbuds in a black charging case. Left earbud has a small scratch.',
    location: 'Sports Complex',
    date: new Date(Date.now() - 5 * 86400000),
    images: [PLACEHOLDER_IMG],
    imageTypes: ['actual'],
    coverImageIndex: 0,
    status: 'approved',
    questions: {
      question1: 'I think I left them on the bench near the basketball court in the sports complex.',
      question2: 'June 22nd evening after my workout session, around 6:30 PM.',
      question3: 'Left earbud has a visible scratch. I can also provide the pairing history from my phone.'
    }
  },
  {
    itemName: 'Steel Water Bottle (Milton)',
    type: 'found',
    category: 'Water Bottle',
    description: 'Found a silver/grey Milton thermosteel bottle, 750ml. Has a sticker of a mountain on it.',
    location: 'Academic Block Corridor',
    date: new Date(Date.now() - 6 * 86400000),
    images: [PLACEHOLDER_IMG],
    imageTypes: ['actual'],
    coverImageIndex: 0,
    status: 'approved',
    questions: {
      question1: 'Found near the water cooler on the 3rd floor corridor of the academic block.',
      question2: 'June 21st, around 2 PM.',
      question3: 'The bottle is currently with me in Hostel-2, Room 215.'
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user (plain text password - model pre-save hook will hash it)
    const admin = await User.create({
      name: 'CampusFind Admin',
      rollNumber: 'ADMIN001',
      email: 'admin@nitkkr.ac.in',
      password: 'admin123',
      department: 'Administration',
      year: 1,
      isVerified: true,
      role: 'admin'
    });
    console.log('👤 Admin created: admin@nitkkr.ac.in / admin123');

    // Create sample students
    const students = [];
    const studentData = [
      { name: 'Rahul Sharma', rollNumber: '124102101', email: '124102101@nitkkr.ac.in', department: 'Computer Engineering', year: 2 },
      { name: 'Priya Verma', rollNumber: '124102102', email: '124102102@nitkkr.ac.in', department: 'Electronics & Communication', year: 3 },
      { name: 'Amit Kumar', rollNumber: '124102103', email: '124102103@nitkkr.ac.in', department: 'Mechanical Engineering', year: 1 },
    ];
    for (const s of studentData) {
      // Pass plain text - model pre-save hook hashes it
      const student = await User.create({ ...s, password: 'student123', isVerified: true });
      students.push(student);
      console.log(`👤 Student created: ${s.email} / student123`);
    }

    // Create sample posts
    for (let i = 0; i < samplePosts.length; i++) {
      const reporter = students[i % students.length];
      await Post.create({ ...samplePosts[i], reporter: reporter._id });
    }
    console.log(`📝 Created ${samplePosts.length} sample posts`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@nitkkr.ac.in / admin123');
    console.log('   Student 1: 124102101@nitkkr.ac.in / student123');
    console.log('   Student 2: 124102102@nitkkr.ac.in / student123');
    console.log('   Student 3: 124102103@nitkkr.ac.in / student123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
