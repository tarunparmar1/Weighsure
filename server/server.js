const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedDefaultRules } = require('./engine/defaultRules');
const User = require('./models/User');
const Instrument = require('./models/Instrument');
const TestReport = require('./models/TestReport');

dotenv.config();

const app = express();

// Connect to MongoDB (with auto fallback)
connectDB().then(async () => {
  // Seed default data if database is empty
  await seedInitialData();
});

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/instruments', require('./routes/instruments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/oiml-rules', require('./routes/oimlRules'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function seedInitialData() {
  try {
    await seedDefaultRules();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const admin = await User.create({
        name: 'Dr. Rajesh Sharma',
        email: 'admin@metrology.gov.in',
        password: 'password123',
        role: 'admin',
        organization: 'Department of Consumer Affairs (Legal Metrology)',
        phone: '+91 98100 12345',
      });

      const engineer = await User.create({
        name: 'Priya Verma',
        email: 'engineer@metrology.gov.in',
        password: 'password123',
        role: 'engineer',
        organization: 'Regional Reference Standard Laboratory',
        phone: '+91 98200 54321',
      });

      const instrument = await Instrument.create({
        manufacturer: {
          name: 'Avery India Ltd',
          address: 'Plot 5, Sector 25, Ballabgarh, Haryana',
          country: 'India',
          contactPerson: 'S. K. Gupta',
          email: 'info@averyweighing.in',
        },
        modelInfo: {
          modelNumber: 'E1205-Bench',
          serialNumber: 'SN-2024-8841',
          typeDesignation: 'Electronic Bench Scale',
          yearOfManufacture: 2024,
        },
        specifications: {
          accuracyClass: 'III',
          maxCapacity: 15,
          minCapacity: 0.1,
          verificationScaleInterval_e: 0.005,
          actualScaleInterval_d: 0.005,
          numberOfIntervals_n: 3000,
          tareRange: 15,
          operatingTemperatureMin: -10,
          operatingTemperatureMax: 40,
        },
        createdBy: engineer._id,
      });

      await TestReport.create({
        reportNumber: 'NAWI-202609-1001',
        reportDate: new Date(),
        instrument: instrument._id,
        oimlRuleVersion: 'R76-2006-v1',
        laboratory: {
          name: 'Regional Reference Standard Laboratory (RRSL)',
          address: 'Faridabad, Haryana',
          accreditationNumber: 'NABL-LM-2024-001',
          labTemperature: 23.5,
          labHumidity: 52,
          labPressure: 1013.2,
        },
        tests: [
          {
            testType: 'eccentricity',
            readings: [
              { position: 'Center', indication: 5.000 },
              { position: 'Front-Left', indication: 5.000 },
              { position: 'Front-Right', indication: 5.001 },
              { position: 'Rear-Left', indication: 4.999 },
              { position: 'Rear-Right', indication: 5.000 },
            ],
            results: {
              passed: true,
              remarks: 'Eccentricity test PASSED — all 5 positions within MPE ±0.005 kg',
            },
          },
        ],
        overallResult: {
          passed: true,
          summary: 'Instrument satisfies all metrological criteria of OIML R-76 for Class III instruments up to 15kg.',
          evaluatedBy: engineer.name,
          approvedBy: admin.name,
        },
        status: 'approved',
        createdBy: engineer._id,
      });

      console.log('Initial sample dataset seeded successfully');
    }
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`NAWI Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. NAWI Server is already running and serving API requests.`);
  } else {
    console.error('Server error:', err);
  }
});
