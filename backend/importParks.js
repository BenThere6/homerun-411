const mongoose = require('mongoose');
const fs = require('fs');
const csvParser = require('csv-parser');
const Park = require('./models/Park');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yourDatabaseName', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function importParks() {
  const parks = [];
  let isFirstRow = true; // Add this variable to track the first row (headers)

  // Read parks from CSV file
  fs.createReadStream('parks.csv')
    .pipe(csvParser())
    .on('data', (row) => {
      // Skip the first row (headers)
      if (isFirstRow) {
        isFirstRow = false;
        return;
      }

      const park = {};

      // Required fields
      park.name = row.name;
      park.city = row.city;
      park.state = row.state;
      park.coordinates = {
        type: 'Point',
        coordinates: JSON.parse(row.coordinates), // Parse string coordinates to array
      };
      park.fieldTypes = row.fieldTypes;

      // Optional fields - only include if present in CSV
      if (row.interactiveMapPositionDetails) park.interactiveMapPositionDetails = row.interactiveMapPositionDetails;
      if (row.satelliteImageUrl) park.satelliteImageUrl = row.satelliteImageUrl;

      park.pictures = {};
      if (row.mainImageUrl) park.pictures.mainImageUrl = row.mainImageUrl;
      if (row.dugoutUrl) park.pictures.dugoutUrl = row.dugoutUrl;
      if (row.sidelinesUrl) park.pictures.sidelinesUrl = row.sidelinesUrl;
      if (row.shadedAreasUrl) park.pictures.shadedAreasUrl = row.shadedAreasUrl;

      if (row.closestParkingToField) park.closestParkingToField = row.closestParkingToField;
      if (row.bleachers) park.bleachers = row.bleachers === 'true';

      park.handicapAccess = {};
      if (row.hasHandicapAccess) park.handicapAccess.hasAccess = row.hasHandicapAccess === 'true';
      if (row.handicapDetails) park.handicapAccess.details = row.handicapDetails;

      park.concessions = {};
      if (row.concessionsAvailable) park.concessions.available = row.concessionsAvailable === 'true';
      if (row.concessionsDetails) park.concessions.details = row.concessionsDetails;
      if (row.paymentMethods) park.concessions.paymentMethods = row.paymentMethods;

      if (row.coolersAllowed) park.coolersAllowed = row.coolersAllowed === 'true';
      if (row.canopiesAllowed) park.canopiesAllowed = row.canopiesAllowed === 'true';
      if (row.surfaceMaterial) park.surfaceMaterial = row.surfaceMaterial;
      if (row.lights) park.lights = row.lights === 'true';
      if (row.restrooms) park.restrooms = row.restrooms;
      if (row.fenceDistance) park.fenceDistance = parseInt(row.fenceDistance, 10);
      if (row.powerWaterAccess) park.powerWaterAccess = row.powerWaterAccess === 'true';
      if (row.cellReception) park.cellReception = row.cellReception === 'true';

      park.shadedAreas = {};
      if (row.shadedAreasAvailable) park.shadedAreas.available = row.shadedAreasAvailable === 'true';

      park.playground = {};
      if (row.playgroundAvailable) park.playground.available = row.playgroundAvailable === 'true';
      if (row.playgroundCloseToParking) park.playground.closeToParking = row.playgroundCloseToParking === 'true';

      if (row.moundType) park.moundType = row.moundType;

      // Add the park to the array
      parks.push(park);
    })
    .on('end', async () => {
      try {
        // Bulk insert into MongoDB
        await Park.insertMany(parks);
        console.log('Parks imported successfully!');
        process.exit();
      } catch (error) {
        console.error('Error importing parks:', error);
        process.exit(1);
      }
    });
}

importParks();