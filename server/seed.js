const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Instrument = require('./models/Instrument');
const TestReport = require('./models/TestReport');
const OimlRule = require('./models/OimlRule');
const { DEFAULT_RULES } = require('./engine/defaultRules');

dotenv.config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Instrument.deleteMany({});
    await TestReport.deleteMany({});
    await OimlRule.deleteMany({});

    // Seed Rules
    const rule = await OimlRule.create(DEFAULT_RULES);
    console.log('Seeded OIML R-76 Rules:', rule.version);

    // Seed Users
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

    console.log('Seeded Users: Admin & Engineer');

    // Seed Instrument
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

    console.log('Seeded Instrument:', instrument.modelInfo.modelNumber);

    // Seed Sample Test Report
    const report = await TestReport.create({
      reportNumber: 'NAWI-202609-1001',
      reportDate: new Date(),
      instrument: instrument._id,
      oimlRuleVersion: rule.version,
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
        {
          testType: 'repeatability',
          readings: [
            { testLoad: 7.5, indications: [7.500, 7.500, 7.501, 7.500, 7.499, 7.500] },
          ],
          results: {
            passed: true,
            remarks: 'Repeatability test PASSED — max range 0.002 kg within MPE',
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

    console.log('Seeded Sample Test Report:', report.reportNumber);
    console.log('Database seeding complete successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedData();
